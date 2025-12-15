"""
Authentication Router
Handles user registration, login, password reset, and phone verification
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, validator, field_validator
from typing import Optional
from datetime import datetime, timedelta
import uuid
import hashlib
import secrets
import re

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ============== DATA MODELS ==============

class EmailSignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Invalid email address')
        return v.lower()

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain an uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain a lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain a number')
        return v


class PhoneSignupRequest(BaseModel):
    phone_number: str
    country_code: str = "US"

    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v):
        # Remove non-numeric characters
        cleaned = re.sub(r'\D', '', v)
        if len(cleaned) < 10 or len(cleaned) > 15:
            raise ValueError('Invalid phone number')
        return cleaned


class VerifyPhoneRequest(BaseModel):
    phone_number: str
    code: str


class LoginRequest(BaseModel):
    email: Optional[str] = None
    phone_number: Optional[str] = None
    password: Optional[str] = None
    code: Optional[str] = None  # For phone login


class PasswordResetRequest(BaseModel):
    email: Optional[str] = None
    phone_number: Optional[str] = None


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class AuthResponse(BaseModel):
    status: str
    user_id: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None
    message: Optional[str] = None


# ============== IN-MEMORY STORAGE (Replace with database) ==============

users_db = {}
verification_codes = {}  # phone -> {code, expires_at}
password_reset_tokens = {}  # token -> {user_id, expires_at}
sessions = {}  # token -> user_id


# ============== HELPER FUNCTIONS ==============

def hash_password(password: str) -> str:
    """Hash password with salt"""
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}${hashed.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    try:
        salt, stored_hash = hashed.split('$')
        new_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return new_hash.hex() == stored_hash
    except:
        return False


def generate_token() -> str:
    """Generate secure token"""
    return secrets.token_urlsafe(32)


def generate_verification_code() -> str:
    """Generate 6-digit verification code"""
    return f"{secrets.randbelow(1000000):06d}"


async def send_sms(phone_number: str, message: str):
    """Send SMS (stub - implement with Twilio/Telnyx)"""
    print(f"[SMS] To: {phone_number}: {message}")
    # In production: await twilio_client.messages.create(...)


async def send_email(email: str, subject: str, body: str):
    """Send email (stub - implement with SendGrid/SES)"""
    print(f"[EMAIL] To: {email}, Subject: {subject}")
    # In production: await sendgrid_client.send(...)


# ============== SIGNUP ENDPOINTS ==============

@router.post("/signup/email")
async def signup_with_email(request: EmailSignupRequest, background_tasks: BackgroundTasks) -> AuthResponse:
    """
    Sign up with email and password.
    Sends verification email.
    """
    if request.email in [u.get("email") for u in users_db.values()]:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    users_db[user_id] = {
        "id": user_id,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "name": request.name,
        "phone_number": None,
        "email_verified": False,
        "phone_verified": False,
        "created_at": datetime.utcnow().isoformat()
    }

    # Send verification email
    verification_token = generate_token()
    verification_codes[request.email] = {
        "token": verification_token,
        "expires_at": datetime.utcnow() + timedelta(hours=24)
    }

    background_tasks.add_task(
        send_email,
        request.email,
        "Verify your WickedCRM account",
        f"Click to verify: https://app.wickedcrm.com/verify?token={verification_token}"
    )

    # Generate access token
    access_token = generate_token()
    sessions[access_token] = user_id

    return AuthResponse(
        status="success",
        user_id=user_id,
        access_token=access_token,
        expires_in=3600 * 24 * 7,  # 7 days
        message="Account created. Please verify your email."
    )


@router.post("/signup/phone")
async def signup_with_phone(request: PhoneSignupRequest, background_tasks: BackgroundTasks) -> AuthResponse:
    """
    Sign up with phone number.
    Sends SMS verification code.
    """
    # Check if phone already exists
    for user in users_db.values():
        if user.get("phone_number") == request.phone_number:
            raise HTTPException(status_code=400, detail="Phone number already registered")

    # Generate and store verification code
    code = generate_verification_code()
    verification_codes[request.phone_number] = {
        "code": code,
        "expires_at": datetime.utcnow() + timedelta(minutes=10)
    }

    # Send SMS
    background_tasks.add_task(
        send_sms,
        request.phone_number,
        f"Your WickedCRM verification code is: {code}"
    )

    return AuthResponse(
        status="pending_verification",
        message="Verification code sent to your phone"
    )


@router.post("/signup/phone/verify")
async def verify_phone_signup(request: VerifyPhoneRequest) -> AuthResponse:
    """
    Verify phone number and complete signup.
    """
    stored = verification_codes.get(request.phone_number)

    if not stored:
        raise HTTPException(status_code=400, detail="No verification pending for this number")

    if datetime.utcnow() > stored["expires_at"]:
        del verification_codes[request.phone_number]
        raise HTTPException(status_code=400, detail="Verification code expired")

    if stored["code"] != request.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    # Create user
    user_id = str(uuid.uuid4())
    users_db[user_id] = {
        "id": user_id,
        "email": None,
        "password_hash": None,
        "name": None,
        "phone_number": request.phone_number,
        "email_verified": False,
        "phone_verified": True,
        "created_at": datetime.utcnow().isoformat()
    }

    # Clean up verification
    del verification_codes[request.phone_number]

    # Generate access token
    access_token = generate_token()
    sessions[access_token] = user_id

    return AuthResponse(
        status="success",
        user_id=user_id,
        access_token=access_token,
        expires_in=3600 * 24 * 7,
        message="Account created successfully"
    )


# ============== LOGIN ENDPOINTS ==============

@router.post("/login")
async def login(request: LoginRequest, background_tasks: BackgroundTasks) -> AuthResponse:
    """
    Login with email/password or phone/code.
    """
    # Email + Password login
    if request.email and request.password:
        user = None
        for u in users_db.values():
            if u.get("email") == request.email:
                user = u
                break

        if not user or not verify_password(request.password, user.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        access_token = generate_token()
        sessions[access_token] = user["id"]

        return AuthResponse(
            status="success",
            user_id=user["id"],
            access_token=access_token,
            expires_in=3600 * 24 * 7
        )

    # Phone login - send code
    if request.phone_number and not request.code:
        user = None
        for u in users_db.values():
            if u.get("phone_number") == request.phone_number:
                user = u
                break

        if not user:
            raise HTTPException(status_code=401, detail="Phone number not registered")

        code = generate_verification_code()
        verification_codes[request.phone_number] = {
            "code": code,
            "expires_at": datetime.utcnow() + timedelta(minutes=10)
        }

        background_tasks.add_task(
            send_sms,
            request.phone_number,
            f"Your WickedCRM login code is: {code}"
        )

        return AuthResponse(
            status="pending_verification",
            message="Verification code sent"
        )

    # Phone login - verify code
    if request.phone_number and request.code:
        stored = verification_codes.get(request.phone_number)

        if not stored or stored["code"] != request.code:
            raise HTTPException(status_code=401, detail="Invalid verification code")

        if datetime.utcnow() > stored["expires_at"]:
            raise HTTPException(status_code=401, detail="Code expired")

        user = None
        for u in users_db.values():
            if u.get("phone_number") == request.phone_number:
                user = u
                break

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        del verification_codes[request.phone_number]

        access_token = generate_token()
        sessions[access_token] = user["id"]

        return AuthResponse(
            status="success",
            user_id=user["id"],
            access_token=access_token,
            expires_in=3600 * 24 * 7
        )

    raise HTTPException(status_code=400, detail="Invalid login request")


@router.post("/logout")
async def logout(token: str) -> dict:
    """Logout and invalidate token"""
    if token in sessions:
        del sessions[token]
    return {"status": "logged_out"}


# ============== PASSWORD RESET ==============

@router.post("/password/reset")
async def request_password_reset(request: PasswordResetRequest, background_tasks: BackgroundTasks) -> AuthResponse:
    """
    Request password reset via email or SMS.
    """
    user = None

    if request.email:
        for u in users_db.values():
            if u.get("email") == request.email:
                user = u
                break
    elif request.phone_number:
        for u in users_db.values():
            if u.get("phone_number") == request.phone_number:
                user = u
                break

    # Always return success to prevent enumeration
    if not user:
        return AuthResponse(
            status="success",
            message="If an account exists, reset instructions have been sent"
        )

    token = generate_token()
    password_reset_tokens[token] = {
        "user_id": user["id"],
        "expires_at": datetime.utcnow() + timedelta(hours=1)
    }

    if request.email:
        background_tasks.add_task(
            send_email,
            request.email,
            "Reset your WickedCRM password",
            f"Reset your password: https://app.wickedcrm.com/reset-password?token={token}\n\nThis link expires in 1 hour."
        )
    elif request.phone_number:
        code = generate_verification_code()
        verification_codes[request.phone_number] = {
            "code": code,
            "reset_token": token,
            "expires_at": datetime.utcnow() + timedelta(minutes=10)
        }
        background_tasks.add_task(
            send_sms,
            request.phone_number,
            f"Your WickedCRM password reset code is: {code}"
        )

    return AuthResponse(
        status="success",
        message="If an account exists, reset instructions have been sent"
    )


@router.post("/password/reset/confirm")
async def confirm_password_reset(request: PasswordResetConfirm) -> AuthResponse:
    """
    Confirm password reset with token.
    """
    stored = password_reset_tokens.get(request.token)

    if not stored:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if datetime.utcnow() > stored["expires_at"]:
        del password_reset_tokens[request.token]
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user_id = stored["user_id"]
    if user_id not in users_db:
        raise HTTPException(status_code=400, detail="User not found")

    # Update password
    users_db[user_id]["password_hash"] = hash_password(request.new_password)

    # Clean up token
    del password_reset_tokens[request.token]

    # Invalidate all sessions for this user
    for token, uid in list(sessions.items()):
        if uid == user_id:
            del sessions[token]

    return AuthResponse(
        status="success",
        message="Password has been reset. Please log in with your new password."
    )


@router.post("/password/change")
async def change_password(request: ChangePasswordRequest, authorization: str = "") -> AuthResponse:
    """
    Change password for authenticated user.
    """
    # Extract token from header
    token = authorization.replace("Bearer ", "")
    user_id = sessions.get(token)

    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = users_db.get(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not verify_password(request.current_password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Update password
    users_db[user_id]["password_hash"] = hash_password(request.new_password)

    return AuthResponse(
        status="success",
        message="Password changed successfully"
    )


# ============== EMAIL VERIFICATION ==============

@router.get("/verify/email")
async def verify_email(token: str) -> AuthResponse:
    """Verify email address"""
    for email, data in verification_codes.items():
        if data.get("token") == token:
            if datetime.utcnow() > data["expires_at"]:
                raise HTTPException(status_code=400, detail="Verification link expired")

            # Find user and verify
            for user in users_db.values():
                if user.get("email") == email:
                    user["email_verified"] = True
                    del verification_codes[email]
                    return AuthResponse(status="success", message="Email verified successfully")

    raise HTTPException(status_code=400, detail="Invalid verification link")


# ============== RESEND VERIFICATION ==============

@router.post("/resend/email")
async def resend_email_verification(email: str, background_tasks: BackgroundTasks) -> AuthResponse:
    """Resend email verification"""
    user = None
    for u in users_db.values():
        if u.get("email") == email:
            user = u
            break

    if not user:
        return AuthResponse(status="success", message="If account exists, verification sent")

    if user.get("email_verified"):
        return AuthResponse(status="success", message="Email already verified")

    token = generate_token()
    verification_codes[email] = {
        "token": token,
        "expires_at": datetime.utcnow() + timedelta(hours=24)
    }

    background_tasks.add_task(
        send_email,
        email,
        "Verify your WickedCRM account",
        f"Click to verify: https://app.wickedcrm.com/verify?token={token}"
    )

    return AuthResponse(status="success", message="Verification email sent")


@router.post("/resend/phone")
async def resend_phone_verification(phone_number: str, background_tasks: BackgroundTasks) -> AuthResponse:
    """Resend phone verification code"""
    code = generate_verification_code()
    verification_codes[phone_number] = {
        "code": code,
        "expires_at": datetime.utcnow() + timedelta(minutes=10)
    }

    background_tasks.add_task(
        send_sms,
        phone_number,
        f"Your WickedCRM verification code is: {code}"
    )

    return AuthResponse(status="success", message="Verification code sent")
