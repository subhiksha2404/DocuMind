import { LogOut, Menu, Upload, User } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import ChatInterface from './main/ChatInterface';
import ProfileModal from './main/ProfileModal';
import SearchPanel from './main/SearchPanel';
import DocumentUpload from './sidebar/DocumentUpload';
import ChatHistoryModal from './main/ChatHistoryModal'; 
import { useChat } from '../contexts/ChatContext';
import { documentService } from '../services/api';

interface MainPanelProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
  showChatHistory?: boolean;
  onCloseChatHistory?: () => void;
}

const MainPanel: React.FC<MainPanelProps> = ({ 
  sidebarOpen, 
  onToggleSidebar, 
  onLogout,
  showChatHistory = false,
  onCloseChatHistory = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'upload'>('upload');
  const [connectionStatus, setConnectionStatus] = useState<'agentic' | 'langgraph' | 'error'>('langgraph');
  const [showProfile, setShowProfile] = useState(false);
  const [internalShowChatHistory, setInternalShowChatHistory] = useState(false); 
  const { messages, addMessage, clearMessages, setLoading } = useChat();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    setInternalShowChatHistory(showChatHistory);
  }, [showChatHistory]);

  
  const handleOpenProfile = () => setShowProfile(true);
  const handleCloseProfile = () => setShowProfile(false);

  const handleCloseChatHistoryInternal = () => {
    setInternalShowChatHistory(false);
    onCloseChatHistory();
  };

  const handleLoadChatSession = async (sessionId: string) => {
    console.log('Loading session:', sessionId);
    
    if (sessionId === 'new') {
      clearMessages();
      setCurrentSessionId(null);
    } else {
      try {
        setLoading(true);
        console.log('📥 Loading saved chat session:', sessionId);
        
        // 🔥 ACTUALLY LOAD THE SAVED CHAT FROM BACKEND
        const session = await documentService.getChatSession(sessionId);
        console.log('💾 Loaded session data:', session);
        
        if (!session || !session.messages) {
          console.error('No messages found in session');
          return;
        }
        
        // 🔥 CLEAR CURRENT MESSAGES FIRST
        clearMessages();
        
        // 🔥 ADD ALL MESSAGES FROM THE SAVED SESSION
        console.log(`Loading ${session.messages.length} messages from saved chat`);
        
        // Add messages with a small delay to ensure they're processed correctly
        session.messages.forEach((msg: any, index: number) => {
          addMessage({
            id: Date.now() + index,
            type: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            sources: msg.sources || []
          });
        });
        
        setCurrentSessionId(sessionId);
        console.log('✅ Chat session loaded successfully!');
        
      } catch (error) {
        console.error('❌ Failed to load chat session:', error);
      } finally {
        setLoading(false);
      }
    }

    setActiveTab('chat');
    handleCloseChatHistoryInternal();
  };



  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-white to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 lg:hidden transition-all duration-300 transform hover:scale-110"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'upload'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('chat');
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300'
              }`}
            >
              Search
            </button>
          </div>
        </div>

        {/* Right side - Profile and Logout buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenProfile}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-300"
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg border border-red-200 transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'upload' ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="w-full max-w-2xl">
              <DocumentUpload />
            </div>
          </div>
        ) : activeTab === 'chat' ? (
          <ChatInterface 
            connectionStatus={connectionStatus}
            currentSessionId={currentSessionId}
            onSessionChange={setCurrentSessionId}
          />
        ) : (
          <SearchPanel />
        )}
      </div>
      
      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={handleCloseProfile}
      />

      {/* Chat History Modal */}
      <ChatHistoryModal
        isOpen={showChatHistory}
        onClose={handleCloseChatHistoryInternal}
        onLoadSession={handleLoadChatSession}
      />
    </div>
  );
};

export default MainPanel;