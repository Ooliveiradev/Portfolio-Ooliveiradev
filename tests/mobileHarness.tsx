// Development-only browser fixture; production still uses index.html.
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider, useI18n } from '../src/i18n/I18nProvider';
import { getPortfolioContent } from '../src/i18n/portfolio';
import { MobileControls } from '../src/components/ui/MobileControls';
import { IslandModal } from '../src/components/ui/IslandModal';
import { ChallengeModal } from '../src/components/ui/ChallengeModal';
import { GameSettingsModal } from '../src/components/ui/GameSettingsModal';
import { SecretMessageModal } from '../src/components/ui/SecretMessageModal';
import { createVehicleInput } from '../src/utils/gameInput';
import type { UserStats } from '../src/types';
import '../src/index.css';

const stats: UserStats = { xp: 0, level: 1, visitedIslands: [], completedChallenges: [], viewedProjects: [], collectedCrystals: [], unlockedBadges: [] };
function Harness() {
  const { locale, toggleLocale } = useI18n();
  const { islands } = getPortfolioContent(locale);
  const input = useRef(createVehicleInput());
  const output = useRef<HTMLOutputElement>(null);
  const [modal, setModal] = useState('');
  const [mounted, setMounted] = useState(true);
  const [racing, setRacing] = useState(false);
  const [dockCount, setDockCount] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => { if (output.current) output.current.textContent = JSON.stringify(input.current); }, 20);
    return () => clearInterval(timer);
  }, []);
  const close = () => setModal('');
  return <main className="game-shell relative bg-slate-950 text-white" data-graphics-quality="low">
    <nav className="flex flex-wrap gap-2 p-2">
      {['island', 'challenge', 'settings', 'secret'].map(name => <button key={name} onClick={() => setModal(name)}>{name}</button>)}
      <button onClick={() => setMounted(value => !value)}>mount</button>
      <button onClick={() => setRacing(value => !value)}>race</button>
      <button onClick={toggleLocale}>language</button>
    </nav>
    <output ref={output} aria-label="input" />
    <output aria-label="docks">{dockCount}</output>
    {mounted && <MobileControls virtualInputRef={input} enabled={!modal} dockingAvailable={!racing} onDockNearest={() => setDockCount(value => value + 1)} />}
    {modal === 'island' && <IslandModal island={islands.find(island => island.id === 'experience')!} stats={stats} onInspectProject={() => {}} onClose={close} onStartChallenge={() => setModal('challenge')} lowPower />}
    {modal === 'challenge' && <ChallengeModal islandId="projects" onClose={close} onComplete={close} lowPower />}
    {modal === 'settings' && <GameSettingsModal isOpen onClose={close} isMuted onToggleMute={() => {}} onRespawnVehicle={() => {}} stats={stats} crystals={[]} />}
    {modal === 'secret' && <SecretMessageModal type="asteroid" onClose={close} />}
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><I18nProvider><Harness /></I18nProvider></React.StrictMode>);
