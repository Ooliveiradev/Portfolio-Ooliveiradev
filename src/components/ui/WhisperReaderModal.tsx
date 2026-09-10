import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialIcon } from './MaterialIcon';
import { CosmicWhisper } from '../../types';
import { sounds } from '../../audio/soundManager';

interface WhisperReaderModalProps {
  whisper: CosmicWhisper | null;
  onClose: () => void;
  onLike: (id: string) => void;
}

export const WhisperReaderModal: React.FC<WhisperReaderModalProps> = ({
  whisper,
  onClose,
  onLike,
}) => {
  const [hasLiked, setHasLiked] = useState(false);

  if (!whisper) return null;

  const handleLike = () => {
    if (!hasLiked) {
      setHasLiked(true);
      sounds.playCoin();
      onLike(whisper.id);
    }
  };

  const formattedDate = new Date(whisper.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl select-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-lg bg-[#0b101b]/95 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/20 overflow-hidden"
        >
          {/* Luz de Fundo Eérea */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/60 px-3 py-1 rounded-md border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                TRANSMISSÃO INTERCEPTADA
              </span>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
            >
              <MaterialIcon name="close" size={20} />
            </button>
          </div>

          {/* Dados do Autor e Coordenadas */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-mono font-bold text-base shadow-lg shadow-cyan-500/30 border border-cyan-400/40">
              {whisper.author.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-sans font-bold text-slate-100 tracking-tight flex items-center gap-2">
                {whisper.author}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="text-cyan-300/90">{whisper.origin || 'Origem Desconhecida'}</span>
                <span>•</span>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Coordenadas Cósmicas */}
          <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-400">
            <MaterialIcon name="explore" size={13} className="text-cyan-400" />
            <span>COORDENADAS ESTELARES:</span>
            <span className="text-cyan-300 font-semibold">
              [{whisper.position[0].toFixed(1)}, {whisper.position[1].toFixed(1)}, {whisper.position[2].toFixed(1)}]
            </span>
          </div>

          {/* Mensagem Cósmica em Destaque */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-cyan-500/20 rounded-2xl mb-6 shadow-inner relative">
            <span className="absolute top-2 left-3 text-3xl font-serif text-cyan-500/20 select-none">
              “
            </span>
            <p className="text-sm sm:text-base font-sans text-slate-200 leading-relaxed pl-4 italic">
              {whisper.message}
            </p>
          </div>

          {/* Rodapé: Curtida (Ressonância) e Fechar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <button
              onClick={handleLike}
              disabled={hasLiked}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer shadow-md ${
                hasLiked
                  ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                  : 'bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-slate-200 hover:text-rose-300'
              }`}
            >
              <MaterialIcon
                name="favorite"
                fill={hasLiked}
                size={16}
                className={hasLiked ? 'text-rose-400 animate-pulse' : 'text-slate-400'}
              />
              <span>{whisper.likes + (hasLiked ? 1 : 0)} Ressonâncias</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-semibold shadow-lg shadow-cyan-500/25 transition cursor-pointer"
            >
              Fechar Transmissão
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
