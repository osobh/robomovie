import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UploadedFile {
  originalName: string;
  savedAs: string;
  path: string;
  metadata: string;
}

interface UploadCardProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
}

export function UploadCard({ onUploadComplete }: UploadCardProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    // Filter for accepted file types
    const acceptedTypes = ['.txt', '.md', '.pdf', '.fountain', '.fdx'];
    const validFiles = newFiles.filter(file => 
      acceptedTypes.some(type => file.name.toLowerCase().endsWith(type))
    );

    if (validFiles.length !== newFiles.length) {
      setError('Some files were skipped. Only text, markdown, PDF, and script files are allowed.');
    }

    setFiles(prev => [...prev, ...validFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!user || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('scripts', file);
      });

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${API_URL}/api/upload-scripts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || errorData.details || 'Upload failed');
      }

      const result = await response.json();
      setFiles([]);
      onUploadComplete?.(result.files);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload files';
      setError(errorMessage);
      console.error('Upload error:', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#1A1A1A] rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Upload Scripts</h2>
      
      {/* Drag & Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-[#FFA500] bg-[#FFA500]/10' : 'border-gray-600 hover:border-gray-500'}
          ${files.length > 0 ? 'mb-4' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.pdf,.fountain,.fdx"
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-400 mb-2">
          Drag and drop your script files here, or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Supports: TXT, MD, PDF, Fountain, Final Draft
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 mb-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-800 rounded p-2"
            >
              <span className="text-sm text-gray-300 truncate">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full py-2 px-4 rounded-lg font-medium
            ${uploading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-[#FFA500] hover:bg-[#FFA500]/90'
            }`}
        >
          {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length === 1 ? '' : 's'}`}
        </button>
      )}
    </div>
  );
}
