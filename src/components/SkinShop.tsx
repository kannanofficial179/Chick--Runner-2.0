import React from 'react';
import { Skin, PlayerStats } from '../types';
import { ShoppingBag, Zap, CheckCircle2, Lock } from 'lucide-react';
import { soundManager } from '../audio';

interface SkinShopProps {
  stats: PlayerStats;
  onSelectSkin: (id: string) => void;
  onBuySkin: (id: string, cost: number, currency: 'feeds' | 'gems') => void;
  onClose: () => void;
}

export const skinsList: Skin[] = [
  {
    id: 'skin_classic',
    name: 'Classic White',
    description: 'The energetic, clucky original farm chicken.',
    cost: 0,
    currency: 'feeds',
    unlocked: true,
    color: '#ffffff',
    accentColor: '#f97316',
    multiplierBonus: 1.0
  },
  {
    id: 'skin_skm_employee',
    name: 'SKM Employee',
    description: 'Dressed in the official SKM poultry farm uniform!',
    cost: 1000,
    currency: 'feeds',
    unlocked: false,
    color: '#34d399',
    accentColor: '#f59e0b',
    multiplierBonus: 1.5
  },
  {
    id: 'skin_super',
    name: 'Super Chicken',
    description: 'Slightly radioactive neon body with wing wind thrust!',
    cost: 2500,
    currency: 'feeds',
    unlocked: false,
    color: '#22d3ee',
    accentColor: '#ec4899',
    multiplierBonus: 1.8
  },
  {
    id: 'skin_golden',
    name: 'Golden Chicken',
    description: 'Dazzling, state-of-the-art pure metallic golden feeds collector.',
    cost: 5000,
    currency: 'feeds',
    unlocked: false,
    color: '#eab308',
    accentColor: '#dc2626',
    multiplierBonus: 2.5
  },
  {
    id: 'skin_robo',
    name: 'Robo Chicken',
    description: 'Cybernetic titanium plating with high-density optics.',
    cost: 50,
    currency: 'gems',
    unlocked: false,
    color: '#94a3b8',
    accentColor: '#0ea5e9',
    multiplierBonus: 2.0
  },
  {
    id: 'skin_rainbow',
    name: 'Rainbow Cosmic',
    description: 'Chameleon feathers that dynamically cycle the color spectrum.',
    cost: 120,
    currency: 'gems',
    unlocked: false,
    color: '#a855f7',
    accentColor: '#f43f5e',
    multiplierBonus: 3.0
  }
];

export const SkinShop: React.FC<SkinShopProps> = ({
  stats,
  onSelectSkin,
  onBuySkin,
  onClose
}) => {
  const handleSelect = (skinId: string) => {
    soundManager.playClick();
    onSelectSkin(skinId);
  };

  const handleBuy = (skin: Skin) => {
    soundManager.playClick();
    onBuySkin(skin.id, skin.cost, skin.currency);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-sans">
              <ShoppingBag className="text-yellow-400 w-6 h-6" />
              Poultry Skin Shop
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Select or unlock special chicken skins to gain score multipliers!
            </p>
          </div>
          <button
            id="btn_close_shop"
            onClick={() => { soundManager.playClick(); onClose(); }}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-sm transition"
          >
            ✕ Close
          </button>
        </div>

        {/* Currency balances indicators */}
        <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-950 p-3 rounded-xl border border-slate-800 mx-1">
          <div className="flex items-center justify-between px-4">
            <span className="text-slate-400 text-xs font-mono">YOUR FEEDS:</span>
            <span className="text-yellow-500 font-bold font-mono text-lg flex items-center gap-1.5">
              🌾 {stats.totalFeeds}
            </span>
          </div>
          <div className="flex items-center justify-between border-l border-slate-800 px-4">
            <span className="text-slate-400 text-xs font-mono">YOUR GEMS:</span>
            <span className="text-emerald-400 font-bold font-mono text-lg flex items-center gap-1.5">
              💎 {stats.totalGems}
            </span>
          </div>
        </div>

        {/* Skin Cards Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
          {skinsList.map((skin) => {
            const isUnlocked = skin.id === 'skin_classic' || stats.unlockedSkins.includes(skin.id);
            const isActive = stats.activeSkinId === skin.id;
            
            // Check if player has enough money to buy
            const balance = skin.currency === 'feeds' ? stats.totalFeeds : stats.totalGems;
            const canAfford = balance >= skin.cost;

            return (
              <div
                key={skin.id}
                className={`p-4 rounded-xl border flex gap-4 items-center transition ${
                  isActive
                    ? 'bg-slate-800/80 border-yellow-500 shadow-lg shadow-yellow-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Visual Avatar Placeholder representing the chicken color */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center relative shadow-inner overflow-hidden flex-shrink-0"
                  style={{
                    background: `radial-gradient(circle, ${skin.color} 30%, ${skin.accentColor} 100%)`,
                    border: `2px solid ${skin.color}`
                  }}
                >
                  {/* Comb */}
                  <div className="absolute top-1 w-4 h-2 bg-red-600 rounded-full" />
                  {/* Beak */}
                  <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-amber-500 rotate-45 rounded-sm" />
                  {/* Eye */}
                  <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-black rounded-full" />
                  <div className="absolute top-1/3 right-1/4 w-0.5 h-0.5 bg-white rounded-full translate-x-[-0.5px] translate-y-[-0.5px]" />
                  
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Info and Purchase controls */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-between">
                    <h3 className="text-white font-bold truncate text-sm md:text-base font-sans">{skin.name}</h3>
                    <div className="text-xs font-bold text-yellow-400 font-mono flex items-center gap-0.5 flex-shrink-0 bg-slate-800 px-1.5 py-0.5 rounded">
                      <Zap className="w-3 h-3 fill-yellow-400" />
                      {skin.multiplierBonus}x multiplier
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs mt-1 font-mono leading-relaxed line-clamp-2">
                    {skin.description}
                  </p>

                  <div className="mt-3 flex justify-end gap-2">
                    {isUnlocked ? (
                      isActive ? (
                        <span className="text-emerald-400 text-xs font-bold font-mono py-1.5 px-3 bg-emerald-950/40 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Active Skin
                        </span>
                      ) : (
                        <button
                          id={`btn_select_${skin.id}`}
                          onClick={() => handleSelect(skin.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition cursor-pointer"
                        >
                          Equip
                        </button>
                      )
                    ) : (
                      <button
                        id={`btn_buy_${skin.id}`}
                        onClick={() => handleBuy(skin)}
                        disabled={!canAfford}
                        className={`font-bold py-1.5 px-4 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer ${
                          canAfford
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Buy: {skin.currency === 'feeds' ? '🌾' : '💎'} {skin.cost}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
