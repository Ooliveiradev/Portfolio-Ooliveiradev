import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialIcon } from './MaterialIcon';
import { CosmicWhisper } from '../../types';
import { sounds } from '../../audio/soundManager';

interface WhispersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  whispers: CosmicWhisper[];
  vehiclePos: [number, number, number];
  onSelectWhisper: (whisper: CosmicWhisper) => void;
  onOpenDropModal: () => void;
  presenceCount: number;
}

export const WhispersListModal: React.FC<WhispersListModalProps> = ({
  isOpen,
  onClose,
  whispers,
  vehiclePos,
  onSelectWhisper,
  onOpenDropModal,
  presenceCount,
}) => {
  if (!isOpen) return null;

  const calculateDistance = (pos: [number, number, number]) => {
    const dx = vehiclePos[0] - pos[0];
    const dy = vehiclePos[1] - pos[1];
    const dz = vehiclePos[2] - pos[2];
    return Math.hypot(dx, dy, dz).toFixed(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl select-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-2xl bg-[#0b101b]/95 border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-cyan-500/20 max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <MaterialIcon name="podcasts" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-sans font-bold text-slate-100 flex items-center gap-2">
                  <span>Rede Social Cósmica</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono">
                    {whispers.length} sinais
                  </span>
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{presenceCount} exploradores sintonizados no setor</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
            >
              <MaterialIcon name="close" size={20} />
            </button>
          </div>

          {/* Lista de Transmissões */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 custom-scrollbar mb-4">
            {whispers.map((w) => {
              const dist = calculateDistance(w.position);
              return (
                <div
                  key={w.id}
                  onClick={() => {
                    sounds.playClick();
                    onSelectWhisper(w);
                  }}
                  className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-cyan-300 shrink-0">
                      {w.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition">
                          {w.author}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          ({w.origin || 'Desconhecido'})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300/90 truncate mt-0.5 max-w-sm sm:max-w-md">
                        {w.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                      <MaterialIcon name="near_me" size={12} className="text-cyan-400" />
                      {dist}u
                    </span>
                    <span className="text-xs text-slate-400 group-hover:text-cyan-300 font-mono flex items-center gap-1">
                      <MaterialIcon name="favorite" size={13} className="text-rose-400" />
                      {w.likes}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rodapé com Ação de Transmitir */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              Aproxime-se dos orbes luminosos ou plante o seu próprio sinal.
            </span>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
                onOpenDropModal();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-semibold shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center gap-2"
            >
              <MaterialIcon name="send" size={14} />
              <span>Transmitir Meu Sinal</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
