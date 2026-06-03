import React from 'react';
import { LeaderboardEntry } from '../types';
import { ListOrdered, Calendar, EyeOff } from 'lucide-react';
import { soundManager } from '../audio';

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  onClearLeaderboard?: () => void;
  onClose: () => void;
}

export const seedLeaderboard: LeaderboardEntry[] = [
  { name: '🌾 Theevanam_King_45', score: 1245600, feeds: 8750, distance: 18400, date: '2026-05-28' },
  { name: '🐔 CluckyRun_99', score: 955300, feeds: 6420, distance: 12050, date: '2026-05-30' },
  { name: '🌽 SKM_Silo_Operator', score: 720000, feeds: 4900, distance: 9800, date: '2026-05-31' },
  { name: '🥚 FreeRange_Pecker', score: 412500, feeds: 2855, distance: 6400, date: '2026-06-01' },
  { name: '🚀 Spock_The_Rooster', score: 188400, feeds: 1120, distance: 3210, date: '2026-06-01' }
];

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  entries,
  onClearLeaderboard,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-sans">
              <ListOrdered className="text-yellow-500 w-6 h-6" />
              SKM Champion Hall
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Check out the top poultry run records across our farm ecosystems!
            </p>
          </div>
          <button
            id="btn_close_leaderboard"
            onClick={() => { soundManager.playClick(); onClose(); }}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-sm transition"
          >
            ✕ Close
          </button>
        </div>

        {/* List of ranks */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {entries.length === 0 ? (
            <div className="text-slate-500 text-xs font-mono p-12 text-center flex flex-col items-center gap-2">
              <EyeOff className="w-8 h-8 text-slate-600" />
              No entries logged yet! Run your first match to set a benchmark record.
            </div>
          ) : (
            entries.map((entry, index) => {
              const rank = index + 1;
              let rankStyle = 'bg-slate-950/40 text-slate-400 border-slate-800';
              let badgeStyle = 'bg-slate-800 text-slate-400';
              
              if (rank === 1) {
                rankStyle = 'bg-yellow-500/10 border-yellow-500 text-yellow-100 shadow-sm shadow-yellow-500/5';
                badgeStyle = 'bg-yellow-500 text-slate-950 font-extrabold';
              } else if (rank === 2) {
                rankStyle = 'bg-slate-300/10 border-slate-400 text-slate-100';
                badgeStyle = 'bg-slate-400 text-slate-950 font-bold';
              } else if (rank === 3) {
                rankStyle = 'bg-amber-700/10 border-amber-600 text-amber-200';
                badgeStyle = 'bg-amber-600 text-slate-100 font-bold';
              }

              if (entry.isPlayer) {
                rankStyle += ' ring-2 ring-emerald-500/50 border-emerald-500';
              }

              return (
                <div
                  key={index}
                  className={`border rounded-xl p-3.5 flex items-center justify-between transition-all ${rankStyle}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono flex-shrink-0 ${badgeStyle}`}>
                      #{rank}
                    </div>

                    <div className="truncate">
                      <span className="font-bold text-white text-sm truncate flex items-center gap-1.5 font-sans">
                        {entry.name}
                        {entry.isPlayer && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold px-1 py-0.5 rounded font-mono">
                            YOU
                          </span>
                        )}
                      </span>
                      {/* Sub-stats summary */}
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        🌾 {entry.feeds} feeds | 🏃 {entry.distance}m
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0 ml-4">
                    <span className="font-extrabold text-white text-sm md:text-base font-mono">
                      {entry.score.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono block mt-0.5 flex items-center justify-end gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {entry.date}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Clear scores button */}
        {onClearLeaderboard && entries.length > seedLeaderboard.length && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
            <button
              id="btn_clear_leaderboard"
              onClick={() => { if (confirm('Clear custom runs history? This resets default seed rankings.')) { soundManager.playHit(); onClearLeaderboard(); }}}
              className="text-red-400 hover:text-red-300 text-xs font-mono py-1 px-3 bg-red-950/20 hover:bg-red-950/50 rounded border border-red-900/30 transition cursor-pointer"
            >
              Reset Scores List
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default LeaderboardPanel;
