import React from 'react';
import { History, MessageSquare } from 'lucide-react';

interface ChatHistoryButtonProps {
  onChatHistoryClick: () => void;
}

const ChatHistoryButton: React.FC<ChatHistoryButtonProps> = ({ onChatHistoryClick }) => {

  const handleClick = () => {
    console.log(" Chat History Button CLICKED!"); 
    onChatHistoryClick();
  };

  return (
    <div className="px-4 py-4 border-t border-gray-200">
      <button
        onClick={() => handleClick()}
        className="flex items-center space-x-3 w-full p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:from-green-600 group-hover:to-blue-700 transition-colors">
          <History className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-900">Chat History</div>
          <div className="text-sm text-gray-500">View your previous conversations</div>
        </div>
      </button>
    </div>
  );
};

export default ChatHistoryButton;