import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { PortfolioAnalyticsData } from '../../types';
import {
  fetchRealtimeMetrics,
  subscribeToAnalytics,
  type AnalyticsTimeframe,
} from '../../services/analyticsService';
import { useI18n } from '../../i18n/I18nProvider';
import { MaterialIcon } from './MaterialIcon';

const EMPTY_ANALYTICS: PortfolioAnalyticsData = {
  status: 'unavailable',
  totalVisits: 0,
  uniqueVisitors: 0,
  avgDurationSeconds: 0,
  topProjects: [],
  dailyVisits: [],
  spatialHeatmap: [],
  lastUpdated: '',
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.max(0, Math.round(seconds % 60));
  return `${minutes}m ${remaining.toString().padStart(2, '0')}s`;
};

export const AnalyticsDashboard: React.FC<{ lowPower?: boolean }> = ({ lowPower = false }) => {
  const { locale, t } = useI18n();
  const reducedMotion = useReducedMotion();
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('7d');
  const [analytics, setAnalytics] = useState<PortfolioAnalyticsData>(EMPTY_ANALYTICS);

  useEffect(() => {
    let active = true;
    void fetchRealtimeMetrics(timeframe).then((data) => {
      if (active) setAnalytics(data);
    });
    const unsubscribe = subscribeToAnalytics((data) => {
      if (active) setAnalytics(data);
    }, 4_000, timeframe);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [timeframe]);

  const maxDaily = Math.max(1, ...analytics.dailyVisits.map((item) => item.visits));
  const available = analytics.status === 'available';
  const numberLocale = locale === 'pt' ? 'pt-BR' : 'en-US';
  const formatDate = (date?: string) => date
    ? new Date(`${date}T12:00:00`).toLocaleDateString(numberLocale, { day: '2-digit', month: 'short' })
    : '—';

  return (
    <motion.section
      className="space-y-7"
      aria-label={t('analyticsTitle')}
      initial={lowPower || reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: lowPower || reducedMotion ? 0 : 0.3 }}
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-md">
          <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300/80">
            {locale === 'pt' ? '06 / Observatório' : '06 / Observatory'}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            {locale === 'pt' ? 'Cada visita, uma nova órbita.' : 'Every visit, a new orbit.'}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {locale === 'pt' ? 'As visitas e o tempo de exploração deste portfólio, ao longo dos dias.' : 'Visits and time spent exploring this portfolio, day by day.'}
          </p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1" role="group" aria-label={locale === 'pt' ? 'Período de análise' : 'Analytics period'}>
          {(['7d', '30d'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setTimeframe(period)}
              aria-pressed={timeframe === period}
              className={`min-h-10 rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                timeframe === period ? 'border-sky-500/30 bg-sky-500/10 text-sky-300' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {period === '7d' ? t('analytics7d') : t('analytics30d')}
            </button>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-1 divide-y divide-slate-800/80 border-y border-slate-800/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          [t('analyticsVisits'), available ? analytics.totalVisits.toLocaleString(numberLocale) : '—', 'query_stats'],
          [t('analyticsUnique'), available ? analytics.uniqueVisitors.toLocaleString(numberLocale) : '—', 'groups'],
          [t('analyticsAvgDuration'), available ? formatDuration(analytics.avgDurationSeconds) : '—', 'schedule'],
        ].map(([label, value, icon]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-5 sm:block sm:px-5 sm:first:pl-0 sm:last:pr-0">
            <dt className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <MaterialIcon name={icon} size={15} className="text-slate-500" />
              <span>{label}</span>
            </dt>
            <dd className="text-2xl sm:mt-3 sm:text-3xl font-medium tracking-tight tabular-nums text-slate-100">{value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <div className="min-w-0">
          <h4 className="mb-5 text-xs font-mono font-medium uppercase tracking-wider text-slate-300">{t('analyticsTimeline')}</h4>
          <div className="relative flex h-40 items-end gap-1 border-b border-slate-700/80 bg-[repeating-linear-gradient(to_top,transparent,transparent_calc(25%_-_1px),#1e293b80_calc(25%_-_1px),#1e293b80_25%)]" role="img" aria-label={available ? `${t('analyticsTimeline')}: ${analytics.dailyVisits.map(day => `${formatDate(day.date)}: ${day.visits}`).join('; ')}` : (locale === 'pt' ? 'Fluxo de visitas: dados indisponíveis' : 'Visit flow: data unavailable')}>
            {analytics.dailyVisits.every(day => day.visits === 0) && <p className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">{available ? (locale === 'pt' ? 'Nenhuma visita neste período.' : 'No visits in this period.') : (locale === 'pt' ? 'Dados indisponíveis' : 'Data unavailable')}</p>}
            {analytics.dailyVisits.map((day) => (
              <div
                key={day.date}
                className="min-w-0 flex-1 rounded-t-sm bg-cyan-300/50 transition-colors hover:bg-cyan-300/80"
                style={{ height: `${(day.visits / maxDaily) * 90}%` }}
                title={`${formatDate(day.date)}: ${day.visits}`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[9px] font-mono text-slate-500">
            <span>{formatDate(analytics.dailyVisits[0]?.date)}</span>
            <span>{formatDate(analytics.dailyVisits.at(-1)?.date)}</span>
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4 text-[10px] leading-relaxed text-slate-500">
        <span className="flex items-center gap-2"><MaterialIcon name="shield" size={14} />{t('analyticsPrivacy')}</span>
        <span className="flex items-center gap-2 font-mono"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70" />{available ? `${locale === 'pt' ? 'Atualizado' : 'Updated'} ${new Date(analytics.lastUpdated).toLocaleTimeString(numberLocale)}` : (locale === 'pt' ? 'Aguardando dados reais' : 'Waiting for real data')}</span>
      </footer>
    </motion.section>
  );
};
