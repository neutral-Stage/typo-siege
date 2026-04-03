export type PowerUpType = 'fire' | 'lightning' | 'shield' | 'chain';

export interface PowerUpState {
  type: PowerUpType;
  emoji: string;
  charge: number;
  maxCharge: number;
  key: string;
}

export const POWER_UP_CONFIG: Record<PowerUpType, Omit<PowerUpState, 'charge'>> = {
  fire:      { type: 'fire',      emoji: '🔥', maxCharge: 40, key: '1' },
  lightning: { type: 'lightning', emoji: '⚡', maxCharge: 25, key: '2' },
  shield:    { type: 'shield',    emoji: '🛡️', maxCharge: 35, key: '3' },
  chain:     { type: 'chain',     emoji: '💥', maxCharge: 30, key: '4' },
};

export function createPowerUps(): PowerUpState[] {
  return Object.values(POWER_UP_CONFIG).map(cfg => ({ ...cfg, charge: 0 }));
}

export function chargeAmount(wordLength: number, difficulty: number): number {
  return Math.ceil(wordLength * difficulty * 3);
}

export function distributeCharge(powerUps: PowerUpState[], amount: number): void {
  const perUp = Math.ceil(amount / powerUps.length);
  for (const pu of powerUps) {
    pu.charge = Math.min(pu.maxCharge, pu.charge + perUp);
  }
}

export function usePowerUp(powerUps: PowerUpState[], type: PowerUpType): boolean {
  const pu = powerUps.find(p => p.type === type);
  if (!pu || pu.charge < pu.maxCharge) return false;
  pu.charge = 0;
  return true;
}

export function isPowerUpKey(key: string, powerUps: PowerUpState[]): PowerUpType | null {
  const match = powerUps.find(p => p.key === key);
  return match && match.charge >= match.maxCharge ? match.type : null;
}

export function isPowerUpActivation(key: string, powerUps: PowerUpState[]): boolean {
  return powerUps.some(p => p.key === key);
}
