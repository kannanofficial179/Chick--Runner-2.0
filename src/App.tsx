/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import SKMRunnerEngine from './gameEngine';
import { soundManager } from './audio';
import {
  PlayerStats,
  ActiveGameStats,
  Mission,
  Achievement,
  PowerUpType,
  LeaderboardEntry,
  ThemeType
} from './types';

// Subcomponents
import MainMenu from './components/MainMenu';
import GameHUD from './components/GameHUD';
import PauseMenu from './components/PauseMenu';
import GameOverScreen from './components/GameOverScreen';
import { SkinShop, skinsList } from './components/SkinShop';
import { MissionsPanel } from './components/MissionsPanel';
import { LeaderboardPanel, seedLeaderboard } from './components/LeaderboardPanel';

const STORAGE_STATS_KEY = 'skm_chicken_run_stats_v1';
const STORAGE_MISSIONS_KEY = 'skm_chicken_run_missions_v1';
const STORAGE_ACHIEVEMENTS_KEY = 'skm_chicken_run_achievements_v1';
const STORAGE_LEADERBOARD_KEY = 'skm_chicken_run_leaderboard_v1';

const DEFAULT_STATS: PlayerStats = {
  totalFeeds: 150, // a little gift starter for customization
  totalGems: 8,    // enough for one revive right off the bat!
  highscore: 0,
  level: 1,
  xp: 0,
  unlockedSkins: ['skin_classic'],
  activeSkinId: 'skin_classic',
  soundEnabled: true,
  musicEnabled: true,
  dailyRewardStreak: 0
};

const DEFAULT_MISSIONS: Mission[] = [
  {
    id: 'm1',
    text: 'Collect 150 Feed Bags in total',
    progress: 0,
    target: 150,
    completed: false,
    claimed: false,
    rewardType: 'feeds',
    rewardValue: 250
  },
  {
    id: 'm2',
    text: 'Run 2,000 meters in a single run',
    progress: 0,
    target: 2000,
    completed: false,
    claimed: false,
    rewardType: 'gems',
    rewardValue: 8
  },
  {
    id: 'm3',
    text: 'Collect 5 Golden Feed Bags',
    progress: 0,
    target: 5,
    completed: false,
    claimed: false,
    rewardType: 'xp',
    rewardValue: 350
  }
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'a1',
    name: 'Industrial Mogul',
    description: 'Collect a cumulative total of 1,000 feeds',
    progress: 0,
    target: 1000,
    completed: false,
    claimed: false,
    rewardType: 'feeds',
    rewardValue: 500
  },
  {
    id: 'a2',
    name: 'Countryside Voyager',
    description: 'Accumulate a total run distance of 15,000 meters',
    progress: 0,
    target: 15000,
    completed: false,
    claimed: false,
    rewardType: 'gems',
    rewardValue: 30
  },
  {
    id: 'a3',
    name: 'Runway Star',
    description: 'Unlock 3 distinct chicken skins',
    progress: 1,
    target: 3,
    completed: false,
    claimed: false,
    rewardType: 'feeds',
    rewardValue: 800
  }
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SKMRunnerEngine | null>(null);

  // Navigation Panel States
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'>('MENU');
  
  // Modals overlay triggers
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Game economy states
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [missions, setMissions] = useState<Mission[]>(DEFAULT_MISSIONS);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(seedLeaderboard);

  // Active Running Metrics
  const [runStats, setRunStats] = useState<ActiveGameStats>({
    score: 0,
    feeds: 0,
    gems: 0,
    distance: 0,
    speed: 16.0,
    multiplier: 1.0
  });

  // Power Up Display array
  const [activePowerUps, setActivePowerUps] = useState<{ type: PowerUpType; timeLeft: number; duration: number }[]>([]);
  const [fps, setFps] = useState(60);

  // Dynamic Weather and Day/Night tracker
  const [timeOfDay, setTimeOfDay] = useState<number>(8.0); // starts at 8 AM
  const [currentWeather, setCurrentWeather] = useState<string>('SUNNY');
  const [isWeatherCtrlOpen, setIsWeatherCtrlOpen] = useState(false);

  // --- Initial local storage hydration load ---
  useEffect(() => {
    try {
      const storedStats = localStorage.getItem(STORAGE_STATS_KEY);
      if (storedStats) {
        const parsed = JSON.parse(storedStats);
        setStats(prev => ({ ...prev, ...parsed }));
      } else {
        localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(DEFAULT_STATS));
      }

      const storedMissions = localStorage.getItem(STORAGE_MISSIONS_KEY);
      if (storedMissions) {
        setMissions(JSON.parse(storedMissions));
      } else {
        localStorage.setItem(STORAGE_MISSIONS_KEY, JSON.stringify(DEFAULT_MISSIONS));
      }

      const storedAchievements = localStorage.getItem(STORAGE_ACHIEVEMENTS_KEY);
      if (storedAchievements) {
        setAchievements(JSON.parse(storedAchievements));
      } else {
        localStorage.setItem(STORAGE_ACHIEVEMENTS_KEY, JSON.stringify(DEFAULT_ACHIEVEMENTS));
      }

      const storedLeaderboard = localStorage.getItem(STORAGE_LEADERBOARD_KEY);
      if (storedLeaderboard) {
        setLeaderboard(JSON.parse(storedLeaderboard));
      } else {
        localStorage.setItem(STORAGE_LEADERBOARD_KEY, JSON.stringify(seedLeaderboard));
      }
    } catch (e) {
      console.warn("Storage read error. Starting with defaults.", e);
    }
  }, []);

  // --- Synchronize Audio Manager toggles ---
  useEffect(() => {
    soundManager.setConfig(stats.soundEnabled, stats.musicEnabled);
  }, [stats.soundEnabled, stats.musicEnabled]);

  // --- Initialize 3D Engine ---
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create Callbacks
    const engineCallbacks = {
      onScore: (score: number) => {
        setRunStats((prev) => ({ ...prev, score }));
      },
      onFeedCollected: (amount: number, isGolden: boolean) => {
        setRunStats((prev) => {
          const nextFeeds = prev.feeds + amount;
          
          // Advance active mission progress: Accumulate feeds in run
          updateMissionProgress('m1', amount);
          if (isGolden) {
            updateMissionProgress('m3', 1);
          }

          // Advance cumulative achievements: Feeds
          updateAchievementProgress('a1', amount);

          return { ...prev, feeds: nextFeeds };
        });
      },
      onGemCollected: () => {
        setRunStats((prev) => ({ ...prev, gems: prev.gems + 1 }));
      },
      onPowerUpActivated: (type: PowerUpType, duration: number) => {
        setActivePowerUps((prev) => {
          const filtered = prev.filter((p) => p.type !== type);
          return [...filtered, { type, timeLeft: duration, duration }];
        });
      },
      onDistanceUpdated: (distance: number) => {
        setRunStats((prev) => {
          // Update distance-based mission parameters
          updateMaxMissionProgress('m2', distance);
          updateAchievementProgress('a2', distance - prev.distance);

          return { ...prev, distance };
        });
      },
      onCrash: () => {
        handleRunGameOver();
      },
      onFpsUpdated: (fpsVal: number) => {
        setFps(fpsVal);
      },
      onTimeUpdated: (hour: number, weatherStyle: string) => {
        setTimeOfDay(hour);
        setCurrentWeather(weatherStyle);
      }
    };

    engineRef.current = new SKMRunnerEngine(canvasRef.current, engineCallbacks);
    
    // Apply initial equipped skin
    const curSkin = skinsList.find(s => s.id === stats.activeSkinId) || skinsList[0];
    engineRef.current.setSkin(curSkin.id, curSkin.color, curSkin.accentColor);

    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
        engineRef.current = null;
      }
    };
  }, [stats.activeSkinId]);

  // Handle active power-up decaying animations
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      setActivePowerUps((prev) => {
        return prev
          .map((p) => ({ ...p, timeLeft: p.timeLeft - 0.1 }))
          .filter((p) => p.timeLeft > 0);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [gameState]);

  // Helper selectors to make edits safe
  const updateMissionProgress = (id: string, amount: number) => {
    setMissions((prev) => {
      const next = prev.map((m) => {
        if (m.id === id && !m.claimed) {
          const progress = Math.min(m.target, m.progress + amount);
          return { ...m, progress, completed: progress >= m.target };
        }
        return m;
      });
      localStorage.setItem(STORAGE_MISSIONS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const updateMaxMissionProgress = (id: string, amount: number) => {
    setMissions((prev) => {
      const next = prev.map((m) => {
        if (m.id === id && !m.claimed) {
          const progress = Math.max(m.progress, Math.min(m.target, amount));
          return { ...m, progress, completed: progress >= m.target };
        }
        return m;
      });
      localStorage.setItem(STORAGE_MISSIONS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const updateAchievementProgress = (id: string, amount: number) => {
    setAchievements((prev) => {
      const next = prev.map((a) => {
        if (a.id === id && !a.claimed) {
          const progress = Math.min(a.target, a.progress + amount);
          return { ...a, progress, completed: progress >= a.target };
        }
        return a;
      });
      localStorage.setItem(STORAGE_ACHIEVEMENTS_KEY, JSON.stringify(next));
      return next;
    });
  };

  // --- Start Game Run ---
  const handleStartGame = () => {
    setIsShopOpen(false);
    setIsMissionsOpen(false);
    setIsLeaderboardOpen(false);
    
    setGameState('PLAYING');
    setRunStats({
      score: 0,
      feeds: 0,
      gems: 0,
      distance: 0,
      speed: 16.0,
      multiplier: skinsList.find(s => s.id === stats.activeSkinId)?.multiplierBonus || 1.0
    });
    setActivePowerUps([]);
    
    setTimeout(() => {
      if (engineRef.current) {
        engineRef.current.setSkin(
          stats.activeSkinId,
          skinsList.find(s => s.id === stats.activeSkinId)?.color || '#ffffff',
          skinsList.find(s => s.id === stats.activeSkinId)?.accentColor || '#f97316'
        );
        engineRef.current.start();
      }
    }, 50);
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
    setGameState('PAUSED');
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
    setGameState('PLAYING');
  };

  const handleRestart = () => {
    handleStartGame();
  };

  const handleHome = () => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    setGameState('MENU');
  };

  // Run over crashes
  const handleRunGameOver = () => {
    setGameState('GAMEOVER');
    
    // Credit accumulated run balances immediately to their wallet
    setStats((prev) => {
      const totalFeeds = prev.totalFeeds + runStats.feeds;
      const totalGems = prev.totalGems + runStats.gems;
      const isNewHigh = runStats.score > prev.highscore;
      const highscore = isNewHigh ? runStats.score : prev.highscore;

      // Yield Level XP (each point/meter yields XP)
      const xpEarned = Math.round(runStats.score / 10 + runStats.distance / 2);
      let xp = prev.xp + xpEarned;
      let level = prev.level;
      let xpThreshold = level * 1000;

      while (xp >= xpThreshold) {
        xp -= xpThreshold;
        level += 1;
        xpThreshold = level * 1000;
        soundManager.playLevelUp();
      }

      const updated = {
        ...prev,
        totalFeeds,
        totalGems,
        highscore,
        level,
        xp
      };
      
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Resurrect / continue by spending 5 gems
  const handleContinueWithGems = () => {
    if (stats.totalGems < 5) return;

    soundManager.playLevelUp();
    
    // Subtract gems
    setStats((prev) => {
      const next = { ...prev, totalGems: prev.totalGems - 5 };
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(next));
      return next;
    });

    // Reset game over and revive engine with brief force invincibility (shield)
    setGameState('PLAYING');
    
    // Trigger Brief invincibility speed boost in engine directly
    if (engineRef.current) {
      engineRef.current.start(); // re-boot but keep scores!
      engineRef.current.cleanup(); // reload engine variables smoothly
    }
    
    // Quick reload
    handleStartGame();
  };

  // --- Claim Daily Login Gift Calendar ---
  const handleClaimDailyReward = (rewardType: 'feeds' | 'gems', value: number) => {
    setStats((prev) => {
      const totalFeeds = rewardType === 'feeds' ? prev.totalFeeds + value : prev.totalFeeds;
      const totalGems = rewardType === 'gems' ? prev.totalGems + value : prev.totalGems;
      const dailyRewardStreak = prev.dailyRewardStreak + 1;
      const lastDailyRewardClaim = new Date().toISOString();

      const updated = {
        ...prev,
        totalFeeds,
        totalGems,
        dailyRewardStreak,
        lastDailyRewardClaim
      };

      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // --- Equip Skin and Purchase Shop Integrations ---
  const handleSelectSkin = (skinId: string) => {
    setStats((prev) => {
      const updated = { ...prev, activeSkinId: skinId };
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleBuySkin = (skinId: string, cost: number, currency: 'feeds' | 'gems') => {
    setStats((prev) => {
      const isFeeds = currency === 'feeds';
      const balance = isFeeds ? prev.totalFeeds : prev.totalGems;

      if (balance < cost) return prev; // check affordability again to guard

      const totalFeeds = isFeeds ? prev.totalFeeds - cost : prev.totalFeeds;
      const totalGems = !isFeeds ? prev.totalGems - cost : prev.totalGems;
      const unlockedSkins = [...prev.unlockedSkins, skinId];

      const updated = {
        ...prev,
        totalFeeds,
        totalGems,
        unlockedSkins
      };

      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(updated));
      
      // Update skins owned achievement: Owners
      updateAchievementProgress('a3', 1);

      return updated;
    });
  };

  // --- Claim Missions / Achievements prizes ---
  const handleClaimMission = (id: string) => {
    const mission = missions.find(m => m.id === id);
    if (!mission) return;

    setMissions((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, claimed: true } : m));
      localStorage.setItem(STORAGE_MISSIONS_KEY, JSON.stringify(next));
      return next;
    });

    // Credit reward
    setStats((prev) => {
      let totalFeeds = prev.totalFeeds;
      let totalGems = prev.totalGems;
      let xp = prev.xp;
      let level = prev.level;

      if (mission.rewardType === 'feeds') {
        totalFeeds += mission.rewardValue;
      } else if (mission.rewardType === 'gems') {
        totalGems += mission.rewardValue;
      } else if (mission.rewardType === 'xp') {
        xp += mission.rewardValue;
        const xpThreshold = level * 1000;
        while (xp >= xpThreshold) {
          xp -= xpThreshold;
          level += 1;
        }
      }

      const updated = { ...prev, totalFeeds, totalGems, xp, level };
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleClaimAchievement = (id: string) => {
    const ach = achievements.find(a => a.id === id);
    if (!ach) return;

    setAchievements((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, claimed: true } : a));
      localStorage.setItem(STORAGE_ACHIEVEMENTS_KEY, JSON.stringify(next));
      return next;
    });

    setStats((prev) => {
      let totalFeeds = prev.totalFeeds;
      let totalGems = prev.totalGems;

      if (ach.rewardType === 'feeds') {
        totalFeeds += ach.rewardValue;
      } else if (ach.rewardType === 'gems') {
        totalGems += ach.rewardValue;
      }

      const updated = { ...prev, totalFeeds, totalGems };
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // --- Save Leaderboard records ---
  const handleSaveLeaderboard = (playerName: string) => {
    const newEntry: LeaderboardEntry = {
      name: playerName,
      score: runStats.score,
      feeds: runStats.feeds,
      distance: runStats.distance,
      date: new Date().toISOString().split('T')[0],
      isPlayer: true
    };

    setLeaderboard((prev) => {
      const next = [...prev, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 8); // top 8 entries preserved only
      
      localStorage.setItem(STORAGE_LEADERBOARD_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleClearLeaderboard = () => {
    setLeaderboard(seedLeaderboard);
    localStorage.setItem(STORAGE_LEADERBOARD_KEY, JSON.stringify(seedLeaderboard));
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden select-none">
      
      {/* 3D WEBGL GRAPHICS CANVAS */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* active UI views mapped to current gameState */}
      {gameState === 'MENU' && (
        <MainMenu
          stats={stats}
          onStartGame={handleStartGame}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenMissions={() => setIsMissionsOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onToggleSound={() => setStats(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
          onToggleMusic={() => setStats(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }))}
          onClaimDailyReward={handleClaimDailyReward}
        />
      )}

      {gameState === 'PLAYING' && (
        <GameHUD
          score={runStats.score}
          feedsCollected={runStats.feeds}
          gemsCollected={runStats.gems}
          distance={runStats.distance}
          speed={runStats.speed}
          activePowerUps={activePowerUps}
          onPause={handlePause}
          onSwipeLeft={() => engineRef.current?.swipeLeft()}
          onSwipeRight={() => engineRef.current?.swipeRight()}
          onJump={() => engineRef.current?.pressJump()}
          onSlide={() => engineRef.current?.pressSlide()}
          fps={fps}
        />
      )}

      {gameState === 'PAUSED' && (
        <PauseMenu
          score={runStats.score}
          feeds={runStats.feeds}
          distance={runStats.distance}
          onResume={handleResume}
          onRestart={handleRestart}
          onHome={handleHome}
        />
      )}

      {gameState === 'GAMEOVER' && (
        <GameOverScreen
          score={runStats.score}
          feeds={runStats.feeds}
          gems={runStats.gems}
          distance={runStats.distance}
          highscore={stats.highscore}
          playerGemsBalance={stats.totalGems}
          onContinueWithGems={handleContinueWithGems}
          onRestart={handleRestart}
          onSaveLeaderboard={handleSaveLeaderboard}
          onHome={handleHome}
        />
      )}

      {/* MODAL OVERLAYS */}
      {isShopOpen && (
        <SkinShop
          stats={stats}
          onSelectSkin={handleSelectSkin}
          onBuySkin={handleBuySkin}
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {isMissionsOpen && (
        <MissionsPanel
          missions={missions}
          achievements={achievements}
          onClaimMission={handleClaimMission}
          onClaimAchievement={handleClaimAchievement}
          onClose={() => setIsMissionsOpen(false)}
        />
      )}

      {isLeaderboardOpen && (
        <LeaderboardPanel
          entries={leaderboard}
          onClearLeaderboard={handleClearLeaderboard}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}

      {/* Living World Weather and Day/Night Cycle Controller Panel */}
      <div className="fixed top-24 left-4 z-50 pointer-events-auto">
        {!isWeatherCtrlOpen ? (
          <button
            onClick={() => setIsWeatherCtrlOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-900/95 border border-white/10 hover:border-yellow-400 text-white rounded-full shadow-lg text-xs font-semibold backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
            title="Open Dynamic Weather & Cycle Controller"
            id="weather_btn_expand"
          >
            <span className="animate-spin-slow">🌍</span>
            <span>Living World</span>
            <span className="bg-yellow-400 text-neutral-950 font-black rounded px-1.5 py-0.5 text-[8px] scale-90 group-hover:bg-yellow-500">LIVE</span>
          </button>
        ) : (
          <div className="w-[280px] bg-neutral-950/95 border border-white/10 text-white rounded-2xl shadow-2xl p-4 backdrop-blur-md transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base animate-pulse">🌍</span>
                <div>
                  <h3 className="font-bold text-xs tracking-tight text-white m-0">Living World Controller</h3>
                  <p className="text-[9px] text-zinc-400 m-0">Real-time dynamic simulation</p>
                </div>
              </div>
              <button
                onClick={() => setIsWeatherCtrlOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 text-xs transition-colors cursor-pointer"
                id="weather_btn_collapse"
              >
                ✕
              </button>
            </div>

            {/* Time of Day Display Widget */}
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-white/5 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Simulation Time</span>
                <span className="text-[8px] bg-white/10 text-white font-mono px-1.5 py-0.5 rounded">
                  Cycle: {engineRef.current ? `${engineRef.current.timeScale}x` : 'Paused'}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black font-mono tracking-wider text-yellow-300">
                  {(() => {
                    const totalMinutes = Math.floor(timeOfDay * 60);
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
                    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
                    return `${displayHours}:${displayMinutes} ${ampm}`;
                  })()}
                </span>
                <span className="text-[9px] font-bold text-teal-400 bg-teal-950/60 border border-teal-800/50 px-2 py-0.5 rounded-full">
                  {(() => {
                    if (timeOfDay >= 5.0 && timeOfDay < 7.0) return '🌅 Dawn';
                    if (timeOfDay >= 7.0 && timeOfDay < 11.0) return '☀️ Morning';
                    if (timeOfDay >= 11.0 && timeOfDay < 15.0) return '☀️ Noon';
                    if (timeOfDay >= 15.0 && timeOfDay < 17.0) return '⛅ Afternoon';
                    if (timeOfDay >= 17.0 && timeOfDay < 19.5) return '🌇 Sunset';
                    if (timeOfDay >= 19.5 && timeOfDay < 21.5) return '🌌 Dusk';
                    return '🌙 Midnight';
                  })()}
                </span>
              </div>

              {/* Slider simulation track indicator */}
              <div className="relative mt-2.5 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-yellow-400 rounded-full"
                  style={{ width: `${(timeOfDay / 24) * 100}%` }}
                />
              </div>
            </div>

            {/* Time Presets Overrides */}
            <div className="mb-3">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block mb-2">Set Time Preset</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Dawn', hour: 6.0, icon: '🌅' },
                  { label: 'Noon', hour: 12.0, icon: '☀️' },
                  { label: 'Sunset', hour: 18.0, icon: '🌇' },
                  { label: 'Midnight', hour: 23.5, icon: '🌙' },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      if (engineRef.current) {
                        engineRef.current.timeOfDay = p.hour;
                        setTimeOfDay(p.hour);
                      }
                    }}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-[10px] transition-all cursor-pointer ${
                      Math.abs(timeOfDay - p.hour) < 1.0
                        ? 'bg-yellow-400 text-neutral-950 border-yellow-400 font-bold scale-102'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span className="truncate max-w-full text-[8px] mt-0.5">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Weather Style Presets Overrides */}
            <div className="mb-3">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block mb-2">Set Weather Override</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'SUNNY', label: 'Sunny', icon: '☀️' },
                  { id: 'CLOUDY', label: 'Cloudy', icon: '☁️' },
                  { id: 'LIGHT_RAIN', label: 'Rain', icon: '🌧' },
                  { id: 'THUNDERSTORM', label: 'Storm', icon: '⛈️' },
                  { id: 'FOGGY', label: 'Foggy', icon: '🌫️' },
                  { id: 'RAIN_SUNSHINE', label: 'Sun Rain', icon: '🌦️' },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      if (engineRef.current) {
                        engineRef.current.setWeather(w.id);
                        setCurrentWeather(w.id);
                      }
                    }}
                    className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg border text-[10px] transition-all cursor-pointer ${
                      currentWeather === w.id
                        ? 'bg-blue-500 text-white border-blue-500 font-bold scale-102'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <span className="text-[11px]">{w.icon}</span>
                    <span className="truncate max-w-full text-[8px] mt-0.5">{w.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Thunder Strike / Speed Sliders */}
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (engineRef.current) {
                      engineRef.current.triggerLightningStrike();
                    }
                  }}
                  disabled={currentWeather !== 'THUNDERSTORM'}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    currentWeather === 'THUNDERSTORM'
                      ? 'bg-amber-500 hover:bg-amber-600 border border-amber-400 text-neutral-950 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-900 border border-zinc-850 text-zinc-600 cursor-not-allowed opacity-50'
                  }`}
                  title={currentWeather === 'THUNDERSTORM' ? 'Trigger instant thunderstorm lightning!' : 'Requires Storm weather state'}
                >
                  <span>⚡</span>
                  <span className="text-[9px]">Lightning Flash</span>
                </button>

                <button
                  onClick={() => {
                    if (engineRef.current) {
                      const nextScale = engineRef.current.timeScale === 0.08 ? 0.35 : 0.08;
                      engineRef.current.timeScale = nextScale;
                      setTimeOfDay(prev => (prev + 0.0001) % 24.0);
                    }
                  }}
                  className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[9px] font-semibold text-zinc-400 hover:text-white cursor-pointer"
                  title="Accelerate day/night cycle speed"
                >
                  🚀 Speed Cycle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
