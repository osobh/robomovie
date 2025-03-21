import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Loader2, AlertCircle, Trash2, Check, FileText, Film, Save } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { useAuth } from '@/lib/auth';
import { useServerStatus } from '@/lib/hooks/use-server-status';
import { useWorkflow } from '@/lib/workflow';
import { useStore } from '@/lib/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface MovieSettings {
  title: string;
  genre: string;
  number_of_scenes: number;
  length_minutes: number;
  topic: string;
  mode: string;
}

export function ScriptProcessing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { completeStep } = useWorkflow();
  const isServerRunning = useServerStatus();
  const [script, setScript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [movieSettings, setMovieSettings] = useState<MovieSettings>({ 
    title: '', 
    genre: '', 
    number_of_scenes: 0,
    length_minutes: 5,
    topic: '',
    mode: 'managed'
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<{ id: string; name: string; type: 'script' | 'movie'; createdAt: string; size: string; metadata?: any }[]>([]);

  // Get store actions
  const { workflow, setScenes, setMovieSettings: setStoreMovieSettings } = useStore();

  useEffect(() => {
    const fetchFiles = async () => {
      if (!isServerRunning || !user) return;

      try {
        const filesResponse = await fetch(`${API_URL}/api/user-files/${user.id}`);
        if (!filesResponse.ok) {
          throw new Error('Failed to fetch user files');
        }
        const recentFiles = await filesResponse.json();

        // Transform files data
        const formattedFiles = recentFiles.map((file: any) => ({
          id: file.id,
          name: file.name,
          type: file.type as 'script' | 'movie',
          createdAt: file.createdAt,
          size: formatFileSize(file.size),
          metadata: file.metadata
        }));

        setFiles(formattedFiles);
      } catch (err) {
        console.error('Error fetching files:', err);
        setError('Failed to load files');
      }
    };

    fetchFiles();
  }, [isServerRunning, user]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  useEffect(() => {
    // Load movie settings from store
    if (workflow.movieSettings) {
      setMovieSettings(workflow.movieSettings);
    }

    // Load script from store
    if (workflow.script) {
      setScript(workflow.script);
    }
  }, [workflow.movieSettings, workflow.script]);

  const handleSaveScript = async () => {
    if (!isServerRunning || !user || !script.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/scripts/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title: movieSettings.title,
          content: script,
          metadata: {
            title: movieSettings.title,
            genre: movieSettings.genre,
            numberOfScenes: movieSettings.number_of_scenes,
            lengthMinutes: movieSettings.length_minutes,
            topic: movieSettings.topic,
            createdAt: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save script');
      }

      const data = await response.json();
      useStore.getState().setScriptFile({
        fileName: data.fileName,
        filePath: data.filePath,
        content: script
      });
      setSuccessMessage('Script saved successfully!');

      // Refresh files list
      const filesResponse = await fetch(`${API_URL}/api/user-files/${user.id}`);
      if (filesResponse.ok) {
        const recentFiles = await filesResponse.json();
        setFiles(recentFiles.map((file: any) => ({
          id: file.id,
          name: file.name,
          type: file.type as 'script' | 'movie',
          createdAt: file.createdAt,
          size: formatFileSize(file.size),
          metadata: file.metadata
        })));
      }
    } catch (error) {
      console.error('Error saving script:', error);
      setError(error instanceof Error ? error.message : 'Failed to save script');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleProcessScript = async () => {
    if (!isServerRunning || !user || !workflow.scriptFile || !workflow.movieSettings) {
      setError('Please ensure all settings are configured before processing');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Log validation data
      console.log('Validating process script data:', {
        script: script ? 'present' : 'missing',
        scriptLength: script?.length || 0,
        user: user?.id ? 'present' : 'missing',
        movieSettings,
        scriptFile: workflow.scriptFile
      });

      // Validate all required data is present
      if (!script?.trim()) throw new Error('Script content is required');
      if (!user?.id) throw new Error('User ID is required');
      if (!workflow.scriptFile?.fileName) throw new Error('Script file is required');
      if (!movieSettings.title?.trim()) throw new Error('Movie title is required');
      if (!movieSettings.genre?.trim()) throw new Error('Genre is required');
      if (!movieSettings.number_of_scenes) throw new Error('Number of scenes is required');
      if (!movieSettings.length_minutes) throw new Error('Movie length is required');

      // Prepare request body with proper type conversions
      const requestBody = {
        scriptContent: script.trim(),
        userId: user.id.toString(),
        title: movieSettings.title.trim(),
        genre: movieSettings.genre.trim(),
        numberOfScenes: Number(movieSettings.number_of_scenes),
        lengthMinutes: Number(movieSettings.length_minutes),
        scriptId: workflow.scriptFile.fileName
      };

      // Log the prepared request
      console.log('Prepared process script request:', {
        endpoint: `${API_URL}/api/process-script`,
        body: {
          ...requestBody,
          scriptContent: `${requestBody.scriptContent.slice(0, 100)}...` // Truncate for logging
        }
      });

      // Send request to process script
      console.log('Sending process script request...');
      const response = await fetch(`${API_URL}/api/process-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to process script');
      }

      const data = await response.json();
      console.log('Process script response:', {
        status: response.status,
        ok: response.ok,
        data
      });
      
      // Save scenes to store
      if (data.scenes) {
        setScenes(data.scenes);
        // Complete the script step and navigate to storyboarding
        completeStep('script');
        navigate('/storyboard');
      } else {
        throw new Error('No scene data received');
      }
    } catch (error) {
      console.error('Error processing script:', error);
      setError(error instanceof Error ? error.message : 'Failed to process script');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearScript = () => {
    setScript('');
    setError(null);
    useStore.getState().setScriptFile(null);
    setSuccessMessage('Script cleared');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleLoadScript = async (file: { id: string; name: string; metadata?: any }) => {
    try {
      const response = await fetch(`${API_URL}/api/script-content/${user?.id}/${file.id}`);
      if (!response.ok) throw new Error('Failed to fetch script');
      const data = await response.json();
      
      setScript(data.content);
      useStore.getState().setScriptFile({
        fileName: file.id,
        filePath: data.filePath,
        content: data.content
      });

      // Update both local state and store with metadata if available
      const newSettings = file.metadata || {
        title: data.title || '',
        genre: data.genre || '',
        number_of_scenes: data.number_of_scenes || 0,
        length_minutes: data.length_minutes || 5,
        topic: '',
        mode: 'managed'
      };
      setMovieSettings(newSettings);
      setStoreMovieSettings(newSettings);

      setSuccessMessage('Script loaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error loading script:', error);
      setError('Failed to load script');
    }
  };

  const handleDeleteScript = async (fileId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/scripts/delete/${user?.id}/${fileId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete script');
      
      // Remove from files list
      setFiles(files.filter(f => f.id !== fileId));
      setSuccessMessage('Script deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting script:', error);
      setError('Failed to delete script');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-[#FFA500]">Script Processing</h1>
      <p className="text-lg mb-8 text-gray-300">Edit and process your script.</p>

      {/* Movie Info Display */}
      <div className="bg-[#1A1A1A] rounded-lg p-6 mb-8">
        <div className="grid grid-cols-4 gap-6">
          <div>
            <Label className="text-gray-400">Movie Title</Label>
            <p className="text-xl font-semibold text-white">{movieSettings.title}</p>
          </div>
          <div>
            <Label className="text-gray-400">Genre</Label>
            <p className="text-xl font-semibold text-white">{movieSettings.genre}</p>
          </div>
          <div>
            <Label className="text-gray-400">Number of Scenes</Label>
            <p className="text-xl font-semibold text-white">{movieSettings.number_of_scenes}</p>
          </div>
          <div>
            <Label className="text-gray-400">Length</Label>
            <p className="text-xl font-semibold text-white">{movieSettings.length_minutes} minutes</p>
          </div>
        </div>
      </div>
      
      {!isServerRunning && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-md text-yellow-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Server is not running. Please start the server to enable script processing.
        </div>
      )}

      {!workflow.movieSettings && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-md text-yellow-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Please create a new movie from the dashboard first.
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-md text-red-500">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-md text-green-500 flex items-center">
          <Check className="w-5 h-5 mr-2" />
          {successMessage}
        </div>
      )}
      
      <div className="flex gap-4 mb-8">
        <Button
          className="bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSaveScript}
          disabled={!script || isSaving || !isServerRunning}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save
            </>
          )}
        </Button>

        {script && (
          <Button
            className="bg-red-500 hover:bg-red-500/90 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClearScript}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-[#1A1A1A] rounded-lg p-4">
          <textarea
            className="w-full h-[400px] bg-transparent text-white font-mono resize-none focus:outline-none"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Your script will appear here..."
          />
        </div>

        <Button
          className="w-full bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleProcessScript}
          disabled={!script || !workflow.scriptFile || isProcessing || !isServerRunning || !workflow.movieSettings}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Script...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Process Script
            </>
          )}
        </Button>

        {/* Recent Files Section */}
        <div className="bg-[#1A1A1A] rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Files</h2>
          <div className="space-y-2">
            {files.length === 0 ? (
              <p className="text-gray-400">No files available</p>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#2A2A2A] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {file.type === 'script' ? (
                      <FileText className="w-5 h-5 text-[#1ABC9C]" />
                    ) : (
                      <Film className="w-5 h-5 text-[#FFA500]" />
                    )}
                    <div>
                      <p className="text-white">{file.name}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(file.createdAt).toLocaleDateString()} • {file.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      className="text-[#1ABC9C] hover:text-[#1ABC9C]/80 text-sm"
                      onClick={() => handleLoadScript(file)}
                    >
                      Load Script
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-400 text-sm"
                      onClick={() => handleDeleteScript(file.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
