# agents/query_analyzer.py
from typing import Dict, Any

class QueryAnalyzerAgent:
    def __init__(self):
        pass
    
    def analyze_query(self, query: str) -> Dict[str, Any]:
        """
        Analyze the query type - EXACT same logic as your current prompt selection
        but organized separately.
        """
        query_lower = query.lower()
        
        analysis = {
            "original_query": query,
            "query_type": "general",  # Default type
        }
        
        # EXACT same logic from your generate_rag_response function
        if any(word in query_lower for word in ['what is', 'define', 'definition']):
            analysis["query_type"] = "definition"
            
        elif any(word in query_lower for word in ['how', 'process', 'steps', 'method']):
            analysis["query_type"] = "process"
            
        elif any(word in query_lower for word in ['compare', 'difference', 'vs', 'versus']):
            analysis["query_type"] = "comparison"
        
        return analysis