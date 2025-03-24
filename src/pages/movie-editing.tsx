import { useEffect } from 'react';
import { useVideoEditorStore } from '@/lib/store/video-editor';
import { VideoEditor } from '@/components/video-editor';
import { MenuList } from '@/components/video-editor/menu-list';
import { ControlList } from '@/components/video-editor/control-list';

export function MovieEditing() {
  const { setSelectedScene } = useVideoEditorStore();

  // Initialize with sample scene
  useEffect(() => {
    setSelectedScene({
      id: 'sample-scene',
      number: 1,
      title: 'Sample Scene'
    });
  }, []);

  return (
    <div className="h-screen bg-[#1A1A1A] flex flex-col">
      {/* Video Editor */}
      <div className="flex-1 relative overflow-hidden">
        <MenuList />
        <ControlList />
        <VideoEditor className="h-[calc(100vh-4rem)]" />
      </div>
    </div>
  );
}
