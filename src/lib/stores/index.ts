// Export all stores for easy importing
export { useAuthStore } from './auth.store';
export { useProjectsStore } from './projects.store';
export { useGenerationStore } from './generation.store';
export { useUIStore, useIsLoading } from './ui.store';
export { useCanvasStore, createPanelElement, createImageElement, createTextElement, createDialogueElement } from './canvas-store';

// Store types
export type { LoadingKeys } from './ui.store';

// Combined hook for accessing multiple stores
export function useStores() {
  const auth = useAuthStore();
  const projects = useProjectsStore();
  const generation = useGenerationStore();
  const ui = useUIStore();

  return {
    auth,
    projects,
    generation,
    ui,
  };
}

// Utility hook to clear all stores (for logout/reset)
export function useClearStores() {
  const { reset: resetAuth } = useAuthStore();
  const { reset: resetProjects } = useProjectsStore();
  const { reset: resetGeneration } = useGenerationStore();

  return () => {
    resetAuth();
    resetProjects();
    resetGeneration();
  };
}