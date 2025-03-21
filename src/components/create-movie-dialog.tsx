import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CreateMovieDialogProps {
  onClose: () => void;
  navigate: (path: string) => void;
}

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

export function CreateMovieDialog({ onClose, navigate }: CreateMovieDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [length, setLength] = useState<number>(5);
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');

  // Calculate number of scenes based on movie length
  const numberOfScenes = useMemo(() => calculateSceneCount(length), [length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError('');
    setGenerationStatus('Saving movie settings...');

    try {
      const { error: saveError } = await supabase
        .from('movie_settings')
        .insert({
          user_id: user.id,
          title,
          genre,
          length_minutes: length,
          number_of_scenes: numberOfScenes,
          topic,
          mode: 'managed'
        });

      if (saveError) {
        console.error('Supabase error:', saveError);
        throw new Error(saveError.message);
      }

      // Save settings to store
      const setMovieSettings = useStore.getState().setMovieSettings;
      const movieSettings = {
        title,
        genre,
        length_minutes: length,
        number_of_scenes: numberOfScenes,
        topic,
        mode: 'managed'
      };
      setMovieSettings(movieSettings);

      // Generate script
      setGenerationStatus('Generating script...');
      const response = await fetch(`${API_URL}/api/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          genre,
          lengthMinutes: length,
          numberOfScenes,
          topic,
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
      while (true) {
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
                if (parsed.done) break;
                if (parsed.content) {
                  generatedScript += parsed.content;
                }
              }
              
              if (parsed.status === 'complete') {
                // Save the generated script
                setGenerationStatus('Saving generated script...');
                const saveResponse = await fetch(`${API_URL}/api/scripts/save`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: user.id,
                    title,
                    content: parsed.content,
                    metadata: {
                      title,
                      genre,
                      numberOfScenes,
                      lengthMinutes: length,
                      topic,
                      createdAt: new Date().toISOString()
                    }
                  }),
                });

                if (!saveResponse.ok) {
                  throw new Error('Failed to save generated script');
                }

                const saveData = await saveResponse.json();
                
                // Set script file in store
                const setScriptFile = useStore.getState().setScriptFile;
                setScriptFile({
                  fileName: saveData.fileName,
                  filePath: saveData.filePath,
                  content: parsed.content
                });
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
      
      onClose();
      navigate('/script');
    } catch (err) {
      console.error('Error creating movie:', err);
      setError(err instanceof Error ? err.message : 'Failed to create movie');
    } finally {
      setIsLoading(false);
      setGenerationStatus('');
    }
  };

  return (
    <DialogContent className="bg-[#1A1A1A] text-white">
      <DialogHeader>
        <DialogTitle>Create New Movie</DialogTitle>
        <DialogDescription>
          Configure your movie settings to get started
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {generationStatus && (
          <div className="text-[#1ABC9C] text-sm flex items-center">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {generationStatus}
          </div>
        )}

        <div>
          <Label htmlFor="title">Movie Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
            placeholder="Enter movie title"
            required
          />
        </div>

        <div>
          <Label htmlFor="genre">Genre</Label>
          <Input
            id="genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
            placeholder="e.g., Action, Comedy, Drama"
            required
          />
        </div>

        <div>
          <Label>Movie Length</Label>
          <Select value={length.toString()} onValueChange={(value) => setLength(parseInt(value))}>
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
          <Label>Estimated Number of Scenes</Label>
          <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-md p-3 text-white">
            {numberOfScenes} {numberOfScenes === 1 ? 'scene' : 'scenes'} (based on {length} minutes)
          </div>
        </div>

        <div>
          <Label htmlFor="topic">Topic/Theme</Label>
          <textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full h-24 mt-2 px-3 py-2 bg-[#2A2A2A] text-white rounded-md border border-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#FFA500] focus:border-transparent resize-none"
            placeholder="Enter a topic or theme for your movie..."
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {generationStatus || 'Creating...'}
            </>
          ) : (
            'Create Movie'
          )}
        </Button>
      </form>
    </DialogContent>
  );
}
