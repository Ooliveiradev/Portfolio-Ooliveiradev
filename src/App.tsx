import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { GalaxyScene } from './components/GalaxyScene';
import { LandingOverlay } from './components/ui/LandingOverlay';
import { HUD } from './components/ui/HUD';
import { MobileControls } from './components/ui/MobileControls';
import { IslandModal } from './components/ui/IslandModal';
import { ChallengeModal } from './components/ui/ChallengeModal';
import { GameSettingsModal, SettingsTab } from './components/ui/GameSettingsModal';
import { RaceOverlay } from './components/ui/RaceOverlay';
import { SPEED_RINGS } from './components/3d/SpeedRings';
import {
  ISLANDS_CONFIG,
  CRYSTALS_DATA,
  BADGES_DATA,
  formatRaceTime,
} from './data/portfolioData';
import { IslandId, UserStats, CrystalCollectible, CameraViewMode, GraphicsQuality, RaceLeaderboardEntry, GameMode } from './types';
import { sounds } from './audio/soundManager';
import { getIslandLivePosition } from './utils/celestialCoords';
import confetti from 'canvas-confetti';

export default function App() {
  // Game mode: landing screen, free driving exploration, island inspection, or cinematic transitions
  const [gameMode, setGameMode] = useState<GameMode>('landing');
  // Keep track of which screen the user was on before inspecting an island
  const [previousGameMode, setPreviousGameMode] = useState<GameMode>('driving');

  // Player Vehicle state (Cruising level = 1.0)
  const [vehiclePos, setVehiclePos] = useState<[number, number, number]>([0, 1.0, 16]);
  const [vehicleRotation, setVehicleRotation] = useState<number>(0);
  const [targetVehiclePos, setTargetVehiclePos] = useState<[number, number, number] | null>(null);
  const [virtualInput, setVirtualInput] = useState<{ x: number; y: number; boost: boolean }>({
    x: 0,
    y: 0,
    boost: false,
  });

  // Camera view mode: 'iso' (default diorama isometric view) or 'tactical55' (55° panoramic view)
  const [cameraViewMode, setCameraViewMode] = useState<CameraViewMode>('iso');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Graphics Quality Preset: 'low' (ultra lightweight), 'mid' (balanced default), 'high' (high fidelity)
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(() => {
    try {
      const saved = localStorage.getItem('galactic_portfolio_graphics');
      if (saved === 'low' || saved === 'mid' || saved === 'high') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'mid';
  });

  const handleSelectGraphicsQuality = (quality: GraphicsQuality) => {
    setGraphicsQuality(quality);
    try {
      localStorage.setItem('galactic_portfolio_graphics', quality);
    } catch {
      // fallback
    }
  };

  // Active modals
  const [selectedIslandId, setSelectedIslandId] = useState<IslandId | null>(null);
  const [activeChallengeIsland, setActiveChallengeIsland] = useState<IslandId | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsModalTab, setSettingsModalTab] = useState<SettingsTab>('options');

  // Collectibles in 3D
  const [crystals, setCrystals] = useState<CrystalCollectible[]>(CRYSTALS_DATA);

  // User Gamification Stats
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('galactic_portfolio_stats');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return {
      xp: 100,
      level: 1,
      visitedIslands: [],
      completedChallenges: [],
      viewedProjects: [],
      collectedCrystals: [],
      unlockedBadges: ['badge-ignition'],
    };
  });

  // Recent XP notification popup
  const [recentXpGained, setRecentXpGained] = useState<number | null>(null);
  const xpTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync stats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('galactic_portfolio_stats', JSON.stringify(stats));
    } catch {
      // fallback
    }
  }, [stats]);

  // ESC key handler for closing modals or opening settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSettingsModal) {
          setShowSettingsModal(false);
        } else if (activeChallengeIsland) {
          setActiveChallengeIsland(null);
        } else if (gameMode === 'inspecting' || selectedIslandId) {
          setGameMode('takeoff');
        } else {
          setSettingsModalTab('options');
          setShowSettingsModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showSettingsModal,
    activeChallengeIsland,
    selectedIslandId,
    previousGameMode,
  ]);

  // Award XP helper
  const addXp = useCallback((amount: number) => {
    sounds.playCoin();
    setRecentXpGained(amount);

    if (xpTimerRef.current) clearTimeout(xpTimerRef.current);
    xpTimerRef.current = setTimeout(() => {
      setRecentXpGained(null);
    }, 2200);

    setStats((prev) => {
      const newXp = prev.xp + amount;
      const newLevel =
        newXp < 300 ? 1 : newXp < 700 ? 2 : newXp < 1200 ? 3 : 4;

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
      };
    });
  }, []);

  // Cosmic Time Trial Race State
  const [isNearStartGate, setIsNearStartGate] = useState<boolean>(false);
  const [raceState, setRaceState] = useState<'idle' | 'countdown' | 'racing' | 'finished'>('idle');
  const [countdownNumber, setCountdownNumber] = useState<number>(3);
  const [raceElapsedTime, setRaceElapsedTime] = useState<number>(0);
  const [currentCheckpoint, setCurrentCheckpoint] = useState<number>(0);
  const totalCheckpoints = 6;
  const raceStartTimeRef = useRef<number>(0);

  const [bestRaceTime, setBestRaceTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('galactic_portfolio_best_race_time');
      if (saved) return parseFloat(saved);
    } catch {
      // fallback
    }
    return null;
  });

  // Racing timer animation loop
  useEffect(() => {
    let animId: number;
    if (raceState === 'racing') {
      const updateTimer = () => {
        const elapsed = (Date.now() - raceStartTimeRef.current) / 1000;
        setRaceElapsedTime(elapsed);
        animId = requestAnimationFrame(updateTimer);
      };
      animId = requestAnimationFrame(updateTimer);
    }
    return () => cancelAnimationFrame(animId);
  }, [raceState]);

  const handleStartRace = useCallback(() => {
    setRaceState('countdown');
    setCountdownNumber(3);
    sounds.playCountdownBeep(false);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
        sounds.playCountdownBeep(false);
      } else if (count === 0) {
        setCountdownNumber(0);
        sounds.playCountdownBeep(true);
      } else {
        clearInterval(interval);
        setRaceState('racing');
        setCurrentCheckpoint(0);
        raceStartTimeRef.current = Date.now();
        setRaceElapsedTime(0);
      }
    }, 850);
  }, []);

  const handleReachCheckpoint = useCallback((index: number) => {
    if (index === currentCheckpoint) {
      if (index === totalCheckpoints - 1) {
        // Race Finished!
        const finalTime = (Date.now() - raceStartTimeRef.current) / 1000;
        setRaceElapsedTime(finalTime);
        setRaceState('finished');
        sounds.playRaceVictory();
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.5 },
        });
        addXp(200);

        setBestRaceTime((prev) => {
          if (prev === null || finalTime < prev) {
            try {
              localStorage.setItem('galactic_portfolio_best_race_time', finalTime.toString());
            } catch {
              // fallback
            }
            return finalTime;
          }
          return prev;
        });
      } else {
        setCurrentCheckpoint((prev) => prev + 1);
      }
    }
  }, [currentCheckpoint, totalCheckpoints, addXp]);

  const handleCancelRace = useCallback(() => {
    setRaceState('idle');
    setCurrentCheckpoint(0);
    setRaceElapsedTime(0);
  }, []);

  const handleRecoverCargo = useCallback((_id: string) => {
    addXp(35);
  }, [addXp]);

  const handleSaveRaceScore = useCallback((pilotName: string) => {
    const newEntry: RaceLeaderboardEntry = {
      id: Date.now().toString(),
      name: pilotName,
      timeSeconds: raceElapsedTime,
      formattedTime: formatRaceTime(raceElapsedTime),
      date: 'Hoje',
    };

    try {
      const saved = localStorage.getItem('galactic_portfolio_race_ranking');
      const currentList: RaceLeaderboardEntry[] = saved ? JSON.parse(saved) : [];
      const updated = [...currentList, newEntry]
        .sort((a, b) => a.timeSeconds - b.timeSeconds)
        .slice(0, 10);
      localStorage.setItem('galactic_portfolio_race_ranking', JSON.stringify(updated));
    } catch {
      // fallback
    }

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
    });
    sounds.playBadgeUnlocked();
  }, [raceElapsedTime]);

  // Check and unlock badges automatically
  const checkBadges = useCallback((currentStats: UserStats) => {
    const unlocked = new Set(currentStats.unlockedBadges);
    let newlyUnlocked = false;

    // Badge 2: Cosmo Navegador (visited all 5 islands)
    if (currentStats.visitedIslands.length >= 5 && !unlocked.has('badge-explorer')) {
      unlocked.add('badge-explorer');
      newlyUnlocked = true;
      addXp(300);
    }

    // Badge 3: Mestre dos Desafios (completed 2+ challenges)
    if (currentStats.completedChallenges.length >= 2 && !unlocked.has('badge-coder')) {
      unlocked.add('badge-coder');
      newlyUnlocked = true;
      addXp(250);
    }

    // Badge 4: Coletor Cósmico (collected 5 crystals)
    if (currentStats.collectedCrystals.length >= 5 && !unlocked.has('badge-crystal')) {
      unlocked.add('badge-crystal');
      newlyUnlocked = true;
      addXp(200);
    }

    // Badge 5: Inspetor de Projetos (viewed project details)
    if (currentStats.viewedProjects.length >= 1 && !unlocked.has('badge-inspector')) {
      unlocked.add('badge-inspector');
      newlyUnlocked = true;
      addXp(150);
    }

    // Badge 6: Comunicação Estabelecida (visited about island)
    if (currentStats.visitedIslands.includes('about') && !unlocked.has('badge-contact')) {
      unlocked.add('badge-contact');
      newlyUnlocked = true;
      addXp(200);
    }

    if (newlyUnlocked) {
      sounds.playBadgeUnlocked();
      setStats((prev) => ({
        ...prev,
        unlockedBadges: Array.from(unlocked),
      }));
    }
  }, [addXp]);

  // Handle entering game from landing screen with cinematic fly-in
  const handleStartGame = () => {
    setGameMode('entering');
    setTargetVehiclePos(null);
    sounds.startAmbient();
  };

  // Handle Island Selection / Cinematic Docking
  const handleSelectIsland = (id: IslandId) => {
    const island = ISLANDS_CONFIG.find((i) => i.id === id);
    if (!island) return;

    if (gameMode !== 'inspecting' && gameMode !== 'landing-island') {
      setPreviousGameMode(gameMode);
    }

    setSelectedIslandId(id);
    setGameMode('landing-island');

    // If first visit, award XP
    setStats((prev) => {
      if (!prev.visitedIslands.includes(id)) {
        addXp(100);
        const updated = {
          ...prev,
          visitedIslands: [...prev.visitedIslands, id],
        };
        setTimeout(() => checkBadges(updated), 500);
        return updated;
      }
      return prev;
    });
  };

  // Handle cinematic animation completions
  const handleCinematicComplete = useCallback((finishedMode: GameMode) => {
    if (finishedMode === 'entering') {
      setGameMode('driving');
    } else if (finishedMode === 'landing-island') {
      setGameMode('inspecting');
    } else if (finishedMode === 'takeoff') {
      setSelectedIslandId(null);
      setTargetVehiclePos(null);
      setGameMode('driving');
    } else if (finishedMode === 'exiting') {
      setGameMode('landing');
      setSelectedIslandId(null);
      setTargetVehiclePos(null);
      setVehiclePos([0, 1.0, 16]);
    }
  }, []);

  // Handle Return to Landing Screen with cinematic fly-out
  const handleReturnToLanding = () => {
    sounds.playClick();
    setGameMode('exiting');
  };

  // Handle collecting a crystal
  const handleCollectCrystal = (id: number) => {
    setCrystals((prev) =>
      prev.map((c) => (c.id === id ? { ...c, collected: true } : c))
    );

    setStats((prev) => {
      if (!prev.collectedCrystals.includes(id)) {
        addXp(25);
        const updated = {
          ...prev,
          collectedCrystals: [...prev.collectedCrystals, id],
        };
        setTimeout(() => checkBadges(updated), 500);
        return updated;
      }
      return prev;
    });
  };

  // Inspect project detail inside island modal
  const handleInspectProject = (projectId: string) => {
    setStats((prev) => {
      if (!prev.viewedProjects.includes(projectId)) {
        addXp(50);
        const updated = {
          ...prev,
          viewedProjects: [...prev.viewedProjects, projectId],
        };
        setTimeout(() => checkBadges(updated), 500);
        return updated;
      }
      return prev;
    });
  };

  // Complete island challenge
  const handleCompleteChallenge = (islandId: IslandId) => {
    setActiveChallengeIsland(null);
    setStats((prev) => {
      if (!prev.completedChallenges.includes(islandId)) {
        addXp(150);
        const updated = {
          ...prev,
          completedChallenges: [...prev.completedChallenges, islandId],
        };
        setTimeout(() => checkBadges(updated), 500);
        return updated;
      }
      return prev;
    });
  };

  // Reset rover to origin in case player gets lost
  const handleResetVehicle = () => {
    setVehiclePos([0, 1.0, 16]);
    setTargetVehiclePos(null);
    setSelectedIslandId(null);
    setGameMode('driving');
  };

  // Dock at nearest island on mobile
  const handleDockNearest = () => {
    let nearestIsland = ISLANDS_CONFIG[0];
    let minDistance = Infinity;

    ISLANDS_CONFIG.forEach((isl) => {
      const [ix, , iz] = getIslandLivePosition(isl);
      const dist = Math.hypot(vehiclePos[0] - ix, vehiclePos[2] - iz);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIsland = isl;
      }
    });

    handleSelectIsland(nearestIsland.id);
  };

  const handleOpenSettingsModal = (tab: SettingsTab = 'options') => {
    setSettingsModalTab(tab);
    setShowSettingsModal(true);
  };

  const handleRespawnVehicle = () => {
    sounds.playBoost();
    window.dispatchEvent(new CustomEvent('app:respawn-vehicle'));
  };

  const handleResetCrystals = () => {
    sounds.playClick();
    setCrystals(CRYSTALS_DATA.map((c) => ({ ...c, collected: false })));
  };

  const isModalOpen =
    gameMode === 'inspecting' ||
    Boolean(activeChallengeIsland) ||
    showSettingsModal;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070b14] text-white">
      {/* 3D WebGL Three.js Galaxy Scene */}
      <GalaxyScene
        gameMode={gameMode}
        vehiclePos={vehiclePos}
        vehicleRotation={vehicleRotation}
        cameraViewMode={cameraViewMode}
        targetVehiclePos={targetVehiclePos}
        onVehiclePosChange={setVehiclePos}
        onVehicleRotationChange={setVehicleRotation}
        onSelectIsland={handleSelectIsland}
        selectedIslandId={selectedIslandId}
        islands={ISLANDS_CONFIG}
        visitedIslands={stats.visitedIslands}
        crystals={crystals}
        onCollectCrystal={handleCollectCrystal}
        virtualInput={virtualInput}
        isModalOpen={isModalOpen}
        onClearTargetPosition={() => setTargetVehiclePos(null)}
        graphicsQuality={graphicsQuality}
        isRacing={raceState === 'racing'}
        currentCheckpoint={currentCheckpoint}
        onReachCheckpoint={handleReachCheckpoint}
        onNearStartGate={setIsNearStartGate}
        onRecoverCargo={handleRecoverCargo}
        onCinematicComplete={handleCinematicComplete}
      />

      {/* Screen 1: Initial Landing Screen Overlay with Centered Orbiting Galaxy in Background */}
      <AnimatePresence>
        {gameMode === 'landing' && (
          <LandingOverlay
            onStartGame={handleStartGame}
            islands={ISLANDS_CONFIG}
            visitedIslands={stats.visitedIslands}
            onSelectIsland={handleSelectIsland}
            onOpenSettings={() => handleOpenSettingsModal('home')}
          />
        )}
      </AnimatePresence>

      {/* Screen 2: In-Game Exploration HUD (Clean & Minimalist) */}
      {gameMode !== 'landing' && gameMode !== 'entering' && gameMode !== 'exiting' && (
        <>
          <HUD
            stats={stats}
            islands={ISLANDS_CONFIG}
            selectedIslandId={selectedIslandId}
            onSelectIsland={handleSelectIsland}
            onResetVehicle={handleResetVehicle}
            onReturnToLanding={handleReturnToLanding}
            onOpenSettings={() => handleOpenSettingsModal('options')}
            recentXpGained={recentXpGained}
            vehiclePos={vehiclePos}
            vehicleRotation={vehicleRotation}
            crystals={crystals}
            targetVehiclePos={targetVehiclePos}
            isRacing={raceState === 'racing'}
            currentCheckpoint={currentCheckpoint}
          />

          {/* Mobile Touch Controls (Active during free driving exploration) */}
          {gameMode === 'driving' && (
            <MobileControls
              onInputChange={setVirtualInput}
              onDockNearest={handleDockNearest}
            />
          )}

          {/* Cosmic Time Trial Race Overlay (Prompt Card, Countdown, Live Timer, Finish Modal) */}
          <RaceOverlay
            isNearStartGate={isNearStartGate}
            raceState={raceState}
            countdownNumber={countdownNumber}
            elapsedTime={raceElapsedTime}
            currentCheckpoint={currentCheckpoint}
            totalCheckpoints={totalCheckpoints}
            bestTime={bestRaceTime}
            vehiclePos={vehiclePos}
            targetRingPosition={SPEED_RINGS[currentCheckpoint]?.position}
            onStartRace={handleStartRace}
            onCancelRace={handleCancelRace}
            onSaveScore={handleSaveRaceScore}
            onRetryRace={handleStartRace}
            onCloseModal={() => setRaceState('idle')}
          />
        </>
      )}

      {/* Island Content Detail Modal */}
      <AnimatePresence>
        {gameMode === 'inspecting' && selectedIslandId && (
          <IslandModal
            island={ISLANDS_CONFIG.find((i) => i.id === selectedIslandId)!}
            stats={stats}
            onClose={() => {
              setGameMode('takeoff');
            }}
            onStartChallenge={(id) => setActiveChallengeIsland(id)}
            onInspectProject={handleInspectProject}
          />
        )}
      </AnimatePresence>

      {/* Technical Challenge Interactive Minigame Modal */}
      <AnimatePresence>
        {activeChallengeIsland && (
          <ChallengeModal
            islandId={activeChallengeIsland}
            onComplete={handleCompleteChallenge}
            onClose={() => setActiveChallengeIsland(null)}
          />
        )}
      </AnimatePresence>

      {/* System Settings & Options Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <GameSettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(sounds.toggleMute())}
            cameraViewMode={cameraViewMode}
            onSelectCameraMode={setCameraViewMode}
            onRespawnVehicle={handleRespawnVehicle}
            onResetCrystals={() => {
              setCrystals((prev) => prev.map((c) => ({ ...c, collected: false })));
              setStats((prev) => ({ ...prev, collectedCrystals: [] }));
              sounds.playCoin();
            }}
            stats={stats}
            crystals={crystals}
            initialTab={settingsModalTab}
            graphicsQuality={graphicsQuality}
            onSelectGraphicsQuality={handleSelectGraphicsQuality}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
