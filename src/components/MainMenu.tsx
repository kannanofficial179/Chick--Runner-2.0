import React from 'react';
import { PlayerStats } from '../types';
import { soundManager } from '../audio';
import { Play, ShoppingCart, Trophy, ListOrdered, Volume2, VolumeX, Music, Calendar, Award } from 'lucide-react';

interface MainMenuProps {
  stats: PlayerStats;
  onStartGame: () => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onOpenLeaderboard: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onClaimDailyReward: (rewardType: 'feeds' | 'gems', value: number) => void;
}

export const DailyRewardsList = [
  { day: 1, type: 'feeds' as const, value: 150, desc: 'Starter Seed' },
  { day: 2, type: 'feeds' as const, value: 300, desc: 'Feed Pack' },
  { day: 3, type: 'gems' as const, value: 5, desc: 'Mineral Crystals' },
  { day: 4, type: 'feeds' as const, value: 600, desc: 'Silo Surplus' },
  { day: 5, type: 'gems' as const, value: 15, desc: 'Golden Crystal' },
  { day: 6, type: 'feeds' as const, value: 1200, desc: 'Factory Special' },
  { day: 7, type: 'gems' as const, value: 40, desc: 'Jackpot Gems' }
];

export const MainMenu: React.FC<MainMenuProps> = ({
  stats,
  onStartGame,
  onOpenShop,
  onOpenMissions,
  onOpenLeaderboard,
  onToggleSound,
  onToggleMusic,
  onClaimDailyReward
}) => {
  // Determine if daily reward can be claimed
  const canClaimDaily = React.useMemo(() => {
    if (!stats.lastDailyRewardClaim) return true;
    const lastClaim = new Date(stats.lastDailyRewardClaim);
    const today = new Date();
    
    // Check if on a different calendar day
    return (
      lastClaim.getFullYear() !== today.getFullYear() ||
      lastClaim.getMonth() !== today.getMonth() ||
      lastClaim.getDate() !== today.getDate()
    );
  }, [stats.lastDailyRewardClaim]);

  const activeDailyDayIndex = stats.dailyRewardStreak % 7;
  const currentReward = DailyRewardsList[activeDailyDayIndex];

  const handleClaim = () => {
    if (!canClaimDaily) return;
    soundManager.playLevelUp();
    onClaimDailyReward(currentReward.type, currentReward.value);
  };

  const nextLevelXp = stats.level * 1000;
  const xpPct = Math.min(100, Math.round((stats.xp / nextLevelXp) * 100));

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80 pointer-events-none">
      
      {/* Top Profile Badge & Sound Toggles */}
      <div className="flex justify-between items-start w-full pointer-events-auto">
        {/* User Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3 backdrop-blur shadow-2xl">
          <div className="w-10 h-10 rounded-full bg-yellow-500 border-2 border-yellow-400 flex items-center justify-center font-bold text-slate-950 text-sm font-sans flex-shrink-0">
            Lvl {stats.level}
          </div>
          <div className="min-w-0">
            <h4 className="text-white text-xs font-bold leading-none font-sans">SKM Poultry Runner</h4>
            {/* XP Bar */}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="bg-yellow-400 h-full transition-all" style={{ width: `${xpPct}%` }} />
              </div>
              <span className="text-[9px] text-slate-400 font-mono">{stats.xp}/{nextLevelXp} XP</span>
            </div>
          </div>
        </div>

        {/* Audio Toggles & General highscore feedback */}
        <div className="flex flex-col items-end gap-2">
          {/* High Score Badge */}
          <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-lg text-right backdrop-blur shadow-md">
            <span className="text-[10px] text-slate-400 font-mono block">PERSONAL BEST</span>
            <span className="text-sm font-black text-amber-400 font-mono">{stats.highscore.toLocaleString()} pts</span>
          </div>

          {/* Quick Sound Buttons */}
          <div className="flex gap-1">
            <button
              id="btn_toggle_sound"
              onClick={() => { soundManager.playClick(); onToggleSound(); }}
              className={`p-2 rounded-lg transition border backdrop-blur ${
                stats.soundEnabled
                  ? 'bg-slate-900/90 border-slate-800 text-yellow-400 hover:bg-slate-800'
                  : 'bg-red-950/20 border-red-900/40 text-slate-500'
              }`}
              title="Toggle Sound Effects"
            >
              {stats.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              id="btn_toggle_music"
              onClick={() => { soundManager.playClick(); onToggleMusic(); }}
              className={`p-2 rounded-lg transition border backdrop-blur ${
                stats.musicEnabled
                  ? 'bg-slate-900/90 border-slate-800 text-cyan-400 hover:bg-slate-800'
                  : 'bg-red-950/20 border-red-900/40 text-slate-500'
              }`}
              title="Toggle Music Chiptune"
            >
              <Music className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Center Logo branding & Big Play Trigger */}
      <div className="flex-1 flex flex-col justify-center items-center pointer-events-auto select-none py-12">
        {/* Cinematic Title Box */}
        <div className="text-center bg-slate-950/40 p-4 rounded-3xl backdrop-blur-xs border border-transparent max-w-lg mb-8 flex flex-col items-center">
          <span className="bg-amber-500 text-slate-950 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full shadow-md leading-none font-mono">
            3D Endless runner
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 mt-2 filter drop-shadow font-sans text-center uppercase tracking-tight">
            SKM Chicken Run
          </h1>
          <h2 className="text-xl md:text-2xl font-bold font-mono text-cyan-400 tracking-widest -mt-1 uppercase">
            Infinity
          </h2>
          <div className="h-0.5 w-32 bg-slate-800 mt-3 rounded-full" />
        </div>

        {/* Big Action Core Buttons */}
        <div className="flex flex-col gap-3 min-w-64 max-w-xs w-full">
          {/* PLAY BUTTON */}
          <button
            id="btn_play_now"
            onClick={onStartGame}
            className="group relative bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-xl shadow-yellow-500/20 transition-all active:scale-95 flex items-center justify-center gap-2.5 text-lg uppercase cursor-pointer"
          >
            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Play className="w-5 h-5 fill-slate-950" />
            Start Run
          </button>

          {/* Sub menu grid */}
          <div className="grid grid-cols-3 gap-2">
            <button
              id="btn_open_shop"
              onClick={onOpenShop}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold p-3 rounded-xl transition flex flex-col items-center justify-center gap-1.5 text-xs cursor-pointer shadow"
            >
              <ShoppingCart className="w-4 h-4 text-yellow-400" />
              Skins
            </button>

            <button
              id="btn_open_missions"
              onClick={onOpenMissions}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold p-3 rounded-xl transition flex flex-col items-center justify-center gap-1.5 text-xs cursor-pointer shadow"
            >
              <Trophy className="w-4 h-4 text-emerald-400" />
              Goals
            </button>

            <button
              id="btn_open_leaderboard"
              onClick={onOpenLeaderboard}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold p-3 rounded-xl transition flex flex-col items-center justify-center gap-1.5 text-xs cursor-pointer shadow"
            >
              <ListOrdered className="w-4 h-4 text-cyan-400" />
              Ranks
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Segment: Daily Reward Claim Drawer */}
      <div className="w-full flex justify-center pointer-events-auto">
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 p-4 rounded-2xl backdrop-blur shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono block leading-none">DAILY BONUS</span>
              <h4 className="text-white text-xs font-bold font-sans mt-1">
                Day {stats.dailyRewardStreak + 1}: {currentReward.desc}
              </h4>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                Reward: {currentReward.type === 'feeds' ? '🌾' : '💎'} {currentReward.value}
              </p>
            </div>
          </div>

          <button
            id="btn_claim_daily"
            disabled={!canClaimDaily}
            onClick={handleClaim}
            className={`font-black py-2 px-5 rounded-xl text-xs uppercase font-mono tracking-wider transition ${
              canClaimDaily
                ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-md cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/30'
            }`}
          >
            {canClaimDaily ? 'Claim Gift' : 'Claimed Today'}
          </button>
        </div>
      </div>

    </div>
  );
};
export default MainMenu;
