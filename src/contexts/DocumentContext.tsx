import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  status: 'uploading' | 'processing' | 'processed' | 'failed' | 'deleted';
  chunks: number;
  userId: string;
  metadata?: {
    title: string;
    author: string;
    pages: number;
  };
}

export interface Activity {
  id: string;
  type: 'upload' | 'delete' | 'model_change' | 'search';
  message: string;
  timestamp: Date;
  userId: string;
}

interface DocumentContextType {
  documents: Document[];
  activities: Activity[];
  addDocuments: (docs: Omit<Document, 'id'>[]) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id' | 'userId'>) => void;
  getUserDocuments: () => Document[];
  getUserActivities: () => Activity[];
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
  const { currentUser } = useAuth();

  // Listen to documents from Firestore
  useEffect(() => {
    if (!currentUser) {
      console.log('No current user, clearing documents');
      setDocuments([]);
      return;
    }

    console.log('Setting up documents listener for user:', currentUser.uid);
    const documentsQuery = query(
      collection(db, 'documents'),
      where('userId', '==', currentUser.uid),
      orderBy('uploadDate', 'desc')
    );

    const unsubscribe = onSnapshot(documentsQuery, 
      (snapshot) => {
        console.log('🔥 Documents snapshot received, count:', snapshot.size);
        const docsData: Document[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          console.log('📄 Document data:', {
            id: docSnapshot.id,
            name: data.name,
            status: data.status,
            userId: data.userId
          });
          docsData.push({
            id: docSnapshot.id,
            name: data.name || 'Unknown',
            type: data.type || 'unknown',
            size: data.size || 0,
            uploadDate: data.uploadDate?.toDate() || new Date(),
            status: data.status || 'processed',
            chunks: data.chunks || 0,
            userId: data.userId,
            metadata: data.metadata
          });
        });
        console.log('📦 Setting documents state with:', docsData.length, 'documents');
        setDocuments(docsData);
      },
      (error) => {
        console.error('❌ Error listening to documents:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Listen to activities from Firestore
  useEffect(() => {
    if (!currentUser) {
      setActivities([]);
      return;
    }

    const activitiesQuery = query(
      collection(db, 'activities'),
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(activitiesQuery, 
      (snapshot) => {
        console.log('📋 Activities snapshot received, count:', snapshot.size);
        const activitiesData: Activity[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          activitiesData.push({
            id: docSnapshot.id,
            type: data.type,
            message: data.message,
            timestamp: data.timestamp?.toDate() || new Date(),
            userId: data.userId
          });
        });
        setActivities(activitiesData);
      },
      (error) => {
        console.error('❌ Error listening to activities:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const addDocuments = async (newDocs: Omit<Document, 'id'>[]) => {
    if (!currentUser) throw new Error('User must be logged in');

    console.log('➕ Adding documents to Firestore:', newDocs.length, 'documents');

    for (const docData of newDocs) {
      try {
        const docRef = await addDoc(collection(db, 'documents'), {
          ...docData,
          uploadDate: new Date(),
          userId: currentUser.uid
        });
        
        console.log('✅ Document added with ID:', docRef.id);

        // Add upload activity
        await addDoc(collection(db, 'activities'), {
          type: 'upload',
          message: `Uploaded "${docData.name}"`,
          timestamp: new Date(),
          userId: currentUser.uid
        });

      } catch (error) {
        console.error('❌ Error adding document:', error);
        throw error;
      }
    }
  };

  const deleteDocument = async (id: string) => {
    if (!currentUser) throw new Error('User must be logged in');

    const documentToDelete = documents.find(doc => doc.id === id);
    if (!documentToDelete) return;

    try {
      // Update document status to 'deleted' instead of removing it
      const docRef = doc(db, 'documents', id);
      await updateDoc(docRef, {
        status: 'deleted'
      });

      console.log('🗑️ Document marked as deleted:', id);

      // Add delete activity
      await addDoc(collection(db, 'activities'), {
        type: 'delete',
        message: `Deleted "${documentToDelete.name}"`,
        timestamp: new Date(),
        userId: currentUser.uid
      });
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      throw error;
    }
  };

  const addActivity = async (activity: Omit<Activity, 'id' | 'userId'>) => {
    if (!currentUser) return;
    
    await addDoc(collection(db, 'activities'), {
      ...activity,
      userId: currentUser.uid,
      timestamp: new Date()
    });
  };

  const getUserDocuments = () => {
    if (!currentUser) return [];
    return documents;
  };

  const getUserActivities = () => {
    if (!currentUser) return [];
    return activities;
  };

  const value = {
    documents,
    activities,
    addDocuments,
    deleteDocument,
    addActivity,
    getUserDocuments,
    getUserActivities
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};