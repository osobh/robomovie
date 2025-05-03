import { create } from "zustand";

interface AuthUser {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
  };
}

interface ServerState {
  isRunning: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLogin: boolean;
  isSuccess: boolean;
  error: string | null;
  isLoading: boolean;
}

interface MovieData {
  id: string;
  title: string;
  duration: number;
  scenes: Scene[];
  status: "draft" | "processing" | "completed";
}

interface AudioData {
  id: string;
  url: string;
  duration: number;
  type: "background" | "effect" | "dialogue";
  metadata: Record<string, unknown>;
}

interface WorkflowState {
  scriptFile: {
    fileName: string;
    filePath: string;
    content: string;
  } | null;
  script: string | null;
  movieSettings: {
    title: string;
    genre: string;
    number_of_scenes: number;
    length_minutes: number;
    topic: string;
    mode: string;
  } | null;
  scenes: Scene[] | null;
  movie: MovieData | null;
  audio: AudioData | null;
  completedSteps: string[];
  devMode: boolean;
}

export interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  location: string;
  timeOfDay: string;
  characters: string[];
  description: string;
  shots: {
    number: number;
    angle: string;
    movement: string;
    composition: string;
    action: string;
    effects: string;
    lighting: string;
    scriptSegment: string;
    dialogue: { speaker: string; text: string } | null;
    isGeneratingImage?: boolean;
    error?: string | null;
    referenceImage?: string | null;
    revisedPrompt?: string | null;
  }[];
  technicalRequirements: {
    equipment: string[];
    vfx: string[];
    practicalEffects: string[];
    props: string[];
    safety: string[];
  };
  emotionalContext: {
    characterEmotions: { [characterName: string]: string };
    mood: string;
    colorPalette: string[];
    soundCues: string[];
  };
}

interface Store {
  // Server State
  server: ServerState;
  setServerStatus: (status: boolean) => void;

  // Auth State
  auth: AuthState;
  setUser: (user: AuthUser | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
  setAuthSuccess: (success: boolean) => void;
  setAuthMode: (isLogin: boolean) => void;

  // Workflow State
  workflow: WorkflowState;
  setScriptFile: (
    file: { fileName: string; filePath: string; content: string } | null
  ) => void;
  setScript: (script: string | null) => void;
  setMovieSettings: (settings: WorkflowState["movieSettings"]) => void;
  setScenes: (scenes: Scene[]) => void;
  setMovie: (movie: MovieData | null) => void;
  setAudio: (audio: AudioData | null) => void;
  completeStep: (step: string) => void;
  toggleDevMode: () => void;
  isStepComplete: (step: string) => boolean;
}

// Zustand store
export const useStore = create<Store>((set, get) => ({
  // Server State
  server: {
    isRunning: false,
  },
  setServerStatus: (status) =>
    set((state) => ({
      server: {
        ...state.server,
        isRunning: status,
      },
    })),

  // Auth State
  auth: {
    user: null,
    isAuthenticated: false,
    isLogin: true,
    isSuccess: false,
    error: null,
    isLoading: false,
  },
  setUser: (user) =>
    set((state) => ({
      auth: {
        ...state.auth,
        user,
        isAuthenticated: !!user,
      },
    })),
  setAuthLoading: (loading) =>
    set((state) => ({
      auth: {
        ...state.auth,
        isLoading: loading,
      },
    })),
  setAuthError: (error) =>
    set((state) => ({
      auth: {
        ...state.auth,
        error,
      },
    })),
  setAuthSuccess: (success) =>
    set((state) => ({
      auth: {
        ...state.auth,
        isSuccess: success,
      },
    })),
  setAuthMode: (isLogin) =>
    set((state) => ({
      auth: {
        ...state.auth,
        isLogin,
      },
    })),

  // Workflow State
  workflow: {
    scriptFile: null,
    script: null,
    movieSettings: null,
    scenes: null,
    movie: null,
    audio: null,
    completedSteps: [],
    devMode: false,
  },
  setScriptFile: (file) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        scriptFile: file,
      },
    })),
  setScript: (script) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        script,
      },
    })),
  setMovieSettings: (settings) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        movieSettings: settings,
      },
    })),
  setScenes: (scenes) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        scenes,
      },
    })),
  setMovie: (movie) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        movie,
      },
    })),
  setAudio: (audio) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        audio,
      },
    })),
  completeStep: (step) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        completedSteps: [...state.workflow.completedSteps, step],
      },
    })),
  toggleDevMode: () =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        devMode: !state.workflow.devMode,
      },
    })),
  isStepComplete: (step) => {
    const state = get();
    return state.workflow.completedSteps.includes(step);
  },
}));
