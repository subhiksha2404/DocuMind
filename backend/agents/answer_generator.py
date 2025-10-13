# agents/answer_generator.py
from typing import List, Dict

class AnswerGeneratorAgent:
    def __init__(self):
        pass
    
    def generate_answer(self, query: str, context_chunks: List[str], query_analysis: Dict) -> str:
        """
        Generate answer - EXACT same logic as your current generate_rag_response function
        but organized separately.
        """
        try:
            # EXACT same context formatting
            context = "\n\n".join([f"📄 Source {i+1}:\n{chunk}" for i, chunk in enumerate(context_chunks)])
            
            # EXACT same prompt selection logic from generate_rag_response
            query_type = query_analysis["query_type"]
            
            if query_type == "definition":
                prompt = f"""Based EXCLUSIVELY on the provided document context, provide a comprehensive answer to the user's question.

DOCUMENT CONTEXT:
{context}

USER QUESTION: {query}

Please structure your answer as:
- **Clear Definition**: Start with a concise definition
- **Key Characteristics**: Main features or aspects
- **Importance/Significance**: Why it matters
- **Applications/Examples**: Where and how it's used
- **Summary**: Brief recap

Use markdown formatting with headers (##), bullet points, and **bold** for key terms.
Answer using ONLY the document context above. If the context doesn't contain enough information, say so."""
            
            elif query_type == "process":
                prompt = f"""Based EXCLUSIVELY on the provided document context, explain the process or method asked about.

DOCUMENT CONTEXT:
{context}

USER QUESTION: {query}

Please structure your answer as:
- **Overview**: Brief introduction to the process
- **Step-by-Step Explanation**: Clear sequential steps
- **Key Components**: Important elements involved
- **Applications**: Where this process is used
- **Considerations**: Important factors or limitations

Use markdown formatting and be practical. Answer using ONLY the document context above."""
            
            elif query_type == "comparison":
                prompt = f"""Based EXCLUSIVELY on the provided document context, compare the concepts asked about.

DOCUMENT CONTEXT:
{context}

USER QUESTION: {query}

Please structure your answer as:
- **Overview**: Brief introduction to both concepts
- **Key Differences**: Clear comparison points
- **Similarities**: Common aspects
- **Use Cases**: When to use each
- **Summary**: Comparative conclusion

Use markdown formatting with tables or clear sections. Answer using ONLY the document context above."""
            
            else:
                # EXACT same general prompt
                prompt = f"""Based EXCLUSIVELY on the provided document context, provide a comprehensive and well-structured answer to the user's question.

DOCUMENT CONTEXT:
{context}

USER QUESTION: {query}

Please provide a natural, flowing answer that:
- Directly addresses the question
- Explains key concepts clearly
- Uses appropriate examples from the context
- Highlights important points
- Maintains logical flow

Use markdown formatting with:
## Headers for main sections
- Bullet points for lists
**Bold** for key terms and definitions
Clear paragraph structure

Answer using ONLY the document context above. If the information is insufficient, acknowledge this politely."""

            # EXACT same model call
            from local_model_manager import model_manager
            answer = model_manager.generate_response(prompt)
            
            return answer
            
        except Exception as e:
            return f"I found relevant documents but encountered an error: {str(e)}"