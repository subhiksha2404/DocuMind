# agents/langgraph_orchestrator.py
from typing import Dict, Any, TypedDict
from langgraph.graph import StateGraph, END
from .query_analyzer import QueryAnalyzerAgent
from .search_agent import SearchAgent
from .answer_generator import AnswerGeneratorAgent

# Define state for LangGraph
class AgentState(TypedDict):
    query: str
    query_analysis: Dict[str, Any]
    search_results: Dict[str, Any]
    final_answer: str
    n_context_chunks: int

class LangGraphOrchestrator:
    def __init__(self):
        self.query_analyzer = QueryAnalyzerAgent()
        self.search_agent = SearchAgent()
        self.answer_generator = AnswerGeneratorAgent()
        self.graph = self._build_graph()
    
    def _build_graph(self):
        """Build the LangGraph workflow"""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("analyze_query", self._analyze_query_node)
        workflow.add_node("search_documents", self._search_documents_node)
        workflow.add_node("generate_answer", self._generate_answer_node)
        
        # Define flow
        workflow.set_entry_point("analyze_query")
        workflow.add_edge("analyze_query", "search_documents")
        workflow.add_edge("search_documents", "generate_answer")
        workflow.add_edge("generate_answer", END)
        
        return workflow.compile()
    
    def _analyze_query_node(self, state: AgentState) -> AgentState:
        """Node 1: Analyze the query"""
        print("🔍 [LangGraph] Analyzing query...")
        state["query_analysis"] = self.query_analyzer.analyze_query(state["query"])
        return state
    
    def _search_documents_node(self, state: AgentState) -> AgentState:
        """Node 2: Search for documents"""
        print("📚 [LangGraph] Searching documents...")
        state["search_results"] = self.search_agent.search_documents(
            state["query"], 
            state.get("n_context_chunks", 5)
        )
        return state
    
    def _generate_answer_node(self, state: AgentState) -> AgentState:
        """Node 3: Generate final answer"""
        print("🤖 [LangGraph] Generating answer...")
        state["final_answer"] = self.answer_generator.generate_answer(
            state["query"],
            state["search_results"]["context_chunks"],
            state["query_analysis"]
        )
        return state
    
    def process_query(self, query: str, n_context_chunks: int = 5) -> Dict[str, Any]:
        """Process query using LangGraph"""
        print("🚀 [LangGraph] Starting LangGraph workflow...")
        
        # Initialize state
        initial_state: AgentState = {
            "query": query,
            "query_analysis": {},
            "search_results": {},
            "final_answer": "",
            "n_context_chunks": n_context_chunks
        }
        
        # Execute graph
        final_state = self.graph.invoke(initial_state)
        
        return {
            "question": query,
            "answer": final_state["final_answer"],
            "sources": final_state["search_results"]["sources"],
            "model_used": "langgraph",
            "workflow_used": "langgraph"
        }