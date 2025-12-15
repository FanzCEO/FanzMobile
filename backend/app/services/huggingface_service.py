"""
WickedCRM Hugging Face Integration Service
Comprehensive NSFW/Adult content AI models from Hugging Face.

Models Integrated:
- NSFW Image Detection (Falconsai, AdamCodd, Marqo, TostAI)
- Age Estimation (nateraw, dima806)
- Toxic/Hate Speech Detection (unitary, Falconsai)
- NSFW Text Detection (TostAI, qiuhuachuan)
- Mature Content Classification (prithivMLmods)
"""

import os
import base64
import httpx
from typing import Optional, Literal, Union, Dict, List
from enum import Enum
from pydantic import BaseModel
from app.config import settings


# ============== CONFIGURATION ==============

class HuggingFaceConfig:
    """Hugging Face API configuration and model endpoints."""

    # API Base URL
    API_BASE = "https://api-inference.huggingface.co/models"

    # NSFW Image Detection Models
    NSFW_IMAGE_MODELS = {
        "falconsai": "Falconsai/nsfw_image_detection",           # Most popular, 80k images trained
        "adamcodd": "AdamCodd/vit-base-nsfw-detector",           # 96.54% accuracy
        "marqo": "Marqo/nsfw-image-detection-384",               # 98.56% accuracy, lightweight
        "tostai_large": "TostAI/nsfw-image-detection-large",     # 3-class: SAFE/QUESTIONABLE/UNSAFE
        "lukejacob": "LukeJacob2023/nsfw-image-detector",        # 5-class: drawings/hentai/neutral/porn/sexy
        "mature_content": "prithivMLmods/Mature-Content-Detection",  # Anime/Adult content
        "guard_unsafe": "prithivMLmods/Guard-Against-Unsafe-Content-Siglip2",  # 99% accuracy
    }

    # Age Estimation Models
    AGE_MODELS = {
        "vit_age": "nateraw/vit-age-classifier",                 # FairFace dataset
        "dima806_age": "dima806/facial_age_image_detection",     # Age bins
        "dima806_faces": "dima806/faces_age_detection",          # 91% accuracy
        "swin_age": "ibombonato/swin-age-classifier",            # Swin transformer
    }

    # Toxic/Hate Speech Detection Models
    TOXIC_MODELS = {
        "toxic_bert": "unitary/toxic-bert",                      # Jigsaw trained
        "multilingual_toxic": "unitary/multilingual-toxic-xlm-roberta",  # 7 languages
        "offensive_speech": "Falconsai/offensive_speech_detection",      # DistilBERT
        "hate_speech": "facebook/roberta-hate-speech-dynabench-r4-target",
        "toxicity_type": "dougtrajano/toxicity-type-detection",  # Multi-label toxicity
    }

    # NSFW Text Detection Models
    NSFW_TEXT_MODELS = {
        "tostai_text": "TostAI/nsfw-text-detection-large",       # SAFE/QUESTIONABLE/UNSAFE
        "nsfw_detector": "qiuhuachuan/NSFW-detector",            # Pornographic text
    }

    # Nudity-Specific Detection
    NUDITY_MODELS = {
        "nudity": "esvinj312/nudity-detection",                  # 85% accuracy
    }


# ============== DATA MODELS ==============

class NSFWResult(BaseModel):
    """NSFW detection result."""
    is_nsfw: bool
    confidence: float
    label: str
    all_scores: Dict[str, float]
    model_used: str


class AgeResult(BaseModel):
    """Age estimation result."""
    estimated_age: str
    confidence: float
    age_range: Optional[str] = None
    all_scores: Dict[str, float]
    model_used: str


class ToxicityResult(BaseModel):
    """Toxicity detection result."""
    is_toxic: bool
    toxicity_score: float
    categories: Dict[str, float]
    model_used: str


class ContentModerationResult(BaseModel):
    """Combined content moderation result."""
    nsfw_image: Optional[NSFWResult] = None
    age_estimation: Optional[AgeResult] = None
    toxicity: Optional[ToxicityResult] = None
    nsfw_text: Optional[NSFWResult] = None
    overall_safe: bool
    flags: List[str]
    recommendations: List[str]


# ============== SERVICE ==============

class HuggingFaceService:
    """
    Hugging Face API integration for NSFW/Adult content moderation.

    Supports:
    - NSFW Image Detection (multiple models)
    - Age Estimation from faces
    - Toxic/Hate Speech Detection
    - NSFW Text Detection
    - Comprehensive content moderation
    """

    def __init__(self):
        self.api_key = os.environ.get("HUGGINGFACE_API_KEY", "")
        self.config = HuggingFaceConfig()
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    def is_configured(self) -> bool:
        """Check if HuggingFace API is configured."""
        return bool(self.api_key)

    def get_headers(self) -> dict:
        """Get API headers."""
        return {"Authorization": f"Bearer {self.api_key}"}

    async def _query_model(self, model_id: str, data: Union[dict, bytes]) -> Union[dict, list]:
        """Query a Hugging Face model."""
        url = f"{self.config.API_BASE}/{model_id}"

        if isinstance(data, bytes):
            # Image data
            response = await self.client.post(
                url,
                headers=self.get_headers(),
                content=data
            )
        else:
            # JSON data
            response = await self.client.post(
                url,
                headers=self.get_headers(),
                json=data
            )

        if response.status_code == 200:
            return response.json()
        else:
            return {"error": response.text, "status_code": response.status_code}

    # ============== NSFW IMAGE DETECTION ==============

    async def detect_nsfw_image(
        self,
        image_data: bytes,
        model: str = "falconsai"
    ) -> NSFWResult:
        """
        Detect NSFW content in an image.

        Args:
            image_data: Raw image bytes
            model: Model to use (falconsai, adamcodd, marqo, tostai_large, lukejacob)

        Returns:
            NSFWResult with detection results
        """
        model_id = self.config.NSFW_IMAGE_MODELS.get(model, self.config.NSFW_IMAGE_MODELS["falconsai"])

        if not self.is_configured():
            # Demo mode
            return NSFWResult(
                is_nsfw=False,
                confidence=0.85,
                label="normal",
                all_scores={"normal": 0.85, "nsfw": 0.15},
                model_used=f"{model_id} (demo)"
            )

        result = await self._query_model(model_id, image_data)

        if isinstance(result, list) and len(result) > 0:
            # Parse classification results
            scores = {item["label"]: item["score"] for item in result}

            # Determine if NSFW based on model
            nsfw_labels = ["nsfw", "porn", "sexy", "hentai", "UNSAFE", "QUESTIONABLE", "Unsafe Content"]
            safe_labels = ["normal", "sfw", "neutral", "SAFE", "Safe Content"]

            is_nsfw = False
            nsfw_score = 0.0
            label = "unknown"

            for item in result:
                if item["label"].lower() in [l.lower() for l in nsfw_labels]:
                    nsfw_score = max(nsfw_score, item["score"])
                    if item["score"] > 0.5:
                        is_nsfw = True
                        label = item["label"]

            if not is_nsfw:
                for item in result:
                    if item["label"].lower() in [l.lower() for l in safe_labels]:
                        if item["score"] > 0.5:
                            label = item["label"]
                            break

            return NSFWResult(
                is_nsfw=is_nsfw,
                confidence=max(scores.values()),
                label=label,
                all_scores=scores,
                model_used=model_id
            )

        return NSFWResult(
            is_nsfw=False,
            confidence=0.0,
            label="error",
            all_scores={"error": 1.0},
            model_used=model_id
        )

    async def detect_nsfw_multi_model(
        self,
        image_data: bytes,
        models: List[str] = ["falconsai", "adamcodd", "marqo"]
    ) -> Dict[str, NSFWResult]:
        """
        Run NSFW detection with multiple models for higher accuracy.

        Returns results from all specified models.
        """
        results = {}
        for model in models:
            results[model] = await self.detect_nsfw_image(image_data, model)
        return results

    # ============== AGE ESTIMATION ==============

    async def estimate_age(
        self,
        image_data: bytes,
        model: str = "vit_age"
    ) -> AgeResult:
        """
        Estimate age from a face image.

        Args:
            image_data: Raw image bytes containing a face
            model: Model to use (vit_age, dima806_age, dima806_faces, swin_age)

        Returns:
            AgeResult with age estimation
        """
        model_id = self.config.AGE_MODELS.get(model, self.config.AGE_MODELS["vit_age"])

        if not self.is_configured():
            # Demo mode
            return AgeResult(
                estimated_age="25-34",
                confidence=0.75,
                age_range="adult",
                all_scores={"25-34": 0.75, "35-44": 0.15, "18-24": 0.10},
                model_used=f"{model_id} (demo)"
            )

        result = await self._query_model(model_id, image_data)

        if isinstance(result, list) and len(result) > 0:
            scores = {item["label"]: item["score"] for item in result}
            top_result = result[0]

            # Determine age range category
            age_label = top_result["label"]
            age_range = self._categorize_age(age_label)

            return AgeResult(
                estimated_age=age_label,
                confidence=top_result["score"],
                age_range=age_range,
                all_scores=scores,
                model_used=model_id
            )

        return AgeResult(
            estimated_age="unknown",
            confidence=0.0,
            age_range="unknown",
            all_scores={},
            model_used=model_id
        )

    def _categorize_age(self, age_label: str) -> str:
        """Categorize age label into minor/adult/senior."""
        # Handle various label formats
        age_label_lower = age_label.lower()

        # Check for numeric ranges
        minor_indicators = ["0-", "1-", "2-", "3-", "4-", "5-", "6-", "7-", "8-", "9-", "10-", "11-", "12-", "13-", "14-", "15-", "16-", "17-", "child", "teen", "minor"]
        senior_indicators = ["60-", "65-", "70-", "75-", "80-", "85-", "90-", "elder", "senior"]

        for indicator in minor_indicators:
            if indicator in age_label_lower:
                return "minor"

        for indicator in senior_indicators:
            if indicator in age_label_lower:
                return "senior"

        return "adult"

    # ============== TOXIC CONTENT DETECTION ==============

    async def detect_toxicity(
        self,
        text: str,
        model: str = "toxic_bert"
    ) -> ToxicityResult:
        """
        Detect toxic/hate speech in text.

        Args:
            text: Text to analyze
            model: Model to use (toxic_bert, multilingual_toxic, offensive_speech, etc.)

        Returns:
            ToxicityResult with toxicity analysis
        """
        model_id = self.config.TOXIC_MODELS.get(model, self.config.TOXIC_MODELS["toxic_bert"])

        if not self.is_configured():
            # Demo mode
            return ToxicityResult(
                is_toxic=False,
                toxicity_score=0.05,
                categories={"toxic": 0.05, "non_toxic": 0.95},
                model_used=f"{model_id} (demo)"
            )

        result = await self._query_model(model_id, {"inputs": text})

        if isinstance(result, list) and len(result) > 0:
            # Handle nested list structure from HF
            if isinstance(result[0], list):
                result = result[0]

            scores = {item["label"]: item["score"] for item in result}

            # Determine toxicity
            toxic_labels = ["toxic", "LABEL_1", "hate", "offensive", "1"]
            toxicity_score = 0.0

            for item in result:
                if item["label"].lower() in [l.lower() for l in toxic_labels] or item["label"] == "LABEL_1":
                    toxicity_score = max(toxicity_score, item["score"])

            return ToxicityResult(
                is_toxic=toxicity_score > 0.5,
                toxicity_score=toxicity_score,
                categories=scores,
                model_used=model_id
            )

        return ToxicityResult(
            is_toxic=False,
            toxicity_score=0.0,
            categories={},
            model_used=model_id
        )

    # ============== NSFW TEXT DETECTION ==============

    async def detect_nsfw_text(
        self,
        text: str,
        model: str = "tostai_text"
    ) -> NSFWResult:
        """
        Detect NSFW content in text.

        Args:
            text: Text to analyze
            model: Model to use (tostai_text, nsfw_detector)

        Returns:
            NSFWResult with detection results
        """
        model_id = self.config.NSFW_TEXT_MODELS.get(model, self.config.NSFW_TEXT_MODELS["tostai_text"])

        if not self.is_configured():
            # Demo mode
            return NSFWResult(
                is_nsfw=False,
                confidence=0.90,
                label="SAFE",
                all_scores={"SAFE": 0.90, "QUESTIONABLE": 0.07, "UNSAFE": 0.03},
                model_used=f"{model_id} (demo)"
            )

        result = await self._query_model(model_id, {"inputs": text})

        if isinstance(result, list) and len(result) > 0:
            if isinstance(result[0], list):
                result = result[0]

            scores = {item["label"]: item["score"] for item in result}

            nsfw_labels = ["UNSAFE", "QUESTIONABLE", "nsfw", "pornographic", "1", "LABEL_1"]
            is_nsfw = False
            nsfw_score = 0.0
            label = "SAFE"

            for item in result:
                if item["label"] in nsfw_labels:
                    nsfw_score = max(nsfw_score, item["score"])
                    if item["score"] > 0.5:
                        is_nsfw = True
                        label = item["label"]

            if not is_nsfw:
                label = max(result, key=lambda x: x["score"])["label"]

            return NSFWResult(
                is_nsfw=is_nsfw,
                confidence=max(scores.values()),
                label=label,
                all_scores=scores,
                model_used=model_id
            )

        return NSFWResult(
            is_nsfw=False,
            confidence=0.0,
            label="error",
            all_scores={},
            model_used=model_id
        )

    # ============== COMPREHENSIVE MODERATION ==============

    async def moderate_content(
        self,
        image_data: Optional[bytes] = None,
        text: Optional[str] = None,
        check_age: bool = True
    ) -> ContentModerationResult:
        """
        Comprehensive content moderation using multiple models.

        Args:
            image_data: Optional image bytes to analyze
            text: Optional text to analyze
            check_age: Whether to run age estimation on images

        Returns:
            ContentModerationResult with all analysis results
        """
        flags = []
        recommendations = []
        overall_safe = True

        nsfw_image_result = None
        age_result = None
        toxicity_result = None
        nsfw_text_result = None

        # Analyze image
        if image_data:
            nsfw_image_result = await self.detect_nsfw_image(image_data)

            if nsfw_image_result.is_nsfw:
                flags.append("nsfw_image_detected")
                recommendations.append("Apply age verification or content warning")
                overall_safe = False

            if check_age:
                age_result = await self.estimate_age(image_data)

                if age_result.age_range == "minor":
                    flags.append("potential_minor_detected")
                    recommendations.append("CRITICAL: Manual review required for age verification")
                    overall_safe = False

        # Analyze text
        if text:
            toxicity_result = await self.detect_toxicity(text)
            nsfw_text_result = await self.detect_nsfw_text(text)

            if toxicity_result.is_toxic:
                flags.append("toxic_content_detected")
                recommendations.append("Review and moderate text content")
                overall_safe = False

            if nsfw_text_result.is_nsfw:
                flags.append("nsfw_text_detected")
                recommendations.append("Apply content warnings to text")
                overall_safe = False

        if overall_safe:
            recommendations.append("Content appears safe for publication")

        return ContentModerationResult(
            nsfw_image=nsfw_image_result,
            age_estimation=age_result,
            toxicity=toxicity_result,
            nsfw_text=nsfw_text_result,
            overall_safe=overall_safe,
            flags=flags,
            recommendations=recommendations
        )

    # ============== UTILITY METHODS ==============

    def get_available_models(self) -> dict:
        """Get all available models by category."""
        return {
            "nsfw_image": list(self.config.NSFW_IMAGE_MODELS.keys()),
            "age_estimation": list(self.config.AGE_MODELS.keys()),
            "toxicity": list(self.config.TOXIC_MODELS.keys()),
            "nsfw_text": list(self.config.NSFW_TEXT_MODELS.keys()),
            "nudity": list(self.config.NUDITY_MODELS.keys()),
        }

    def get_model_info(self) -> dict:
        """Get detailed model information."""
        return {
            "nsfw_image": {
                "falconsai": {
                    "id": "Falconsai/nsfw_image_detection",
                    "description": "Most popular NSFW detector, 80k images trained, ViT-based",
                    "classes": ["normal", "nsfw"],
                },
                "adamcodd": {
                    "id": "AdamCodd/vit-base-nsfw-detector",
                    "description": "96.54% accuracy, restrictive (classifies sexy as NSFW)",
                    "classes": ["SFW", "NSFW"],
                },
                "marqo": {
                    "id": "Marqo/nsfw-image-detection-384",
                    "description": "98.56% accuracy, 18-20x smaller, lightweight",
                    "classes": ["safe", "nsfw"],
                },
                "tostai_large": {
                    "id": "TostAI/nsfw-image-detection-large",
                    "description": "FocalNet-based, 3-class classification",
                    "classes": ["SAFE", "QUESTIONABLE", "UNSAFE"],
                },
                "lukejacob": {
                    "id": "LukeJacob2023/nsfw-image-detector",
                    "description": "5-class detailed classification, 93.16% accuracy",
                    "classes": ["drawings", "hentai", "neutral", "porn", "sexy"],
                },
            },
            "age_estimation": {
                "vit_age": {
                    "id": "nateraw/vit-age-classifier",
                    "description": "ViT finetuned on FairFace dataset",
                },
                "dima806_faces": {
                    "id": "dima806/faces_age_detection",
                    "description": "91% accuracy age group detection",
                },
            },
            "toxicity": {
                "toxic_bert": {
                    "id": "unitary/toxic-bert",
                    "description": "Trained on Jigsaw challenges, multi-class toxicity",
                },
                "offensive_speech": {
                    "id": "Falconsai/offensive_speech_detection",
                    "description": "DistilBERT for hate/offensive speech",
                },
            },
        }

    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None


# Singleton instance
huggingface_service = HuggingFaceService()
