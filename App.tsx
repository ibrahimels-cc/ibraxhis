
import React, { useState, useEffect, useCallback } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameScreen } from './components/GameScreen';
import { Leaderboard } from './components/Leaderboard';
import { SettingsMenu } from './components/SettingsMenu';
import { ChatScreen } from './components/ChatScreen';
import { AppGeneratorScreen } from './components/AppGeneratorScreen';
import { ToolsScreen } from './components/ToolsScreen';
import { ImageEditorScreen } from './components/ImageEditorScreen';
import { ComicGeneratorScreen } from './components/ComicGeneratorScreen';
import { VeoVideoScreen } from './components/VeoVideoScreen';
import { GamesHub } from './components/GamesHub';
import { AITriviaScreen } from './components/games/AITriviaScreen';
import { AIStoryScreen } from './components/games/AIStoryScreen';
import { EmojiQuestScreen } from './components/games/EmojiQuestScreen';
import { Sidebar } from './components/Sidebar';
import { LoadingScreen } from './components/LoadingScreen';
import { GameState, PlayerStats, PuzzleData, AppSettings } from './types';
import { generatePuzzle } from './services/geminiService';
import { saveScore } from './services/leaderboardService';
import { Modal } from './components/ui/Modal';
import { Lock, Menu } from 'lucide-react';
import { translations } from './utils/translations';
import { audioManager } from './utils/audio';

const INITIAL_STATS: PlayerStats = {
  level: 1,
  score: 0,
  hintsRemaining: 3,
  streak: 0,
  lives: 3,
  difficulty: 'medium' // Default, overwritten on start
};

const COOLDOWN_DURATION_MS = 90 * 1000; // 1.5 minutes
const SAVE_KEY = 'md_save_state';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [playerName, setPlayerName] = useState('');
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const [lastRewardClaimed, setLastRewardClaimed] = useState(0);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedGameExists, setSavedGameExists] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>({
    language: 'ar',
    musicVolume: 0.3,
    sfxVolume: 0.5,
    difficulty: 'medium'
  });

  // Load last reward time on mount
  useEffect(() => {
    const storedReward = localStorage.getItem('md_last_reward');
    if (storedReward) {
      setLastRewardClaimed(parseInt(storedReward));
    }
    
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        setSavedGameExists(true);
    }
  }, []);

  // Update HTML dir and Audio on setting change
  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    
    audioManager.setVolumes(settings.musicVolume, settings.sfxVolume);
    
    // Should music be playing? Only in Game Modes
    const shouldPlay = settings.musicVolume > 0 && (gameState === GameState.MENU || gameState === GameState.PLAYING || gameState === GameState.SETTINGS);
    audioManager.toggleMusic(shouldPlay);

  }, [settings, gameState]);

  // Check Cooldown on Mount and Interval
  useEffect(() => {
    const checkCooldown = () => {
        const lastGameOver = localStorage.getItem('md_last_game_over');
        if (lastGameOver) {
            const diff = Date.now() - parseInt(lastGameOver);
            if (diff < COOLDOWN_DURATION_MS) {
                setCooldownTimeLeft(Math.ceil((COOLDOWN_DURATION_MS - diff) / 1000));
                return true;
            }
        }
        setCooldownTimeLeft(0);
        return false;
    };

    checkCooldown();
    const interval = setInterval(() => {
        const isCooling = checkCooldown();
        if (!isCooling && gameState === GameState.COOLDOWN) {
            setGameState(GameState.MENU);
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  const t = translations[settings.language];

  const loadLevel = useCallback(async (level: number) => {
    setGameState(GameState.LOADING);
    
    const messages = translations[settings.language].loading;
    setLoadingMessage(messages[Math.floor(Math.random() * messages.length)]);

    // Use stats.difficulty if stats is current, else fallback to settings.difficulty
    const diff = stats?.difficulty || settings.difficulty;
    const puzzle = await generatePuzzle(level, diff, settings.language);
    setCurrentPuzzle(puzzle);
    setGameState(GameState.PLAYING);
  }, [settings.language, stats, settings.difficulty]);

  const startGame = () => {
    audioManager.playClick(); 
    audioManager.toggleMusic(settings.musicVolume > 0);

    if (cooldownTimeLeft > 0) {
        setGameState(GameState.COOLDOWN);
        return;
    }

    // Clear any existing save when starting new
    localStorage.removeItem(SAVE_KEY);
    setSavedGameExists(false);

    // Initialize stats using current settings
    setStats({
        ...INITIAL_STATS,
        difficulty: settings.difficulty
    });
    
    setGameState(GameState.LOADING);
    const messages = translations[settings.language].loading;
    setLoadingMessage(messages[Math.floor(Math.random() * messages.length)]);
    
    generatePuzzle(1, settings.difficulty, settings.language).then(puzzle => {
        setCurrentPuzzle(puzzle);
        setGameState(GameState.PLAYING);
    });
  };

  const handleResumeGame = () => {
     audioManager.playClick();
     const saved = localStorage.getItem(SAVE_KEY);
     if (saved) {
       try {
         const { stats: savedStats, puzzle: savedPuzzle } = JSON.parse(saved);
         setStats(savedStats);
         setCurrentPuzzle(savedPuzzle);
         setGameState(GameState.PLAYING);
       } catch (e) {
         console.error("Failed to load save", e);
         setSavedGameExists(false);
         // Fallback to start game if corrupt
         startGame();
       }
     }
  };

  const handleExitGame = () => {
    audioManager.playClick();
    // Save state if we are in playing mode and have a puzzle and lives
    if (gameState === GameState.PLAYING && currentPuzzle && stats.lives > 0) {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        stats,
        puzzle: currentPuzzle
      }));
      setSavedGameExists(true);
    }
    setGameState(GameState.MENU);
  };

  const handleGameResult = (success: boolean) => {
    // Audio is handled in GameScreen for immediate feedback
    
    if (success) {
        // Scoring Multiplier based on difficulty
        let multiplier = 1;
        if (stats.difficulty === 'easy') multiplier = 0.75;
        if (stats.difficulty === 'hard') multiplier = 1.5;

        const basePoints = 100 + (stats.level * 10) + (stats.streak * 5);
        const points = Math.round(basePoints * multiplier);
        
        setStats(prev => ({
            ...prev,
            score: prev.score + points,
            level: prev.level + 1,
            streak: prev.streak + 1,
            hintsRemaining: prev.level % 3 === 0 ? prev.hintsRemaining + 1 : prev.hintsRemaining
        }));
        
        setGameState(GameState.SUCCESS);
        // We generally don't auto-save on success screen transition to allow the user to "continue".
        // If they exit here, we rely on them starting the next level when they resume? 
        // Currently, exiting at SUCCESS clears progress in our simplified model, 
        // or we could implement auto-save of level+1. For now, keep it simple.
    } else {
        if (stats.lives > 1) {
            setStats(prev => ({
                ...prev,
                lives: prev.lives - 1,
                streak: 0
            }));
            setGameState(GameState.SUCCESS); 
        } else {
            setStats(prev => ({ ...prev, lives: 0 }));
            localStorage.setItem('md_last_game_over', Date.now().toString());
            // Clear save on game over
            localStorage.removeItem(SAVE_KEY);
            setSavedGameExists(false);
            setGameState(GameState.GAME_OVER);
        }
    }
  };

  const handleNextLevel = () => {
    audioManager.playClick();
    loadLevel(stats.level);
  };

  const handleSaveScore = async () => {
    audioManager.playClick();
    const name = playerName.trim() || 'Unknown Player';
    
    await saveScore({
        name,
        score: stats.score,
        level: stats.level,
        date: new Date().toISOString(),
        difficulty: stats.difficulty
    });
    setGameState(GameState.LEADERBOARD);
  };

  const handleClaimReward = () => {
    const now = Date.now();
    setLastRewardClaimed(now);
    localStorage.setItem('md_last_reward', now.toString());
    setShowRewardModal(true);
  };

  const useHint = () => {
    audioManager.playClick();
    setStats(prev => ({ ...prev, hintsRemaining: Math.max(0, prev.hintsRemaining - 1) }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggleSidebar = () => {
    audioManager.playClick();
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Determine if we are in an active game session where the sidebar should be hidden
  const isGameActive = gameState === GameState.PLAYING || 
                       gameState === GameState.SUCCESS || 
                       gameState === GameState.GAME_OVER ||
                       gameState === GameState.LOADING ||
                       gameState === GameState.AI_TRIVIA ||
                       gameState === GameState.AI_STORY ||
                       gameState === GameState.EMOJI_QUEST;

  return (
    <div className={`antialiased ${settings.language === 'ar' ? 'font-cairo' : 'font-sans'} relative`}>
      
      {/* Global Navigation Toggle - Hidden during gameplay */}
      {!isGameActive && (
        <div className="fixed top-4 left-4 z-50">
          <button 
              onClick={toggleSidebar}
              className="p-3 bg-slate-900/80 backdrop-blur border border-slate-700 text-amber-500 rounded-full shadow-lg hover:bg-slate-800 transition-all"
          >
              <Menu size={24} />
          </button>
        </div>
      )}

      {/* Sidebar - Hidden during gameplay */}
      {!isGameActive && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          currentState={gameState}
          onNavigate={setGameState}
          language={settings.language}
        />
      )}

      {gameState === GameState.MENU && (
        <MainMenu 
            onStart={startGame} 
            onShowLeaderboard={() => setGameState(GameState.LEADERBOARD)}
            onShowSettings={() => setGameState(GameState.SETTINGS)}
            language={settings.language}
            lastRewardClaimed={lastRewardClaimed}
            onClaimReward={handleClaimReward}
            hasSavedGame={savedGameExists}
            onResume={handleResumeGame}
        />
      )}

      {gameState === GameState.GAMES_HUB && (
        <GamesHub onNavigate={setGameState} language={settings.language} />
      )}

      {gameState === GameState.AI_TRIVIA && (
        <AITriviaScreen onNavigate={setGameState} language={settings.language} />
      )}

      {gameState === GameState.AI_STORY && (
        <AIStoryScreen onNavigate={setGameState} language={settings.language} />
      )}
      
      {gameState === GameState.EMOJI_QUEST && (
        <EmojiQuestScreen onNavigate={setGameState} language={settings.language} />
      )}

      {gameState === GameState.CHAT && (
        <ChatScreen language={settings.language} />
      )}

      {gameState === GameState.GENERATOR && (
        <AppGeneratorScreen language={settings.language} />
      )}

      {gameState === GameState.TOOLS && (
        <ToolsScreen onNavigate={setGameState} language={settings.language} />
      )}

      {gameState === GameState.IMAGE_EDITOR && (
        <ImageEditorScreen onNavigate={setGameState} language={settings.language} />
      )}

      {gameState === GameState.COMIC_GENERATOR && (
        <ComicGeneratorScreen onNavigate={setGameState} language={settings.language} />
      )}

      {gameState === GameState.VEO_VIDEO && (
        <VeoVideoScreen onNavigate={setGameState} language={settings.language} />
      )}

      {gameState === GameState.SETTINGS && (
        <SettingsMenu 
            settings={settings} 
            onUpdateSettings={setSettings} 
            onClose={() => setGameState(GameState.MENU)} 
        />
      )}

      {gameState === GameState.LEADERBOARD && (
        <Leaderboard 
            onBack={() => setGameState(GameState.MENU)} 
            language={settings.language}
        />
      )}

      {gameState === GameState.LOADING && (
        <LoadingScreen message={loadingMessage} />
      )}

      {gameState === GameState.COOLDOWN && (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center max-w-md w-full shadow-2xl">
                <Lock className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">{t.cooldownTitle}</h2>
                <p className="text-slate-400 mb-8">{t.cooldownMessage}</p>
                
                <div className="text-4xl font-mono font-bold text-amber-500 mb-8">
                    {formatTime(cooldownTimeLeft)}
                </div>

                <button 
                    onClick={() => setGameState(GameState.MENU)}
                    className="text-slate-400 hover:text-white underline"
                >
                    {t.mainMenu}
                </button>
            </div>
        </div>
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.SUCCESS || gameState === GameState.GAME_OVER) && currentPuzzle && (
        <GameScreen 
            puzzle={currentPuzzle} 
            stats={stats}
            onResult={handleGameResult}
            onExit={handleExitGame}
            useHint={useHint}
            language={settings.language}
        />
      )}

      {gameState === GameState.SUCCESS && (
        <Modal 
            title={stats.lives < 3 && stats.streak === 0 ? t.heartLost : t.successTitle}
            message={
                stats.lives < 3 && stats.streak === 0
                ? t.heartLostMessage.replace('{lives}', stats.lives.toString())
                : t.successMessage.replace('{level}', (stats.level - 1).toString())
            }
            type={stats.lives < 3 && stats.streak === 0 ? 'error' : 'success'}
            actionLabel={stats.lives < 3 && stats.streak === 0 ? t.retry : t.nextLevel}
            onAction={handleNextLevel}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <Modal 
            title={t.gameOver}
            message={t.gameOverMessage.replace('{score}', stats.score.toString())}
            type="error"
            actionLabel={t.saveScore}
            onAction={handleSaveScore}
            secondaryActionLabel={t.mainMenu}
            onSecondaryAction={() => setGameState(GameState.MENU)}
            showInput={true}
            inputValue={playerName}
            onInputChange={setPlayerName}
            inputPlaceholder={t.enterName}
        />
      )}

      {showRewardModal && (
        <Modal
            title={t.rewardTitle}
            message={t.rewardClaimed}
            type="achievement"
            actionLabel={t.mainMenu}
            onAction={() => setShowRewardModal(false)}
        />
      )}
    </div>
  );
};

export default App;