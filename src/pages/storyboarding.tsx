import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Settings, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { useServerStatus } from '@/lib/hooks/use-server-status';
import { useWorkflow } from '@/lib/workflow';
import { useStore } from '@/lib/store';
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
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load scenes from workflow if available
    if (workflow.scenes) {
      setScenes(workflow.scenes);
    }
  }, [workflow.scenes]);

  const handleProcessStoryboard = async () => {
    if (!isServerRunning || !workflow.scriptFile) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/storyboarding/process-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: workflow.scriptFile.content,
          scriptId: workflow.scriptFile.fileName,
          userId: workflow.scriptFile.fileName.split('/')[0]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process script');
      }

      const data = await response.json();
      
      // Update scenes in store and local state
      setScenes(data.scenes);
      useStore.getState().setScenes(data.scenes);

      // Complete the storyboard step
      completeStep('scene');
    } catch (error) {
      console.error('Error processing storyboard:', error);
      setError(error instanceof Error ? error.message : 'Failed to process storyboard');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#FFA500]">Storyboarding</h1>
        <p className="text-lg text-gray-300 mt-2">Review and process your scene breakdowns.</p>
      </div>

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {scenes.map((scene) => (
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
        ))}
      </div>

      {/* Process Storyboard Button */}
      <div className="flex justify-center mb-12">
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
              Process Storyboard
            </>
          )}
        </Button>
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
