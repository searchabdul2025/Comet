import { getSetting } from './settings';

const DEFAULT_RATE_LIMIT = 15;
const DEFAULT_MAX_LENGTH = 500;
const DEFAULT_HISTORY_LIMIT = 50;

function parseNumber(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export async function getChatLimits() {
  const [rateLimitRaw, maxLengthRaw, historyLimitRaw] = await Promise.all([
    getSetting('CHAT_RATE_LIMIT_PER_MINUTE'),
    getSetting('CHAT_MESSAGE_MAX_LENGTH'),
    getSetting('CHAT_HISTORY_LIMIT'),
  ]);

  return {
    rateLimitPerMinute: parseNumber(rateLimitRaw, DEFAULT_RATE_LIMIT),
    maxMessageLength: parseNumber(maxLengthRaw, DEFAULT_MAX_LENGTH),
    historyLimit: parseNumber(historyLimitRaw, DEFAULT_HISTORY_LIMIT),
  };
}

export const CHAT_DEFAULTS = {
  rateLimitPerMinute: DEFAULT_RATE_LIMIT,
  maxMessageLength: DEFAULT_MAX_LENGTH,
  historyLimit: DEFAULT_HISTORY_LIMIT,
};












