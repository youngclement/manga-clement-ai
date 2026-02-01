import { apiClient, ApiResponse } from './client';
import { API_ENDPOINTS } from './config';

export interface GenerateConfig {
  style: 'anime' | 'realistic' | 'cartoon' | 'manga' | 'webcomic';
  genre: string;
  colorScheme: 'color' | 'blackwhite' | 'sepia';
  resolution: 'low' | 'medium' | 'high' | 'ultra';
  aspectRatio: '16:9' | '4:3' | '1:1' | 'custom';
  quality?: number;
  seed?: number;
  model?: string;
}

export interface SessionHistory {
  id: string;
  imageUrl: string;
  prompt: string;
  pageNumber?: number;
}

export interface GenerateRequest {
  prompt: string;
  config: GenerateConfig;
  sessionHistory?: SessionHistory[];
  isAutoContinue?: boolean;
  projectId?: string;
}

export interface GenerateResponse {
  id: string;
  page: {
    id: string;
    pageNumber: number;
    panels: Array<{
      id: string;
      position: number;
      prompt: string;
      imageUrl: string;
      thumbnailUrl?: string;
    }>;
  };
  prompt: string;
  imageUrl: string;
  processingTime?: number;
  metadata?: {
    model: string;
    cost?: number;
    parameters: GenerateConfig;
  };
}

export interface BatchGenerateRequest {
  prompts: string[];
  config: GenerateConfig;
  projectId?: string;
  batchSize?: number;
}

export interface BatchGenerateResponse {
  batchId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: GenerateResponse[];
  progress: {
    completed: number;
    total: number;
    failed: number;
  };
}

export interface GenerationHistory {
  id: string;
  type: 'single' | 'batch';
  prompt: string;
  parameters: GenerateConfig;
  imageUrls: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  metadata: {
    provider: string;
    processingTime?: number;
    cost?: number;
  };
}

export class GenerateService {
  // Generate single panel
  async generateSingle(request: GenerateRequest): Promise<ApiResponse<GenerateResponse>> {
    return apiClient.post<GenerateResponse>(API_ENDPOINTS.GENERATE.SINGLE, request, {
      timeout: 60000, // 60 seconds for generation
    });
  }

  // Generate multiple panels
  async generateBatch(request: BatchGenerateRequest): Promise<ApiResponse<BatchGenerateResponse>> {
    return apiClient.post<BatchGenerateResponse>(API_ENDPOINTS.GENERATE.BATCH, request, {
      timeout: 120000, // 2 minutes for batch
    });
  }

  // Get generation status (for batch operations)
  async getGenerationStatus(id: string): Promise<ApiResponse<BatchGenerateResponse>> {
    return apiClient.get<BatchGenerateResponse>(API_ENDPOINTS.GENERATE.STATUS(id));
  }

  // Cancel generation
  async cancelGeneration(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.GENERATE.CANCEL(id));
  }

  // Get generation history
  async getHistory(params: {
    page?: number;
    limit?: number;
    type?: 'single' | 'batch';
    status?: string;
  } = {}): Promise<ApiResponse<GenerationHistory[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `${API_ENDPOINTS.GENERATE.HISTORY}?${queryString}` : API_ENDPOINTS.GENERATE.HISTORY;
    
    return apiClient.get<GenerationHistory[]>(endpoint);
  }

  // Poll generation status with automatic retries
  async pollStatus(
    id: string, 
    onProgress?: (status: BatchGenerateResponse) => void,
    maxRetries: number = 30
  ): Promise<BatchGenerateResponse> {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const response = await this.getGenerationStatus(id);
        const status = response.data!;
        
        if (onProgress) {
          onProgress(status);
        }
        
        if (status.status === 'completed' || status.status === 'failed') {
          return status;
        }
        
        // Wait before next poll
        await this.delay(2000);
        retries++;
        
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        await this.delay(5000);
      }
    }
    
    throw new Error('Generation polling timeout');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get usage statistics
  async getUsageStats(): Promise<ApiResponse<{
    monthlyGenerated: number;
    monthlyLimit: number;
    totalGenerated: number;
    remainingCredits: number;
    resetDate: string;
  }>> {
    return apiClient.get('/generate/usage');
  }

  // Generate clean panels without dialogue (for manual dialogue editing)
  async generateClean(request: {
    prompt?: string;
    config: GenerateConfig;
    sessionHistory?: SessionHistory[];
    totalPages?: number;
  }): Promise<ApiResponse<{
    pages: GenerateResponse['page'][];
    totalGenerated: number;
    isClean: boolean;
  }>> {
    return apiClient.post(API_ENDPOINTS.GENERATE.CLEAN, request, {
      timeout: 120000, // 2 minutes
    });
  }

  // Add dialogue bubbles to a clean panel
  async addDialogue(request: {
    imageUrl: string;
    dialogues: DialogueBubble[];
    language?: string;
    fontStyle?: 'manga' | 'comic' | 'handwritten' | 'clean';
  }): Promise<ApiResponse<{
    imageUrl: string;
    originalImageUrl: string;
    dialogues: DialogueBubble[];
    language: string;
    fontStyle: string;
  }>> {
    return apiClient.post(API_ENDPOINTS.GENERATE.ADD_DIALOGUE, request, {
      timeout: 60000,
    });
  }

  // Get AI-suggested dialogue for a panel
  async suggestDialogue(request: {
    imageUrl: string;
    context?: string;
    previousDialogues?: string[];
    numberOfSuggestions?: number;
  }): Promise<ApiResponse<{
    suggestions: DialogueSuggestion[];
    imageUrl: string;
  }>> {
    return apiClient.post(API_ENDPOINTS.GENERATE.SUGGEST_DIALOGUE, request, {
      timeout: 30000,
    });
  }
}

// Dialogue bubble interface for adding to panels
export interface DialogueBubble {
  id?: string;
  /** X position as percentage (0-100) from left */
  x: number;
  /** Y position as percentage (0-100) from top */
  y: number;
  /** Dialogue text content */
  text: string;
  /** Bubble style */
  style?: 'speech' | 'thought' | 'shout' | 'whisper' | 'narrator';
  /** Tail direction pointing to speaker */
  tailDirection?: 'left' | 'right' | 'top' | 'bottom' | 'none';
  /** Font size (optional) */
  fontSize?: number;
  /** Character name (optional) */
  characterName?: string;
}

// AI-suggested dialogue
export interface DialogueSuggestion {
  text: string;
  characterName?: string;
  style: 'speech' | 'thought' | 'shout' | 'whisper' | 'narrator';
  suggestedX: number;
  suggestedY: number;
  reasoning: string;
}

export const generateService = new GenerateService();