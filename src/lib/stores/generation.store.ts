import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { generateService, GenerateRequest, GenerateResponse, BatchGenerateRequest, BatchGenerateResponse, GenerationHistory } from '../api/generate';

interface GenerationState {
  // Current generation
  currentGeneration: GenerateResponse | null;
  currentBatch: BatchGenerateResponse | null;
  
  // History
  history: GenerationHistory[];
  
  // Loading states
  isGenerating: boolean;
  isBatchGenerating: boolean;
  isLoadingHistory: boolean;
  isCancelling: boolean;
  
  // Progress tracking
  generationProgress: {
    current: number;
    total: number;
    percentage: number;
    status: string;
    estimatedTimeRemaining?: number;
  };
  
  // Error states
  error: string | null;
  batchErrors: string[];
  
  // Usage tracking
  usageStats: {
    monthlyGenerated: number;
    monthlyLimit: number;
    remainingCredits: number;
    resetDate: string;
  } | null;
  
  // Actions
  setCurrentGeneration: (generation: GenerateResponse | null) => void;
  setCurrentBatch: (batch: BatchGenerateResponse | null) => void;
  setError: (error: string | null) => void;
  updateProgress: (progress: Partial<GenerationState['generationProgress']>) => void;
  
  // Generation operations
  generateSingle: (request: GenerateRequest) => Promise<GenerateResponse>;
  generateBatch: (request: BatchGenerateRequest) => Promise<BatchGenerateResponse>;
  cancelGeneration: (id: string) => Promise<void>;
  pollBatchProgress: (batchId: string) => Promise<void>;
  
  // History operations
  fetchHistory: (params?: any) => Promise<void>;
  clearHistory: () => void;
  
  // Usage operations
  fetchUsageStats: () => Promise<void>;
  
  // Utility
  clearError: () => void;
  reset: () => void;
}

const initialProgress = {
  current: 0,
  total: 0,
  percentage: 0,
  status: 'idle',
};

const initialState = {
  currentGeneration: null,
  currentBatch: null,
  history: [],
  isGenerating: false,
  isBatchGenerating: false,
  isLoadingHistory: false,
  isCancelling: false,
  generationProgress: initialProgress,
  error: null,
  batchErrors: [],
  usageStats: null,
};

export const useGenerationStore = create<GenerationState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Sync actions
      setCurrentGeneration: (currentGeneration) => set({ currentGeneration }),
      setCurrentBatch: (currentBatch) => set({ currentBatch }),
      setError: (error) => set({ error }),
      updateProgress: (progress) =>
        set((state) => ({
          generationProgress: { ...state.generationProgress, ...progress }
        })),

      // Generation operations
      generateSingle: async (request) => {
        set({ 
          isGenerating: true, 
          error: null,
          generationProgress: { ...initialProgress, status: 'starting', total: 1 }
        });

        try {
          // Update progress
          set((state) => ({
            generationProgress: { 
              ...state.generationProgress, 
              status: 'processing',
              percentage: 10 
            }
          }));

          const response = await generateService.generateSingle(request);
          
          if (response.success && response.data) {
            set({ 
              currentGeneration: response.data,
              generationProgress: {
                current: 1,
                total: 1,
                percentage: 100,
                status: 'completed'
              }
            });
            
            // Refresh usage stats
            get().fetchUsageStats();
            
            return response.data;
          }
          
          throw new Error('Generation failed');
        } catch (error) {
          const errorMessage = (error as Error).message;
          set({ 
            error: errorMessage,
            generationProgress: { ...initialProgress, status: 'failed' }
          });
          throw error;
        } finally {
          set({ isGenerating: false });
        }
      },

      generateBatch: async (request) => {
        set({ 
          isBatchGenerating: true, 
          error: null, 
          batchErrors: [],
          generationProgress: { 
            ...initialProgress, 
            status: 'starting',
            total: request.prompts.length 
          }
        });

        try {
          const response = await generateService.generateBatch(request);
          
          if (response.success && response.data) {
            set({ currentBatch: response.data });
            
            // Start polling for updates
            await get().pollBatchProgress(response.data.batchId);
            
            return response.data;
          }
          
          throw new Error('Batch generation failed');
        } catch (error) {
          const errorMessage = (error as Error).message;
          set({ 
            error: errorMessage,
            generationProgress: { ...initialProgress, status: 'failed' }
          });
          throw error;
        } finally {
          set({ isBatchGenerating: false });
        }
      },

      // Poll batch progress
      pollBatchProgress: async (batchId: string) => {
        const maxRetries = 60; // 2 minutes with 2s intervals
        let retries = 0;

        while (retries < maxRetries) {
          try {
            const response = await generateService.getGenerationStatus(batchId);
            
            if (response.success && response.data) {
              const batch = response.data;
              set({ currentBatch: batch });

              // Update progress
              const progress = batch.progress;
              const percentage = progress.total > 0 
                ? Math.round((progress.completed / progress.total) * 100)
                : 0;

              set((state) => ({
                generationProgress: {
                  ...state.generationProgress,
                  current: progress.completed,
                  total: progress.total,
                  percentage,
                  status: batch.status,
                }
              }));

              if (batch.status === 'completed' || batch.status === 'failed') {
                if (progress.failed > 0) {
                  set({ 
                    batchErrors: [`${progress.failed} generations failed`] 
                  });
                }
                
                // Refresh usage stats
                get().fetchUsageStats();
                break;
              }
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, 2000));
            retries++;
            
          } catch (error) {
            console.warn('Polling failed:', error);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }

        if (retries >= maxRetries) {
          set({ 
            error: 'Generation polling timeout',
            generationProgress: { ...initialProgress, status: 'failed' }
          });
        }
      },

      cancelGeneration: async (id: string) => {
        set({ isCancelling: true, error: null });
        try {
          await generateService.cancelGeneration(id);
          set({ 
            currentGeneration: null,
            currentBatch: null,
            generationProgress: { ...initialProgress, status: 'cancelled' }
          });
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        } finally {
          set({ isCancelling: false });
        }
      },

      fetchHistory: async (params = {}) => {
        set({ isLoadingHistory: true, error: null });
        try {
          const response = await generateService.getHistory(params);
          if (response.success && response.data) {
            set({ history: response.data });
          }
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoadingHistory: false });
        }
      },

      clearHistory: () => set({ history: [] }),

      fetchUsageStats: async () => {
        try {
          const response = await generateService.getUsageStats();
          if (response.success && response.data) {
            set({ usageStats: response.data });
          }
        } catch (error) {
          console.warn('Failed to fetch usage stats:', error);
        }
      },

      clearError: () => set({ error: null, batchErrors: [] }),
      reset: () => set(initialState),
    }),
    { name: 'GenerationStore' }
  )
);