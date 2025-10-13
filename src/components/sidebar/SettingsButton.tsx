import React from 'react';
import { Settings } from 'lucide-react';

interface SettingsButtonProps {
  onSettingsClick: () => void;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ onSettingsClick }) => {
  return (
    <div className="px-4 py-4 border-t border-gray-200">
      <button
        onClick={onSettingsClick}
        className="flex items-center space-x-3 w-full p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:from-blue-600 group-hover:to-purple-700 transition-colors">
          <Settings className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-900">Settings</div>
          <div className="text-sm text-gray-500">Configure chat and agent settings</div>
        </div>
      </button>
    </div>
  );
};

export default SettingsButton;
