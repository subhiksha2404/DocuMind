import React from 'react';
import { X } from 'lucide-react';
import SidebarHeader from './sidebar/SidebarHeader';
import FolderTree from './sidebar/FolderTree';
import ModelControls from './sidebar/ModelControls';
import CollectionStatus from './sidebar/CollectionStatus';
import ActivityTimeline from './sidebar/ActivityTimeline';
import SettingsButton from './sidebar/SettingsButton';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
        w-80 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${!isOpen ? 'lg:w-0 lg:border-r-0' : ''}
      `}>
        {/* Mobile close button */}
        <button
          onClick={onToggle}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col h-full overflow-hidden">
          <SidebarHeader />
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
            <FolderTree />
            <ModelControls />
            <CollectionStatus />
            <ActivityTimeline />
          </div>
          <SettingsButton />
        </div>
      </div>
    </>
  );
};

export default Sidebar;