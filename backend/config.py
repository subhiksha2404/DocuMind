# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Keys
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY')
    
    # Embedding Models
    EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2')
    
    # Text Processing (from your main.py)
    CHUNK_SIZE = 512  # From your split_text_into_chunks function
    CHUNK_OVERLAP = 50
    
    # Paths (from your main.py)
    VECTORSTORE_PATH = os.path.abspath("./vector_db")
    CHROMA_DB_DIR = os.path.join(VECTORSTORE_PATH, "chroma_db")
    LOG_FILE_PATH = os.path.join(VECTORSTORE_PATH, "document_log.json")
    
    # Local Model Settings
    LOCAL_MODEL_DEVICE = os.getenv('LOCAL_MODEL_DEVICE', 'cpu')
    MAX_NEW_TOKENS = int(os.getenv('MAX_NEW_TOKENS', 500))
    
    # Available Models
    EMBEDDING_MODELS = {
        "BAAI/bge-m3": "BAAI/bge-m3",
        "sentence-transformers/all-MiniLM-L6-v2": "sentence-transformers/all-MiniLM-L6-v2"
    }
    
    INFERENCE_MODELS = {
        "gemini": {"api_url": "local", "requires_key": True},
        "microsoft/DialoGPT-large": {"api_url": "local", "requires_key": False},
        "microsoft/DialoGPT-medium": {"api_url": "local", "requires_key": False},
        "google/flan-t5-base": {"api_url": "local", "requires_key": False}
    }