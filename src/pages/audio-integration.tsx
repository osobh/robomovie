import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Volume2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useServerStatus } from '@/lib/hooks/use-server-status';

interface AudioScene {
  id: string;
  name: string;
  breakdown: string;
  audioStatus: 'pending' | 'processing' | 'completed';
  audioUrl?: string;
}

const initialScenes: AudioScene[] = [
  {
    id: '1',
    name: 'Opening Scene',
    breakdown: 'A quiet suburban street at dawn...',
    audioStatus: 'pending'
  },
  {
    id: '2',
    name: 'Character Introduction',
    breakdown: 'Sarah walks out of her house...',
    audioStatus: 'pending'
  },
  {
    id: '3',
    name: 'Conflict Setup',
    breakdown: 'A mysterious package arrives...',
    audioStatus: 'pending'
  },
  {
    id: '4',
    name: 'Rising Action',
    breakdown: 'The implications become clear...',
    audioStatus: 'pending'
  }
];

function AudioCard({ scene, onProcess, disabled }: { 
  scene: AudioScene; 
  onProcess: (scene: AudioScene) => void;
  disabled: boolean;
}) {
  return (
    <div className="bg-[#1A1A1A] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-[#FFA500]">{scene.name}</h3>
        {scene.audioStatus === 'completed' && (
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        )}
      </div>
      
      <p className="text-gray-300 mb-6 line-clamp-2">{scene.breakdown}</p>
      
      {scene.audioStatus === 'completed' && scene.audioUrl && (
        <div className="mb-4">
          <audio
            controls
            className="w-full"
            src={scene.audioUrl}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
      
      <Button
        className="w-full bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onProcess(scene)}
        disabled={disabled || scene.audioStatus === 'processing' || scene.audioStatus === 'completed'}
      >
        {scene.audioStatus === 'processing' ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : scene.audioStatus === 'completed' ? (
          <Volume2 className="w-4 h-4 mr-2" />
        ) : (
          <Play className="w-4 h-4 mr-2" />
        )}
        {scene.audioStatus === 'processing' ? 'Processing...' : 
         scene.audioStatus === 'completed' ? 'Audio Ready' : 
         'Process Audio'}
      </Button>
    </div>
  );
}

export function AudioIntegration() {
  const isServerRunning = useServerStatus();
  const [scenes, setScenes] = useState<AudioScene[]>(initialScenes);

  const handleProcessAudio = async (scene: AudioScene) => {
    if (!isServerRunning) return;

    setScenes(prev => prev.map(s => 
      s.id === scene.id 
        ? { ...s, audioStatus: 'processing' }
        : s
    ));

    try {
      // Simulate audio processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setScenes(prev => prev.map(s => 
        s.id === scene.id 
          ? { 
              ...s, 
              audioStatus: 'completed',
              audioUrl: 'https://example.com/audio.mp3' // Replace with actual audio URL
            }
          : s
      ));
    } catch (error) {
      console.error('Error processing audio:', error);
      setScenes(prev => prev.map(s => 
        s.id === scene.id 
          ? { ...s, audioStatus: 'pending' }
          : s
      ));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#FFA500]">Audio Integration</h1>
        <p className="text-lg text-gray-300 mt-2">Process and add audio for each scene in your movie.</p>
      </div>

      {!isServerRunning && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-md text-yellow-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Server is not running. Please start the server to enable audio processing.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {scenes.map((scene) => (
          <AudioCard 
            key={scene.id} 
            scene={scene} 
            onProcess={handleProcessAudio}
            disabled={!isServerRunning}
          />
        ))}
      </div>
    </div>
  );
}
