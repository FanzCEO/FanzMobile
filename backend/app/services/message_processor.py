"""
WickedCRM AI Message Processor
Extracts entities and insights from messages using LLM.

Extracts:
- People/Contact names
- Phone numbers
- Meeting times and dates
- Locations/places
- Tasks/action items
- Intent classification
- Importance scoring
"""

import re
import json
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel
from app.services.llm_providers import llm_service, LLMRequest, ChatMessage


class ExtractedEntities(BaseModel):
    """Entities extracted from a message."""
    contact_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    meeting_detected: bool = False
    meeting_time: Optional[str] = None
    meeting_date: Optional[str] = None
    meeting_location: Optional[str] = None
    places: List[str] = []
    tasks: List[str] = []
    intent: str = "general"
    sentiment: str = "neutral"
    importance: int = 5  # 1-10 scale
    summary: Optional[str] = None
    follow_up_needed: bool = False
    keywords: List[str] = []


class MessageProcessor:
    """AI-powered message processor for entity extraction."""

    SYSTEM_PROMPT = """You are an AI assistant that analyzes text messages and extracts relevant information.

Your task is to extract the following from the message:
1. Contact names mentioned
2. Phone numbers
3. Email addresses
4. Meeting/appointment details (time, date, location)
5. Places mentioned
6. Tasks or action items
7. The intent of the message (schedule, question, feedback, request, greeting, complaint, etc.)
8. Sentiment (positive, negative, neutral)
9. Importance (1-10, where 10 is urgent)
10. Whether follow-up is needed

Respond ONLY with valid JSON in this exact format:
{
    "contact_name": "name or null",
    "phone_number": "number or null",
    "email": "email or null",
    "meeting_detected": true/false,
    "meeting_time": "time string or null",
    "meeting_date": "date string or null",
    "meeting_location": "location or null",
    "places": ["list", "of", "places"],
    "tasks": ["list", "of", "action items"],
    "intent": "schedule|question|feedback|request|greeting|complaint|general",
    "sentiment": "positive|negative|neutral",
    "importance": 5,
    "summary": "brief one-line summary",
    "follow_up_needed": true/false,
    "keywords": ["key", "words"]
}"""

    def __init__(self):
        self.llm = llm_service

    async def process_message(self, message_body: str, sender_info: Optional[Dict] = None) -> ExtractedEntities:
        """
        Process a message and extract entities using AI.

        Args:
            message_body: The text content of the message
            sender_info: Optional dict with sender details (phone, name, etc.)

        Returns:
            ExtractedEntities with all extracted information
        """
        # First do quick regex-based extraction for common patterns
        quick_results = self._quick_extract(message_body)

        # Then use LLM for deeper analysis
        try:
            llm_results = await self._llm_extract(message_body, sender_info)
            # Merge results, preferring LLM results but keeping regex finds
            return self._merge_results(quick_results, llm_results)
        except Exception as e:
            print(f"LLM extraction failed: {e}, using regex results only")
            return quick_results

    def _quick_extract(self, text: str) -> ExtractedEntities:
        """Quick regex-based extraction for common patterns."""
        entities = ExtractedEntities()

        # Extract phone numbers
        phone_pattern = r'(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}'
        phone_match = re.search(phone_pattern, text)
        if phone_match:
            entities.phone_number = phone_match.group()

        # Extract email
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        email_match = re.search(email_pattern, text)
        if email_match:
            entities.email = email_match.group()

        # Detect meeting keywords
        meeting_keywords = ['meet', 'meeting', 'appointment', 'schedule', 'call', 'zoom', 'coffee', 'lunch', 'dinner']
        text_lower = text.lower()
        entities.meeting_detected = any(kw in text_lower for kw in meeting_keywords)

        # Detect time patterns
        time_patterns = [
            r'\b\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)\b',
            r'\b(?:at|@)\s*\d{1,2}(?::\d{2})?\b',
            r'\bnoon\b', r'\bmidnight\b',
            r'\b(?:morning|afternoon|evening|tonight)\b'
        ]
        for pattern in time_patterns:
            time_match = re.search(pattern, text, re.IGNORECASE)
            if time_match:
                entities.meeting_time = time_match.group()
                break

        # Detect date patterns
        date_patterns = [
            r'\b(?:tomorrow|today|tonight)\b',
            r'\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
            r'\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b',
            r'\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}\b'
        ]
        for pattern in date_patterns:
            date_match = re.search(pattern, text, re.IGNORECASE)
            if date_match:
                entities.meeting_date = date_match.group()
                break

        # Detect urgency keywords
        urgent_keywords = ['urgent', 'asap', 'emergency', 'immediately', 'right now', 'important']
        if any(kw in text_lower for kw in urgent_keywords):
            entities.importance = 9

        # Detect question intent
        if '?' in text or text_lower.startswith(('what', 'when', 'where', 'why', 'how', 'can', 'could', 'would', 'is', 'are')):
            entities.intent = 'question'

        return entities

    async def _llm_extract(self, text: str, sender_info: Optional[Dict] = None) -> ExtractedEntities:
        """Use LLM for intelligent entity extraction."""
        context = ""
        if sender_info:
            context = f"\nSender info: {json.dumps(sender_info)}\n"

        user_message = f"{context}Message to analyze:\n\n{text}"

        request = LLMRequest(
            messages=[
                ChatMessage(role="system", content=self.SYSTEM_PROMPT),
                ChatMessage(role="user", content=user_message)
            ],
            temperature=0.1,  # Low temperature for consistent extraction
            max_tokens=500
        )

        response = await self.llm.generate(request)

        # Parse JSON response
        try:
            # Extract JSON from response (handle markdown code blocks)
            content = response.content
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0]
            elif '```' in content:
                content = content.split('```')[1].split('```')[0]

            data = json.loads(content.strip())
            return ExtractedEntities(**data)
        except (json.JSONDecodeError, Exception) as e:
            print(f"Failed to parse LLM response: {e}")
            return ExtractedEntities()

    def _merge_results(self, quick: ExtractedEntities, llm: ExtractedEntities) -> ExtractedEntities:
        """Merge quick regex results with LLM results."""
        # Use LLM results as base, but keep regex extractions if LLM missed them
        result = llm.model_copy()

        # Keep regex phone/email if LLM didn't find any
        if not result.phone_number and quick.phone_number:
            result.phone_number = quick.phone_number
        if not result.email and quick.email:
            result.email = quick.email

        # If regex found meeting but LLM didn't, use regex
        if quick.meeting_detected and not result.meeting_detected:
            result.meeting_detected = True
        if quick.meeting_time and not result.meeting_time:
            result.meeting_time = quick.meeting_time
        if quick.meeting_date and not result.meeting_date:
            result.meeting_date = quick.meeting_date

        # Take higher importance if urgent keywords were found
        if quick.importance > result.importance:
            result.importance = quick.importance

        return result

    async def batch_process(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process multiple messages in batch.

        Args:
            messages: List of dicts with 'body' and optional 'sender_info'

        Returns:
            List of dicts with 'original' and 'extracted' keys
        """
        results = []
        for msg in messages:
            body = msg.get('body', '')
            sender = msg.get('sender_info')

            extracted = await self.process_message(body, sender)
            results.append({
                'original': msg,
                'extracted': extracted.model_dump()
            })

        return results


# Global instance
message_processor = MessageProcessor()
