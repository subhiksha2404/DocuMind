import { Calendar, FileText, Trash2, User, X } from 'lucide-react';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDocuments } from '../../contexts/DocumentContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { getUserDocuments } = useDocuments();
  const userDocuments = getUserDocuments();

  console.log('👤 ProfileModal - User documents:', userDocuments.length);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'deleted') {
      return <Trash2 className="w-4 h-4 text-red-500" />;
    }
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'uploading': return 'bg-blue-100 text-blue-800';
      case 'deleted': return 'bg-red-100 text-red-800 line-through';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeDocuments = userDocuments.filter(doc => doc.status !== 'deleted');
  const totalSize = activeDocuments.reduce((total, doc) => total + doc.size, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">User Profile</h2>
                <p className="text-blue-100">Account information and document history</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Column - User Info & Stats */}
            <div className="space-y-6">
              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-800">{currentUser?.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">User ID:</span>
                    <span className="font-mono text-sm text-gray-600">
                      {currentUser?.uid.substring(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Documents:</span>
                    <span className="font-medium text-gray-800">{userDocuments.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Documents:</span>
                    <span className="font-medium text-gray-800">{activeDocuments.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total File Size:</span>
                    <span className="font-medium text-gray-800">
                      {formatFileSize(totalSize)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Document History */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Document Upload History ({userDocuments.length})
              </h3>
              
              {userDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No documents uploaded yet</p>
                  <p className="text-sm">Upload your first document to see it here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {userDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={`border border-gray-200 rounded-lg p-4 hover:bg-white transition-colors ${
                        doc.status === 'deleted' ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {getStatusIcon(doc.status)}
                          <span className={`font-medium text-gray-800 truncate ${
                            doc.status === 'deleted' ? 'line-through' : ''
                          }`}>
                            {doc.name}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0 ml-2">
                          {formatFileSize(doc.size)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(doc.uploadDate)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                          {doc.status !== 'deleted' && doc.chunks > 0 && (
                            <span>{doc.chunks} chunks</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;