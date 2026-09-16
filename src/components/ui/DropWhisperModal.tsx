import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialIcon } from './MaterialIcon';
import { CosmicWhisper, WhisperColor } from '../../types';
import { validateAndSanitizeWhisper } from '../../utils/contentModeration';
import { sounds } from '../../audio/soundManager';
import { getVehiclePosition } from '../../utils/vehicleTelemetry';

interface DropWhisperModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPosition: [number, number, number];
  onBroadcastWhisper: (whisper: CosmicWhisper) => void;
}

const COLOR_OPTIONS: { id: WhisperColor; label: string; bg: string; border: string }[] = [
  { id: 'cyan', label: 'Ciano', bg: 'bg-cyan-500', border: 'border-cyan-400' },
  { id: 'purple', label: 'Púrpura', bg: 'bg-purple-500', border: 'border-purple-400' },
  { id: 'amber', label: 'Solar', bg: 'bg-amber-500', border: 'border-amber-400' },
  { id: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-500', border: 'border-emerald-400' },
];

export const DropWhisperModal: React.FC<DropWhisperModalProps> = ({
  isOpen,
  onClose,
  currentPosition,
  onBroadcastWhisper,
}) => {
  const [author, setAuthor] = useState('');
  const [origin, setOrigin] = useState('');
  const [message, setMessage] = useState('');
  const [selectedColor, setSelectedColor] = useState<WhisperColor>('cyan');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = validateAndSanitizeWhisper(author, message, origin);
    if (!validation.isValid) {
      setErrorMsg(validation.errorMessage || 'Dados inválidos');
      return;
    }

    const position = getVehiclePosition();
    const newWhisper: CosmicWhisper = {
      id: `whisper-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      author: validation.sanitizedAuthor,
      origin: validation.sanitizedOrigin,
      message: validation.sanitizedMessage,
      position: [
        Number(position[0].toFixed(2)),
        Number((position[1] + 0.5).toFixed(2)),
        Number(position[2].toFixed(2)),
      ],
      createdAt: new Date().toISOString(),
      likes: 1,
      color: selectedColor,
    };

    sounds.playCoin();
    onBroadcastWhisper(newWhisper);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl select-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-lg bg-[#0b101b]/95 border border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/20 overflow-hidden"
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/70 px-3 py-1 rounded-md border border-cyan-500/40 flex items-center gap-1.5 shadow-sm">
                <MaterialIcon name="sensors" size={14} className="text-cyan-400 animate-pulse" />
                TRANSMISSOR ESTELAR
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

          <h3 className="text-xl font-sans font-bold text-slate-100 mb-1 tracking-tight">
            Plantar Sinal Cósmico
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Deixe uma mensagem ancorada no espaço que ficará visível para todos os navegadores que explorarem este quadrante.
          </p>

          {/* Coordenadas de Ancoragem */}
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300">
            <MaterialIcon name="my_location" size={14} className="text-cyan-400" />
            <span>Ponto de Ancoragem:</span>
            <span className="text-cyan-300 font-semibold">
              [{currentPosition[0].toFixed(1)}, {currentPosition[1].toFixed(1)}, {currentPosition[2].toFixed(1)}]
            </span>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
                <MaterialIcon name="error" size={15} className="text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-300 mb-1">
                  Seu Nome ou Codinome
                </label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ex: Dra. Helena ou Recrutador"
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-300 mb-1">
                  Planeta / Cidade de Origem
                </label>
                <input
                  type="text"
                  maxLength={32}
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Ex: São Paulo, Brasil ou Marte"
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono font-medium text-slate-300">
                  Mensagem Cósmica
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  {140 - message.length} caracteres
                </span>
              </div>
              <textarea
                required
                rows={3}
                maxLength={140}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: Adorei o portfólio 3D! O shader de água cósmica ficou incrível..."
                className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 resize-none"
              />
            </div>

            {/* Seletor de Tonalidade do Orbe */}
            <div>
              <label className="block text-[11px] font-mono font-medium text-slate-300 mb-1.5">
                Cor do Orbe Bioluminescente
              </label>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedColor(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-mono transition cursor-pointer ${
                      selectedColor === opt.id
                        ? `${opt.border} bg-slate-800 text-white shadow-md`
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${opt.bg}`} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rodapé e Ação */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <MaterialIcon name="bolt" fill size={14} className="text-emerald-400" />
                +150 XP de Exploração
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-semibold shadow-lg shadow-cyan-500/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <MaterialIcon name="send" size={14} />
                  <span>Transmitir Sinal</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
