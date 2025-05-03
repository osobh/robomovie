import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Play,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  FileText,
  Trash2,
  Check,
  ArrowRight,
  Film,
} from "lucide-react";
import { useServerStatus } from "@/lib/hooks/use-server-status";
import { useWorkflow } from "@/lib/workflow";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Import Scene type from store to ensure consistency
import type { Scene } from "@/lib/store";

interface SceneModalProps {
  scene: Scene;
}

function SceneModal({ scene }: SceneModalProps) {
  const { workflow } = useStore();
  const setStoreScenes = useStore((state) => state.setScenes);
  return (
    <DialogContent className="bg-[#1A1A1A] text-white max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          Scene {scene.sceneNumber}: {scene.title}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 mt-4">
        <div>
          <h3 className="text-lg font-semibold text-[#FFA500] mb-2">
            Overview
          </h3>
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
            <p className="text-white">{scene.characters.join(", ")}</p>
          </div>
          <div className="mt-2">
            <p className="text-gray-400">Description</p>
            <p className="text-white">{scene.description}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[#FFA500] mb-2">
            Shot List
          </h3>
          <div className="space-y-6">
            {scene.shots.map((shot: Scene["shots"][0]) => (
              <div key={shot.number} className="bg-[#2A2A2A] p-4 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold text-lg">Shot {shot.number}</h4>
                  <div className="px-2 py-1 bg-[#1ABC9C]/10 text-[#1ABC9C] rounded text-sm">
                    {shot.angle}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Technical Details & Reference Image */}
                  <div className="space-y-6">
                    {/* Technical Details */}
                    <div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
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
                        <div>
                          <p className="text-gray-400">Effects</p>
                          <p className="text-white">{shot.effects}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-gray-400">Action</p>
                        <p className="text-white">{shot.action}</p>
                      </div>
                    </div>

                    {/* Reference Image Section */}
                    <div className="border-t border-[#3A3A3A] pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-400 font-medium">
                          Reference Image
                        </p>
                        <Button
                          size="sm"
                          className="bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white"
                          onClick={async () => {
                            try {
                              // Update shot state to show loading and clear previous image
                              const updatedShots = [...scene.shots];
                              const shotIndex = updatedShots.findIndex(
                                (s) => s.number === shot.number
                              );
                              updatedShots[shotIndex] = {
                                ...shot,
                                isGeneratingImage: true,
                                referenceImage: null, // Clear previous image while generating
                                error: null, // Clear any previous errors
                              };
                              setStoreScenes(
                                workflow!.scenes!.map((s: Scene) =>
                                  s.id === scene.id
                                    ? { ...s, shots: updatedShots }
                                    : s
                                )
                              );

                              // Generate reference image
                              const response = await fetch(
                                `${API_URL}/api/generate-reference`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ shot, scene }),
                                }
                              );

                              if (!response.ok)
                                throw new Error(
                                  "Failed to generate reference image"
                                );

                              const data = await response.json();
                              console.log("Reference image response:", data);

                              if (!data.success || !data.imageData) {
                                throw new Error(
                                  data.error || "Failed to get image data"
                                );
                              }

                              // Create a new shot object with the image data
                              const newShot = {
                                ...shot,
                                isGeneratingImage: false,
                                referenceImage: `data:${data.contentType};base64,${data.imageData}`,
                                revisedPrompt: data.revisedPrompt,
                                error: null,
                              };

                              // Create a new array with the updated shot
                              const newShots = [...scene.shots];
                              newShots[shotIndex] = newShot;

                              // Update scenes with the new shots array
                              const updatedScene = {
                                ...scene,
                                shots: newShots,
                              };

                              // Update scenes in store with a fresh reference
                              setStoreScenes(
                                workflow!.scenes!.map((s: Scene) =>
                                  s.id === scene.id ? updatedScene : s
                                )
                              );
                            } catch (error) {
                              console.error(
                                "Error generating reference image:",
                                error
                              );
                              // Reset generating state and set error
                              const updatedShots = [...scene.shots];
                              const shotIndex = updatedShots.findIndex(
                                (s) => s.number === shot.number
                              );
                              updatedShots[shotIndex] = {
                                ...shot,
                                isGeneratingImage: false,
                                referenceImage: null,
                                error:
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to generate image",
                              };
                              setStoreScenes(
                                workflow!.scenes!.map((s: Scene) =>
                                  s.id === scene.id
                                    ? { ...s, shots: updatedShots }
                                    : s
                                )
                              );
                            }
                          }}
                          disabled={shot.isGeneratingImage}
                        >
                          {shot.isGeneratingImage ? (
                            <div className="flex items-center">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              <span>Generating...</span>
                            </div>
                          ) : shot.referenceImage ? (
                            "Regenerate"
                          ) : (
                            "Generate Reference"
                          )}
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {/* DALL-E's Interpretation */}
                        {shot.revisedPrompt && (
                          <div className="bg-[#1A1A1A] p-3 rounded text-sm">
                            <p className="text-gray-400 mb-2">
                              DALL-E's Interpretation:
                            </p>
                            <p className="text-[#1ABC9C]">
                              {shot.revisedPrompt}
                            </p>
                          </div>
                        )}

                        {/* Reference Image Display */}
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                          {shot.isGeneratingImage && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                              <div className="text-center space-y-3">
                                <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#1ABC9C]" />
                                <p className="text-sm text-white font-medium">
                                  Creating cinematic shot...
                                </p>
                                <p className="text-xs text-gray-400">
                                  This may take a few moments
                                </p>
                              </div>
                            </div>
                          )}
                          {/* Show image when ready */}
                          {!shot.isGeneratingImage && shot.referenceImage && (
                            <img
                              src={shot.referenceImage}
                              alt={`Reference for shot ${shot.number}`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                console.error("Image failed to load:", e);
                                e.currentTarget.src =
                                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
                                e.currentTarget.className =
                                  "w-12 h-12 text-red-500";
                              }}
                            />
                          )}
                          {/* Show error state */}
                          {!shot.isGeneratingImage && shot.error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/10">
                              <div className="text-center space-y-2">
                                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                                <p className="text-sm text-red-500">
                                  {shot.error}
                                </p>
                              </div>
                            </div>
                          )}
                          {/* Show initial state */}
                          {!shot.isGeneratingImage &&
                            !shot.referenceImage &&
                            !shot.error && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center space-y-2">
                                  <ImageIcon className="w-12 h-12 text-gray-600 mx-auto" />
                                  <p className="text-sm text-gray-400">
                                    Click generate to create reference image
                                  </p>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Right Column - Script Content */}
                  <div className="space-y-4 border-l border-[#3A3A3A] pl-6">
                    {shot.scriptSegment && (
                      <div>
                        <p className="text-gray-400 mb-2">Script Direction</p>
                        <p className="text-white bg-[#1A1A1A] p-3 rounded">
                          {shot.scriptSegment}
                        </p>
                      </div>
                    )}
                    {shot.dialogue && (
                      <div>
                        <p className="text-gray-400 mb-2">Dialogue</p>
                        <div className="bg-[#1A1A1A] p-3 rounded font-mono space-y-1">
                          <p className="text-yellow-500 font-bold uppercase">
                            {shot.dialogue.speaker}
                          </p>
                          <p className="text-[#1ABC9C]">{shot.dialogue.text}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[#FFA500] mb-2">
            Technical Requirements
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Equipment</p>
              <ul className="list-disc list-inside text-white">
                {scene.technicalRequirements.equipment.map(
                  (item: string, i: number) => (
                    <li key={i}>{item}</li>
                  )
                )}
              </ul>
            </div>
            <div>
              <p className="text-gray-400">VFX</p>
              <ul className="list-disc list-inside text-white">
                {scene.technicalRequirements.vfx.map(
                  (item: string, i: number) => (
                    <li key={i}>{item}</li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[#FFA500] mb-2">
            Emotional Context
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Mood</p>
              <p className="text-white">{scene.emotionalContext.mood}</p>
            </div>
            <div>
              <p className="text-gray-400">Color Palette</p>
              <p className="text-white">
                {scene.emotionalContext.colorPalette.join(", ")}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-gray-400">Sound Cues</p>
            <ul className="list-disc list-inside text-white">
              {scene.emotionalContext.soundCues.map(
                (cue: string, i: number) => (
                  <li key={i}>{cue}</li>
                )
              )}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[#FFA500] mb-2">
            Create Movie Scene
          </h3>
          <div className="bg-[#2A2A2A] p-4 rounded-lg">
            <p className="text-gray-300 mb-4">
              Transform this scene into a movie scene with visual effects,
              audio, and more.
            </p>
            <Button
              className="w-full bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white"
              onClick={() => {}}
            >
              <Film className="w-5 h-5 mr-2" />
              Create Movie Scene
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function Storyboarding() {
  const navigate = useNavigate();
  const isServerRunning = useServerStatus();
  const { completeStep } = useWorkflow();
  const { workflow } = useStore();
  const { user } = useAuth();
  const [scenes, setLocalScenes] = useState<Scene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const setStoreScenes = useStore((state) => state.setScenes);
  const selectedScene = scenes.find((s) => s.id === selectedSceneId) || null;
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedStoryboards, setSavedStoryboards] = useState<
    {
      id: string;
      name: string;
      type: string;
      createdAt: string;
      size: number;
      metadata?: {
        sceneCount: number;
      };
    }[]
  >([]);
  const [isLoadingStoryboards, setIsLoadingStoryboards] = useState(false);

  // Function to fetch storyboards
  const fetchStoryboards = useCallback(async () => {
    if (!isServerRunning || !user) {
      console.log("Skipping storyboard fetch - server not running or no user");
      return;
    }

    console.log("Fetching storyboards for user:", user.id);
    setIsLoadingStoryboards(true);
    try {
      const response = await fetch(`${API_URL}/api/user-files/${user.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      const data = await response.json();
      console.log("Received files:", data);

      // Filter storyboard files
      interface FileData {
        id: string;
        name: string;
        type: string;
        createdAt: string;
        size: number;
        metadata?: {
          sceneCount: number;
        };
      }

      const storyboards = data.filter(
        (file: FileData) => file.type === "storyboard"
      );
      console.log("Filtered storyboard files:", storyboards);
      setSavedStoryboards(storyboards);
    } catch (err) {
      console.error("Error fetching storyboards:", err);
      setError("Failed to load saved storyboards");
    } finally {
      setIsLoadingStoryboards(false);
      console.log("Storyboard fetch completed");
    }
  }, [isServerRunning, user]);

  // Load saved storyboards
  useEffect(() => {
    fetchStoryboards();
  }, [isServerRunning, user, fetchStoryboards]);

  // Load scenes from workflow if available
  useEffect(() => {
    if (workflow.scenes) {
      setLocalScenes(workflow.scenes);
    }
  }, [workflow.scenes]);

  const handleProcessStoryboard = async () => {
    if (!isServerRunning || !workflow.scriptFile) {
      console.log(
        "Skipping storyboard processing - server not running or no script file"
      );
      return;
    }

    console.log(
      "Starting storyboard processing for script:",
      workflow.scriptFile.fileName
    );
    setIsProcessing(true);
    setError(null);

    try {
      const requestBody = {
        script: workflow.scriptFile.content,
        scriptId: workflow.scriptFile.fileName.replace(".txt", ""),
        userId: user?.id,
      };
      console.log("Sending process request:", requestBody);

      const response = await fetch(
        `${API_URL}/api/storyboarding/process-script`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process script");
      }

      const data = await response.json();
      console.log("Received storyboard data:", data);

      // Add IDs to scenes
      const scenesWithIds = data.scenes.map((scene: Scene) => ({
        ...scene,
        id: Math.random().toString(36).substr(2, 9),
      }));

      // Update scenes in store and local state
      console.log("Setting scenes:", scenesWithIds);
      setLocalScenes(scenesWithIds);
      setStoreScenes(scenesWithIds);

      // Complete the storyboard step
      completeStep("scene");

      // Refresh storyboards list
      console.log("Refreshing storyboards list");
      fetchStoryboards();

      // Show success message
      setSuccessMessage("Storyboard generated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error processing storyboard:", error);
      setError(
        error instanceof Error ? error.message : "Failed to process storyboard"
      );
    } finally {
      setIsProcessing(false);
      console.log("Storyboard processing completed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Saved Storyboards Section */}
      <div className="bg-[#1A1A1A] rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          Saved Storyboards
        </h2>
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
                      {new Date(storyboard.createdAt).toLocaleDateString()} •{" "}
                      {storyboard.metadata?.sceneCount || 0} scenes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    className="text-[#1ABC9C] hover:text-[#1ABC9C]/80 text-sm"
                    onClick={async () => {
                      console.log("Loading storyboard:", storyboard.id);
                      try {
                        console.log("Loading storyboard:", storyboard.id);
                        const encodedId = encodeURIComponent(storyboard.id);
                        const response = await fetch(
                          `${API_URL}/api/storyboards/${user?.id}/${encodedId}`
                        );
                        if (!response.ok)
                          throw new Error("Failed to load storyboard");
                        const data = await response.json();
                        console.log("Received storyboard data:", data);

                        if (data.content && data.content.scenes) {
                          // Add IDs to scenes if they don't have them
                          const scenesWithIds = data.content.scenes.map(
                            (scene: Scene) => ({
                              ...scene,
                              id:
                                scene.id ||
                                Math.random().toString(36).substr(2, 9),
                            })
                          );
                          console.log("Setting scenes:", scenesWithIds);
                          setLocalScenes(scenesWithIds);
                          setStoreScenes(scenesWithIds);
                          // Complete the storyboard step
                          completeStep("scene");
                          setSuccessMessage("Storyboard loaded successfully!");
                          setTimeout(() => setSuccessMessage(null), 3000);
                        } else {
                          console.error(
                            "Invalid storyboard data format:",
                            data
                          );
                          throw new Error("Invalid storyboard data format");
                        }
                      } catch (error) {
                        console.error("Error loading storyboard:", error);
                        setError("Failed to load storyboard");
                      }
                    }}
                  >
                    Load Storyboard
                  </button>
                  <button
                    className="text-red-500 hover:text-red-400 text-sm"
                    onClick={async () => {
                      console.log("Deleting storyboard:", storyboard.id);
                      try {
                        console.log("Deleting storyboard:", storyboard.id);
                        const encodedId = encodeURIComponent(storyboard.id);
                        const response = await fetch(
                          `${API_URL}/api/storyboards/${user?.id}/${encodedId}`,
                          {
                            method: "DELETE",
                          }
                        );
                        if (!response.ok)
                          throw new Error("Failed to delete storyboard");
                        console.log("Storyboard deleted successfully");
                        setSavedStoryboards((prev) =>
                          prev.filter((s) => s.id !== storyboard.id)
                        );
                        setSuccessMessage("Storyboard deleted successfully!");
                        setTimeout(() => setSuccessMessage(null), 3000);
                      } catch (error) {
                        console.error("Error deleting storyboard:", error);
                        setError("Failed to delete storyboard");
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
        <p className="text-lg text-gray-300 mt-2">
          Review and process your scene breakdowns.
        </p>
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
          Server is not running. Please start the server to enable
          storyboarding.
        </div>
      )}

      {/* Scene Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {scenes.length > 0 ? (
          scenes.map((scene) => (
            <div
              key={scene.sceneNumber}
              className="aspect-video bg-[#1A1A1A] rounded-lg p-4 flex flex-col cursor-pointer hover:bg-[#2A2A2A] transition-colors"
              onClick={() => setSelectedSceneId(scene.id)}
            >
              <div className="flex-1 flex flex-col items-center justify-center">
                <ImageIcon className="w-12 h-12 text-[#1ABC9C] mb-2" />
                <h3 className="text-lg font-semibold text-center">
                  Scene {scene.sceneNumber}
                </h3>
                <p className="text-sm text-gray-400 text-center mt-1">
                  {scene.title}
                </p>
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">
                  {scene.shots.length} Shots
                </p>
              </div>
            </div>
          ))
        ) : (
          // Placeholder storyboard frames
          <>
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className="aspect-video bg-[#1A1A1A] rounded-lg p-4 flex flex-col border border-dashed border-gray-600"
              >
                <div className="flex-1 flex flex-col items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-600 mb-2" />
                  <h3 className="text-lg font-semibold text-center text-gray-400">
                    Scene {num}
                  </h3>
                  <p className="text-sm text-gray-500 text-center mt-1">
                    Placeholder
                  </p>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Generate storyboard to view scenes
                  </p>
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
            onClick={() => navigate("/movie")}
          >
            Next
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>

      {/* Scene Details Modal */}
      <Dialog
        open={!!selectedScene}
        onOpenChange={() => setSelectedSceneId(null)}
      >
        {selectedScene && <SceneModal scene={selectedScene} />}
      </Dialog>
    </div>
  );
}
