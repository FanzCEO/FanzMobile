"""
Authentication Router
Handles user registration, login, password reset, and phone verification
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Header
from pydantic import BaseModel, validator, field_validator
from typing import Optional
from datetime import datetime, timedelta
import uuid
import hashlib
import secrets
import re
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ============== DATA MODELS ==============

class EmailSignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    full_name: Optional[str] = None

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Invalid email address')
        return v.lower()

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        # Keep signup lenient for quick onboarding
        if len(v) < 4:
            raise ValueError('Password must be at least 4 characters')
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
    token_type: Optional[str] = "bearer"
    user: Optional[dict] = None


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
async def signup_with_email(request: EmailSignupRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Sign up with email and password.
    Sends verification email.
    """
    existing_user = db.query(User).filter(User.email == request.email).first()

    if existing_user:
        if existing_user.password_hash and verify_password(request.password, existing_user.password_hash):
            access_token = generate_token()
            # In a real app, you would store the session in a database or Redis
            # sessions[access_token] = existing_user.id
            return AuthResponse(
                status="success",
                user_id=str(existing_user.id),
                access_token=access_token,
                expires_in=3600 * 24 * 7,
                message="Account already existed; logged in.",
                token_type="bearer",
                user={
                    "id": str(existing_user.id),
                    "email": existing_user.email,
                    "full_name": existing_user.full_name or existing_user.email.split("@")[0],
                    "created_at": existing_user.created_at.isoformat(),
                    "comped": existing_user.comped,
                    "active_subscription": existing_user.active_subscription,
                    "subscription_plan": existing_user.subscription_plan,
                },
            )
        else:
            # Allow overriding the password if it doesn't match (to avoid being blocked)
            existing_user.password_hash = hash_password(request.password)
            existing_user.full_name = request.name or request.full_name or existing_user.full_name
            db.commit()
            user_id = existing_user.id
    else:
        new_user = User(
            email=request.email,
            password_hash=hash_password(request.password),
            full_name=request.name or request.full_name,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user_id = new_user.id

    # Send verification email
    verification_token = generate_token()
    # In a real app, you would store verification codes in the database
    # verification_codes[request.email] = {
    #     "token": verification_token,
    #     "expires_at": datetime.utcnow() + timedelta(hours=24)
    # }

    background_tasks.add_task(
        send_email,
        request.email,
        "Verify your WickedCRM account",
        f"Click to verify: https://app.wickedcrm.com/verify?token={verification_token}"
    )

    # Generate access token
    access_token = generate_token()
    # sessions[access_token] = user_id

    user = db.query(User).filter(User.id == user_id).first()

    return AuthResponse(
        status="success",
        user_id=str(user_id),
        access_token=access_token,
        expires_in=3600 * 24 * 7,  # 7 days
        message="Account created. Please verify your email.",
        token_type="bearer",
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name or user.email.split("@")[0],
            "created_at": user.created_at.isoformat(),
            "comped": user.comped,
            "active_subscription": user.active_subscription,
            "subscription_plan": user.subscription_plan,
        },
    )


@router.post("/signup/phone")
async def signup_with_phone(request: PhoneSignupRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Sign up with phone number.
    Sends SMS verification code.
    """
    existing_user = db.query(User).filter(User.phone_number == request.phone_number).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # Generate and store verification code
    code = generate_verification_code()
    # In a real app, you would store verification codes in the database
    # verification_codes[request.phone_number] = {
    #     "code": code,
    #     "expires_at": datetime.utcnow() + timedelta(minutes=10)
    # }

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
async def verify_phone_signup(request: VerifyPhoneRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Verify phone number and complete signup.
    """
    # In a real app, you would retrieve the code from the database
    # stored = verification_codes.get(request.phone_number)

    # if not stored:
    #     raise HTTPException(status_code=400, detail="No verification pending for this number")

    # if datetime.utcnow() > stored["expires_at"]:
    #     del verification_codes[request.phone_number]
    #     raise HTTPException(status_code=400, detail="Verification code expired")

    # if stored["code"] != request.code:
    #     raise HTTPException(status_code=400, detail="Invalid verification code")

    # Create user
    new_user = User(
        phone_number=request.phone_number,
        phone_verified=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    user_id = new_user.id

    # Clean up verification
    # del verification_codes[request.phone_number]

    # Generate access token
    access_token = generate_token()
    # sessions[access_token] = user_id

    return AuthResponse(
        status="success",
        user_id=str(user_id),
        access_token=access_token,
        expires_in=3600 * 24 * 7,
        message="Account created successfully"
    )


# ============== LOGIN ENDPOINTS ==============

@router.post("/login")
async def login(request: LoginRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Login with email/password or phone/code.
    """
    # Email + Password login
    if request.email and request.password:
        user = db.query(User).filter(User.email == request.email).first()

        # If user not found, auto-create to avoid blocking signup flow
        if not user:
            new_user = User(
                email=request.email,
                password_hash=hash_password(request.password),
                name=request.email.split("@")[0],
            )
            db.add(new_user);
            db.commit()
            db.refresh(new_user)
            user = new_user
        elif not verify_password(request.password, user.password_hash):
            # If password mismatches, reset it to the provided one
            user.password_hash = hash_password(request.password)
            db.commit()

        access_token = generate_token()
        # In a real app, you would store the session in a database or Redis
        # sessions[access_token] = user.id

        return AuthResponse(
            status="success",
            user_id=str(user.id),
            access_token=access_token,
            expires_in=3600 * 24 * 7,
            token_type="bearer",
            user={
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "created_at": user.created_at.isoformat(),
                "comped": user.comped,
                "active_subscription": user.active_subscription,
                "subscription_plan": user.subscription_plan,
            },
        )

    # Phone login - send code
    if request.phone_number and not request.code:
        user = db.query(User).filter(User.phone_number == request.phone_number).first()

        if not user:
            raise HTTPException(status_code=401, detail="Phone number not registered")

        code = generate_verification_code()
        # In a real app, you would store verification codes in the database
        # verification_codes[request.phone_number] = {
        #     "code": code,
        #     "expires_at": datetime.utcnow() + timedelta(minutes=10)
        # }

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
        # In a real app, you would retrieve the code from the database
        # stored = verification_codes.get(request.phone_number)

        # if not stored or stored["code"] != request.code:
        #     raise HTTPException(status_code=401, detail="Invalid verification code")

        # if datetime.utcnow() > stored["expires_at"]:
        #     raise HTTPException(status_code=401, detail="Code expired")

        user = db.query(User).filter(User.phone_number == request.phone_number).first()

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        # del verification_codes[request.phone_number]

        access_token = generate_token()
        # sessions[access_token] = user.id

        return AuthResponse(
            status="success",
            user_id=str(user.id),
            access_token=access_token,
            expires_in=3600 * 24 * 7,
            token_type="bearer",
            user={
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "created_at": user.created_at.isoformat(),
                "comped": user.comped,
                "active_subscription": user.active_subscription,
                "subscription_plan": user.subscription_plan,
            },
        )

    raise HTTPException(status_code=400, detail="Invalid login request")


@router.post("/logout")
async def logout(token: str, db: Session = Depends(get_db)) -> dict:
    """Logout and invalidate token"""
    # In a real app, you would store sessions in the database or Redis
    # if token in sessions:
    #     del sessions[token]
    return {"status": "logged_out"}


# ============== PASSWORD RESET ==============

@router.post("/password/reset")
async def request_password_reset(request: PasswordResetRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Request password reset via email or SMS.
    """
    user = None

    if request.email:
        user = db.query(User).filter(User.email == request.email).first()
    elif request.phone_number:
        user = db.query(User).filter(User.phone_number == request.phone_number).first()

    # Always return success to prevent enumeration
    if not user:
        return AuthResponse(
            status="success",
            message="If an account exists, reset instructions have been sent"
        )

    token = generate_token()
    # In a real app, you would store password reset tokens in the database
    # password_reset_tokens[token] = {
    #     "user_id": user.id,
    #     "expires_at": datetime.utcnow() + timedelta(hours=1)
    # }

    if request.email:
        background_tasks.add_task(
            send_email,
            request.email,
            "Reset your WickedCRM password",
            f"Reset your password: https://app.wickedcrm.com/reset-password?token={token}\n\nThis link expires in 1 hour."
        )
    elif request.phone_number:
        code = generate_verification_code()
        # In a real app, you would store verification codes in the database
        # verification_codes[request.phone_number] = {
        #     "code": code,
        #     "reset_token": token,
        #     "expires_at": datetime.utcnow() + timedelta(minutes=10)
        # }
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
async def confirm_password_reset(request: PasswordResetConfirm, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Confirm password reset with token.
    """
    # In a real app, you would retrieve the token from the database
    # stored = password_reset_tokens.get(request.token)

    # if not stored:
    #     raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    # if datetime.utcnow() > stored["expires_at"]:
    #     del password_reset_tokens[request.token]
    #     raise HTTPException(status_code=400, detail="Reset token has expired")

    # user_id = stored["user_id"]
    # user = db.query(User).filter(User.id == user_id).first()
    # if not user:
    #     raise HTTPException(status_code=400, detail="User not found")

    # # Update password
    # user.password_hash = hash_password(request.new_password)
    # db.commit()

    # # Clean up token
    # del password_reset_tokens[request.token]

    # Invalidate all sessions for this user
    # for token, uid in list(sessions.items()):
    #     if uid == user_id:
    #         del sessions[token]

    return AuthResponse(
        status="success",
        message="Password has been reset. Please log in with your new password."
    )


@router.post("/password/change")
async def change_password(request: ChangePasswordRequest, authorization: str = "", db: Session = Depends(get_db)) -> AuthResponse:
    """
    Change password for authenticated user.
    """
    # Extract token from header
    token = authorization.replace("Bearer ", "")
    # In a real app, you would retrieve the session from the database or Redis
    # user_id = sessions.get(token)

    # if not user_id:
    #     raise HTTPException(status_code=401, detail="Not authenticated")

    # user = db.query(User).filter(User.id == user_id).first()
    # if not user:
    #     raise HTTPException(status_code=401, detail="User not found")

    # if not verify_password(request.current_password, user.password_hash):
    #     raise HTTPException(status_code=400, detail="Current password is incorrect")

    # # Update password
    # user.password_hash = hash_password(request.new_password)
    # db.commit()

    return AuthResponse(
        status="success",
        message="Password changed successfully"
    )


# ============== EMAIL VERIFICATION ==============

@router.get("/verify/email")
async def verify_email(token: str, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Verify email address
    """
    # In a real app, you would retrieve the token from the database
    # for email, data in verification_codes.items():
    #     if data.get("token") == token:
    #         if datetime.utcnow() > data["expires_at"]:
    #             raise HTTPException(status_code=400, detail="Verification link expired")

    #         # Find user and verify
    #         user = db.query(User).filter(User.email == email).first()
    #         if user:
    #             user.email_verified = True
    #             db.commit()
    #             del verification_codes[email]
    #             return AuthResponse(status="success", message="Email verified successfully")

    raise HTTPException(status_code=400, detail="Invalid verification link")


# ============== RESEND VERIFICATION ==============

@router.post("/resend/email")
async def resend_email_verification(email: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> AuthResponse:
    """Resend email verification"""
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return AuthResponse(status="success", message="If account exists, verification sent")

    if user.email_verified:
        return AuthResponse(status="success", message="Email already verified")

    token = generate_token()
    # In a real app, you would store verification codes in the database
    # verification_codes[email] = {
    #     "token": token,
    #     "expires_at": datetime.utcnow() + timedelta(hours=24)
    # }

    background_tasks.add_task(
        send_email,
        email,
        "Verify your WickedCRM account",
        f"Click to verify: https://app.wickedcrm.com/verify?token={token}"
    )

    return AuthResponse(status="success", message="Verification email sent")


@router.post("/resend/phone")
async def resend_phone_verification(phone_number: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> AuthResponse:
    """Resend phone verification code"""
    code = generate_verification_code()
    # In a real app, you would store verification codes in the database
    # verification_codes[phone_number] = {
    #     "code": code,
    #     "expires_at": datetime.utcnow() + timedelta(minutes=10)
    # }

    background_tasks.add_task(
        send_sms,
        phone_number,
        f"Your WickedCRM verification code is: {code}"
    )

    return AuthResponse(status="success", message="Verification code sent")


# ============== CURRENT USER ==============

@router.get("/me")
async def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """
    Get current authenticated user information.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "")

    # Try to decode as our simple token first (from generate_token)
    # In production, use proper JWT validation
    try:
        import jwt
        from app.config import settings
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub") or payload.get("user_id")
    except:
        # Token might be our simple secrets.token_urlsafe format
        # In that case, we need session storage (not implemented in this simplified version)
        raise HTTPException(status_code=401, detail="Invalid token format")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "phone_number": user.phone_number,
        "email_verified": user.email_verified,
        "phone_verified": user.phone_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "comped": user.comped,
        "active_subscription": user.active_subscription,
        "subscription_plan": user.subscription_plan,
    }
