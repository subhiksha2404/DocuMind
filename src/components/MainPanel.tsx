import React, { useState } from 'react';
import { Menu, Upload } from 'lucide-react';
import ChatInterface from './main/ChatInterface';
import SearchPanel from './main/SearchPanel';
import DocumentUpload from './sidebar/DocumentUpload';
import SettingsModal from './main/SettingModal'; 

interface MainPanelProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  showSettings: boolean;
  onCloseSettings: () => void;
  onOpenSettings: () => void;
}

const MainPanel: React.FC<MainPanelProps> = ({ sidebarOpen, onToggleSidebar, showSettings, onCloseSettings, onOpenSettings}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'upload'>('upload');
  const [useLangGraph, setUseLangGraph] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'agentic' | 'simple' | 'langgraph' | 'error'>('agentic');

    React.useEffect(() => {
    if (useLangGraph) {
      setConnectionStatus('langgraph');
    } else {
      setConnectionStatus('agentic');
    }
  }, [useLangGraph]);


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
              onClick={() => setActiveTab('chat')}
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
            useLangGraph={useLangGraph}
            connectionStatus={connectionStatus}
          />
        ) : (
          <SearchPanel />
        )}
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          useLangGraph={useLangGraph}
          setUseLangGraph={setUseLangGraph}
          onClose={onCloseSettings}
        />
      )}
    </div>
  );
};

export default MainPanel;