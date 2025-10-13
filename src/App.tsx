import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MainPanel from './components/MainPanel';
import { DocumentProvider } from './contexts/DocumentContext';
import { ChatProvider } from './contexts/ChatContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <DocumentProvider>
      <ChatProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar 
            isOpen={sidebarOpen} 
            onToggle={handleToggleSidebar}
            onSettingsClick={handleOpenSettings}
          />
          <MainPanel 
            sidebarOpen={sidebarOpen}
            onToggleSidebar={handleToggleSidebar}
            showSettings={showSettings}
            onCloseSettings={handleCloseSettings}
            onOpenSettings={handleOpenSettings}

          />
        </div>
      </ChatProvider>
    </DocumentProvider>
  );
}

export default App;