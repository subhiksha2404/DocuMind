# DocuMind - AI Document Assistant
DocuMind is an AI-powered document assistant that allows you to chat with your documents using RAG (Retrieval Augmented Generation) technology.

# Features
📄 Document Upload: Upload PDF, DOCX, TXT, and CSV files

🤖 AI Chat: Ask questions about your uploaded documents

🔍 Semantic Search: Find relevant content across all documents

🚀 Multiple AI Agents: Choose between custom agents or LangGraph

⚡ Fast Responses: Powered by Gemini Flash and ChromaDB

# Quick Start
## 1. Clone the Repository
git clone https://github.com/PJRenu/DocuMind.git

cd DocuMind

## 2. Create Virtual Environment

python -m venv venv

Activate 

On Windows:
venv\Scripts\activate

On macOS/Linux:
source venv/bin/activate

## 3. Backend setup
cd backend

pip install -r requirements.txt

uvicorn main:app --reload

✅ Backend running at: http://localhost:8000

## 4. Frontend Setup
cd src

npm install

npm run dev

✅ Frontend running at: http://localhost:5173
