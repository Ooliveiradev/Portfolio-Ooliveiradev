// Development-only entry: Vite's production entry remains index.html.
import './narrativeMotionOverride';
import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence } from 'motion/react';
import { I18nProvider, useI18n } from '../src/i18n/I18nProvider';
import { getPortfolioContent } from '../src/i18n/portfolio';
import { IslandModal } from '../src/components/ui/IslandModal';
import { ChallengeModal } from '../src/components/ui/ChallengeModal';
import { IslandId, UserStats } from '../src/types';
import '../src/index.css';

function Harness() {
  const { locale, toggleLocale } = useI18n();
  const { islands } = getPortfolioContent(locale);
  const [selected, setSelected] = useState<IslandId | null>(null);
  const [challenge, setChallenge] = useState<IslandId | null>(null);
  const [lowPower, setLowPower] = useState(false);
  const [stats, setStats] = useState<UserStats>({ xp: 0, level: 1, visitedIslands: [], completedChallenges: [], viewedProjects: [], collectedCrystals: [], unlockedBadges: [] });
  return <main className="p-8 space-y-6" data-graphics-quality={lowPower ? 'low' : 'high'}>
    <h1 className="text-2xl">Issue #10 — teste isolado das ilhas</h1>
    <p>Mesmos componentes e conteúdo do aplicativo, sem carregar a cena 3D.</p>
    <p className="text-sm">Simulação de teste: <a className="underline mr-4" href="?motion=full">Movimento completo</a><a className="underline mr-4" href="?motion=reduced">Movimento reduzido</a><a className="underline" href="?">Preferência do sistema</a></p>
    <label className="block"><input type="checkbox" checked={lowPower} onChange={event => setLowPower(event.target.checked)} /> Qualidade baixa</label>
    <button onClick={toggleLocale}>PT / EN</button>
    <div className="flex flex-wrap gap-4">{islands.map(island => <button className="p-3 border rounded" key={island.id} onClick={() => setSelected(island.id)}>{island.name}</button>)}</div>
    <AnimatePresence>{selected && <IslandModal island={islands.find(island => island.id === selected)!} stats={stats} lowPower={lowPower} onClose={() => setSelected(null)} onStartChallenge={setChallenge} onInspectProject={id => setStats(value => ({ ...value, viewedProjects: [...new Set([...value.viewedProjects, id])] }))} />}</AnimatePresence>
    <AnimatePresence>{challenge && <ChallengeModal islandId={challenge} lowPower={lowPower} onClose={() => setChallenge(null)} onComplete={() => setChallenge(null)} />}</AnimatePresence>
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><I18nProvider><Harness /></I18nProvider></StrictMode>);
