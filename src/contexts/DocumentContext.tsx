import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Document {
  id: number;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  status: 'uploading' | 'processing' | 'processed' | 'failed';
  chunks: number;
  metadata?: {  // Make it optional
    title: string;
    author: string;
    pages: number;
  };
}

export interface Activity {
  id: number;
  type: 'upload' | 'delete' | 'model_change' | 'search';
  message: string;
  timestamp: Date;
}

interface DocumentContextType {
  documents: Document[];
  activities: Activity[];
  addDocuments: (docs: Document[]) => void;
  deleteDocument: (id: number) => void;
  addActivity: (activity: Activity) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

interface DocumentProviderProps {
  children: ReactNode;
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const addDocuments = (newDocs: Document[]) => {
    setDocuments(prev => [...prev, ...newDocs]);
    
    // Add upload activities
    newDocs.forEach(doc => {
      addActivity({
        id: Date.now() + Math.random(),
        type: 'upload',
        message: `Uploaded "${doc.name}"`,
        timestamp: new Date()
      });
    });
  };

  const deleteDocument = (id: number) => {
    const doc = documents.find(d => d.id === id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    
    if (doc) {
      addActivity({
        id: Date.now(),
        type: 'delete',
        message: `Deleted "${doc.name}"`,
        timestamp: new Date()
      });
    }
  };

  const addActivity = (activity: Activity) => {
    setActivities(prev => [activity, ...prev].slice(0, 50)); // Keep last 50 activities
  };

  return (
    <DocumentContext.Provider value={{
      documents,
      activities,
      addDocuments,
      deleteDocument,
      addActivity
    }}>
      {children}
    </DocumentContext.Provider>
  );
};