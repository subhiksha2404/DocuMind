import React, { useCallback, useState, useEffect } from 'react';
import { Upload, FolderPlus, File as FileIcon, Loader2, Check, X } from 'lucide-react';
import { useDocuments } from '../../contexts/DocumentContext';
import { documentService, ProgressMessage, FolderUploadResult } from '../../services/api';

interface FileInfo {
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const DocumentUpload: React.FC = () => {
  const { addDocuments } = useDocuments();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [uploadMode, setUploadMode] = useState<'single' | 'folder'>('single');
  const [files, setFiles] = useState<FileInfo[]>([]);

  // Setup progress listener
  useEffect(() => {
    const handleProgress = (message: ProgressMessage) => {
      setProgress(message.progress);
      setCurrentStage(message.message);
    };

    documentService.connectProgress(handleProgress);

    return () => {
      documentService.disconnect();
    };
  }, []);

  const handleFilesSelected = useCallback(async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    
    if (uploadMode === 'single') {
      // Single file mode - just take the first file
      await handleSingleUpload(fileArray[0]);
    } else {
      // Folder mode - process all files
      await handleFolderUpload(fileArray);
    }
  }, [uploadMode]);

  const handleSingleUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setCurrentStage('Starting upload...');
    setFiles([{ name: file.name, size: file.size, type: file.type, status: 'uploading' }]);

    try {
      const result = await documentService.uploadFile(file);
      
      addDocuments([{
        id: Date.now(),
        name: result.filename,
        type: file.type || 'unknown',
        size: file.size,
        uploadDate: new Date(),
        status: 'processed',
        chunks: result.chunks_stored,
        metadata: result.metadata
      }]);

      setFiles(prev => prev.map(f => 
        f.name === file.name ? { ...f, status: 'completed' } : f
      ));
      setCurrentStage('Upload completed successfully!');
      
    } catch (error) {
      console.error('Upload failed:', error);
      setFiles(prev => prev.map(f => 
        f.name === file.name ? { ...f, status: 'error', error: (error as Error).message } : f
      ));
      setCurrentStage('Upload failed. Please try again.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setCurrentStage('');
        setFiles([]);
      }, 3000);
    }
  };

  const handleFolderUpload = async (filesToProcess: File[]) => {
    setUploading(true);
    setProgress(0);
    setCurrentStage('Checking files...');
    
    // Create file info for all files
    const fileInfos: FileInfo[] = filesToProcess.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending'
    }));
    setFiles(fileInfos);

    try {
      // Check for existing files
      const existing = await documentService.checkExistingFiles(filesToProcess.map(f => f.name));
      
      let filesToUpload = filesToProcess;
      if (existing.existing.length > 0) {
        if (!window.confirm(
          `${existing.existing.length} files already exist. Do you want to skip them and upload the rest?`
        )) {
          setUploading(false);
          return;
        }
        
        // Filter out existing files
        filesToUpload = filesToProcess.filter(file => !existing.existing.includes(file.name));
        setFiles(fileInfos.map(info => 
          existing.existing.includes(info.name) 
            ? { ...info, status: 'error', error: 'File already exists' }
            : { ...info, status: 'uploading' }
        ));
        
        if (filesToUpload.length === 0) {
          setCurrentStage('All files already exist.');
          setUploading(false);
          return;
        }
      } else {
        setFiles(prev => prev.map(info => ({ ...info, status: 'uploading' })));
      }

      setCurrentStage('Uploading folder...');
      const result: FolderUploadResult = await documentService.uploadFolder(filesToUpload);

      // Update file statuses based on results
      setFiles(prevFiles => prevFiles.map(file => {
        const processed = result.documents_processed.find(doc => doc.filename === file.name);
        const error = result.errors.find(err => err.filename === file.name);
        
        if (processed) {
          // Add to documents context
          addDocuments([{
            id: Date.now() + Math.random(),
            name: processed.filename,
            type: file.type,
            size: file.size,
            uploadDate: new Date(),
            status: 'processed',
            chunks: processed.chunks_stored,
            metadata: processed.metadata
          }]);
          
          return { ...file, status: 'completed' };
        } else if (error) {
          return { ...file, status: 'error', error: error.error };
        } else {
          return file;
        }
      }));

      setCurrentStage(
        `Folder upload complete! ${result.processed_count} successful, ${result.error_count} errors`
      );
      
    } catch (error) {
      console.error('Folder upload failed:', error);
      setFiles(prev => prev.map(file => file.status === 'uploading' ? { ...file, status: 'error', error: 'Upload failed' } : file));
      setCurrentStage('Folder upload failed. Please try again.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setCurrentStage('');
      }, 5000);
    }
  };

  // Improved drag and drop that handles folders
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const items = e.dataTransfer.items;
    const files: File[] = [];
    
    // Handle folder drag and drop
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
          if (entry) {
            // If it's a directory, we need to traverse it
            if (entry.isDirectory) {
              // For now, let's just skip directories in drag & drop
              // or you can implement directory traversal here
              console.log('Directory drag & drop detected, but not implemented');
              continue;
            }
          }
          // If it's a file or we can't detect directory, get it as file
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
    }
    
    // Fallback to regular files if no items or no webkitGetAsEntry support
    if (files.length === 0 && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      files.push(...Array.from(e.dataTransfer.files));
    }

    if (files.length > 0) {
      handleFilesSelected(files);
    } else {
      console.warn('No files found in drop.');
    }
  }, [handleFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const getFileStatusIcon = (status: FileInfo['status']) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4 text-green-600" />;
      case 'error': return <X className="w-4 h-4 text-red-600" />;
      case 'uploading': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default: return <FileIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
      
      {/* Upload Mode Selector */}
      <div className="flex space-x-2 mb-3">
        <button
          onClick={() => setUploadMode('single')}
          className={`px-3 py-1 rounded-lg font-medium text-sm ${
            uploadMode === 'single'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } transition-all duration-300`}
        >
          Single File
        </button>
        <button
          onClick={() => setUploadMode('folder')}
          className={`px-3 py-1 rounded-lg font-medium text-sm ${
            uploadMode === 'folder'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } transition-all duration-300`}
        >
          Folder Upload
        </button>
      </div>

      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver 
            ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50' 
            : 'border-gray-300 hover:border-purple-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-purple-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
            <p className="text-sm text-gray-600">{currentStage}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-purple-400 mx-auto transition-colors duration-300" />
            <p className="text-sm text-gray-600">
              {uploadMode === 'single' 
                ? 'Drop a file here or click to browse' 
                : 'Drop files here or use folder button to select entire folder'}
            </p>
          </div>
        )}
      </div>

      {/* File List for Folder Upload */}
      {uploadMode === 'folder' && files.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
              <div className="flex items-center space-x-2">
                {getFileStatusIcon(file.status)}
                <span className="font-medium truncate max-w-[150px]">{file.name}</span>
              </div>
              {file.error && (
                <span className="text-red-600 text-xs">{file.error}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="group flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
          <FileIcon className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
          <span className="text-sm">Files</span>
          <input
            type="file"
            multiple={uploadMode === 'folder'}
            className="hidden"
            onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
          />
        </label>
        
        {/* FIXED: Added folder input attributes for proper folder selection */}
        <label className="group flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-lg hover:from-indigo-700 hover:to-pink-700 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
          <FolderPlus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
          <span className="text-sm">Folder</span>
          <input
            type="file"
            multiple
            {...({ 
              webkitdirectory: "", 
              directory: "",
              mozdirectory: ""
            } as any)}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                console.log('Folder selected with files:', Array.from(e.target.files));
                handleFilesSelected(e.target.files);
              }
            }}
          />
        </label>
      </div>

      {/* Current Stage Status */}
      {currentStage && (
        <div className="p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-700">{currentStage}</p>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;