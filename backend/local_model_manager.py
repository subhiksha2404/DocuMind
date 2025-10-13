# local_model_manager.py
import os
from typing import List, Dict, Any
import google.generativeai as genai
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import torch
from config import Config

class LocalModelManager:
    def __init__(self):
        self.available_models = Config.INFERENCE_MODELS
        self.current_model = "gemini"
        self.model = None
        self.tokenizer = None
        
        # Initialize Gemini
        if Config.GEMINI_API_KEY:
            genai.configure(api_key=Config.GEMINI_API_KEY)
            self.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
            print("✅ Gemini model initialized")
        else:
            self.gemini_model = None
            print("❌ Gemini API key not found")
    
    def load_local_model(self, model_name: str):
        """Load a local HuggingFace model"""
        try:
            print(f"Loading model: {model_name}")
            
            if model_name == "gemini":
                self.current_model = "gemini"
                if self.gemini_model:
                    print("✅ Using Gemini model")
                else:
                    print("❌ Gemini not available, please check API key")
                return
            
            # For smaller models that can run locally
            device = 0 if torch.cuda.is_available() and Config.LOCAL_MODEL_DEVICE == "cuda" else -1
            
            if model_name in ["microsoft/DialoGPT-medium", "microsoft/DialoGPT-large"]:
                self.model = pipeline(
                    "text-generation",
                    model=model_name,
                    tokenizer=model_name,
                    max_new_tokens=Config.MAX_NEW_TOKENS,
                    temperature=0.7,
                    do_sample=True,
                    device=device
                )
            elif model_name == "google/flan-t5-base":
                self.model = pipeline(
                    "text2text-generation",
                    model=model_name,
                    max_new_tokens=Config.MAX_NEW_TOKENS,
                    temperature=0.7,
                    device=device
                )
            
            self.current_model = model_name
            print(f"✅ Loaded local model: {model_name} on device: {device}")
            
        except Exception as e:
            print(f"❌ Failed to load model {model_name}: {e}")
            # Fallback to Gemini if available
            if self.gemini_model:
                self.current_model = "gemini"
                print("🔄 Falling back to Gemini")
    
    def generate_response(self, prompt: str) -> str:
        """Generate response using current model"""
        try:
            if self.current_model == "gemini" and self.gemini_model:
                response = self.gemini_model.generate_content(prompt)
                return response.text
            
            elif self.model:
                # For text-generation models (DialoGPT)
                if self.model.task == "text-generation":
                    result = self.model(
                        prompt,
                        max_new_tokens=Config.MAX_NEW_TOKENS,
                        temperature=0.7,
                        do_sample=True,
                        pad_token_id=self.model.tokenizer.eos_token_id
                    )
                    return result[0]['generated_text'].replace(prompt, '').strip()
                
                # For text2text models (FLAN-T5)
                elif self.model.task == "text2text-generation":
                    result = self.model(prompt, max_new_tokens=Config.MAX_NEW_TOKENS)
                    return result[0]['generated_text']
            
            # Fallback response
            return "I understand your question but couldn't generate a detailed response with the current model configuration."
            
        except Exception as e:
            print(f"❌ Generation error: {e}")
            return f"Sorry, I encountered an error: {str(e)}"

# Global instance
model_manager = LocalModelManager()