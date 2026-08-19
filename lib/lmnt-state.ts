import fs from 'fs';
import path from 'path';

export interface LmntKeyItem {
  id: string;
  key: string;
  name: string;
  status: 'active' | 'quota_exceeded' | 'invalid';
  charsGenerated: number;
  lastUsedAt?: string;
  errorCount: number;
}

export interface LmntSessionState {
  playgroundSessionToken?: string;
  cookieHeader?: string;
  updatedAt?: string;
  status: 'active' | 'expired' | 'none';
  generationCount: number;
}

export interface EngineConfig {
  priorities: ('playground' | 'api_pool' | 'edge_tts')[];
  session: LmntSessionState;
  keys: LmntKeyItem[];
  currentKeyIndex: number;
}

const STATE_FILE_PATH = path.join(process.cwd(), 'lmnt_engine_state.json');

const DEFAULT_STATE: EngineConfig = {
  priorities: ['playground', 'api_pool', 'edge_tts'],
  session: {
    status: 'none',
    generationCount: 0
  },
  keys: [
    {
      id: 'key-default',
      key: process.env.LMNT_API_KEY || 'ak_nhWTGWch6HYmgfodtppQzZ',
      name: 'Chave Master Primária',
      status: 'active',
      charsGenerated: 0,
      errorCount: 0
    }
  ],
  currentKeyIndex: 0
};

export function getEngineState(): EngineConfig {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = fs.readFileSync(STATE_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      // Ensure master env key exists
      if (process.env.LMNT_API_KEY && !parsed.keys.some((k: LmntKeyItem) => k.key === process.env.LMNT_API_KEY)) {
        parsed.keys.unshift({
          id: 'key-env',
          key: process.env.LMNT_API_KEY,
          name: 'Chave Env Master',
          status: 'active',
          charsGenerated: 0,
          errorCount: 0
        });
      }
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch (err) {
    console.error('Error reading engine state:', err);
  }
  return DEFAULT_STATE;
}

export function saveEngineState(state: EngineConfig): void {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving engine state:', err);
  }
}

export function updateLmntSession(token: string, cookie?: string): LmntSessionState {
  const state = getEngineState();
  state.session = {
    playgroundSessionToken: token,
    cookieHeader: cookie || '',
    updatedAt: new Date().toISOString(),
    status: 'active',
    generationCount: state.session.generationCount || 0
  };
  saveEngineState(state);
  return state.session;
}

export function getActiveApiKey(): string | null {
  const state = getEngineState();
  const activeKeys = state.keys.filter(k => k.status === 'active');
  if (activeKeys.length === 0) return null;
  
  const index = (state.currentKeyIndex || 0) % activeKeys.length;
  const selectedKey = activeKeys[index];
  
  // Rotate index for round-robin
  state.currentKeyIndex = (index + 1) % activeKeys.length;
  saveEngineState(state);
  
  return selectedKey.key;
}

export function reportKeyQuotaExceeded(keyStr: string): void {
  const state = getEngineState();
  const target = state.keys.find(k => k.key === keyStr);
  if (target) {
    target.status = 'quota_exceeded';
    target.errorCount = (target.errorCount || 0) + 1;
    saveEngineState(state);
  }
}
