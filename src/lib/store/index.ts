import { create } from 'zustand';
import { supabase } from '../supabase';

interface User {
  id: string;
  email?: string;
}

interface MovieSettings {
  title: string;
  genre: string;
  length_minutes: number;
  number_of_scenes: number;
  topic: string;
  mode: string;
}

export interface Scene {
  id: string; // Required for drag and drop functionality
  title: string;
  sceneNumber: number;
  location: string;
  timeOfDay: string;
  characters: string[];
  description: string;
  generator?: 'runway' | 'pika'; // For movie editing
  comments?: string; // For movie editing
  shots: {
    number: number;
    angle: string;
    movement: string;
    composition: string;
    action: string;
    effects: string;
    lighting: string;
  }[];
  technicalRequirements: {
    equipment: string[];
    vfx: string[];
    practicalEffects: string[];
    props: string[];
    safety: string[];
  };
  emotionalContext: {
    characterEmotions: Record<string, string>;
    mood: string;
    colorPalette: string[];
    soundCues: string[];
  };
  script: string;
}

interface ScriptFile {
  fileName: string;
  filePath: string;
  content: string;
}

interface WorkflowState {
  script: string | null;
  scriptFile: ScriptFile | null;
  scenes: Scene[] | null;
  movie: Scene[] | null;
  audio: any | null;
  completedSteps: string[];
  devMode: boolean;
  movieSettings: MovieSettings | null;
}

interface ServerState {
  isRunning: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLogin: boolean;
  isSuccess: boolean;
  error: string | null;
  isLoading: boolean;
}

interface Store {
  // Auth State
  auth: AuthState;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  setAuthMode: (isLogin: boolean) => void;
  setAuthSuccess: (isSuccess: boolean) => void;
  setAuthError: (error: string | null) => void;
  setAuthLoading: (isLoading: boolean) => void;

  // Workflow State
  workflow: WorkflowState;
  setScript: (script: string) => void;
  setScriptFile: (file: ScriptFile | null) => void;
  setScenes: (scenes: Scene[]) => void;
  setMovie: (movie: any) => void;
  setAudio: (audio: any) => void;
  setMovieSettings: (settings: MovieSettings) => void;
  completeStep: (step: string) => void;
  toggleDevMode: () => void;
  isStepComplete: (step: string) => boolean;

  // Server State
  server: ServerState;
  setServerStatus: (isRunning: boolean) => void;
}

export const useStore = create<Store>((set, get) => ({
  // Auth State
  auth: {
    user: null,
    isAuthenticated: false,
    isLogin: true, // Default to login mode
    isSuccess: false,
    error: null,
    isLoading: false
  },
  setUser: (user) => {
    console.log('Setting user:', user ? user.id : 'null');
    set((state) => ({
      auth: {
        ...state.auth,
        user,
        isAuthenticated: !!user
      }
    }));
  },
  signOut: async () => {
    console.log('Signing out user');
    await supabase.auth.signOut();
    set((state) => ({
      auth: {
        ...state.auth,
        user: null,
        isAuthenticated: false,
        isSuccess: false, // Reset success state
        error: null,
        isLogin: true // Reset to login mode
      }
    }));
  },
  setAuthMode: (isLogin) => {
    console.log('Setting auth mode:', isLogin);
    set((state) => ({
      auth: {
        ...state.auth,
        isLogin,
        isSuccess: false, // Reset success state on mode switch
        error: null
      }
    }));
  },
  setAuthSuccess: (isSuccess) => {
    console.log('Setting auth success:', isSuccess);
    set((state) => ({
      auth: {
        ...state.auth,
        isSuccess,
        isLogin: isSuccess ? true : state.auth.isLogin, // Switch to login mode on success
        error: null,
        user: isSuccess ? null : state.auth.user // Clear user on signup success
      }
    }));
  },
  setAuthError: (error) => {
    console.log('Setting auth error:', error);
    set((state) => ({
      auth: {
        ...state.auth,
        error,
        isSuccess: false // Reset success state on error
      }
    }));
  },
  setAuthLoading: (isLoading) => {
    console.log('Setting auth loading:', isLoading);
    set((state) => ({
      auth: {
        ...state.auth,
        isLoading,
        error: null // Clear error when loading
      }
    }));
  },

  // Workflow State
  workflow: {
    script: null,
    scriptFile: null,
    scenes: null,
    movie: null,
    audio: null,
    completedSteps: [],
    devMode: false,
    movieSettings: null,
  },
  setScript: (script) => set((state) => ({
    workflow: { ...state.workflow, script }
  })),
  setScriptFile: (scriptFile) => set((state) => ({
    workflow: {
      ...state.workflow,
      scriptFile,
      script: scriptFile ? scriptFile.content : null
    }
  })),
  setScenes: (scenes) => set((state) => ({
    workflow: { ...state.workflow, scenes }
  })),
  setMovie: (movie) => set((state) => ({
    workflow: { ...state.workflow, movie }
  })),
  setAudio: (audio) => set((state) => ({
    workflow: { ...state.workflow, audio }
  })),
  setMovieSettings: (settings) => set((state) => ({
    workflow: { ...state.workflow, movieSettings: settings }
  })),
  completeStep: (step) => set((state) => ({
    workflow: {
      ...state.workflow,
      completedSteps: [...state.workflow.completedSteps, step]
    }
  })),
  toggleDevMode: () => set((state) => ({
    workflow: { ...state.workflow, devMode: !state.workflow.devMode }
  })),
  isStepComplete: (step) => {
    const state = get();
    if (state.workflow.devMode) return true;
    return state.workflow.completedSteps.includes(step);
  },

  // Server State
  server: {
    isRunning: false
  },
  setServerStatus: (isRunning) => set({
    server: { isRunning }
  })
}));
