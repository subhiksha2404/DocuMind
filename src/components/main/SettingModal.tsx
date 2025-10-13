import React from 'react';
import { X } from 'lucide-react';

interface SettingsModalProps {
  useLangGraph: boolean;
  setUseLangGraph: (value: boolean) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  useLangGraph,
  setUseLangGraph,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Chat Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                Use LangGraph
              </label>
              <p className="text-sm text-gray-500">
                Advanced multi-agent system with better workflow management
              </p>
            </div>
            <input
              type="checkbox"
              checked={useLangGraph}
              onChange={(e) => setUseLangGraph(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              {useLangGraph 
                ? '🚀 LangGraph provides advanced workflow management and better observability.' 
                : '🔄 Custom agents offer fast, reliable performance for most use cases.'
              }
            </p>
          </div>
        </div>
        
        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;