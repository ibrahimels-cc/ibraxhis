
export enum PuzzleType {
  DOORS = 'DOORS',
  DETECTIVE = 'DETECTIVE',
  RIDDLE = 'RIDDLE',
  VISUAL = 'VISUAL'
}

export interface PuzzleData {
  id: string;
  type: PuzzleType;
  title: string;
  story: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
  difficultyLevel: number;
}

export interface TriviaData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  SUCCESS = 'SUCCESS',
  GAME_OVER = 'GAME_OVER',
  LEADERBOARD = 'LEADERBOARD',
  SETTINGS = 'SETTINGS',
  COOLDOWN = 'COOLDOWN',
  ERROR = 'ERROR',
  CHAT = 'CHAT',
  GENERATOR = 'GENERATOR',
  TOOLS = 'TOOLS',
  IMAGE_EDITOR = 'IMAGE_EDITOR',
  VEO_VIDEO = 'VEO_VIDEO',
  COMIC_GENERATOR = 'COMIC_GENERATOR',
  GAMES_HUB = 'GAMES_HUB',
  AI_TRIVIA = 'AI_TRIVIA',
  AI_STORY = 'AI_STORY',
  EMOJI_QUEST = 'EMOJI_QUEST'
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PlayerStats {
  score: number;
  level: number;
  hintsRemaining: number;
  streak: number;
  lives: number;
  difficulty: Difficulty;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
  date: string;
  difficulty: Difficulty;
}

export type Language = 'ar' | 'en' | 'jp';

export interface AppSettings {
  language: Language;
  musicVolume: number;
  sfxVolume: number;
  difficulty: Difficulty;
}