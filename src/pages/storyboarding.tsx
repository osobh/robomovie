import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Image as ImageIcon, AlertCircle, Loader2, FileText, Trash2, Check, ArrowRight } from 'lucide-react';
import { useServerStatus } from '@/lib/hooks/use-server-status';
import { useWorkflow } from '@/lib/workflow';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Import Scene type from store to ensure consistency
import type { Scene } from '@/lib/store';

interface SceneModalProps {
  scene: Scene;
  onClose: () => void;
}

function SceneModal({ scene, onClose }: SceneModalProps) {
  return (
    <DialogContent className="bg-[#1A1A1A] text-white max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Scene {scene.sceneNumber}: {scene.title}</DialogTitle>
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </DialogHeader>
      
      <div className="space-y-6 mt-4">
        <div>
          <h3 className="text-lg font-semibold text-[#FFA500] mb-2">Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Location</p>
              <p className="text-white">{scene.location}</p>
            </div>
            <div>
              <p className="text-gray-400">Time of Day</p>
              <p className="text-white">{scene.timeOfDay}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-gray-400">Characters</p>
            <p className="text-white">{scene.characters.join(', ')}</p>
          </div>
          <div className="mt-2">
            <p className="text-gray-400">Description</p>
            <p className="text-white">{scene.description}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[#FFA500] mb-2">Shot List</h3>
          <div className="space-y-4">
            {scene.shots.map((shot: Scene['shots'][0]) => (
              <div key={shot.number} className="bg-[#2A2A2A] p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Shot {shot.number}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">Angle</p>
                    <p className="text-white">{shot.angle}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Movement</p>
                    <p className="text-white">{shot.movement}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Composition</p>
                    <p className="text-white">{shot.composition}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Lighting</p>
                    <p className="text-white">{shot.lighting}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-gray-400">Action</p>
                  <p className="text-white">{shot.action}</p>
                </div>
                <div className="mt-2">
                  <p className="text-gray-400">Effects</p>
                  <p className="text-white">{shot.effects}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[#FFA500] mb-2">Technical Requirements</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Equipment</p>
              <ul className="list-disc list-inside text-white">
                {scene.technicalRequirements.equipment.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-gray-400">VFX</p>
              <ul className="list-disc list-inside text-white">
                {scene.technicalRequirements.vfx.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[#FFA500] mb-2">Emotional Context</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Mood</p>
              <p className="text-white">{scene.emotionalContext.mood}</p>
            </div>
            <div>
              <p className="text-gray-400">Color Palette</p>
              <p className="text-white">{scene.emotionalContext.colorPalette.join(', ')}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-gray-400">Sound Cues</p>
            <ul className="list-disc list-inside text-white">
              {scene.emotionalContext.soundCues.map((cue: string, i: number) => (
                <li key={i}>{cue}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[#FFA500] mb-2">Script</h3>
          <div className="bg-[#2A2A2A] p-4 rounded-lg">
            <pre className="text-white whitespace-pre-wrap font-mono text-sm">{scene.script}</pre>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function Storyboarding() {
  const navigate = useNavigate();
  const isServerRunning = useServerStatus();
  const { completeStep } = useWorkflow();
  const { workflow } = useStore();
  const { user } = useAuth();
  const isStepComplete = useStore((state) => state.isStepComplete);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedStoryboards, setSavedStoryboards] = useState<{
    id: string;
    name: string;
    type: string;
    createdAt: string;
    size: number;
    metadata?: {
      sceneCount: number;
    };
  }[]>([]);
  const [isLoadingStoryboards, setIsLoadingStoryboards] = useState(false);

  // Function to fetch storyboards
  const fetchStoryboards = useCallback(async () => {
      if (!isServerRunning || !user) {
        console.log('Skipping storyboard fetch - server not running or no user');
        return;
      }
      
      console.log('Fetching storyboards for user:', user.id);
      setIsLoadingStoryboards(true);
      try {
        const response = await fetch(`${API_URL}/api/user-files/${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch files');
        }
        const data = await response.json();
        console.log('Received files:', data);
        
        // Filter storyboard files
        const storyboards = data.filter((file: any) => file.type === 'storyboard');
        console.log('Filtered storyboard files:', storyboards);
        setSavedStoryboards(storyboards);
      } catch (err) {
        console.error('Error fetching storyboards:', err);
        setError('Failed to load saved storyboards');
      } finally {
        setIsLoadingStoryboards(false);
        console.log('Storyboard fetch completed');
      }
    }, [isServerRunning, user, API_URL]);

  // Load saved storyboards
  useEffect(() => {
    fetchStoryboards();
  }, [isServerRunning, user, fetchStoryboards]);

  // Load scenes from workflow if available
  useEffect(() => {
    if (workflow.scenes) {
      setScenes(workflow.scenes);
    }
  }, [workflow.scenes]);

  const handleProcessStoryboard = async () => {
    if (!isServerRunning || !workflow.scriptFile) {
      console.log('Skipping storyboard processing - server not running or no script file');
      return;
    }
    
    console.log('Starting storyboard processing for script:', workflow.scriptFile.fileName);
    setIsProcessing(true);
    setError(null);

    try {
      const requestBody = {
        script: workflow.scriptFile.content,
        scriptId: workflow.scriptFile.fileName.replace('.txt', ''),
        userId: user?.id
      };
      console.log('Sending process request:', requestBody);

      const response = await fetch(`${API_URL}/api/storyboarding/process-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process script');
      }

      const data = await response.json();
      console.log('Received storyboard data:', data);
      
      // Add IDs to scenes
      const scenesWithIds = data.scenes.map((scene: Scene) => ({
        ...scene,
        id: Math.random().toString(36).substr(2, 9)
      }));
      
      // Update scenes in store and local state
      console.log('Setting scenes:', scenesWithIds);
      setScenes(scenesWithIds);
      useStore.getState().setScenes(scenesWithIds);

      // Complete the storyboard step
      completeStep('scene');
      
      // Refresh storyboards list
      console.log('Refreshing storyboards list');
      fetchStoryboards();
      
      // Show success message
      setSuccessMessage('Storyboard generated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error processing storyboard:', error);
      setError(error instanceof Error ? error.message : 'Failed to process storyboard');
    } finally {
      setIsProcessing(false);
      console.log('Storyboard processing completed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Saved Storyboards Section */}
      <div className="bg-[#1A1A1A] rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Saved Storyboards</h2>
        <div className="space-y-2">
          {isLoadingStoryboards ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-[#1ABC9C]" />
            </div>
          ) : savedStoryboards.length === 0 ? (
            <p className="text-gray-400">No saved storyboards</p>
          ) : (
            savedStoryboards.map((storyboard) => (
              <div
                key={storyboard.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#2A2A2A] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#1ABC9C]" />
                  <div>
                    <p className="text-white">{storyboard.name}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(storyboard.createdAt).toLocaleDateString()} • {storyboard.metadata?.sceneCount || 0} scenes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    className="text-[#1ABC9C] hover:text-[#1ABC9C]/80 text-sm"
                    onClick={async () => {
                      console.log('Loading storyboard:', storyboard.id);
                      try {
                        console.log('Loading storyboard:', storyboard.id);
                        const encodedId = encodeURIComponent(storyboard.id);
                        const response = await fetch(`${API_URL}/api/storyboards/${user?.id}/${encodedId}`);
                        if (!response.ok) throw new Error('Failed to load storyboard');
                        const data = await response.json();
                        console.log('Received storyboard data:', data);
                        
                        if (data.content && data.content.scenes) {
                          // Add IDs to scenes if they don't have them
                          const scenesWithIds = data.content.scenes.map((scene: Scene) => ({
                            ...scene,
                            id: scene.id || Math.random().toString(36).substr(2, 9)
                          }));
                          console.log('Setting scenes:', scenesWithIds);
                          setScenes(scenesWithIds);
                          useStore.getState().setScenes(scenesWithIds);
                          // Complete the storyboard step
                          completeStep('scene');
                          setSuccessMessage('Storyboard loaded successfully!');
                          setTimeout(() => setSuccessMessage(null), 3000);
                        } else {
                          console.error('Invalid storyboard data format:', data);
                          throw new Error('Invalid storyboard data format');
                        }
                      } catch (error) {
                        console.error('Error loading storyboard:', error);
                        setError('Failed to load storyboard');
                      }
                    }}
                  >
                    Load Storyboard
                  </button>
                  <button 
                    className="text-red-500 hover:text-red-400 text-sm"
                    onClick={async () => {
                      console.log('Deleting storyboard:', storyboard.id);
                      try {
                        console.log('Deleting storyboard:', storyboard.id);
                        const encodedId = encodeURIComponent(storyboard.id);
                        const response = await fetch(`${API_URL}/api/storyboards/${user?.id}/${encodedId}`, {
                          method: 'DELETE'
                        });
                        if (!response.ok) throw new Error('Failed to delete storyboard');
                        console.log('Storyboard deleted successfully');
                        setSavedStoryboards(prev => prev.filter(s => s.id !== storyboard.id));
                        setSuccessMessage('Storyboard deleted successfully!');
                        setTimeout(() => setSuccessMessage(null), 3000);
                      } catch (error) {
                        console.error('Error deleting storyboard:', error);
                        setError('Failed to delete storyboard');
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#FFA500]">Storyboarding</h1>
        <p className="text-lg text-gray-300 mt-2">Review and process your scene breakdowns.</p>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-md text-green-500 flex items-center">
          <Check className="w-5 h-5 mr-2" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-md text-red-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {!isServerRunning && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-md text-yellow-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Server is not running. Please start the server to enable storyboarding.
        </div>
      )}

      {/* Scene Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {scenes.length > 0 ? scenes.map((scene) => (
          <div
            key={scene.sceneNumber}
            className="aspect-video bg-[#1A1A1A] rounded-lg p-4 flex flex-col cursor-pointer hover:bg-[#2A2A2A] transition-colors"
            onClick={() => setSelectedScene(scene)}
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <ImageIcon className="w-12 h-12 text-[#1ABC9C] mb-2" />
              <h3 className="text-lg font-semibold text-center">Scene {scene.sceneNumber}</h3>
              <p className="text-sm text-gray-400 text-center mt-1">{scene.title}</p>
            </div>
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">{scene.shots.length} Shots</p>
            </div>
          </div>
        )) : (
          // Placeholder storyboard frames
          <>
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className="aspect-video bg-[#1A1A1A] rounded-lg p-4 flex flex-col border border-dashed border-gray-600"
              >
                <div className="flex-1 flex flex-col items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-600 mb-2" />
                  <h3 className="text-lg font-semibold text-center text-gray-400">Scene {num}</h3>
                  <p className="text-sm text-gray-500 text-center mt-1">Placeholder</p>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">Generate storyboard to view scenes</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Process Storyboard Button and Next Button */}
      <div className="flex justify-center gap-4 mb-12">
        {scenes.length === 0 ? (
          <Button
            size="lg"
            className="bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleProcessStoryboard}
            disabled={isProcessing || !workflow.scriptFile || !isServerRunning}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Generate Storyboard
              </>
            )}
          </Button>
        ) : (
          <Button
            size="lg"
            className="bg-[#1ABC9C] hover:bg-[#1ABC9C]/90"
            onClick={() => navigate('/movie')}
          >
            Next
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>

      {/* Scene Details Modal */}
      {selectedScene && (
        <Dialog open={true} onOpenChange={() => setSelectedScene(null)}>
          <SceneModal scene={selectedScene} onClose={() => setSelectedScene(null)} />
        </Dialog>
      )}
    </div>
  );
}
