"""
WickedCRM Content Moderation Routes
API endpoints for NSFW detection, age estimation, and content moderation using Hugging Face models.
"""

import base64
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from app.services.huggingface_service import huggingface_service


router = APIRouter(prefix="/api/moderation", tags=["Content Moderation"])


# ============== REQUEST MODELS ==============

class TextModerationRequest(BaseModel):
    """Request for text moderation."""
    text: str
    check_toxicity: bool = True
    check_nsfw: bool = True


class ImageModerationRequest(BaseModel):
    """Request for image moderation with base64 data."""
    image_base64: str
    check_nsfw: bool = True
    check_age: bool = True
    nsfw_model: str = "falconsai"
    age_model: str = "vit_age"


class ComprehensiveModerationRequest(BaseModel):
    """Request for comprehensive moderation."""
    image_base64: Optional[str] = None
    text: Optional[str] = None
    check_age: bool = True


# ============== ROUTES ==============

@router.get("/health")
async def moderation_health():
    """Check moderation service health."""
    return {
        "status": "healthy",
        "huggingface_configured": huggingface_service.is_configured(),
        "message": "Hugging Face API ready" if huggingface_service.is_configured() else "Running in demo mode - set HUGGINGFACE_API_KEY"
    }


@router.get("/models")
async def get_available_models():
    """Get all available moderation models."""
    return {
        "models": huggingface_service.get_available_models(),
        "details": huggingface_service.get_model_info()
    }


# ============== NSFW IMAGE DETECTION ==============

@router.post("/nsfw/image")
async def detect_nsfw_image(
    file: UploadFile = File(...),
    model: str = Form(default="falconsai")
):
    """
    Detect NSFW content in an uploaded image.

    Models available:
    - falconsai: Most popular, 80k images trained
    - adamcodd: 96.54% accuracy, restrictive
    - marqo: 98.56% accuracy, lightweight
    - tostai_large: 3-class (SAFE/QUESTIONABLE/UNSAFE)
    - lukejacob: 5-class (drawings/hentai/neutral/porn/sexy)
    """
    image_data = await file.read()
    result = await huggingface_service.detect_nsfw_image(image_data, model)
    return result.model_dump()


@router.post("/nsfw/image/base64")
async def detect_nsfw_image_base64(request: ImageModerationRequest):
    """Detect NSFW content in a base64-encoded image."""
    try:
        image_data = base64.b64decode(request.image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    result = await huggingface_service.detect_nsfw_image(image_data, request.nsfw_model)
    return result.model_dump()


@router.post("/nsfw/image/multi")
async def detect_nsfw_multi_model(
    file: UploadFile = File(...),
    models: str = Form(default="falconsai,adamcodd,marqo")
):
    """
    Detect NSFW content using multiple models for higher accuracy.

    Returns results from all specified models for comparison.
    """
    image_data = await file.read()
    model_list = [m.strip() for m in models.split(",")]
    results = await huggingface_service.detect_nsfw_multi_model(image_data, model_list)
    return {model: result.model_dump() for model, result in results.items()}


# ============== AGE ESTIMATION ==============

@router.post("/age/estimate")
async def estimate_age(
    file: UploadFile = File(...),
    model: str = Form(default="vit_age")
):
    """
    Estimate age from a face image.

    Models available:
    - vit_age: ViT finetuned on FairFace
    - dima806_age: Age bins
    - dima806_faces: 91% accuracy age groups
    - swin_age: Swin transformer

    Returns age estimation and whether person appears to be minor/adult/senior.
    """
    image_data = await file.read()
    result = await huggingface_service.estimate_age(image_data, model)
    return result.model_dump()


@router.post("/age/estimate/base64")
async def estimate_age_base64(request: ImageModerationRequest):
    """Estimate age from a base64-encoded face image."""
    try:
        image_data = base64.b64decode(request.image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    result = await huggingface_service.estimate_age(image_data, request.age_model)
    return result.model_dump()


# ============== TOXICITY DETECTION ==============

@router.post("/toxicity")
async def detect_toxicity(request: TextModerationRequest):
    """
    Detect toxic/hate speech in text.

    Models available:
    - toxic_bert: Jigsaw trained, multi-class
    - multilingual_toxic: 7 languages supported
    - offensive_speech: DistilBERT hate/offensive
    - hate_speech: Facebook Dynabench
    - toxicity_type: Multi-label (health, ideology, insult, etc.)
    """
    result = await huggingface_service.detect_toxicity(request.text)
    return result.model_dump()


# ============== NSFW TEXT DETECTION ==============

@router.post("/nsfw/text")
async def detect_nsfw_text(request: TextModerationRequest):
    """
    Detect NSFW content in text.

    Models available:
    - tostai_text: SAFE/QUESTIONABLE/UNSAFE classification
    - nsfw_detector: Pornographic text detection
    """
    result = await huggingface_service.detect_nsfw_text(request.text)
    return result.model_dump()


# ============== COMPREHENSIVE MODERATION ==============

@router.post("/comprehensive")
async def comprehensive_moderation(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    check_age: bool = Form(default=True)
):
    """
    Comprehensive content moderation.

    Analyzes both image and text content using multiple models:
    - NSFW image detection
    - Age estimation (optional)
    - Toxicity detection
    - NSFW text detection

    Returns combined results with safety assessment and recommendations.
    """
    image_data = None
    if file:
        image_data = await file.read()

    result = await huggingface_service.moderate_content(
        image_data=image_data,
        text=text,
        check_age=check_age
    )

    return {
        "nsfw_image": result.nsfw_image.model_dump() if result.nsfw_image else None,
        "age_estimation": result.age_estimation.model_dump() if result.age_estimation else None,
        "toxicity": result.toxicity.model_dump() if result.toxicity else None,
        "nsfw_text": result.nsfw_text.model_dump() if result.nsfw_text else None,
        "overall_safe": result.overall_safe,
        "flags": result.flags,
        "recommendations": result.recommendations
    }


@router.post("/comprehensive/json")
async def comprehensive_moderation_json(request: ComprehensiveModerationRequest):
    """
    Comprehensive content moderation with JSON/base64 input.

    Same as /comprehensive but accepts base64 image data in JSON body.
    """
    image_data = None
    if request.image_base64:
        try:
            image_data = base64.b64decode(request.image_base64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")

    result = await huggingface_service.moderate_content(
        image_data=image_data,
        text=request.text,
        check_age=request.check_age
    )

    return {
        "nsfw_image": result.nsfw_image.model_dump() if result.nsfw_image else None,
        "age_estimation": result.age_estimation.model_dump() if result.age_estimation else None,
        "toxicity": result.toxicity.model_dump() if result.toxicity else None,
        "nsfw_text": result.nsfw_text.model_dump() if result.nsfw_text else None,
        "overall_safe": result.overall_safe,
        "flags": result.flags,
        "recommendations": result.recommendations
    }
