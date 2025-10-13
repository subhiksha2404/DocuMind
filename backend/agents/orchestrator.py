# agents/orchestrator.py
from typing import Dict, Any
from .query_analyzer import QueryAnalyzerAgent
from .search_agent import SearchAgent
from .answer_generator import AnswerGeneratorAgent

class AgentOrchestrator:
    def __init__(self):
        self.query_analyzer = QueryAnalyzerAgent()
        self.search_agent = SearchAgent()
        self.answer_generator = AnswerGeneratorAgent()
    
    def process_query(self, query: str, n_context_chunks: int = 5) -> Dict[str, Any]:
        """
        Orchestrate the agent workflow - EXACT same flow as your current chat_with_documents
        but using organized agents.
        """
        # Step 1: Analyze query (this was implicit in your prompt selection)
        query_analysis = self.query_analyzer.analyze_query(query)
        print(f"🔍 Query Analysis: {query_analysis['query_type']}")
        
        # Step 2: Search for documents (EXACT same as before)
        search_results = self.search_agent.search_documents(query, n_context_chunks)
        print(f"📚 Search found {search_results['total_chunks_found']} chunks")
        
        # Step 3: Generate answer (EXACT same as before)
        answer = self.answer_generator.generate_answer(
            query, 
            search_results["context_chunks"], 
            query_analysis
        )
        
        # Return EXACT same response format as your current chat_with_documents
        return {
            "question": query,
            "answer": answer,
            "sources": search_results["sources"],
            "model_used": "agentic"  # We'll update this in the main function
        }