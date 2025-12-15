"""
AI Help Bot Router
Provides AI-powered tutorials and assistance
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/api/help", tags=["Help Bot"])


class HelpQuery(BaseModel):
    question: str
    context: Optional[str] = None  # Current screen/feature user is on
    user_id: Optional[str] = None


class HelpResponse(BaseModel):
    answer: str
    related_articles: List[dict]
    suggested_actions: List[dict]
    follow_up_questions: List[str]


class TutorialStep(BaseModel):
    step_number: int
    title: str
    description: str
    action: Optional[str] = None
    screenshot_url: Optional[str] = None


class Tutorial(BaseModel):
    id: str
    title: str
    description: str
    duration_minutes: int
    steps: List[TutorialStep]


# Knowledge base for common questions
KNOWLEDGE_BASE = {
    "getting_started": {
        "keywords": ["start", "begin", "setup", "new", "account", "register"],
        "answer": """Welcome to WickedCRM! Here's how to get started:

1. **Create an Account**: Sign up with your email or phone number
2. **Grant Permissions**: Allow access to SMS/messages when prompted
3. **Set as Default**: Make WickedCRM your default messaging app
4. **Explore Features**: Check out the inbox, contacts, and AI insights

Need help with a specific step? Just ask!""",
        "related": ["sync_messages", "permissions", "ai_features"]
    },
    "sync_messages": {
        "keywords": ["sync", "messages", "not showing", "import", "transfer"],
        "answer": """To sync your messages:

**Android:**
1. Open WickedCRM SMS
2. Grant SMS permissions
3. Set as default SMS app
4. Messages sync automatically

**iPhone (iMessage):**
1. Install WickedCRM iMessage Sync on Mac
2. Grant Full Disk Access
3. Enter server URL
4. Messages sync in background

If messages aren't syncing, check permissions in your device settings.""",
        "related": ["permissions", "troubleshooting"]
    },
    "ai_features": {
        "keywords": ["ai", "artificial intelligence", "smart", "detect", "analyze"],
        "answer": """WickedCRM AI automatically analyzes your messages for:

📅 **Meetings**: Detects dates, times, and locations
✅ **Tasks**: Identifies action items and follow-ups
👤 **Contacts**: Extracts names and phone numbers
🎯 **Intent**: Understands what people want

To use AI features:
1. Ensure AI is enabled in Settings → Privacy
2. Open any message to see AI insights
3. Tap detected items to take action""",
        "related": ["settings", "privacy"]
    },
    "delete_data": {
        "keywords": ["delete", "remove", "erase", "privacy", "data"],
        "answer": """You can delete your data anytime:

**Delete Synced Data Only:**
Settings → Privacy → Delete Synced Data
(Keeps local messages, removes server data)

**Delete All Data:**
Settings → Privacy → Delete All My Data
(Removes everything - cannot be undone)

**Delete Account:**
Settings → Privacy → Delete Account
(Permanently removes your account and all data)""",
        "related": ["privacy", "settings"]
    },
    "password_reset": {
        "keywords": ["password", "forgot", "reset", "login", "cant sign in"],
        "answer": """To reset your password:

1. Go to the login screen
2. Tap **Forgot Password**
3. Enter your email or phone number
4. Check your email/SMS for a reset link
5. Create a new password

The reset link expires in 1 hour. If you don't receive it, check spam or try again.""",
        "related": ["account", "security"]
    },
    "spam": {
        "keywords": ["spam", "block", "unwanted", "scam", "report"],
        "answer": """WickedCRM helps protect you from spam:

**Automatic Protection:**
- AI analyzes incoming messages for spam signals
- Known spam numbers are automatically flagged

**Manual Actions:**
- Swipe left on a message → Report Spam
- Open contact → Block Number

**View Blocked:**
Settings → Privacy → Blocked Numbers""",
        "related": ["ai_features", "settings"]
    }
}

TUTORIALS = [
    Tutorial(
        id="onboarding",
        title="Getting Started with WickedCRM",
        description="Learn the basics of WickedCRM in 5 minutes",
        duration_minutes=5,
        steps=[
            TutorialStep(step_number=1, title="Welcome", description="WickedCRM is your AI-powered messaging companion. Let's set it up!"),
            TutorialStep(step_number=2, title="Grant Permissions", description="Tap 'Allow' when prompted for SMS and contact permissions.", action="grant_permissions"),
            TutorialStep(step_number=3, title="Set as Default", description="Make WickedCRM your default messaging app to receive all messages.", action="set_default"),
            TutorialStep(step_number=4, title="Explore Inbox", description="Your unified inbox shows all messages. Try tapping a conversation!", action="open_inbox"),
            TutorialStep(step_number=5, title="AI Insights", description="Tap any message to see AI-detected meetings, tasks, and more.", action="view_ai"),
            TutorialStep(step_number=6, title="All Done!", description="You're ready to go! Explore settings to customize your experience.")
        ]
    ),
    Tutorial(
        id="ai_features",
        title="Using AI Features",
        description="Get the most out of AI-powered insights",
        duration_minutes=3,
        steps=[
            TutorialStep(step_number=1, title="AI Analysis", description="Every message is analyzed for important information."),
            TutorialStep(step_number=2, title="Meeting Detection", description="When a meeting is detected, you'll see date, time, and location."),
            TutorialStep(step_number=3, title="Task Extraction", description="Action items are highlighted so you never miss a follow-up."),
            TutorialStep(step_number=4, title="Smart Actions", description="Tap detected items to add to calendar or create tasks.")
        ]
    ),
    Tutorial(
        id="privacy",
        title="Managing Your Privacy",
        description="Control your data and privacy settings",
        duration_minutes=2,
        steps=[
            TutorialStep(step_number=1, title="Privacy Settings", description="Go to Settings → Privacy to manage your data."),
            TutorialStep(step_number=2, title="Export Data", description="Download all your data anytime with Export My Data."),
            TutorialStep(step_number=3, title="Delete Data", description="Remove synced data or delete your entire account."),
            TutorialStep(step_number=4, title="AI Controls", description="Toggle AI processing on or off based on your preference.")
        ]
    )
]


def find_best_answer(question: str) -> dict:
    """Find the best matching answer from knowledge base"""
    question_lower = question.lower()
    best_match = None
    best_score = 0

    for key, item in KNOWLEDGE_BASE.items():
        score = sum(1 for keyword in item["keywords"] if keyword in question_lower)
        if score > best_score:
            best_score = score
            best_match = item

    if best_match:
        return best_match

    # Default response
    return {
        "answer": """I'd be happy to help! Here are some common topics:

- **Getting Started**: How to set up WickedCRM
- **Message Sync**: Connecting your messages
- **AI Features**: Understanding AI insights
- **Privacy**: Managing your data
- **Password Reset**: Recovering your account

What would you like to know more about?""",
        "related": ["getting_started", "sync_messages", "ai_features"]
    }


@router.post("/ask")
async def ask_help_bot(query: HelpQuery) -> HelpResponse:
    """
    Ask the AI help bot a question.
    Returns relevant answers, articles, and suggested actions.
    """
    result = find_best_answer(query.question)

    related_articles = [
        {"id": key, "title": KNOWLEDGE_BASE.get(key, {}).get("answer", "")[:50] + "..."}
        for key in result.get("related", [])
        if key in KNOWLEDGE_BASE
    ]

    return HelpResponse(
        answer=result["answer"],
        related_articles=related_articles,
        suggested_actions=[
            {"action": "open_settings", "label": "Open Settings"},
            {"action": "contact_support", "label": "Contact Support"}
        ],
        follow_up_questions=[
            "How do I sync my messages?",
            "What does AI detect?",
            "How do I delete my data?"
        ]
    )


@router.get("/tutorials")
async def get_tutorials() -> List[Tutorial]:
    """Get all available tutorials"""
    return TUTORIALS


@router.get("/tutorials/{tutorial_id}")
async def get_tutorial(tutorial_id: str) -> Tutorial:
    """Get a specific tutorial by ID"""
    for tutorial in TUTORIALS:
        if tutorial.id == tutorial_id:
            return tutorial
    raise HTTPException(status_code=404, detail="Tutorial not found")


@router.get("/articles/{topic}")
async def get_help_article(topic: str) -> dict:
    """Get a specific help article"""
    if topic in KNOWLEDGE_BASE:
        return {
            "topic": topic,
            "content": KNOWLEDGE_BASE[topic]["answer"],
            "related": KNOWLEDGE_BASE[topic].get("related", [])
        }
    raise HTTPException(status_code=404, detail="Article not found")


@router.get("/search")
async def search_help(q: str) -> List[dict]:
    """Search help articles"""
    results = []
    q_lower = q.lower()

    for key, item in KNOWLEDGE_BASE.items():
        if any(keyword in q_lower for keyword in item["keywords"]):
            results.append({
                "id": key,
                "title": key.replace("_", " ").title(),
                "preview": item["answer"][:100] + "...",
                "relevance": sum(1 for kw in item["keywords"] if kw in q_lower)
            })

    results.sort(key=lambda x: x["relevance"], reverse=True)
    return results[:5]


@router.post("/feedback")
async def submit_feedback(helpful: bool, article_id: Optional[str] = None, comment: Optional[str] = None):
    """Submit feedback on help content"""
    # In production, store this feedback
    return {
        "status": "received",
        "message": "Thank you for your feedback!"
    }
