import React, { useState } from "react";
import LoginPage from "./components/LoginPage";
import MainPanel from "./components/MainPanel";
import Sidebar from "./components/Sidebar";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import { DocumentProvider } from "./contexts/DocumentContext";

const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser, loading, logout } = useAuth();
  const [showChatHistory, setShowChatHistory] = useState(false); // 🔥 ADD THIS

  const handleToggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  // 🔥 ADD THIS FUNCTION
  const handleChatHistoryClick = () => {
    console.log("Chat history clicked - opening modal");
    setShowChatHistory(true);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <LoginPage />;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        onChatHistoryClick={handleChatHistoryClick} // 🔥 PASS THE HANDLER
      />
      <MainPanel
        sidebarOpen={sidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        onLogout={logout}
        showChatHistory={showChatHistory} // 🔥 PASS THIS TOO
        onCloseChatHistory={() => setShowChatHistory(false)} 
      />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <DocumentProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </DocumentProvider>
  </AuthProvider>
);

export default App;