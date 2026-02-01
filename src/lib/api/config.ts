// Frontend API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ,
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
};

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  
  // Projects
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    GET: (id: string) => `/projects/${id}`,
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
    DUPLICATE: (id: string) => `/projects/${id}/duplicate`,
  },
  
  // Generation
  GENERATE: {
    SINGLE: '/generate/single',
    BATCH: '/generate/batch',
    CLEAN: '/generate/clean',
    ADD_DIALOGUE: '/generate/add-dialogue',
    SUGGEST_DIALOGUE: '/generate/suggest-dialogue',
    STATUS: (id: string) => `/generate/status/${id}`,
    CANCEL: (id: string) => `/generate/cancel/${id}`,
    HISTORY: '/generate/history',
  },
  
  // Images
  IMAGES: {
    UPLOAD: '/images/upload',
    DELETE: (id: string) => `/images/${id}`,
    OPTIMIZE: (id: string) => `/images/${id}/optimize`,
  },
  
  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    SETTINGS: '/users/settings',
    USAGE: '/users/usage',
  },
  
  // Grok
  GROK: {
    GENERATE: '/grok/generate',
    HISTORY: '/grok/history',
  }
} as const;

// Rate limiting configurations for frontend
export const RATE_LIMITS = {
  GENERATE: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
  API_CALLS: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
  IMAGE_UPLOAD: {
    windowMs: 60 * 1000,
    maxRequests: 20,
  },
} as const;