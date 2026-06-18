import { create } from "zustand";

export type CoordinationSuggestion = {
  signal: string;
  taskId: string;
  taskTitle: string;
  reason: string;
  completedDependencyTitle?: string;
  blockingTaskCount?: number;
  priority?: string;
};

type CoordinationStore = {
  currentSuggestion: CoordinationSuggestion | null;
  isOpen: boolean;
  
  // Actions
  setSuggestion: (suggestion: CoordinationSuggestion | null) => void;
  dismissSuggestion: () => void;
  setOpen: (open: boolean) => void;
  reset: () => void;
};

const useCoordinationStore = create<CoordinationStore>((set) => ({
  currentSuggestion: null,
  isOpen: false,

  setSuggestion: (suggestion) => set(() => ({ currentSuggestion: suggestion, isOpen: !!suggestion })),
  dismissSuggestion: () => set(() => ({ currentSuggestion: null, isOpen: false })),

  setOpen: (open) => set({ isOpen: open }),

  reset: () => ({
    currentSuggestion: null,
    isOpen: false,
  }),
}));

export { useCoordinationStore };
