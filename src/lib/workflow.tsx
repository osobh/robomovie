import { useStore } from './store';

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  return children;
}

export function useWorkflow() {
  const workflow = useStore((state) => state.workflow);
  const setScript = useStore((state) => state.setScript);
  const setScenes = useStore((state) => state.setScenes);
  const setMovie = useStore((state) => state.setMovie);
  const setAudio = useStore((state) => state.setAudio);
  const completeStep = useStore((state) => state.completeStep);
  const toggleDevMode = useStore((state) => state.toggleDevMode);
  const isStepComplete = useStore((state) => state.isStepComplete);

  return {
    state: workflow,
    setScript,
    setScenes,
    setMovie,
    setAudio,
    completeStep,
    toggleDevMode,
    isStepComplete,
  };
}
