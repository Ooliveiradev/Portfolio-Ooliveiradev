import { CosmicWhisper } from '../types';
import { INITIAL_WHISPERS } from '../data/initialWhispers';

const STORAGE_KEY = 'portfolio_cosmic_whispers';
const CHANNEL_NAME = 'portfolio_cosmic_network';

type BroadcastMessage =
  | { type: 'NEW_WHISPER'; whisper: CosmicWhisper }
  | { type: 'LIKE_WHISPER'; id: string }
  | { type: 'PRESENCE_PING'; tabId: string }
  | { type: 'PRESENCE_PONG'; tabId: string };

class WhispersService {
  private channel: BroadcastChannel | null = null;
  private tabId: string = Math.random().toString(36).substring(2, 9);
  private activeTabs: Set<string> = new Set([this.tabId]);
  private whisperListeners: Set<(whispers: CosmicWhisper[]) => void> = new Set();
  private presenceListeners: Set<(count: number) => void> = new Set();
  private cachedWhispers: CosmicWhisper[] = [];
  private presenceTimer: number | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // 1. Carregar do localStorage
    this.cachedWhispers = this.loadFromStorage();

    // 2. Inicializar BroadcastChannel se suportado
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
          this.handleBroadcastMessage(event.data);
        };

        // Ping de presença inicial
        this.channel.postMessage({ type: 'PRESENCE_PING', tabId: this.tabId });

        // Intervalo de batimento cardíaco para manter presença sincronizada
        this.presenceTimer = window.setInterval(() => {
          if (this.channel) {
            this.channel.postMessage({ type: 'PRESENCE_PING', tabId: this.tabId });
          }
          this.notifyPresence();
        }, 12000);
      } catch (err) {
        console.warn('BroadcastChannel não disponível:', err);
      }
    }
  }

  private loadFromStorage(): CosmicWhisper[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CosmicWhisper[] = JSON.parse(stored);
        // Garante que os whispers iniciais continuam presentes mesmo se o usuário tiver salvo mensagens
        const initialMap = new Map<string, CosmicWhisper>();
        INITIAL_WHISPERS.forEach((w) => initialMap.set(w.id, w));
        parsed.forEach((w) => initialMap.set(w.id, w));
        return Array.from(initialMap.values());
      }
    } catch (e) {
      console.warn('Erro ao carregar whispers do localStorage:', e);
    }
    return [...INITIAL_WHISPERS];
  }

  private saveToStorage(whispers: CosmicWhisper[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(whispers));
    } catch (e) {
      console.warn('Erro ao salvar whispers no localStorage:', e);
    }
  }

  private handleBroadcastMessage(msg: BroadcastMessage) {
    if (msg.type === 'NEW_WHISPER') {
      const exists = this.cachedWhispers.some((w) => w.id === msg.whisper.id);
      if (!exists) {
        this.cachedWhispers = [msg.whisper, ...this.cachedWhispers];
        this.saveToStorage(this.cachedWhispers);
        this.notifyWhispers();
      }
    } else if (msg.type === 'LIKE_WHISPER') {
      this.cachedWhispers = this.cachedWhispers.map((w) =>
        w.id === msg.id ? { ...w, likes: w.likes + 1 } : w
      );
      this.saveToStorage(this.cachedWhispers);
      this.notifyWhispers();
    } else if (msg.type === 'PRESENCE_PING') {
      if (msg.tabId !== this.tabId) {
        this.activeTabs.add(msg.tabId);
        this.channel?.postMessage({ type: 'PRESENCE_PONG', tabId: this.tabId });
        this.notifyPresence();
      }
    } else if (msg.type === 'PRESENCE_PONG') {
      if (msg.tabId !== this.tabId) {
        this.activeTabs.add(msg.tabId);
        this.notifyPresence();
      }
    }
  }

  public getWhispers(): CosmicWhisper[] {
    return [...this.cachedWhispers];
  }

  public addWhisper(whisper: CosmicWhisper) {
    this.cachedWhispers = [whisper, ...this.cachedWhispers];
    this.saveToStorage(this.cachedWhispers);

    // Broadcast instantâneo para outras abas
    if (this.channel) {
      this.channel.postMessage({ type: 'NEW_WHISPER', whisper });
    }

    this.notifyWhispers();
  }

  public likeWhisper(id: string) {
    this.cachedWhispers = this.cachedWhispers.map((w) =>
      w.id === id ? { ...w, likes: w.likes + 1 } : w
    );
    this.saveToStorage(this.cachedWhispers);

    if (this.channel) {
      this.channel.postMessage({ type: 'LIKE_WHISPER', id });
    }

    this.notifyWhispers();
  }

  public subscribeToWhispers(listener: (whispers: CosmicWhisper[]) => void): () => void {
    this.whisperListeners.add(listener);
    listener([...this.cachedWhispers]);
    return () => {
      this.whisperListeners.delete(listener);
    };
  }

  public subscribeToPresence(listener: (count: number) => void): () => void {
    this.presenceListeners.add(listener);
    listener(this.calculateEstimatedPresence());
    return () => {
      this.presenceListeners.delete(listener);
    };
  }

  private calculateEstimatedPresence(): number {
    // Simula tráfego orgânico global de viajantes (entre 3 e 7 exploradores no quadrante)
    // somado ao número de abas ativas reais do visitante
    const hour = new Date().getHours();
    const baseHourTraffic = Math.floor(3 + Math.sin((hour / 24) * Math.PI * 2) * 2);
    const realTabsCount = Math.max(1, this.activeTabs.size);
    return baseHourTraffic + realTabsCount;
  }

  private notifyWhispers() {
    const list = [...this.cachedWhispers];
    this.whisperListeners.forEach((fn) => fn(list));
  }

  private notifyPresence() {
    const count = this.calculateEstimatedPresence();
    this.presenceListeners.forEach((fn) => fn(count));
  }

  public destroy() {
    if (this.presenceTimer) {
      clearInterval(this.presenceTimer);
    }
    if (this.channel) {
      this.channel.close();
    }
  }
}

export const whispersService = new WhispersService();
