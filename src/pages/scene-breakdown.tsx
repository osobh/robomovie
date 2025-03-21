import { Button } from '@/components/ui/button';
import { Settings, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useServerStatus } from '@/lib/hooks/use-server-status';
import { useStore } from '@/lib/store';

export function Storyboarding() {
  const isServerRunning = useServerStatus();
  const { workflow } = useStore();

  if (!workflow.scenes) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#FFA500]">Storyboarding</h1>
          <p className="text-lg text-gray-300 mt-2">No scenes available. Please process a script first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#FFA500]">Storyboarding</h1>
        <p className="text-lg text-gray-300 mt-2">Create and visualize your story frame by frame.</p>
      </div>

      {!isServerRunning && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-md text-yellow-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Server is not running. Please start the server to enable storyboarding.
        </div>
      )}

      {/* Scene Cards Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {workflow.scenes.map((scene) => (
          <div
            key={scene.sceneNumber}
            className="bg-[#1A1A1A] rounded-lg p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Scene {scene.sceneNumber}</h3>
                <p className="text-[#1ABC9C] font-mono">{scene.sceneHeading}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#1ABC9C] text-[#1ABC9C] hover:bg-[#1ABC9C] hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-gray-400 font-medium mb-2">Characters</h4>
                <div className="flex flex-wrap gap-2">
                  {scene.characters.map((character, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-[#2A2A2A] rounded text-sm text-white"
                    >
                      {character}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-gray-400 font-medium mb-2">Setting</h4>
                <p className="text-white">{scene.setting}</p>
              </div>

              <div className="col-span-2">
                <h4 className="text-gray-400 font-medium mb-2">Summary</h4>
                <p className="text-white">{scene.summary}</p>
              </div>

              <div>
                <h4 className="text-gray-400 font-medium mb-2">Mood</h4>
                <p className="text-white">{scene.mood}</p>
              </div>

              <div>
                <h4 className="text-gray-400 font-medium mb-2">Visual Elements</h4>
                <div className="flex flex-wrap gap-2">
                  {scene.visualElements.map((element, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-[#2A2A2A] rounded text-sm text-white"
                    >
                      {element}
                    </span>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <h4 className="text-gray-400 font-medium mb-2">Key Plot Points</h4>
                <ul className="list-disc list-inside text-white space-y-1">
                  {scene.plotPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>

              {/* Storyboard Frames */}
              <div className="col-span-2 mt-4">
                <h4 className="text-gray-400 font-medium mb-4">Storyboard Frames</h4>
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((frameNumber) => (
                    <div
                      key={frameNumber}
                      className="aspect-video bg-[#2A2A2A] rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-600 hover:border-[#1ABC9C] transition-colors cursor-pointer group"
                    >
                      <ImageIcon className="w-8 h-8 text-gray-600 group-hover:text-[#1ABC9C] mb-2" />
                      <p className="text-sm text-gray-400 group-hover:text-[#1ABC9C]">Frame {frameNumber}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
