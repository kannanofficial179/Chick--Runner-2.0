import React from 'react';
import { PowerUpType, PowerUpState, ThemeType } from '../types';
import { Pause, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Shield, RefreshCw } from 'lucide-react';
import { soundManager } from '../audio';

interface GameHUDProps {
  score: number;
  feedsCollected: number;
  gemsCollected: number;
  distance: number;
  speed: number;
  activePowerUps: { type: PowerUpType; timeLeft: number; duration: number }[];
  onPause: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  fps?: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  feedsCollected,
  gemsCollected,
  distance,
  speed,
  activePowerUps,
  onPause,
  onSwipeLeft,
  onSwipeRight,
  onJump,
  onSlide,
  fps = 60
}) => {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 pointer-events-none select-none">
      
      {/* Top HUD: Stats Bar */}
      <div className="flex justify-between items-start w-full pointer-events-auto">
        {/* Left indicators */}
        <div className="flex flex-col gap-1.5">
          {/* Main Score & Multiplier */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 backdrop-blur shadow-2xl flex flex-col">
            <span className="text-[9px] text-slate-400 font-mono tracking-widest leading-none">SCORE</span>
            <span className="text-xl md:text-2xl font-black text-white font-mono leading-tight">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Collected Counter Feeds & Gems */}
          <div className="flex gap-2">
            <div className="bg-slate-900/95 border border-slate-800 rounded-lg py-1 px-2.5 flex items-center gap-1.5 backdrop-blur font-mono text-xs">
              🌾 <span className="font-bold text-yellow-500">{feedsCollected}</span>
            </div>
            <div className="bg-slate-900/95 border border-slate-800 rounded-lg py-1 px-2.5 flex items-center gap-1.5 backdrop-blur font-mono text-xs">
              💎 <span className="font-bold text-emerald-400">{gemsCollected}</span>
            </div>
          </div>
        </div>

        {/* Right side trackers */}
        <div className="flex flex-col items-end gap-1.5">
          {/* Running distance */}
          <div className="bg-slate-900/95 border border-slate-800 px-3 py-1.5 rounded-xl text-right backdrop-blur font-mono shadow-md">
            <span className="text-[9px] text-slate-400 tracking-widest block leading-none">DISTANCE</span>
            <span className="text-sm font-bold text-zinc-100">{distance.toLocaleString()} m</span>
          </div>

          <div className="flex gap-1.5 items-center">
            {/* FPS & Speed debug nodes */}
            <span className="text-[8px] font-mono text-slate-400 bg-slate-900/600 p-1 rounded">
              {fps} FPS | {Math.round(speed * 3.6)} km/h
            </span>

            {/* PAUSE TRIGGER BUTTON */}
            <button
              id="btn_pause_game"
              onClick={() => { soundManager.playClick(); onPause(); }}
              className="bg-slate-900/95 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl transition cursor-pointer"
            >
              <Pause className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Center Screen: Active Power-up Sliders */}
      <div className="w-full max-w-xs mx-auto flex flex-col gap-2 pointer-events-auto">
        {activePowerUps.map((p) => {
          const pct = Math.round((p.timeLeft / p.duration) * 100);
          let powerColor = 'bg-yellow-400';
          let powerEmoji = '🎒';
          let label = 'POWER-UP';

          if (p.type === PowerUpType.MAGNET) {
            powerColor = 'bg-red-500';
            powerEmoji = '🧲';
            label = 'FEED MAGNET';
          } else if (p.type === PowerUpType.SHIELD) {
            powerColor = 'bg-emerald-500';
            powerEmoji = '🛡️';
            label = 'SHIELD ACTIVE';
          } else if (p.type === PowerUpType.SPEED_BOOST) {
            powerColor = 'bg-amber-400 animate-pulse';
            powerEmoji = '⚡';
            label = 'SPEED TURBO';
          } else if (p.type === PowerUpType.DOUBLE_SCORE) {
            powerColor = 'bg-purple-500';
            powerEmoji = '⭐';
            label = 'DOUBLE SCORE';
          } else if (p.type === PowerUpType.FLYING_MODE) {
            powerColor = 'bg-cyan-400 animate-bounce';
            powerEmoji = '🪶';
            label = 'FLYING CHICKEN';
          }

          return (
            <div
              key={p.type}
              className="bg-slate-950/90 border border-slate-850 p-2 rounded-xl backdrop-blur-sm shadow flex items-center gap-2.5"
            >
              <div className="text-base flex-shrink-0">{powerEmoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[9px] font-mono mb-1 leading-none">
                  <span className="text-white font-bold">{label}</span>
                  <span className="text-slate-400 font-bold">{p.timeLeft.toFixed(1)}s</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${powerColor} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Segment: Touch / Mouse Visual Controls for easy client playing */}
      <div className="w-full flex justify-between items-end pointer-events-auto mt-4 px-1">
        {/* Left Lane control buttons */}
        <div className="flex gap-2">
          <button
            id="btn_swipe_left"
            onClick={onSwipeLeft}
            className="w-12 h-12 bg-slate-900/90 hover:bg-slate-800 active:scale-90 rounded-xl border border-slate-800 flex items-center justify-center text-slate-300 shadow-xl transition cursor-pointer"
            title="Move Lane Left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            id="btn_swipe_right"
            onClick={onSwipeRight}
            className="w-12 h-12 bg-slate-900/90 hover:bg-slate-800 active:scale-90 rounded-xl border border-slate-800 flex items-center justify-center text-slate-300 shadow-xl transition cursor-pointer"
            title="Move Lane Right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right Action buttons (Jump and Slide) */}
        <div className="flex gap-2">
          <button
            id="btn_hud_jump"
            onClick={onJump}
            className="w-14 h-14 bg-gradient-to-tr from-yellow-500 to-amber-500 text-slate-950 hover:from-yellow-400 hover:to-amber-400 active:scale-90 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-yellow-500/20 transition cursor-pointer"
            title="Jump Up"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[8px] font-black font-mono">JUMP</span>
          </button>
          <button
            id="btn_hud_slide"
            onClick={onSlide}
            className="w-14 h-14 bg-slate-900/95 hover:bg-slate-800 text-cyan-400 active:scale-90 rounded-2xl border border-slate-800 flex flex-col items-center justify-center shadow-xl transition cursor-pointer"
            title="Slide Down"
          >
            <ArrowDown className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[8px] font-black font-mono">SLIDE</span>
          </button>
        </div>
      </div>

    </div>
  );
};
export default GameHUD;
