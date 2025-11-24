
import { LeaderboardEntry } from '../types';

const STORAGE_KEY = 'mystery_doors_leaderboard';

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const entries: LeaderboardEntry[] = JSON.parse(stored);
    // Sort by score desc
    return entries.sort((a, b) => b.score - a.score).slice(0, 50);
  } catch (e) {
    console.error("Error reading local leaderboard", e);
    return [];
  }
};

export const saveScore = async (entry: LeaderboardEntry) => {
  try {
    const current = await getLeaderboard();
    current.push(entry);
    // Sort and limit
    const updated = current.sort((a, b) => b.score - a.score).slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving local score", e);
  }
};
