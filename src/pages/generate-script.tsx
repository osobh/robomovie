import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Loader2, AlertCircle, Trash2, Check, FileText, Film } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/lib/auth';
import { useServerStatus } from '@/lib/hooks/use-server-status';
import { useWorkflow } from '@/lib/workflow';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const MOVIE_LENGTHS = [
  { value: 1, label: '1 minute' },
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' },
];

// Helper function to calculate number of scenes
function calculateSceneCount(lengthMinutes: number): number {
  const avgSceneLength = 2.5; // Average scene length in minutes
  return Math.max(1, Math.round(lengthMinutes / avgSceneLength));
}

interface MovieSettings {
  title: string;
  genre: string;
  number_of_scenes: number;
  length_minutes: number;
  topic: string;
  mode: string;
}

export function GenerateScript() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { completeStep } = useWorkflow();
  const isServerRunning = useServerStatus();
  const [script, setScript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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

  interface FileMetadata extends MovieSettings {
    createdAt?: string;
  }

  interface FileData {
    id: string;
    name: string;
    type: 'script' | 'movie';
    createdAt: string;
    size: string | number;
    metadata?: FileMetadata;
  }

  const [files, setFiles] = useState<FileData[]>([]);

  // Get store actions
  const { workflow, setMovieSettings: setStoreMovieSettings } = useStore();

  useEffect(() => {
    const fetchFiles = async () => {
      if (!isServerRunning || !user) return;

      try {
        const filesResponse = await fetch(`${API_URL}/api/user-files/${user.id}?type=script`);
        if (!filesResponse.ok) {
          throw new Error('Failed to fetch user files');
        }
        const recentFiles = await filesResponse.json();

        // Transform files data
        const formattedFiles = recentFiles.map((file: FileData) => ({
          id: file.id,
          name: file.name,
          type: file.type as 'script' | 'movie',
          createdAt: file.createdAt,
          size: formatFileSize(typeof file.size === 'string' ? parseInt(file.size) : file.size),
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

  const handleNext = () => {
    if (!script?.trim()) {
      setError('Please load or enter a script before continuing');
      return;
    }

    // Save current script to store if not already saved
    if (!workflow.scriptFile) {
      useStore.getState().setScriptFile({
        fileName: `script_${Date.now()}.txt`,
        filePath: '',
        content: script
      });
    }

    // Navigate to storyboard
    completeStep('script');
    navigate('/storyboard');
  };

  const handleClearScript = () => {
    setScript('');
    setError(null);
    useStore.getState().setScriptFile(null);
    setSuccessMessage('Script cleared');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleGenerateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsProcessing(true);
    setError(null);
    setScript('');

    try {
      // Save movie settings to Supabase
      const { error: saveError } = await supabase
        .from('movie_settings')
        .insert({
          user_id: user.id,
          title: movieSettings.title,
          genre: movieSettings.genre,
          length_minutes: movieSettings.length_minutes,
          number_of_scenes: movieSettings.number_of_scenes,
          topic: movieSettings.topic,
          mode: 'managed'
        });

      if (saveError) {
        console.error('Supabase error:', saveError);
        throw new Error(saveError.message);
      }

      // Save settings to store
      setStoreMovieSettings(movieSettings);

      // Generate script
      const response = await fetch(`${API_URL}/api/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: movieSettings.title,
          genre: movieSettings.genre,
          lengthMinutes: movieSettings.length_minutes,
          numberOfScenes: movieSettings.number_of_scenes,
          topic: movieSettings.topic,
          userId: user.id
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      let generatedScript = '';
      let isComplete = false;
      while (!isComplete) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5);
            if (!data.trim()) continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.content !== undefined) {
                if (parsed.done) {
                  isComplete = true;
                  break;
                }
                if (parsed.content) {
                  generatedScript += parsed.content;
                  setScript(generatedScript); // Update textarea in real-time
                }
              }
              
              if (parsed.status === 'complete') {
                // Save the generated script
                const saveResponse = await fetch(`${API_URL}/api/scripts/save`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: user.id,
                    title: movieSettings.title,
                    content: parsed.content,
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

                if (!saveResponse.ok) {
                  throw new Error('Failed to save generated script');
                }

                const saveData = await saveResponse.json();
                
                // Set script file in store
                useStore.getState().setScriptFile({
                  fileName: saveData.fileName,
                  filePath: saveData.filePath,
                  content: parsed.content
                });

                setSuccessMessage('Script generated successfully!');
              }
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              console.error('Error parsing JSON:', e, 'Data:', data);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error generating script:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate script');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadScript = async (file: FileData) => {
    try {
      const response = await fetch(`${API_URL}/api/scripts/script-content/${user?.id}/${file.id}`);
      if (!response.ok) throw new Error('Failed to fetch script');
      const data = await response.json();
      
      setScript(data.content);
      useStore.getState().setScriptFile({
        fileName: file.id,
        filePath: data.filePath,
        content: data.content
      });

      // Create movie settings from metadata or data
      const newSettings: MovieSettings = {
        title: file.metadata?.title || data.title || '',
        genre: file.metadata?.genre || data.genre || '',
        number_of_scenes: file.metadata?.number_of_scenes || data.number_of_scenes || 0,
        length_minutes: file.metadata?.length_minutes || data.length_minutes || 5,
        topic: file.metadata?.topic || '',
        mode: file.metadata?.mode || 'managed'
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
      <h1 className="text-4xl font-bold mb-6 text-[#FFA500]">Script Generation</h1>
      <p className="text-lg mb-8 text-gray-300">Generate your script.</p>

      {/* Movie Settings Form */}
      <form onSubmit={handleGenerateScript} className="bg-[#1A1A1A] rounded-lg p-6 mb-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Movie Title</Label>
            <Input
              id="title"
              value={movieSettings.title}
              onChange={(e) => setMovieSettings({ ...movieSettings, title: e.target.value })}
              className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
              placeholder="Enter movie title"
              required
            />
          </div>
          <div>
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              value={movieSettings.genre}
              onChange={(e) => setMovieSettings({ ...movieSettings, genre: e.target.value })}
              className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
              placeholder="e.g., Action, Comedy, Drama"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Movie Length</Label>
            <Select 
              value={movieSettings.length_minutes.toString()} 
              onValueChange={(value) => {
                const length = parseInt(value);
                setMovieSettings({
                  ...movieSettings,
                  length_minutes: length,
                  number_of_scenes: calculateSceneCount(length)
                });
              }}
            >
              <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                <SelectValue placeholder="Select length" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                {MOVIE_LENGTHS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Estimated Scenes</Label>
            <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-md p-3 text-white">
              {movieSettings.number_of_scenes} {movieSettings.number_of_scenes === 1 ? 'scene' : 'scenes'}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="topic">Topic/Theme</Label>
          <textarea
            id="topic"
            value={movieSettings.topic}
            onChange={(e) => setMovieSettings({ ...movieSettings, topic: e.target.value })}
            className="w-full h-24 mt-2 px-3 py-2 bg-[#2A2A2A] text-white rounded-md border border-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#FFA500] focus:border-transparent resize-none"
            placeholder="Enter a topic or theme for your movie..."
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white"
          disabled={isProcessing || !isServerRunning}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Script...
            </>
          ) : (
            'Generate Script'
          )}
        </Button>
      </form>
      
      {!isServerRunning && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-md text-yellow-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Server is not running. Please start the server to enable script processing.
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
      
      {script && (
        <div className="mb-8">
          <Button
            className="bg-red-500 hover:bg-red-500/90 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClearScript}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      )}

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
          onClick={handleNext}
          disabled={!script || !isServerRunning}
        >
          <Play className="w-4 h-4 mr-2" />
          Next
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
