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
import { Wrench, Play, GripHorizontal, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useWorkflow, type Scene } from '@/lib/workflow';
import { useServerStatus } from '@/lib/hooks/use-server-status';

interface SceneCardProps {
  scene: Scene & { sceneNumber: number };
  onEdit: (scene: Scene & { sceneNumber: number }) => void;
  onGenerate: (scene: Scene & { sceneNumber: number }) => void;
  disabled: boolean;
}

function SortableSceneCard({ scene, onEdit, onGenerate, disabled }: SceneCardProps) {
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
      <p className="text-gray-300 mb-6 line-clamp-3">{scene.breakdown}</p>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onEdit(scene)}
          disabled={disabled}
        >
          <Wrench className="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button
          className="bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onGenerate(scene)}
          disabled={disabled}
        >
          <Play className="w-4 h-4 mr-2" />
          Generate
        </Button>
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

export function MovieEditing() {
  const isServerRunning = useServerStatus();
  const { state, setMovie } = useWorkflow();
  const [scenes, setScenes] = useState<(Scene & { sceneNumber: number })[]>(() => {
    if (state.movie) {
      return state.movie.map((scene, index) => ({
        ...scene,
        sceneNumber: index + 1
      }));
    }
    return initialScenes;
  });
  const [editingScene, setEditingScene] = useState<(Scene & { sceneNumber: number }) | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const currentScenes = JSON.stringify(scenes);
    const movieScenes = JSON.stringify(state.movie?.map((scene, index) => ({
      ...scene,
      sceneNumber: index + 1
    })));
    
    if (currentScenes !== movieScenes) {
      setMovie(scenes.map(({ sceneNumber, ...scene }) => scene));
    }
  }, [scenes]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setScenes((scenes) => {
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

  const handleEdit = (scene: Scene & { sceneNumber: number }) => {
    if (!isServerRunning) return;
    setEditingScene(scene);
    setIsEditModalOpen(true);
  };

  const handleGenerate = async (scene: Scene & { sceneNumber: number }) => {
    if (!isServerRunning) return;
    
    setIsGenerating(true);
    try {
      // Here we would implement the video generation logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated processing
      console.log('Generating video for scene:', scene);
    } catch (error) {
      console.error('Error generating video:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScene || !isServerRunning) return;

    setScenes(scenes.map(scene => 
      scene.id === editingScene.id ? editingScene : scene
    ));
    
    setIsEditModalOpen(false);
    setEditingScene(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#FFA500]">Movie Editing</h1>
        <p className="text-lg text-gray-300 mt-2">Arrange and edit your scenes, then generate the final video.</p>
      </div>

      {!isServerRunning && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-md text-yellow-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Server is not running. Please start the server to enable movie editing.
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={scenes} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {scenes.map((scene) => (
              <SortableSceneCard
                key={scene.id}
                scene={scene}
                onEdit={handleEdit}
                onGenerate={handleGenerate}
                disabled={!isServerRunning || isGenerating}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-[#1A1A1A] text-white">
          <DialogHeader>
            <DialogTitle>Edit Scene {editingScene?.sceneNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <Label htmlFor="name">Scene Name</Label>
              <Input
                id="name"
                value={editingScene?.name || ''}
                onChange={(e) => setEditingScene(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="breakdown">Scene Breakdown</Label>
              <textarea
                id="breakdown"
                value={editingScene?.breakdown || ''}
                onChange={(e) => setEditingScene(prev => prev ? { ...prev, breakdown: e.target.value } : null)}
                className="w-full h-32 bg-[#2A2A2A] border-[#3A3A3A] text-white rounded-md p-2"
              />
            </div>
            
            <div>
              <Label htmlFor="generator">Video Generator</Label>
              <select
                id="generator"
                value={editingScene?.generator || 'runway'}
                onChange={(e) => setEditingScene(prev => prev ? { ...prev, generator: e.target.value as 'runway' | 'pika' } : null)}
                className="w-full bg-[#2A2A2A] border-[#3A3A3A] text-white rounded-md p-2"
              >
                <option value="runway">Runway</option>
                <option value="pika">Pika</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="comments">Additional Comments</Label>
              <textarea
                id="comments"
                value={editingScene?.comments || ''}
                onChange={(e) => setEditingScene(prev => prev ? { ...prev, comments: e.target.value } : null)}
                className="w-full h-32 bg-[#2A2A2A] border-[#3A3A3A] text-white rounded-md p-2"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isServerRunning}
            >
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
