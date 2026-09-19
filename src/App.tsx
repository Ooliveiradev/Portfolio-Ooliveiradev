import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GalaxyScene } from './components/GalaxyScene';
import { LandingOverlay } from './components/ui/LandingOverlay';
import { HUD } from './components/ui/HUD';
import { MobileControls } from './components/ui/MobileControls';
import { SettingsTab } from './components/ui/GameSettingsModal';
import { RaceOverlay } from './components/ui/RaceOverlay';
import { ScreenEdgeBlur } from './components/ui/ScreenEdgeBlur';
import { AchievementToast } from './components/ui/AchievementToast';
import { SecretType } from './components/ui/SecretMessageModal';
import { whispersService } from './services/whispersService';
import { useKonamiCode } from './hooks/useKonamiCode';
import { useFPSQualityGuard } from './hooks/useFPSQualityGuard';
import { SPEED_RINGS } from './components/3d/SpeedRings';
import { Preloader } from './components/ui/Preloader';

// Heavy UI Modals loaded on-demand (Tier 3 - #9: Code Splitting)
const IslandModal = lazy(() => import('./components/ui/IslandModal').then(m => ({ default: m.IslandModal })));
const ChallengeModal = lazy(() => import('./components/ui/ChallengeModal').then(m => ({ default: m.ChallengeModal })));
const GameSettingsModal = lazy(() => import('./components/ui/GameSettingsModal').then(m => ({ default: m.GameSettingsModal })));
const SecretMessageModal = lazy(() => import('./components/ui/SecretMessageModal').then(m => ({ default: m.SecretMessageModal })));
const WhisperReaderModal = lazy(() => import('./components/ui/WhisperReaderModal').then(m => ({ default: m.WhisperReaderModal })));
const DropWhisperModal = lazy(() => import('./components/ui/DropWhisperModal').then(m => ({ default: m.DropWhisperModal })));
const WhispersListModal = lazy(() => import('./components/ui/WhispersListModal').then(m => ({ default: m.WhispersListModal })));
import {
  ISLANDS_CONFIG,
  CRYSTALS_DATA,
  BADGES_DATA,
  formatRaceTime,
} from './data/portfolioData';
import { IslandId, UserStats, CrystalCollectible, GraphicsQuality, RaceLeaderboardEntry, GameMode, Badge, CosmicWhisper } from './types';
import { sounds } from './audio/soundManager';
import { BoundaryAlert } from './components/ui/BoundaryAlert';
import { MatrixEasterEgg } from './components/ui/MatrixEasterEgg';
import { getIslandLivePosition } from './utils/celestialCoords';
import confetti from 'canvas-confetti';
import { INITIAL_VEHICLE_POSITION, getVehiclePosition, updateVehiclePosition, updateVehicleRotation } from './utils/vehicleTelemetry';
import { createVehicleInput, isEditableTarget } from './utils/gameInput';

export default function App() {
  // Preloading & System Certification: certifica Rapier WASM, shaders GPU e fontes antes de liberar jogabilidade
  const [isPreloading, setIsPreloading] = useState<boolean>(true);
  const [isSceneReady, setIsSceneReady] = useState<boolean>(false);

  // Game mode: landing screen, free driving exploration, island inspection, or cinematic transitions
  const [gameMode, setGameMode] = useState<GameMode>('landing');
  // Keep track of which screen the user was on before inspecting an island
  const [previousGameMode, setPreviousGameMode] = useState<GameMode>('driving');

  // Player Vehicle state (Cruising level = 1.0)
  const vehiclePos = getVehiclePosition();
  const [targetVehiclePos, setTargetVehiclePos] = useState<[number, number, number] | null>(null);
  const virtualInputRef = useRef(createVehicleInput());

  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Graphics Quality Preset: 'low' (ultra lightweight), 'mid' (balanced), 'high' (high fidelity default)
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(() => {
    try {
      const saved = localStorage.getItem('galactic_portfolio_graphics');
      if (saved === 'low' || saved === 'mid' || saved === 'high') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'high';
  });

  const handleSelectGraphicsQuality = useCallback((quality: GraphicsQuality) => {
    setGraphicsQuality(quality);
    try {
      localStorage.setItem('galactic_portfolio_graphics', quality);
    } catch {
      // fallback
    }
  }, []);

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
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.unlockedBadges)) {
          return {
            ...parsed,
            unlockedBadges: Array.from(new Set(['badge-ignition', ...parsed.unlockedBadges])),
          };
        }
        return parsed;
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

  // Strict synchronous in-memory set to guarantee achievements only unlock ONCE
  const unlockedBadgesRef = useRef<Set<string>>(new Set(stats.unlockedBadges));

  // Sync ref whenever stats.unlockedBadges updates
  useEffect(() => {
    for (const b of stats.unlockedBadges) {
      unlockedBadgesRef.current.add(b);
    }
  }, [stats.unlockedBadges]);

  // Track duck secret discovery
  const duckDiscoveredRef = useRef<boolean>(false);
  useEffect(() => {
    try {
      duckDiscoveredRef.current = localStorage.getItem('galactic_portfolio_duck_discovered') === 'true';
    } catch {
      // fallback
    }
  }, []);

  // Recent XP notification popup
  const [recentXpGained, setRecentXpGained] = useState<number | null>(null);
  const xpTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Achievement toast queue & currently active toast badge
  const [badgeToastQueue, setBadgeToastQueue] = useState<Badge[]>([]);
  const [activeToastBadge, setActiveToastBadge] = useState<Badge | null>(null);

  // Process next achievement in queue when current toast is closed
  useEffect(() => {
    if (!activeToastBadge && badgeToastQueue.length > 0) {
      const timer = setTimeout(() => {
        setBadgeToastQueue((prevQueue) => {
          if (prevQueue.length === 0) return prevQueue;
          const [nextBadge, ...rest] = prevQueue;
          setActiveToastBadge(nextBadge);
          return rest;
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeToastBadge, badgeToastQueue.length]);

  const handleDismissToast = useCallback(() => {
    setActiveToastBadge(null);
  }, []);

  // Easter Eggs & Secret Regions State
  const [secretModalType, setSecretModalType] = useState<SecretType | null>(null);
  const [isMatrixGlitchActive, setIsMatrixGlitchActive] = useState<boolean>(false);
  const avatarClickCountRef = useRef<number>(0);
  useEffect(() => {
    if (!isMatrixGlitchActive) return;
    const timer = window.setTimeout(() => setIsMatrixGlitchActive(false), 6500);
    return () => window.clearTimeout(timer);
  }, [isMatrixGlitchActive]);

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
      if (isPreloading || e.repeat) return;
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
    isPreloading,
    showSettingsModal,
    activeChallengeIsland,
    selectedIslandId,
    previousGameMode,
    gameMode,
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

  // Centralized achievement unlock handler with strict single-unlock guarantee
  const unlockBadge = useCallback(
    (badgeId: string) => {
      // 1. Rigorous check: If already unlocked in ref, CAN NEVER BE UNLOCKED AGAIN.
      if (unlockedBadgesRef.current.has(badgeId)) {
        return false;
      }

      const badge = BADGES_DATA.find((item) => item.id === badgeId);
      if (!badge) return false;

      // 2. Mark immediately in synchronous ref so no concurrent frame/event can re-trigger
      unlockedBadgesRef.current.add(badgeId);

      // 3. Queue toast notification
      setBadgeToastQueue((prev) => {
        if (prev.some((b) => b.id === badgeId)) return prev;
        return [...prev, badge];
      });

      // 4. Award XP for unlocking the achievement
      addXp(badge.xpReward);

      // 5. Atomically update stats state & localStorage
      setStats((prev) => {
        const updatedBadges = Array.from(new Set([...prev.unlockedBadges, badgeId]));
        const updated = {
          ...prev,
          unlockedBadges: updatedBadges,
        };
        try {
          localStorage.setItem('galactic_portfolio_stats', JSON.stringify(updated));
        } catch {
          // fallback
        }
        return updated;
      });

      // 6. Meta-Achievement check: Lenda da Galáxia (10+ conquistas)
      if (
        badgeId !== 'badge-perfectionist' &&
        unlockedBadgesRef.current.size >= 10 &&
        !unlockedBadgesRef.current.has('badge-perfectionist')
      ) {
        setTimeout(() => {
          unlockBadge('badge-perfectionist');
        }, 500);
      }

      return true;
    },
    [addXp]
  );

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

  // Only the race overlay ticks; App records time once at the finish line.
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const handleStartRace = useCallback(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setRaceState('countdown');
    setCountdownNumber(3);
    sounds.playCountdownBeep(false);

    let count = 3;
    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
        sounds.playCountdownBeep(false);
      } else if (count === 0) {
        setCountdownNumber(0);
        sounds.playCountdownBeep(true);
      } else {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
        setRaceState('racing');
        setCurrentCheckpoint(0);
        raceStartTimeRef.current = performance.now();
        setRaceElapsedTime(0);
      }
    }, 850);
  }, []);

  const handleReachCheckpoint = useCallback((index: number) => {
    if (index === currentCheckpoint) {
      if (index === totalCheckpoints - 1) {
        // Race Finished!
        const finalTime = (performance.now() - raceStartTimeRef.current) / 1000;
        setRaceElapsedTime(finalTime);
        setRaceState('finished');
        sounds.playRaceVictory();
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.5 },
        });
        addXp(200);

        // Conquistas exclusivas da corrida (apenas primeiro desbloqueio)
        unlockBadge('badge-speedster');
        if (finalTime < 28) {
          unlockBadge('badge-supersonic');
        }

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
  }, [currentCheckpoint, totalCheckpoints, addXp, unlockBadge]);

  const handleCancelRace = useCallback(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = null;
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

  // Check island milestones and exploration achievements
  const checkMilestoneBadges = useCallback(
    (currentStats: UserStats) => {
      // 1. Cosmo Navegador (todas as 5 ilhas)
      if (currentStats.visitedIslands.length >= 5) {
        unlockBadge('badge-explorer');
      }

      // 2. Mestre dos Desafios (2+ desafios)
      if (currentStats.completedChallenges.length >= 2) {
        unlockBadge('badge-coder');
      }

      // 3. Minerador Estelar (3+ cristais)
      if (currentStats.collectedCrystals.length >= 3) {
        unlockBadge('badge-crystal-novice');
      }

      // 4. Coletor Cósmico (todos os 8 cristais)
      if (currentStats.collectedCrystals.length >= 8) {
        unlockBadge('badge-crystal');
      }

      // 5. Arquiteto de Software (inspecionou projeto)
      if (currentStats.viewedProjects.length >= 1) {
        unlockBadge('badge-inspector');
      }

      // 6. Comunicação Estabelecida (visitou about)
      if (currentStats.visitedIslands.includes('about')) {
        unlockBadge('badge-contact');
      }

      // 7. Mente Brilhante (visitou education)
      if (currentStats.visitedIslands.includes('education')) {
        unlockBadge('badge-scholar');
      }

      // 8. Engenheiro Fullstack (visitou skills)
      if (currentStats.visitedIslands.includes('skills')) {
        unlockBadge('badge-technologist');
      }

      // 9. Lenda da Galáxia (10+ conquistas)
      if (unlockedBadgesRef.current.size >= 10) {
        unlockBadge('badge-perfectionist');
      }
    },
    [unlockBadge]
  );

  // Monitor de marcos galácticos: reage imediatamente e de forma limpa a qualquer atualização de estatísticas
  useEffect(() => {
    checkMilestoneBadges(stats);
  }, [
    stats.visitedIslands,
    stats.completedChallenges,
    stats.collectedCrystals,
    stats.viewedProjects,
    checkMilestoneBadges,
  ]);

  // Listener para boost turbo (Conquista Hyperdrive) - trava síncrona garante disparo ÚNICO na vida útil
  useEffect(() => {
    const handleBoost = () => {
      unlockBadge('badge-boost-master');
    };
    window.addEventListener('app:boost-vehicle', handleBoost);
    return () => window.removeEventListener('app:boost-vehicle', handleBoost);
  }, [unlockBadge]);

  // Listener para exploração espacial: Drifter Solar e Espaço Profundo (garantido disparo único)
  const handleVehiclePosChange = useCallback((position: [number, number, number]) => {
    updateVehiclePosition(position);
    if (gameMode !== 'driving') return;
    const distToCenter = Math.hypot(position[0], position[2]);
    if (distToCenter < 10.5 && !unlockedBadgesRef.current.has('badge-orbit-drifter')) {
      unlockBadge('badge-orbit-drifter');
    }
    if (distToCenter > 95 && !unlockedBadgesRef.current.has('badge-secret-voyager')) {
      unlockBadge('badge-secret-voyager');
    }
  }, [gameMode, unlockBadge]);

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

  // Descoberta de segredos 3D (Asteroide Dourado, Ilha Oculta, Pato de Depuração) - trava rigorosa de 1x
  const handleDiscoverSecret = useCallback(
    (type: SecretType) => {
      setSecretModalType(type);
      if (type === 'asteroid') {
        unlockBadge('badge-easter-asteroid');
      } else if (type === 'void-island') {
        unlockBadge('badge-secret-voyager');
      } else if (type === 'duck') {
        if (!duckDiscoveredRef.current) {
          duckDiscoveredRef.current = true;
          try {
            localStorage.setItem('galactic_portfolio_duck_discovered', 'true');
          } catch {
            // fallback
          }
          addXp(100);
        }
      }
    },
    [addXp, unlockBadge]
  );

  // Easter Egg 5: Matrix Glitch ao clicar 5 vezes no Avatar DR
  const handleAvatarClick = useCallback(() => {
    avatarClickCountRef.current += 1;
    if (avatarClickCountRef.current >= 5) {
      avatarClickCountRef.current = 0;
      setIsMatrixGlitchActive(true);
      sounds.playBadgeUnlocked();
      addXp(100);
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
  const handleSelectIsland = useCallback((id: IslandId) => {
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
        return {
          ...prev,
          visitedIslands: [...prev.visitedIslands, id],
        };
      }
      return prev;
    });
  }, [gameMode, addXp]);

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
      updateVehiclePosition([...INITIAL_VEHICLE_POSITION]);
    }
  }, []);

  const handleBoundaryReturn = useCallback(() => {
    unlockBadge('badge-event-horizon');
    if (raceState === 'racing' || raceState === 'countdown') handleCancelRace();
  }, [unlockBadge, raceState, handleCancelRace]);

  // Handle Return to Landing Screen with cinematic fly-out
  const handleReturnToLanding = () => {
    sounds.playClick();
    setGameMode('exiting');
  };

  // Handle collecting a crystal
  const handleCollectCrystal = useCallback((id: number) => {
    setCrystals((prev) =>
      prev.map((c) => (c.id === id ? { ...c, collected: true } : c))
    );

    setStats((prev) => {
      if (!prev.collectedCrystals.includes(id)) {
        addXp(25);
        return {
          ...prev,
          collectedCrystals: [...prev.collectedCrystals, id],
        };
      }
      return prev;
    });
  }, [addXp]);

  // Inspect project detail inside island modal
  const handleInspectProject = (projectId: string) => {
    setStats((prev) => {
      if (!prev.viewedProjects.includes(projectId)) {
        addXp(50);
        return {
          ...prev,
          viewedProjects: [...prev.viewedProjects, projectId],
        };
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
        return {
          ...prev,
          completedChallenges: [...prev.completedChallenges, islandId],
        };
      }
      return prev;
    });
  };

  // Reset rover to origin in case player gets lost
  const handleResetVehicle = () => {
    updateVehiclePosition([...INITIAL_VEHICLE_POSITION]);
    window.dispatchEvent(new CustomEvent('app:respawn-vehicle'));
    setTargetVehiclePos(null);
    setSelectedIslandId(null);
    setGameMode('driving');
  };

  // Dock at nearest island on mobile
  const handleDockNearest = () => {
    const vehiclePos = getVehiclePosition();
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

  const handlePreloadComplete = useCallback(() => {
    setIsPreloading(false);
  }, []);
  const handleSceneReady = useCallback(() => setIsSceneReady(true), []);
  const handleClearTargetPosition = useCallback(() => setTargetVehiclePos(null), []);

  const isModalOpen =
    isPreloading ||
    gameMode === 'inspecting' ||
    Boolean(activeChallengeIsland) ||
    showSettingsModal ||
    Boolean(secretModalType) ||
    Boolean(selectedWhisper) ||
    showDropWhisperModal ||
    showWhispersListModal ||
    raceState === 'finished';

  useFPSQualityGuard({
    currentQuality: graphicsQuality,
    onAutoAdjustQuality: setGraphicsQuality,
    enabled: !isModalOpen,
  });

  // Global key handler for transmission [T]
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.repeat || isEditableTarget(e.target)) return;

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
    <div data-graphics-quality={graphicsQuality} className="relative w-screen h-screen overflow-hidden bg-[#070b14] text-white">
      {/* 3D WebGL Three.js Galaxy Scene */}
      <GalaxyScene
        gameMode={gameMode}
        vehiclePos={INITIAL_VEHICLE_POSITION}
        vehicleRotation={0}
        targetVehiclePos={targetVehiclePos}
        onVehiclePosChange={handleVehiclePosChange}
        onVehicleRotationChange={updateVehicleRotation}
        onSelectIsland={handleSelectIsland}
        selectedIslandId={selectedIslandId}
        islands={ISLANDS_CONFIG}
        visitedIslands={stats.visitedIslands}
        crystals={crystals}
        onCollectCrystal={handleCollectCrystal}
        virtualInputRef={virtualInputRef}
        isModalOpen={isModalOpen}
        isPreloading={isPreloading}
        onClearTargetPosition={handleClearTargetPosition}
        graphicsQuality={graphicsQuality}
        isRacing={raceState === 'racing'}
        currentCheckpoint={currentCheckpoint}
        onReachCheckpoint={handleReachCheckpoint}
        onNearStartGate={setIsNearStartGate}
        onRecoverCargo={handleRecoverCargo}
        onCinematicComplete={handleCinematicComplete}
        onDiscoverSecret={handleDiscoverSecret}
        onBoundaryReturn={handleBoundaryReturn}
        whispers={whispers}
        onInspectWhisper={setSelectedWhisper}
        onSceneReady={handleSceneReady}
      />

      {/* Screen-Edge Lens Blur & Vignette (Tilt-Shift periférico estilo Bruno Simon) */}
      <ScreenEdgeBlur graphicsQuality={graphicsQuality} />
      <BoundaryAlert active={gameMode === 'driving' && !isModalOpen} />

      {/* Tela 0: Preloader Cinematográfico de Inicialização e Certificação de Sistemas */}
      <AnimatePresence>
        {isPreloading && (
          <Preloader
            isSceneReady={isSceneReady}
            onComplete={handlePreloadComplete}
          />
        )}
      </AnimatePresence>

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
            onInspectWhisper={setSelectedWhisper}
            whispers={whispers}
            presenceCount={presenceCount}
            recentXpGained={recentXpGained}
            crystals={crystals}
            targetVehiclePos={targetVehiclePos}
            isRacing={raceState === 'racing'}
            currentCheckpoint={currentCheckpoint}
          />

          {/* Mobile Touch Controls (Active during free driving exploration) */}
          {gameMode === 'driving' && (
            <MobileControls
              virtualInputRef={virtualInputRef}
              enabled={!isModalOpen}
              onDockNearest={handleDockNearest}
            />
          )}

          {/* Cosmic Time Trial Race Overlay (Prompt Card, Countdown, Live Timer, Finish Modal) */}
          <RaceOverlay
            controlsEnabled={gameMode === 'driving' && !isModalOpen}
            isNearStartGate={isNearStartGate}
            raceState={raceState}
            countdownNumber={countdownNumber}
            elapsedTime={raceElapsedTime}
            startedAt={raceStartTimeRef.current}
            currentCheckpoint={currentCheckpoint}
            totalCheckpoints={totalCheckpoints}
            bestTime={bestRaceTime}
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
          <Suspense fallback={null}>
            <IslandModal
              island={ISLANDS_CONFIG.find((i) => i.id === selectedIslandId)!}
              stats={stats}
              onClose={() => {
                setGameMode('takeoff');
              }}
              onStartChallenge={(id) => setActiveChallengeIsland(id)}
              onInspectProject={handleInspectProject}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Technical Challenge Interactive Minigame Modal */}
      <AnimatePresence>
        {activeChallengeIsland && (
          <Suspense fallback={null}>
            <ChallengeModal
              islandId={activeChallengeIsland}
              onComplete={handleCompleteChallenge}
              onClose={() => setActiveChallengeIsland(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* System Settings & Options Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <Suspense fallback={null}>
            <GameSettingsModal
              isOpen={showSettingsModal}
              onClose={() => setShowSettingsModal(false)}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(sounds.toggleMute())}
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
          </Suspense>
        )}
      </AnimatePresence>

      {/* Notificação Cinematográfica Flutuante de Conquistas Desbloqueadas */}
      <AchievementToast
        achievement={activeToastBadge}
        onClose={handleDismissToast}
      />

      {/* Modal de Descobertas e Segredos Cósmicos */}
      <Suspense fallback={null}>
        {secretModalType && <SecretMessageModal
          type={secretModalType}
          onClose={() => setSecretModalType(null)}
        />}
      </Suspense>

      {/* Modais da Rede Social Cósmica (Whispers / Mensagens Estelares) */}
      <Suspense fallback={null}>
        {selectedWhisper && <WhisperReaderModal
          whisper={selectedWhisper}
          onClose={() => setSelectedWhisper(null)}
          onLike={handleLikeWhisper}
        />}
      </Suspense>

      <Suspense fallback={null}>
        {showDropWhisperModal && <DropWhisperModal
          isOpen={showDropWhisperModal}
          onClose={() => setShowDropWhisperModal(false)}
          currentPosition={vehiclePos}
          onBroadcastWhisper={handleBroadcastWhisper}
        />}
      </Suspense>

      <Suspense fallback={null}>
        {showWhispersListModal && <WhispersListModal
          isOpen={showWhispersListModal}
          onClose={() => setShowWhispersListModal(false)}
          whispers={whispers}
          presenceCount={presenceCount}
          onSelectWhisper={(w) => {
            setShowWhispersListModal(false);
            setSelectedWhisper(w);
          }}
          onOpenDropModal={() => setShowDropWhisperModal(true)}
        />}
      </Suspense>

      {/* Easter Egg 5: Matrix Glitch Cyber Rain Overlay */}
      <AnimatePresence>
        {isMatrixGlitchActive && <MatrixEasterEgg />}
      </AnimatePresence>
    </div>
  );
}
