#!/bin/bash
# WickedCRM AI Backend Setup Script
# Cost-effective LLM inference for adult platforms

echo "=========================================="
echo "  WickedCRM AI Backend Setup"
echo "=========================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found. Please install Python 3.9+"
    exit 1
fi

echo "1. Installing Python dependencies..."
pip3 install -q fastapi uvicorn openai pydantic-settings httpx python-multipart

echo ""
echo "2. Checking LLM Providers..."
echo ""

# Check Ollama
echo "   [FREE] Ollama (Local):"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "   ✓ Ollama is running"
    MODELS=$(curl -s http://localhost:11434/api/tags | python3 -c "import sys,json; d=json.load(sys.stdin); print(', '.join([m['name'] for m in d.get('models',[])]))" 2>/dev/null)
    echo "   ✓ Models: $MODELS"
else
    echo "   ✗ Ollama not running"
    echo "     Install: https://ollama.ai"
    echo "     Then run: ollama pull dolphin-mixtral"
fi

echo ""

# Check API Keys
echo "   [CHEAP] Groq API:"
if [ -n "$GROQ_API_KEY" ]; then
    echo "   ✓ GROQ_API_KEY is set"
else
    echo "   ✗ GROQ_API_KEY not set"
    echo "     Get free key: https://console.groq.com"
fi

echo ""
echo "   [CHEAP] Together.ai API:"
if [ -n "$TOGETHER_API_KEY" ]; then
    echo "   ✓ TOGETHER_API_KEY is set"
else
    echo "   ✗ TOGETHER_API_KEY not set"
    echo "     Get \$25 free: https://together.ai"
fi

echo ""
echo "   [NSFW] HuggingFace API:"
if [ -n "$HUGGINGFACE_API_KEY" ]; then
    echo "   ✓ HUGGINGFACE_API_KEY is set"
else
    echo "   ✗ HUGGINGFACE_API_KEY not set"
fi

echo ""
echo "=========================================="
echo "  Cost Comparison (1M tokens)"
echo "=========================================="
echo ""
echo "  Provider          | Cost      | Speed"
echo "  ------------------|-----------|--------"
echo "  Ollama (local)    | FREE      | Medium"
echo "  Groq 8B           | \$0.13     | 800 t/s"
echo "  Groq 70B          | \$1.38     | 300 t/s"
echo "  Together Dolphin  | \$0.60     | Fast"
echo "  OpenAI GPT-4o     | \$7.50     | Slow"
echo ""
echo "=========================================="
echo ""
echo "3. Starting server..."
echo "   API Docs: http://localhost:8000/docs"
echo ""

# Load .env if exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
