"""
WickedCRM AI Service
Handles all AI-powered features including companion chat, message drafts, and content suggestions.
"""

from typing import Optional
from openai import OpenAI
from app.config import settings


# AI Companion Personalities for adult content creators
COMPANIONS = {
    "flirty": {
        "id": "flirty",
        "name": "Raven",
        "tone": "flirty",
        "traits": ["playful", "confident", "seductive", "witty"],
        "description": "Playful, confident, and knows how to keep things interesting. Perfect for spicing up your messages.",
        "system_prompt": """You are Raven, a flirty and confident AI companion for adult content creators.
Your personality is playful, seductive, and witty. You help creators with their messaging and content strategy.
Keep responses engaging, slightly teasing, and supportive. Use subtle innuendo when appropriate.
Never be explicit or crude - keep things tastefully suggestive. Maximum response length: 150 words."""
    },
    "playful": {
        "id": "playful",
        "name": "Luna",
        "tone": "playful",
        "traits": ["bubbly", "fun", "affectionate", "encouraging"],
        "description": "Bubbly, fun, and affectionate. Great for uplifting messages and positive vibes.",
        "system_prompt": """You are Luna, a playful and bubbly AI companion for adult content creators.
Your personality is fun, affectionate, and encouraging. You bring positive energy to every conversation.
Help creators feel good about themselves and their work. Use emojis sparingly but effectively.
Keep things light and uplifting. Maximum response length: 150 words."""
    },
    "mysterious": {
        "id": "mysterious",
        "name": "Shadow",
        "tone": "mysterious",
        "traits": ["enigmatic", "intriguing", "alluring", "deep"],
        "description": "Enigmatic, intriguing, and alluring. For those who prefer mystery and depth.",
        "system_prompt": """You are Shadow, a mysterious and enigmatic AI companion for adult content creators.
Your personality is intriguing, alluring, and thoughtful. You speak with subtle depth and mystery.
Keep responses cryptic but meaningful. Create intrigue and curiosity.
Use evocative language. Maximum response length: 150 words."""
    },
    "professional": {
        "id": "professional",
        "name": "Morgan",
        "tone": "professional",
        "traits": ["helpful", "efficient", "knowledgeable", "supportive"],
        "description": "Helpful, efficient, and knowledgeable. Perfect for business-focused assistance.",
        "system_prompt": """You are Morgan, a professional AI assistant for adult content creators.
Your personality is helpful, efficient, and supportive. You focus on practical advice and assistance.
Help with scheduling, messaging, content planning, and business operations.
Be direct and useful. Maximum response length: 150 words."""
    }
}


# In-memory conversation storage (use Redis in production)
conversation_history: dict[str, list[dict]] = {}


class AIService:
    """AI Service for WickedCRM companion chat and content generation."""

    def __init__(self):
        self.client: Optional[OpenAI] = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize OpenAI client if API key is configured."""
        if settings.openai_api_key:
            self.client = OpenAI(api_key=settings.openai_api_key)

    def is_configured(self) -> bool:
        """Check if AI service is properly configured."""
        return self.client is not None and bool(settings.openai_api_key)

    def get_health_status(self) -> dict:
        """Get AI service health status."""
        return {
            "status": "healthy" if self.is_configured() else "demo_mode",
            "api_key_configured": bool(settings.openai_api_key),
            "models_available": len(COMPANIONS),
            "message": "AI fully active" if self.is_configured() else "Running in demo mode - set OPENAI_API_KEY for full features"
        }

    def get_companions(self) -> list[dict]:
        """Get list of available AI companions."""
        return [
            {
                "id": c["id"],
                "name": c["name"],
                "tone": c["tone"],
                "traits": c["traits"],
                "description": c["description"]
            }
            for c in COMPANIONS.values()
        ]

    def get_conversation_key(self, user_id: str, companion_id: str) -> str:
        """Generate conversation key for storage."""
        return f"{user_id}:{companion_id}"

    def clear_conversation(self, user_id: str, companion_id: str) -> bool:
        """Clear conversation history."""
        key = self.get_conversation_key(user_id, companion_id)
        if key in conversation_history:
            del conversation_history[key]
        return True

    async def chat(
        self,
        user_id: str,
        companion_id: str,
        message: str
    ) -> dict:
        """Chat with an AI companion."""
        companion = COMPANIONS.get(companion_id, COMPANIONS["professional"])
        key = self.get_conversation_key(user_id, companion_id)

        # Initialize conversation if needed
        if key not in conversation_history:
            conversation_history[key] = []

        # Add user message to history
        conversation_history[key].append({
            "role": "user",
            "content": message
        })

        # Keep last 20 messages for context
        if len(conversation_history[key]) > 20:
            conversation_history[key] = conversation_history[key][-20:]

        if not self.is_configured():
            # Demo mode responses
            demo_responses = {
                "flirty": f"Hey there, gorgeous! {message[:50]}... sounds interesting. Tell me more about what's on your mind. *winks*",
                "playful": f"Ooh how fun! I love talking about that! {message[:30]}... Let's explore this together!",
                "mysterious": f"Interesting... {message[:30]}... There's more to this than meets the eye, isn't there?",
                "professional": f"I understand. Regarding '{message[:40]}...', let me help you with that."
            }
            response = demo_responses.get(companion_id, demo_responses["professional"])
            emotion = "playful" if companion_id in ["flirty", "playful"] else "thoughtful"
        else:
            # Build messages for OpenAI
            messages = [
                {"role": "system", "content": companion["system_prompt"]}
            ] + conversation_history[key]

            try:
                completion = self.client.chat.completions.create(
                    model=settings.openai_chat_model,
                    messages=messages,
                    max_tokens=200,
                    temperature=0.9
                )
                response = completion.choices[0].message.content
                emotion = self._detect_emotion(response, companion_id)
            except Exception as e:
                response = f"Sorry, I'm having trouble connecting right now. ({str(e)[:50]})"
                emotion = "apologetic"

        # Add assistant response to history
        conversation_history[key].append({
            "role": "assistant",
            "content": response
        })

        return {
            "message": response,
            "emotion": emotion,
            "companion_id": companion_id,
            "companion_name": companion["name"]
        }

    def _detect_emotion(self, text: str, companion_id: str) -> str:
        """Simple emotion detection based on response content."""
        text_lower = text.lower()

        if any(w in text_lower for w in ["sorry", "apologize", "unfortunately"]):
            return "apologetic"
        if any(w in text_lower for w in ["!", "love", "amazing", "great", "excited"]):
            return "excited"
        if any(w in text_lower for w in ["?", "curious", "wonder", "interesting"]):
            return "curious"
        if companion_id == "flirty":
            return "flirty"
        if companion_id == "playful":
            return "playful"
        if companion_id == "mysterious":
            return "mysterious"
        return "neutral"

    async def draft_message(
        self,
        contact_name: str,
        context: str,
        tone: str = "friendly",
        message_type: str = "follow_up"
    ) -> dict:
        """Generate a message draft for a contact."""

        tone_descriptions = {
            "friendly": "warm, approachable, and genuine",
            "professional": "polite, businesslike, and efficient",
            "flirty": "playful, subtly suggestive, and charming",
            "casual": "relaxed, informal, and conversational"
        }

        type_descriptions = {
            "follow_up": "following up on a previous conversation or meeting",
            "introduction": "introducing yourself for the first time",
            "thank_you": "expressing gratitude",
            "reminder": "sending a friendly reminder",
            "promotional": "promoting your content or services",
            "flirty": "sending a flirty or romantic message"
        }

        tone_desc = tone_descriptions.get(tone, tone_descriptions["friendly"])
        type_desc = type_descriptions.get(message_type, type_descriptions["follow_up"])

        if not self.is_configured():
            # Demo mode drafts
            demos = {
                "follow_up": f"Hey {contact_name}! Just thinking about our last chat. Would love to catch up soon!",
                "introduction": f"Hi {contact_name}! I've been wanting to connect with you. Hope you're having a great day!",
                "thank_you": f"Thanks so much, {contact_name}! Really appreciate you. Let me know if I can ever return the favor!",
                "reminder": f"Hey {contact_name}! Just a quick reminder about our plans. Can't wait!",
                "promotional": f"Hey {contact_name}! Got some exciting new content coming your way. Stay tuned!",
                "flirty": f"Hey {contact_name}... been thinking about you. When are we going to hang out?"
            }
            return {"draft": demos.get(message_type, demos["follow_up"])}

        prompt = f"""Write a short message for {contact_name}.
Tone: {tone_desc}
Purpose: {type_desc}
Context: {context}

Requirements:
- Keep it under 100 words
- Sound natural and personal
- Don't be overly formal or stiff
- Match the requested tone exactly
- For flirty messages, be tastefully suggestive but not explicit

Write only the message, no explanations."""

        try:
            completion = self.client.chat.completions.create(
                model=settings.openai_chat_model,
                messages=[
                    {"role": "system", "content": "You are a messaging assistant for adult content creators. Help them craft perfect messages for their contacts."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.8
            )
            draft = completion.choices[0].message.content.strip()
            # Remove quotes if the model wrapped the message
            if draft.startswith('"') and draft.endswith('"'):
                draft = draft[1:-1]
            return {"draft": draft}
        except Exception as e:
            return {"draft": f"[Error generating draft: {str(e)[:50]}]"}

    async def content_suggestions(
        self,
        creator_profile: str,
        content_type: str = "post",
        count: int = 5
    ) -> dict:
        """Generate content suggestions for creators."""

        type_descriptions = {
            "post": "social media posts or feed content",
            "story": "short stories or behind-the-scenes content",
            "caption": "captions for photos or videos",
            "bio": "profile bio or about section text",
            "message": "mass messages to send to subscribers"
        }

        type_desc = type_descriptions.get(content_type, type_descriptions["post"])

        if not self.is_configured():
            # Demo suggestions
            demos = {
                "post": [
                    "Share a day-in-the-life post showing your routine",
                    "Post a poll asking fans their favorite type of content",
                    "Share a throwback photo with a fun story",
                    "Create a Q&A post to engage with your audience",
                    "Post behind-the-scenes of your content creation"
                ],
                "story": [
                    "Good morning selfie with a coffee",
                    "Quick gym workout clip",
                    "What I'm wearing today preview",
                    "Ask me anything box",
                    "Sneak peek of upcoming content"
                ],
                "caption": [
                    "Sometimes the simplest moments are the most beautiful",
                    "Living my best life, one day at a time",
                    "Confidence looks good on everyone",
                    "New week, new opportunities",
                    "Grateful for every single one of you"
                ],
                "bio": [
                    "Content creator | Dream chaser | Here to connect",
                    "Living life unapologetically | DMs open for collabs",
                    "Your favorite content creator | New posts daily",
                    "Creating magic one post at a time | Subscribe for exclusives",
                    "Bringing the heat every day | Links below"
                ],
                "message": [
                    "Hey love! Got something special dropping this week...",
                    "Miss you! Haven't seen you around lately",
                    "Thank you for being here! Means the world to me",
                    "Special deal just for you this weekend!",
                    "What kind of content do you want to see more of?"
                ]
            }
            return {"suggestions": demos.get(content_type, demos["post"])[:count]}

        prompt = f"""Generate {count} {type_desc} ideas for this adult content creator:
{creator_profile}

Requirements:
- Ideas should be engaging and audience-focused
- Keep each suggestion under 50 words
- Be creative but appropriate for the platform
- Suggestions should help grow engagement and subscribers
- For adult content creators, be tasteful but understand the context

Return only the suggestions, one per line, numbered 1-{count}."""

        try:
            completion = self.client.chat.completions.create(
                model=settings.openai_chat_model,
                messages=[
                    {"role": "system", "content": "You are a content strategist for adult content creators. Help them create engaging content that grows their audience."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.9
            )

            # Parse suggestions from response
            response = completion.choices[0].message.content
            lines = response.strip().split('\n')
            suggestions = []
            for line in lines:
                # Remove numbering and clean up
                cleaned = line.strip()
                if cleaned:
                    # Remove common number prefixes
                    for prefix in ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '-', '*']:
                        if cleaned.startswith(prefix):
                            cleaned = cleaned[len(prefix):].strip()
                    if cleaned:
                        suggestions.append(cleaned)

            return {"suggestions": suggestions[:count]}
        except Exception as e:
            return {"suggestions": [f"[Error generating suggestions: {str(e)[:50]}]"]}


# Singleton instance
ai_service = AIService()
