"""
WickedCRM Phone Verification Router
Caller ID, spam detection, and contact verification.

Integrates with:
- Mr. Number API (spam/caller ID)
- Twilio Lookup API
- NumVerify API
- Manual verification database
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
import uuid
import httpx
import os
import re

router = APIRouter(prefix="/api/verification", tags=["Phone Verification"])


# ============== CONFIGURATION ==============

# API Keys (set via environment variables)
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
NUMVERIFY_API_KEY = os.environ.get("NUMVERIFY_API_KEY", "")


# ============== DATA MODELS ==============

class PhoneLookupResult(BaseModel):
    phone_number: str
    formatted: Optional[str] = None
    country_code: Optional[str] = None
    carrier: Optional[str] = None
    line_type: Optional[str] = None  # mobile, landline, voip
    is_valid: bool = True
    spam_score: int = 0  # 0-100
    spam_type: Optional[str] = None  # telemarketer, scam, robocall, etc.
    caller_name: Optional[str] = None
    caller_type: Optional[str] = None  # business, consumer
    is_verified: bool = False
    verification_source: Optional[str] = None
    risk_level: Literal["low", "medium", "high", "blocked"] = "low"
    tags: List[str] = []
    notes: Optional[str] = None
    lookup_time: str


class VerifyPhoneRequest(BaseModel):
    phone_number: str
    check_spam: bool = True
    check_carrier: bool = True
    check_caller_id: bool = True


class ReportSpamRequest(BaseModel):
    phone_number: str
    spam_type: str  # telemarketer, scam, robocall, harassment, other
    notes: Optional[str] = None


class BlockNumberRequest(BaseModel):
    phone_number: str
    reason: Optional[str] = None


# ============== IN-MEMORY DATABASES ==============

# Known spam numbers database
spam_database: Dict[str, Dict[str, Any]] = {
    "+18005551234": {"spam_score": 95, "spam_type": "telemarketer", "reports": 1523},
    "+18009998888": {"spam_score": 88, "spam_type": "robocall", "reports": 892},
}

# Verified contacts database
verified_contacts: Dict[str, Dict[str, Any]] = {}

# Blocked numbers
blocked_numbers: Dict[str, Dict[str, Any]] = {}

# User-reported spam
user_reports: List[Dict[str, Any]] = []


# ============== HELPER FUNCTIONS ==============

def normalize_phone(phone: str) -> str:
    """Normalize phone number to E.164 format."""
    # Remove all non-numeric characters except +
    cleaned = re.sub(r'[^\d+]', '', phone)

    # Add + if missing and starts with country code
    if not cleaned.startswith('+'):
        if cleaned.startswith('1') and len(cleaned) == 11:
            cleaned = '+' + cleaned
        elif len(cleaned) == 10:
            cleaned = '+1' + cleaned

    return cleaned


def calculate_risk_level(spam_score: int, is_blocked: bool) -> str:
    """Calculate risk level based on spam score."""
    if is_blocked:
        return "blocked"
    elif spam_score >= 80:
        return "high"
    elif spam_score >= 50:
        return "medium"
    else:
        return "low"


# ============== LOOKUP PROVIDERS ==============

async def lookup_twilio(phone: str) -> Dict[str, Any]:
    """Lookup phone using Twilio Lookup API."""
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return {}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://lookups.twilio.com/v1/PhoneNumbers/{phone}",
                params={"Type": ["carrier", "caller-name"]},
                auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "carrier": data.get("carrier", {}).get("name"),
                    "line_type": data.get("carrier", {}).get("type"),
                    "caller_name": data.get("caller_name", {}).get("caller_name"),
                    "caller_type": data.get("caller_name", {}).get("caller_type"),
                }
    except Exception as e:
        print(f"Twilio lookup error: {e}")

    return {}


async def lookup_numverify(phone: str) -> Dict[str, Any]:
    """Lookup phone using NumVerify API."""
    if not NUMVERIFY_API_KEY:
        return {}

    try:
        # Remove + for numverify
        clean_phone = phone.lstrip('+')

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "http://apilayer.net/api/validate",
                params={
                    "access_key": NUMVERIFY_API_KEY,
                    "number": clean_phone,
                },
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("valid"):
                    return {
                        "is_valid": True,
                        "country_code": data.get("country_code"),
                        "carrier": data.get("carrier"),
                        "line_type": data.get("line_type"),
                        "formatted": data.get("international_format"),
                    }
    except Exception as e:
        print(f"NumVerify lookup error: {e}")

    return {}


# ============== ROUTES ==============

@router.post("/lookup")
async def lookup_phone(request: VerifyPhoneRequest) -> PhoneLookupResult:
    """
    Comprehensive phone number lookup.

    Checks:
    - Spam databases
    - Carrier information
    - Caller ID
    - User reports
    - Blocked list
    """
    phone = normalize_phone(request.phone_number)
    now = datetime.now().isoformat()

    result = PhoneLookupResult(
        phone_number=phone,
        lookup_time=now
    )

    # Check blocked list first
    if phone in blocked_numbers:
        result.risk_level = "blocked"
        result.notes = blocked_numbers[phone].get("reason", "Blocked by user")
        return result

    # Check spam database
    if request.check_spam and phone in spam_database:
        spam_info = spam_database[phone]
        result.spam_score = spam_info.get("spam_score", 0)
        result.spam_type = spam_info.get("spam_type")

    # Check verified contacts
    if phone in verified_contacts:
        contact = verified_contacts[phone]
        result.is_verified = True
        result.caller_name = contact.get("name")
        result.tags = contact.get("tags", [])
        result.verification_source = "user_verified"

    # External lookups
    if request.check_carrier:
        # Try Twilio first
        twilio_data = await lookup_twilio(phone)
        if twilio_data:
            result.carrier = twilio_data.get("carrier")
            result.line_type = twilio_data.get("line_type")
            if twilio_data.get("caller_name"):
                result.caller_name = twilio_data.get("caller_name")
                result.caller_type = twilio_data.get("caller_type")
        else:
            # Fall back to NumVerify
            numverify_data = await lookup_numverify(phone)
            if numverify_data:
                result.carrier = numverify_data.get("carrier")
                result.line_type = numverify_data.get("line_type")
                result.formatted = numverify_data.get("formatted")
                result.is_valid = numverify_data.get("is_valid", True)

    # Calculate risk level
    result.risk_level = calculate_risk_level(
        result.spam_score,
        phone in blocked_numbers
    )

    return result


@router.get("/spam-check/{phone_number}")
async def quick_spam_check(phone_number: str) -> Dict[str, Any]:
    """Quick spam score check for a phone number."""
    phone = normalize_phone(phone_number)

    is_blocked = phone in blocked_numbers
    spam_info = spam_database.get(phone, {})
    spam_score = spam_info.get("spam_score", 0)

    return {
        "phone_number": phone,
        "spam_score": spam_score,
        "spam_type": spam_info.get("spam_type"),
        "is_blocked": is_blocked,
        "risk_level": calculate_risk_level(spam_score, is_blocked),
        "recommendation": "block" if spam_score >= 80 or is_blocked else "allow"
    }


@router.post("/report-spam")
async def report_spam(request: ReportSpamRequest):
    """Report a phone number as spam."""
    phone = normalize_phone(request.phone_number)

    # Add to reports
    user_reports.append({
        "id": str(uuid.uuid4()),
        "phone_number": phone,
        "spam_type": request.spam_type,
        "notes": request.notes,
        "reported_at": datetime.now().isoformat()
    })

    # Update spam database
    if phone in spam_database:
        spam_database[phone]["spam_score"] = min(100, spam_database[phone]["spam_score"] + 5)
        spam_database[phone]["reports"] = spam_database[phone].get("reports", 0) + 1
    else:
        spam_database[phone] = {
            "spam_score": 50,
            "spam_type": request.spam_type,
            "reports": 1
        }

    return {
        "status": "reported",
        "phone_number": phone,
        "new_spam_score": spam_database[phone]["spam_score"]
    }


@router.post("/block")
async def block_number(request: BlockNumberRequest):
    """Block a phone number."""
    phone = normalize_phone(request.phone_number)

    blocked_numbers[phone] = {
        "reason": request.reason,
        "blocked_at": datetime.now().isoformat()
    }

    return {
        "status": "blocked",
        "phone_number": phone
    }


@router.delete("/block/{phone_number}")
async def unblock_number(phone_number: str):
    """Unblock a phone number."""
    phone = normalize_phone(phone_number)

    if phone in blocked_numbers:
        del blocked_numbers[phone]
        return {"status": "unblocked", "phone_number": phone}

    raise HTTPException(status_code=404, detail="Number not in blocked list")


@router.get("/blocked")
async def get_blocked_numbers() -> List[Dict[str, Any]]:
    """Get all blocked numbers."""
    return [
        {"phone_number": phone, **info}
        for phone, info in blocked_numbers.items()
    ]


@router.post("/verify")
async def verify_contact(phone_number: str, name: str, tags: List[str] = []):
    """Mark a phone number as verified contact."""
    phone = normalize_phone(phone_number)

    verified_contacts[phone] = {
        "name": name,
        "tags": tags,
        "verified_at": datetime.now().isoformat()
    }

    return {
        "status": "verified",
        "phone_number": phone,
        "name": name
    }


@router.get("/verified")
async def get_verified_contacts() -> List[Dict[str, Any]]:
    """Get all verified contacts."""
    return [
        {"phone_number": phone, **info}
        for phone, info in verified_contacts.items()
    ]


# ============== INCOMING CALL/MESSAGE SCREENING ==============

@router.post("/screen")
async def screen_incoming(phone_number: str, message_preview: Optional[str] = None) -> Dict[str, Any]:
    """
    Screen an incoming call or message.

    Returns action recommendation: allow, warn, block
    """
    phone = normalize_phone(phone_number)

    # Check blocked list
    if phone in blocked_numbers:
        return {
            "action": "block",
            "reason": "Number is blocked",
            "phone_number": phone
        }

    # Check verified contacts
    if phone in verified_contacts:
        return {
            "action": "allow",
            "reason": "Verified contact",
            "phone_number": phone,
            "contact_name": verified_contacts[phone].get("name")
        }

    # Check spam database
    if phone in spam_database:
        spam_score = spam_database[phone].get("spam_score", 0)
        if spam_score >= 80:
            return {
                "action": "block",
                "reason": f"High spam score ({spam_score})",
                "spam_type": spam_database[phone].get("spam_type"),
                "phone_number": phone
            }
        elif spam_score >= 50:
            return {
                "action": "warn",
                "reason": f"Suspected spam ({spam_score})",
                "spam_type": spam_database[phone].get("spam_type"),
                "phone_number": phone
            }

    # Unknown number
    return {
        "action": "allow",
        "reason": "Unknown number - no spam reports",
        "phone_number": phone,
        "suggestion": "Verify after interaction"
    }
