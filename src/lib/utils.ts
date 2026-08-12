import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function jitter(min: number, max: number) {
  return sleep(min + Math.random() * (max - min));
}

export function fmtTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function summarizeText(text: string, maxLen = 40): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > maxLen ? `${clean.slice(0, maxLen).trimEnd()}…` : clean;
}

export function namePrefix(name: string, maxLen = 16): string {
  const firstWord = name.trim().split(/\s+/)[0] ?? name;
  return firstWord.length > maxLen ? firstWord.slice(0, maxLen) : firstWord;
}

export function computeIQR(values: number[]): { q1: number; median: number; q3: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return { q1: 0, median: 0, q3: 0 };
  const median = sorted[Math.floor(n / 2)];
  const q1 = sorted[Math.floor(n / 4)];
  const q3 = sorted[Math.floor((3 * n) / 4)];
  return { q1, median, q3 };
}
