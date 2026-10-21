import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOTAL_DAYS } from './topics';

export interface HistoryEntry {
  id: number; // 话题 id
  date: string; // 抽取日期 YYYY-MM-DD
}

export interface AppState {
  startDate: string | null; // 旅程开始日期 YYYY-MM-DD
  used: number[]; // 已抽取过的话题 id（永不重复）
  history: HistoryEntry[]; // 抽取历史（新的在前）
  favs: number[]; // 收藏的话题 id
  lastTopicId: number | null; // 最近一次抽到的话题
  selectedMonth: number | null; // 玩家选择的主题月份（null = 跟随真实日期）
}

export const DEFAULT_STATE: AppState = {
  startDate: null,
  used: [],
  history: [],
  favs: [],
  lastTopicId: null,
  selectedMonth: null,
};

const KEY = '@hearttalk/state/v1';
let pendingWrite: Promise<void> = Promise.resolve();

function enqueueWrite(operation: () => Promise<void>): Promise<void> {
  const result = pendingWrite.catch(() => {}).then(operation);
  pendingWrite = result;
  return result;
}

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveState(state: AppState): Promise<void> {
  const snapshot = JSON.stringify(state);
  await enqueueWrite(() => AsyncStorage.setItem(KEY, snapshot));
}

export async function resetState(): Promise<void> {
  await enqueueWrite(() => AsyncStorage.removeItem(KEY));
}

export function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// 旅程进行到第几天（1 ~ TOTAL_DAYS）
export function dayNumber(startDate: string): number {
  const [y, m, d] = startDate.split('-').map(Number);
  const start = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.floor((today - start) / 86400000) + 1;
  return Math.min(Math.max(diff, 1), TOTAL_DAYS);
}

export function formatDateCN(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${y}年${Number(m)}月${Number(d)}日`;
}
