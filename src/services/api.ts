// src/services/api.ts

const API_BASE = import.meta.env.PROD 
  ? '/api'  // Will be proxied through nginx
  : 'http://localhost:8000';

export interface ProgressMessage {
  stage: string;
  progress: number;
  message: string;
  timestamp: string;
}

export interface UploadResult {
  status: string;
  filename: string;
  chunks_stored: number;
  metadata: {
    title: string;
    author: string;
    pages: number;
  };
}

export interface SearchResult {
  query: string;
  results: {
    documents: string[][];
    metadatas: any[][];
    distances: number[][];
  };
}


export interface StatusResult {
  total_vectors_stored: number;
  database_path: string;
  embedding_model: string;
  available_models: string[];
}

export interface FolderUploadResult {
  status: string;
  documents_processed: UploadResult[];
  errors: Array<{ filename: string; error: string }>;
  processed_count: number;
  error_count: number;
  total_files: number;
}

export interface UploadedFile {
  filename: string;
  chunks_stored: number;
  upload_time: string;
  metadata: {
    title: string;
    author: string;
    pages: number;
  };
  file_hash: string;
}
// Add these interfaces to your existing interfaces
export interface ChatMessage {
  question: string;
  answer: string;
  sources: Array<{
    filename: string;
    title: string;
    author: string;
  }>;
  model_used: string;
}

export interface ChatResponse {
  question: string;
  answer: string;
  sources: any[];
  model_used: string;
}

class DocumentService {
  private ws: WebSocket | null = null;
  private progressCallback: ((message: ProgressMessage) => void) | null = null;

  // Initialize WebSocket connection for progress updates
  connectProgress(callback: (message: ProgressMessage) => void): void {
    this.progressCallback = callback;
    this.ws = new WebSocket('ws://localhost:8000/ws/progress');
    
    this.ws.onmessage = (event) => {
      const message: ProgressMessage = JSON.parse(event.data);
      callback(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }

  // Upload file with progress tracking
  async uploadFile(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getDocuments(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/uploaded-files`);
      if (!response.ok) {
      throw new Error(`Failed to get documents: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

 // Semantic search
  async search(query: string, filters?: { filter_author?: string; filter_title?: string; n_results?: number }): Promise<SearchResult> {
    const params = new URLSearchParams();
    params.append('query', query);
    
    if (filters?.filter_author) params.append('filter_author', filters.filter_author);
    if (filters?.filter_title) params.append('filter_title', filters.filter_title);
    if (filters?.n_results) params.append('n_results', filters.n_results.toString());

    try {
      const response = await fetch(`${API_BASE}/search?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search API error:', errorText);
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle error responses from backend
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (error) {
      console.error('Search request failed:', error);
      throw error;
    }
  }


  // Get system status
  async getStatus(): Promise<StatusResult> {
    const response = await fetch(`${API_BASE}/status`);
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Change embedding model
  async setEmbeddingModel(modelName: string): Promise<{ status: string; model: string }> {
    const response = await fetch(`${API_BASE}/set-embedding-model?model_name=${encodeURIComponent(modelName)}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Model change failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get available models
  async getEmbeddingModels(): Promise<{ models: string[] }> {
    const response = await fetch(`${API_BASE}/embedding-models`);
    
    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.statusText}`);
    }

    return response.json();
  }

  async chat(query: string, conversationId?: string, nContextChunks: number = 5): Promise<ChatResponse> {
    const params = new URLSearchParams();
    params.append('query', query);
    if (conversationId) params.append('conversation_id', conversationId);
    params.append('n_context_chunks', nContextChunks.toString());

    const response = await fetch(`${API_BASE}/chat?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Set inference model
  async setInferenceModel(modelName: string): Promise<{ status: string; model: string }> {
    const response = await fetch(`${API_BASE}/set-inference-model?model_name=${encodeURIComponent(modelName)}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Inference model change failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get available inference models
  async getInferenceModels(): Promise<{ models: string[] }> {
    const response = await fetch(`${API_BASE}/inference-models`);
    
    if (!response.ok) {
      throw new Error(`Failed to get inference models: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadFolder(files: File[]): Promise<FolderUploadResult> {
    const formData = new FormData();
    
    // Add all files to FormData
    files.forEach(file => {
      formData.append('files', file, file.name);
    });

    const response = await fetch(`${API_BASE}/upload-folder`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Folder upload backend error:", text);
      throw new Error(`Folder upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get list of uploaded files
  async getUploadedFiles(): Promise<{ files: UploadedFile[] }> {
    const response = await fetch(`${API_BASE}/uploaded-files`);
    
    if (!response.ok) {
      throw new Error(`Failed to get uploaded files: ${response.statusText}`);
    }

    return response.json();
  }

  // Check if files already exist
  async checkExistingFiles(filenames: string[]): Promise<{ existing: string[] }> {
    try {
      const uploadedFiles = await this.getUploadedFiles();
      const existingFilenames = uploadedFiles.files.map(file => file.filename);
      
      return {
        existing: filenames.filter(filename => existingFilenames.includes(filename))
      };
    } catch (error) {
      console.error('Error checking existing files:', error);
      return { existing: [] };
    }
  }
  
  async createChatSession(title: string) {
    const response = await fetch(`${API_BASE}/chat-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    return response.json();
  }

  async getChatSessions() {
    const response = await fetch(`${API_BASE}/chat-sessions`);
    return response.json();
  }

  async getChatSession(sessionId: string) {
    const response = await fetch(`${API_BASE}/chat-sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to get chat session: ${response.statusText}`);
    }
    return response.json();
  }

  async addChatMessage(sessionId: string, message: { role: string; content: string; sources?: any[] }) {
    const response = await fetch(`${API_BASE}/chat-sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    return response.json();
  }

  async deleteChatSession(sessionId: string) {
    const response = await fetch(`${API_BASE}/chat-sessions/${sessionId}`, {
      method: 'DELETE'
    });
    return response.json();
  }

  async updateChatSessionTitle(sessionId: string, title: string) {
    const response = await fetch(`${API_BASE}/chat-sessions/${sessionId}/title`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    return response.json();
  }
  // Cleanup WebSocket
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.progressCallback = null;
  }
}

export const documentService = new DocumentService();