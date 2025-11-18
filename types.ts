export interface ColoringPage {
  id: string;
  prompt: string;
  imageUrl?: string;
  isLoading: boolean;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING_PROMPTS = 'GENERATING_PROMPTS',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  FINISHED = 'FINISHED',
}

export interface GenerationConfig {
  childName: string;
  theme: string;
}