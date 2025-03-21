import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Film, Music, Loader2, ImageIcon, GripHorizontal, AlertCircle } from 'lucide-react';
import { useWorkflow } from '@/lib/workflow';
import { useServerStatus } from '@/lib/hooks/use-server-status';
import type { Scene, AudioScene } from '@/lib/workflow';

interface AssemblyCardProps {
  scene: Scene & { audioUrl?: string; sceneNumber: number };
  disabled: boolean;
}

function SortableAssemblyCard({ scene, disabled }: AssemblyCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#1A1A1A] rounded-lg p-6 relative group"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripHorizontal className="w-5 h-5 text-gray-500" />
      </div>
      
      <div className="absolute top-2 left-2 bg-[#2A2A2A] rounded-full w-6 h-6 flex items-center justify-center">
        <span className="text-sm font-medium text-gray-400">{scene.sceneNumber}</span>
      </div>
      
      <h3 className="text-xl font-semibold text-[#FFA500] mb-4 mt-6">{scene.name}</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Film className="w-4 h-4 text-[#1ABC9C]" />
            <span className="text-gray-300">Video</span>
          </div>
          {scene.videoUrl ? (
            <video
              src={scene.videoUrl}
              controls
              className="w-full rounded-md"
            >
              Your browser does not support the video element.
            </video>
          ) : (
            <div className="aspect-video bg-[#2A2A2A] rounded-md flex flex-col items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-600 mb-2" />
              <p className="text-gray-400">Video not yet generated</p>
            </div>
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-4 h-4 text-[#1ABC9C]" />
            <span className="text-gray-300">Audio</span>
          </div>
          {scene.audioUrl ? (
            <audio
              src={scene.audioUrl}
              controls
              className="w-full"
            >
              Your browser does not support the audio element.
            </audio>
          ) : (
            <div className="h-12 bg-[#2A2A2A] rounded-md flex items-center justify-center">
              <p className="text-gray-400">Audio not yet generated</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const initialScenes: (Scene & { sceneNumber: number })[] = [
  { id: '1', name: 'Opening Scene', breakdown: 'A quiet suburban street at dawn...', generator: 'runway', comments: '', sceneNumber: 1 },
  { id: '2', name: 'Character Introduction', breakdown: 'Sarah walks out of her house...', generator: 'pika', comments: '', sceneNumber: 2 },
  { id: '3', name: 'Conflict Setup', breakdown: 'A mysterious package arrives...', generator: 'runway', comments: '', sceneNumber: 3 },
  { id: '4', name: 'First Plot Point', breakdown: 'Sarah discovers the contents...', generator: 'pika', comments: '', sceneNumber: 4 },
];

export function MovieAssembly() {
  const isServerRunning = useServerStatus();
  const { state } = useWorkflow();
  const [assemblyScenes, setAssemblyScenes] = useState<(Scene & { audioUrl?: string; sceneNumber: number })[]>(() => {
    if (state.movie) {
      return state.movie.map((scene, index) => ({
        ...scene,
        audioUrl: state.audio?.find(audio => audio.id === scene.id)?.audioUrl,
        sceneNumber: index + 1
      }));
    }
    return initialScenes;
  });
  const [isAssembling, setIsAssembling] = useState(false);

  useEffect(() => {
    if (state.movie) {
      const combinedScenes = state.movie.map((scene, index) => ({
        ...scene,
        audioUrl: state.audio?.find(audio => audio.id === scene.id)?.audioUrl,
        sceneNumber: index + 1
      }));
      setAssemblyScenes(combinedScenes);
    }
  }, [state.movie, state.audio]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setAssemblyScenes((scenes) => {
        const oldIndex = scenes.findIndex((scene) => scene.id === active.id);
        const newIndex = scenes.findIndex((scene) => scene.id === over.id);
        const reorderedScenes = arrayMove(scenes, oldIndex, newIndex);
        
        // Update scene numbers
        return reorderedScenes.map((scene, index) => ({
          ...scene,
          sceneNumber: index + 1
        }));
      });
    }
  };

  const handleAssemble = async () => {
    if (!isServerRunning) return;
    
    setIsAssembling(true);
    try {
      // Here we would implement the video assembly logic
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulated processing
      console.log('Assembling scenes:', assemblyScenes);
    } catch (error) {
      console.error('Error assembling movie:', error);
    } finally {
      setIsAssembling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#FFA500]">Movie Assembly</h1>
        <p className="text-lg text-gray-300 mt-2">Arrange your scenes and combine them into the final movie.</p>
      </div>

      {!isServerRunning && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-md text-yellow-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Server is not running. Please start the server to enable movie assembly.
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={assemblyScenes} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {assemblyScenes.map((scene) => (
              <SortableAssemblyCard 
                key={scene.id} 
                scene={scene}
                disabled={!isServerRunning || isAssembling}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <Button
          size="lg"
          className="bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAssemble}
          disabled={isAssembling || assemblyScenes.length === 0 || !isServerRunning}
        >
          {isAssembling ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Assembling Movie...
            </>
          ) : (
            <>
              <Film className="w-5 h-5 mr-2" />
              Assemble Movie
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
