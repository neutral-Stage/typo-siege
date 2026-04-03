export type PowerUpType = 'fire' | 'lightning' | 'shield' | 'chain';

export interface PowerUpState {
  type: PowerUpType;
  emoji: string;
  charge: number;       // 0-100
  maxCharge: number;    // charge needed to activate
  active: boolean;
  key: string;          // keyboard key to activate
}

export const POWER_UP_CONFIG: Record<PowerUpType, Omit<PowerUpState, 'charge' | 'active'>> = {
  fire: { type: 'fire', emoji: '🔥', maxCharge: 100, key: 'q' },
  lightning: { type: 'lightning', emoji: '⚡', maxCharge: 60, key: 'w' },
  shield: { type: 'shield', emoji: '🛡️', maxCharge: 80, key: 'e' },
  chain: { type: 'chain', emoji: '💥', maxCharge: 70, key: 'r' },
};

export function createPowerUps(): PowerUpState[] {
  return Object.values(POWER_UP_CONFIG).map(cfg => ({
    ...cfg,
    charge: 0,
    active: false,
  }));
}

export function chargeFromWord(wordLength: number, difficulty: number): number {
  return Math.ceil(wordLength * difficulty * 1.5);
}
