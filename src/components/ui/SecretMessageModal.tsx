import React from 'react';
import { CinematicDialog } from './narrative/CinematicDialog';
import { useI18n } from '../../i18n/I18nProvider';
import { MaterialIcon } from './MaterialIcon';
import { sounds } from '../../audio/soundManager';

export type SecretType = 'asteroid' | 'void-island' | 'duck';

interface SecretMessageModalProps {
  type: SecretType | null;
  onClose: () => void;
}

export const SecretMessageModal: React.FC<SecretMessageModalProps> = ({ type, onClose }) => {
  const { locale } = useI18n();
  if (!type) return null;

  const getSecretContent = () => {
    switch (type) {
      case 'asteroid':
        return {
          badge: 'REGISTRO ESTELAR #42',
          title: 'Fragmento Secreto do Desenvolvedor',
          icon: 'stars',
          iconColor: 'text-amber-400',
          borderColor: 'border-amber-500/50',
          glowColor: 'shadow-amber-500/20',
          xp: 200,
          quote:
            '"O código é a forma mais pura de magia que os humanos inventaram: com algumas palavras cuidadosamente escolhidas, podemos conjurar universos inteiros do nada."',
          body:
            'Parabéns por explorar o cinturão de asteroides! Este portfólio foi construído com paixão profunda por WebGL, física de jogos e engenharia de software de ponta. Se você chegou até aqui, você tem a curiosidade e o olhar atento aos detalhes que definem os grandes profissionais.',
        };
      case 'void-island':
        return {
          badge: 'ANOMALIA DETECTADA',
          title: 'O Santuário do Vazio Cósmico',
          icon: 'travel_explore',
          iconColor: 'text-purple-400',
          borderColor: 'border-purple-500/50',
          glowColor: 'shadow-purple-500/20',
          xp: 300,
          quote:
            '"Nas fronteiras desconhecidas do espaço, apenas os pilotos mais ousados encontram as maiores respostas."',
          body:
            'Você descobriu a 6ª Ilha Oculta! Este santuário fica além de todas as órbitas conhecidas do sistema solar. Em homenagem à sua perseverança de navegador, você agora detém o título supremo de Explorador do Vazio.',
        };
      case 'duck':
        return {
          badge: 'SABEDORIA TECH',
          title: 'O Pato de Borracha Espacial',
          icon: 'pest_control',
          iconColor: 'text-yellow-400',
          borderColor: 'border-yellow-500/50',
          glowColor: 'shadow-yellow-500/20',
          xp: 100,
          quote:
            '"Se você não consegue explicar o problema em voz alta para um patinho de borracha, você ainda não entendeu o problema."',
          body:
            'O Rubber Duck Debugging é uma das técnicas mais veneradas da história da computação. O patinho espacial agora é o seu copiloto honorário nesta galáxia!',
        };
    }
  };

  const content = getSecretContent();

  return (
    <CinematicDialog titleId="secret-title" onClose={onClose} layer={50}
      className={`relative w-full max-w-lg bg-[#0b0f19] border ${content.borderColor} rounded-3xl p-6 sm:p-8 shadow-2xl ${content.glowColor} max-h-[90dvh] overflow-y-auto`}>
          {/* Luz de Fundo */}
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-400/5 to-transparent pointer-events-none" />

          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-500/30 flex items-center gap-1">
                <MaterialIcon name={content.icon} size={13} className={content.iconColor} />
                {content.badge}
              </span>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              aria-label={locale === 'pt' ? 'Fechar mensagem' : 'Close message'}
              className="modal-close w-11 h-11 shrink-0 flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
            >
              <MaterialIcon name="close" size={20} />
            </button>
          </div>

          <h3 id="secret-title" className="text-xl sm:text-2xl font-sans font-bold text-slate-100 mb-3 tracking-tight">
            {content.title}
          </h3>

          {/* Citação em Destaque */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl mb-4 italic text-xs sm:text-sm text-slate-300 font-serif leading-relaxed">
            {content.quote}
          </div>

          {/* Texto Principal */}
          <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed mb-6">
            {content.body}
          </p>

          {/* Rodapé com Recompensa e Ação */}
          <div className="flex flex-wrap gap-3 items-center justify-between pt-4 border-t border-slate-800/80">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 px-3 py-1 rounded-xl border border-emerald-500/40 flex items-center gap-1 shadow-sm">
              <MaterialIcon name="bolt" fill size={14} className="text-emerald-400" />
              +{content.xp} XP COLETADOS
            </span>

            <button
              onClick={() => {
                sounds.playCoin();
                onClose();
              }}
              className="min-h-11 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-mono text-xs font-semibold shadow-lg shadow-sky-500/25 transition cursor-pointer"
            >
              Continuar Exploração
            </button>
          </div>
    </CinematicDialog>
  );
};
