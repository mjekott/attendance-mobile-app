import { create } from 'zustand';
import { File, Paths } from 'expo-file-system';
import { syncApi } from '../services/api';

// --- Types ---

interface CachedUser {
  name: string;
  embeddings: number[][];
}

interface CachedPass {
  accessCode: string;
  visitorName: string;
  hostName: string;
  purpose: string;
  status: string;
  expectedDate: string;
  checkedIn: string | null;
  checkedOut: string | null;
}

interface QueuedRecord {
  type: 'ATTENDANCE' | 'VISITOR';
  employeeId?: string;
  accessCode?: string;
  action: 'CHECKIN' | 'CHECKOUT';
  timestamp: string;
  confidence?: number;
}

// Tracks today's check-in/out status per employee (keyed as "employeeId:date")
type AttendanceStatus = Record<string, 'CHECKIN' | 'CHECKOUT'>;

interface OfflineState {
  cachedUsers: Record<string, CachedUser>;
  cachedGatePasses: CachedPass[];
  gatePassCacheDate: string;
  pendingQueue: QueuedRecord[];
  attendanceStatus: AttendanceStatus;
  _loaded: boolean;

  load: () => Promise<void>;
  cacheUser: (employeeId: string, user: CachedUser) => void;
  getCachedUser: (employeeId: string) => CachedUser | undefined;
  getNextAction: (employeeId: string) => 'CHECKIN' | 'CHECKOUT';
  recordAction: (employeeId: string, action: 'CHECKIN' | 'CHECKOUT') => void;
  syncGatePasses: (token: string) => Promise<void>;
  getCachedPass: (accessCode: string) => CachedPass | undefined;
  markPassUsed: (accessCode: string, action: 'CHECKIN' | 'CHECKOUT') => void;
  addToQueue: (record: QueuedRecord) => void;
  flushQueue: (token: string) => Promise<void>;
}

// --- Persistence helpers ---

const cacheFile = new File(Paths.document, 'offline_cache.json');

interface PersistedData {
  cachedUsers: Record<string, CachedUser>;
  cachedGatePasses: CachedPass[];
  gatePassCacheDate: string;
  pendingQueue: QueuedRecord[];
  attendanceStatus: AttendanceStatus;
}

async function loadFromDisk(): Promise<PersistedData | null> {
  try {
    if (!cacheFile.exists) return null;
    const raw = await cacheFile.text();
    return JSON.parse(raw) as PersistedData;
  } catch {
    return null;
  }
}

function saveToDisk(data: PersistedData) {
  try {
    cacheFile.write(JSON.stringify(data));
  } catch (e) {
    console.error('Failed to persist offline cache:', e);
  }
}

// --- Store ---

export const useOfflineStore = create<OfflineState>((set, get) => {
  function persist() {
    const { cachedUsers, cachedGatePasses, gatePassCacheDate, pendingQueue, attendanceStatus } = get();
    saveToDisk({ cachedUsers, cachedGatePasses, gatePassCacheDate, pendingQueue, attendanceStatus });
  }

  return {
    cachedUsers: {},
    cachedGatePasses: [],
    gatePassCacheDate: '',
    pendingQueue: [],
    attendanceStatus: {},
    _loaded: false,

    load: async () => {
      const data = await loadFromDisk();
      if (data) {
        // Clear gate pass cache if date changed
        const today = new Date().toISOString().slice(0, 10);
        if (data.gatePassCacheDate !== today) {
          data.cachedGatePasses = [];
          data.gatePassCacheDate = '';
        }
        set({ ...data, _loaded: true });
      } else {
        set({ _loaded: true });
      }
    },

    cacheUser: (employeeId, user) => {
      set((s) => ({
        cachedUsers: { ...s.cachedUsers, [employeeId]: user },
      }));
      persist();
    },

    getCachedUser: (employeeId) => {
      return get().cachedUsers[employeeId];
    },

    getNextAction: (employeeId) => {
      const today = new Date().toISOString().slice(0, 10);
      const key = `${employeeId}:${today}`;
      const last = get().attendanceStatus[key];
      // If last action was CHECKIN, next should be CHECKOUT, and vice versa
      return last === 'CHECKIN' ? 'CHECKOUT' : 'CHECKIN';
    },

    recordAction: (employeeId, action) => {
      const today = new Date().toISOString().slice(0, 10);
      const key = `${employeeId}:${today}`;
      set((s) => ({
        attendanceStatus: { ...s.attendanceStatus, [key]: action },
      }));
      persist();
    },

    syncGatePasses: async (token) => {
      try {
        const passes = await syncApi.getGatePasses(token);
        const today = new Date().toISOString().slice(0, 10);
        set({ cachedGatePasses: passes, gatePassCacheDate: today });
        persist();
      } catch (e) {
        console.error('Gate pass sync failed:', e);
      }
    },

    getCachedPass: (accessCode) => {
      const { cachedGatePasses } = get();
      return cachedGatePasses.find(
        (p) => p.accessCode.toUpperCase() === accessCode.toUpperCase(),
      );
    },

    markPassUsed: (accessCode, action) => {
      set((s) => ({
        cachedGatePasses: s.cachedGatePasses.map((p) => {
          if (p.accessCode.toUpperCase() !== accessCode.toUpperCase()) return p;
          return action === 'CHECKIN'
            ? { ...p, checkedIn: new Date().toISOString() }
            : { ...p, checkedOut: new Date().toISOString() };
        }),
      }));
      persist();
    },

    addToQueue: (record) => {
      set((s) => ({ pendingQueue: [...s.pendingQueue, record] }));
      persist();
    },

    flushQueue: async (token) => {
      const { pendingQueue } = get();
      if (pendingQueue.length === 0) return;

      try {
        await syncApi.pushQueue(token, pendingQueue);
        set({ pendingQueue: [] });
        persist();
      } catch (e) {
        console.error('Queue flush failed, will retry later:', e);
      }
    },
  };
});
