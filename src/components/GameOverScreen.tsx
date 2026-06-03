import React from 'react';
import { Sparkles, Skull, RefreshCw, LogIn, HeartPulse } from 'lucide-react';
import { soundManager } from '../audio';

interface GameOverScreenProps {
  score: number;
  feeds: number;
  gems: number;
  distance: number;
  highscore: number;
  playerGemsBalance: number;
  onContinueWithGems: () => void;
  onRestart: () => void;
  onSaveLeaderboard: (playerName: string) => void;
  onHome: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  feeds,
  gems,
  distance,
  highscore,
  playerGemsBalance,
  onContinueWithGems,
  onRestart,
  onSaveLeaderboard,
  onHome
}) => {
  const isNewHighscore = score > highscore;
  const canContinue = playerGemsBalance >= 5;

  const [playerName, setPlayerName] = React.useState('Runner');
  const [isSaved, setIsSaved] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSaved) return;
    
    soundManager.playLevelUp();
    onSaveLeaderboard(playerName.trim());
    setIsSaved(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-40 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative flex flex-col text-center">
        {/* Skull Mascot Header */}
        <div className="mx-auto w-14 h-14 bg-red-950/30 border border-red-900/40 rounded-2xl flex items-center justify-center text-red-500 mb-2 shadow-xl">
          <Skull className="w-6 h-6 animate-pulse" />
        </div>

        <h2 className="text-2xl font-black text-white font-sans uppercase tracking-wide">
          Run Interrupted
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Your clucky chicken ran into a hard hazard!
        </p>

        {/* Shiny High Score Label */}
        {isNewHighscore ? (
          <div className="my-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center animate-bounce flex items-center justify-center gap-1.5 shadow">
            <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-450" />
            <span className="text-xs font-black text-yellow-400 font-mono tracking-widest uppercase">
              NEW PERSONAL BEST COUGHT!
            </span>
          </div>
        ) : (
          <div className="my-2 text-[10px] text-slate-500 font-mono uppercase">
            BEST HIGH SCORE: {Math.max(highscore, score).toLocaleString()} PTS
          </div>
        )}

        {/* Match statistics matrix */}
        <div className="grid grid-cols-2 gap-2 my-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left">
          <div className="border-b border-slate-850 pb-2">
            <span className="text-[9px] text-slate-400 font-mono block leading-none uppercase">FINAL SCORE</span>
            <span className="text-lg font-black text-white font-mono mt-1 block">
              {score.toLocaleString()}
            </span>
          </div>
          <div className="border-b border-l border-slate-850 pl-3 pb-2">
            <span className="text-[9px] text-slate-400 font-mono block leading-none uppercase">DISTANCE</span>
            <span className="text-lg font-black text-cyan-400 font-mono mt-1 block">
              {distance} m
            </span>
          </div>
          <div className="pt-2">
            <span className="text-[9px] text-slate-400 font-mono block leading-none uppercase">FEEDS BAGGED</span>
            <span className="text-lg font-black text-yellow-500 font-mono mt-1 block">
              🌾 {feeds}
            </span>
          </div>
          <div className="border-l border-slate-850 pl-3 pt-2">
            <span className="text-[9px] text-slate-400 font-mono block leading-none uppercase">GEMS EARNED</span>
            <span className="text-lg font-black text-emerald-400 font-mono mt-1 block">
              💎 {gems}
            </span>
          </div>
        </div>

        {/* Save score to hall of fame */}
        {!isSaved ? (
          <form onSubmit={handleSave} className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 mb-4 text-left">
            <label className="text-[10px] text-slate-400 font-mono uppercase font-bold block mb-1.5">
              Publish Score To Leaderboard
            </label>
            <div className="flex gap-2">
              <input
                id="inp_player_name"
                type="text"
                maxLength={14}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-white font-mono text-xs px-3 py-2 rounded-lg flex-1 focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                placeholder="Enter nickname"
              />
              <button
                id="btn_submit_score"
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold px-3 py-2 rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center text-xs font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-2 rounded-xl mb-4">
            ✓ Run logged on SKM leaderboard!
          </div>
        )}

        {/* Action button tree */}
        <div className="space-y-2">
          {/* Gem continuation option */}
          <button
            id="btn_revive_gems"
            disabled={!canContinue}
            onClick={onContinueWithGems}
            className={`w-full font-black py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm uppercase cursor-pointer border ${
              canContinue
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 border-emerald-500/20 shadow-emerald-500/10'
                : 'bg-slate-800 text-slate-500 border-slate-705 cursor-not-allowed'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            Revive with 5 Gems (💎 {playerGemsBalance})
          </button>

          {/* Quick retry */}
          <button
            id="btn_retry_match"
            onClick={() => { soundManager.playClick(); onRestart(); }}
            className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 hover:from-yellow-300 hover:to-amber-400 font-extrabold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm uppercase cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Quick Try Again
          </button>

          {/* return home */}
          <button
            id="btn_exit_lobby"
            onClick={() => { soundManager.playClick(); onHome(); }}
            className="w-full text-slate-400 hover:text-slate-200 text-xs font-mono py-2 bg-slate-950 hover:bg-slate-950/60 rounded-lg border border-slate-850/40 transition cursor-pointer"
          >
            Exit to Lodge
          </button>
        </div>
      </div>
    </div>
  );
};
export default GameOverScreen;
