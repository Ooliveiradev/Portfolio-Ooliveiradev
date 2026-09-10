import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GalaxyScene } from './components/GalaxyScene';
import { LandingOverlay } from './components/ui/LandingOverlay';
import { HUD } from './components/ui/HUD';
import { MobileControls } from './components/ui/MobileControls';
import { IslandModal } from './components/ui/IslandModal';
import { ChallengeModal } from './components/ui/ChallengeModal';
import { GameSettingsModal, SettingsTab } from './components/ui/GameSettingsModal';
import { RaceOverlay } from './components/ui/RaceOverlay';
import { ScreenEdgeBlur } from './components/ui/ScreenEdgeBlur';
import { AchievementToast } from './components/ui/AchievementToast';
import { SecretMessageModal, SecretType } from './components/ui/SecretMessageModal';
import { WhisperReaderModal } from './components/ui/WhisperReaderModal';
import { DropWhisperModal } from './components/ui/DropWhisperModal';
import { WhispersListModal } from './components/ui/WhispersListModal';
import { whispersService } from './services/whispersService';
import { useKonamiCode } from './hooks/useKonamiCode';
import { SPEED_RINGS } from './components/3d/SpeedRings';
import {
  ISLANDS_CONFIG,
  CRYSTALS_DATA,
  BADGES_DATA,
  formatRaceTime,
} from './data/portfolioData';
import { IslandId, UserStats, CrystalCollectible, CameraViewMode, GraphicsQuality, RaceLeaderboardEntry, GameMode, Badge, CosmicWhisper } from './types';
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

  // Latest unlocked achievement popup toast
  const [latestUnlockedBadge, setLatestUnlockedBadge] = useState<Badge | null>(null);

  // Easter Eggs & Secret Regions State
  const [secretModalType, setSecretModalType] = useState<SecretType | null>(null);
  const [isMatrixGlitchActive, setIsMatrixGlitchActive] = useState<boolean>(false);
  const avatarClickCountRef = useRef<number>(0);

  // Cosmic Whispers & Social Presence State
  const [whispers, setWhispers] = useState<CosmicWhisper[]>([]);
  const [presenceCount, setPresenceCount] = useState<number>(4);
  const [selectedWhisper, setSelectedWhisper] = useState<CosmicWhisper | null>(null);
  const [showDropWhisperModal, setShowDropWhisperModal] = useState<boolean>(false);
  const [showWhispersListModal, setShowWhispersListModal] = useState<boolean>(false);

  // Subscribe to Cosmic Whispers network & Presence
  useEffect(() => {
    const unsubWhispers = whispersService.subscribeToWhispers((list) => {
      setWhispers(list);
    });
    const unsubPresence = whispersService.subscribeToPresence((count) => {
      setPresenceCount(count);
    });
    return () => {
      unsubWhispers();
      unsubPresence();
    };
  }, []);

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

  // Check and unlock badges automatically with cinematic toast notifications
  const checkBadges = useCallback((currentStats: UserStats, extraBadgeId?: string) => {
    const unlocked = new Set(currentStats.unlockedBadges);
    let newlyUnlockedBadge: Badge | null = null;

    const tryUnlock = (badgeId: string) => {
      if (!unlocked.has(badgeId)) {
        unlocked.add(badgeId);
        const b = BADGES_DATA.find((item) => item.id === badgeId);
        if (b) {
          newlyUnlockedBadge = b;
          addXp(b.xpReward);
        }
      }
    };

    if (extraBadgeId) {
      tryUnlock(extraBadgeId);
    }

    // 1. Cosmo Navegador (todas as 5 ilhas)
    if (currentStats.visitedIslands.length >= 5) {
      tryUnlock('badge-explorer');
    }

    // 2. Mestre dos Desafios (2+ desafios)
    if (currentStats.completedChallenges.length >= 2) {
      tryUnlock('badge-coder');
    }

    // 3. Minerador Estelar (3+ cristais)
    if (currentStats.collectedCrystals.length >= 3) {
      tryUnlock('badge-crystal-novice');
    }

    // 4. Coletor Cósmico (todos os 8 cristais)
    if (currentStats.collectedCrystals.length >= 8) {
      tryUnlock('badge-crystal');
    }

    // 5. Arquiteto de Software (inspecionou projeto)
    if (currentStats.viewedProjects.length >= 1) {
      tryUnlock('badge-inspector');
    }

    // 6. Comunicação Estabelecida (visitou about)
    if (currentStats.visitedIslands.includes('about')) {
      tryUnlock('badge-contact');
    }

    // 7. Mente Brilhante (visitou education)
    if (currentStats.visitedIslands.includes('education')) {
      tryUnlock('badge-scholar');
    }

    // 8. Engenheiro Fullstack (visitou skills)
    if (currentStats.visitedIslands.includes('skills')) {
      tryUnlock('badge-technologist');
    }

    // 9. Lenda da Galáxia (10+ conquistas)
    if (unlocked.size >= 10) {
      tryUnlock('badge-perfectionist');
    }

    if (newlyUnlockedBadge) {
      setLatestUnlockedBadge(newlyUnlockedBadge);
      setStats((prev) => ({
        ...prev,
        unlockedBadges: Array.from(unlocked),
      }));
    }
  }, [addXp]);

  // Listener para boost turbo (Conquista Hyperdrive)
  useEffect(() => {
    const handleBoost = () => {
      setStats((prev) => {
        if (!prev.unlockedBadges.includes('badge-boost-master')) {
          checkBadges(prev, 'badge-boost-master');
        }
        return prev;
      });
    };
    window.addEventListener('app:boost-vehicle', handleBoost);
    return () => window.removeEventListener('app:boost-vehicle', handleBoost);
  }, [checkBadges]);

  // Listener para exploração espacial: Drifter Solar e Espaço Profundo
  useEffect(() => {
    if (gameMode !== 'driving') return;
    const distToCenter = Math.hypot(vehiclePos[0], vehiclePos[2]);
    if (distToCenter < 10.5 && !stats.unlockedBadges.includes('badge-orbit-drifter')) {
      checkBadges(stats, 'badge-orbit-drifter');
    }
    if (distToCenter > 95 && !stats.unlockedBadges.includes('badge-secret-voyager')) {
      checkBadges(stats, 'badge-secret-voyager');
    }
  }, [vehiclePos, gameMode, stats, checkBadges]);

  // Easter Egg 3: Konami Code (↑ ↑ ↓ ↓ ← → ← → B A)
  useKonamiCode(
    useCallback(() => {
      sounds.playBadgeUnlocked();
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.4 },
        colors: ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7'],
      });
      addXp(150);
      window.dispatchEvent(new CustomEvent('app:boost-vehicle'));
      alert('🎮 CÓDIGO KONAMI ATIVADO! MODO HYPERDRIVE ARCO-ÍRIS SUPREMO (+150 XP)!');
    }, [addXp])
  );

  // Descoberta de segredos 3D (Asteroide Dourado, Ilha Oculta, Pato de Depuração)
  const handleDiscoverSecret = useCallback((type: SecretType) => {
    setSecretModalType(type);
    if (type === 'asteroid') {
      addXp(200);
      checkBadges(stats, 'badge-easter-asteroid');
    } else if (type === 'void-island') {
      addXp(300);
      checkBadges(stats, 'badge-secret-voyager');
    } else if (type === 'duck') {
      addXp(100);
    }
  }, [addXp, checkBadges, stats]);

  // Easter Egg 5: Matrix Glitch ao clicar 5 vezes no Avatar DR
  const handleAvatarClick = useCallback(() => {
    avatarClickCountRef.current += 1;
    if (avatarClickCountRef.current >= 5) {
      avatarClickCountRef.current = 0;
      setIsMatrixGlitchActive(true);
      sounds.playBadgeUnlocked();
      addXp(100);
      setTimeout(() => {
        setIsMatrixGlitchActive(false);
      }, 3500);
    }
  }, [addXp]);

  // Transmissão de novo Sussurro Cósmico
  const handleBroadcastWhisper = useCallback((newWhisper: CosmicWhisper) => {
    whispersService.addWhisper(newWhisper);
    addXp(150);
    confetti({
      particleCount: 110,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#67e8f9', '#a855f7', '#fbbf24', '#10b981'],
    });
  }, [addXp]);

  // Curtir / Ressoar Sussurro Cósmico
  const handleLikeWhisper = useCallback((id: string) => {
    whispersService.likeWhisper(id);
  }, []);

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
    showSettingsModal ||
    Boolean(secretModalType) ||
    Boolean(selectedWhisper) ||
    showDropWhisperModal ||
    showWhispersListModal;

  // Global key handler for transmission [T]
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if ((e.key === 't' || e.key === 'T') && gameMode === 'driving' && !isModalOpen) {
        e.preventDefault();
        sounds.playClick();
        setShowDropWhisperModal(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [gameMode, isModalOpen]);

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
        onDiscoverSecret={handleDiscoverSecret}
        whispers={whispers}
        onInspectWhisper={setSelectedWhisper}
      />

      {/* Screen-Edge Lens Blur & Vignette (Tilt-Shift periférico estilo Bruno Simon) */}
      <ScreenEdgeBlur graphicsQuality={graphicsQuality} />

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
            onOpenAchievements={() => handleOpenSettingsModal('achievements')}
            onAvatarClick={handleAvatarClick}
            onOpenDropWhisper={() => setShowDropWhisperModal(true)}
            onOpenWhispersList={() => setShowWhispersListModal(true)}
            whispers={whispers}
            presenceCount={presenceCount}
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
            onUpdateStats={(newStats) => setStats(newStats)}
            onAvatarClick={handleAvatarClick}
          />
        )}
      </AnimatePresence>

      {/* Notificação Cinematográfica Flutuante de Conquistas Desbloqueadas */}
      <AchievementToast
        achievement={latestUnlockedBadge}
        onClose={() => setLatestUnlockedBadge(null)}
      />

      {/* Modal de Descobertas e Segredos Cósmicos */}
      <SecretMessageModal
        type={secretModalType}
        onClose={() => setSecretModalType(null)}
      />

      {/* Modais da Rede Social Cósmica (Whispers / Mensagens Estelares) */}
      <WhisperReaderModal
        whisper={selectedWhisper}
        onClose={() => setSelectedWhisper(null)}
        onLike={handleLikeWhisper}
      />

      <DropWhisperModal
        isOpen={showDropWhisperModal}
        onClose={() => setShowDropWhisperModal(false)}
        currentPosition={vehiclePos}
        onBroadcastWhisper={handleBroadcastWhisper}
      />

      <WhispersListModal
        isOpen={showWhispersListModal}
        onClose={() => setShowWhispersListModal(false)}
        whispers={whispers}
        vehiclePos={vehiclePos}
        presenceCount={presenceCount}
        onSelectWhisper={(w) => {
          setShowWhispersListModal(false);
          setSelectedWhisper(w);
        }}
        onOpenDropModal={() => setShowDropWhisperModal(true)}
      />

      {/* Easter Egg 5: Matrix Glitch Cyber Rain Overlay */}
      <AnimatePresence>
        {isMatrixGlitchActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-emerald-950/20 backdrop-invert-[0.08]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-40 animate-pulse" />
            <div className="relative z-10 px-6 py-4 rounded-2xl bg-black/90 border border-emerald-500/80 shadow-[0_0_50px_rgba(16,185,129,0.5)] text-center font-mono">
              <div className="text-emerald-400 font-bold tracking-widest text-lg animate-pulse mb-1">
                SYSTEM OVERRIDE: MATRIX DEVELOPER MODE
              </div>
              <p className="text-xs text-emerald-200/80">
                Você descobriu o segredo do terminal de Danilo Ribeiro! (+100 XP)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
