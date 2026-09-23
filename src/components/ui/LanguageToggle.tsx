import React from 'react';
import { sounds } from '../../audio/soundManager';
import { useI18n } from '../../i18n/I18nProvider';

interface LanguageToggleProps {
  compact?: boolean;
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ compact = false, className = '' }) => {
  const { locale, toggleLocale, t } = useI18n();

  return (
    <button
      type="button"
      onClick={() => { sounds.playClick(); toggleLocale(); }}
      className={`inline-flex items-center justify-center gap-1 rounded-xl border border-slate-700/80 bg-[#0c1017]/90 px-2.5 py-2 font-mono text-[11px] font-semibold text-slate-200 shadow-lg backdrop-blur-xl transition hover:border-cyan-400/60 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${className}`}
      aria-label={t('switchTo')}
      title={t('switchTo')}
    >
      <span aria-hidden="true">🌐</span>
      {!compact && <span>{t('language')}</span>}
      <span className="text-cyan-300">{locale === 'pt' ? 'PT-BR' : 'EN'}</span>
    </button>
  );
};
