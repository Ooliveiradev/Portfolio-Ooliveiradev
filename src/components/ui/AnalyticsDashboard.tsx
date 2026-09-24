import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { PortfolioAnalyticsData } from '../../types';
import {
  fetchRealtimeMetrics,
  subscribeToAnalytics,
  type AnalyticsTimeframe,
} from '../../services/analyticsService';
import { useI18n } from '../../i18n/I18nProvider';
import { MaterialIcon } from './MaterialIcon';

const EMPTY_ANALYTICS: PortfolioAnalyticsData = {
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
  const maxProject = Math.max(1, ...analytics.topProjects.map((item) => item.visits));
  const numberLocale = locale === 'pt' ? 'pt-BR' : 'en-US';

  return (
    <motion.section
      className="relative space-y-5 overflow-hidden rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.025] p-1 sm:p-2"
      aria-label={t('analyticsTitle')}
      initial={lowPower ? false : { opacity: 0, y: 54, scale: 0.92, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={lowPower ? { duration: 0 } : { type: 'spring', stiffness: 115, damping: 18, mass: 0.75, delay: 0.12 }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-24 w-px -translate-x-1/2 bg-gradient-to-b from-cyan-200 via-cyan-400/70 to-transparent"
        initial={lowPower ? false : { scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: lowPower ? 0 : 0.42, delay: 0.04 }}
        style={{ transformOrigin: 'top' }}
      />

      <div className="rounded-xl border border-cyan-500/15 bg-[#08101b]/88 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
            </span>
            {locale === 'pt' ? 'Uplink holográfico recebido' : 'Holographic uplink received'}
          </div>
          <h3 className="text-xl font-bold text-slate-100">{t('analyticsTitle')}</h3>
          <p className="mt-1 text-xs text-slate-400">{t('analyticsPrivacy')}</p>
        </div>
        <div className="flex rounded-xl border border-cyan-500/30 bg-slate-950/70 p-1">
          {(['7d', '30d'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setTimeframe(period)}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono transition ${
                timeframe === period ? 'bg-cyan-400 text-slate-950' : 'text-cyan-200 hover:bg-cyan-500/10'
              }`}
            >
              {period === '7d' ? t('analytics7d') : t('analytics30d')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          [t('analyticsVisits'), analytics.totalVisits.toLocaleString(numberLocale), 'query_stats'],
          [t('analyticsUnique'), analytics.uniqueVisitors.toLocaleString(numberLocale), 'groups'],
          [t('analyticsAvgDuration'), formatDuration(analytics.avgDurationSeconds), 'schedule'],
        ].map(([label, value, icon]) => (
          <div key={label} className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] p-4">
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span>{label}</span>
              <MaterialIcon name={icon} size={16} className="text-cyan-400" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-cyan-100">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800/80 bg-[#0a101a] p-4">
          <h4 className="mb-4 text-xs font-mono font-bold uppercase tracking-wider text-fuchsia-300">{t('analyticsTopProjects')}</h4>
          <div className="space-y-3">
            {analytics.topProjects.slice(0, 5).map((project) => (
              <div key={project.projectId}>
                <div className="mb-1 flex justify-between text-[11px] font-mono text-slate-300">
                  <span>{project.projectName}</span>
                  <span>{project.visits} · {project.percentage}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-orange-400"
                    style={{ width: `${Math.max(6, (project.visits / maxProject) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-[#0a101a] p-4">
          <h4 className="mb-4 text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">{t('analyticsTimeline')}</h4>
          <div className="flex h-36 items-end gap-[3px] overflow-hidden rounded-lg border border-cyan-500/10 bg-slate-950/60 px-2 pb-2 pt-4">
            {analytics.dailyVisits.map((day) => (
              <div
                key={day.date}
                className="min-w-[3px] flex-1 rounded-t bg-gradient-to-t from-cyan-700 via-cyan-400 to-fuchsia-300 opacity-90"
                style={{ height: `${Math.max(8, (day.visits / maxDaily) * 100)}%` }}
                title={`${day.date}: ${day.visits}`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[9px] font-mono text-slate-500">
            <span>{analytics.dailyVisits[0]?.date ?? '—'}</span>
            <span>{analytics.dailyVisits.at(-1)?.date ?? '—'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-[10px] font-mono text-emerald-300">
        <span className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />STREAM · 4s</span>
        <span>{analytics.spatialHeatmap.length} spatial samples</span>
        <span>{analytics.lastUpdated ? new Date(analytics.lastUpdated).toLocaleTimeString(numberLocale) : '—'}</span>
      </div>
      </div>
    </motion.section>
  );
};
