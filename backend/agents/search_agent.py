# agents/search_agent.py
from typing import List, Dict, Any

class SearchAgent:
    def __init__(self):
        pass
    
    def search_documents(self, query: str, n_results: int = 5) -> Dict[str, Any]:
        """
        Search for documents - EXACT same search logic as your current chat function
        but organized separately.
        """
        try:
            # We'll import these inside the function to avoid circular imports
            from main import get_collection, safe_encode
            
            # EXACT same search logic from your chat_with_documents function
            query_embedding = safe_encode([query]).tolist()
            collection = get_collection()
            
            search_results = collection.query(
                query_embeddings=query_embedding,
                n_results=n_results
            )
            
            # EXACT same context extraction
            context_chunks = []
            if search_results and search_results['documents']:
                context_chunks = search_results['documents'][0]
            
            # EXACT same source deduplication logic
            sources = []
            if search_results and search_results['metadatas']:
                seen_sources = set()
                for metadata in search_results['metadatas'][0]:
                    source_key = f"{metadata.get('filename', '')}-{metadata.get('title', '')}"
                    if source_key not in seen_sources:
                        seen_sources.add(source_key)
                        sources.append({
                            "filename": metadata.get('filename', 'Unknown'),
                            "title": metadata.get('title', 'Untitled'),
                            "author": metadata.get('author', 'Unknown'),
                        })
            
            return {
                "context_chunks": context_chunks,
                "sources": sources,
                "total_chunks_found": len(context_chunks)
            }
            
        except Exception as e:
            return {
                "context_chunks": [],
                "sources": [],
                "total_chunks_found": 0,
                "error": str(e)
            }