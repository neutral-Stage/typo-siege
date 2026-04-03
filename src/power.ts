export type PowerUpType = 'fire' | 'lightning' | 'shield' | 'chain';

export interface PowerUpState {
  type: PowerUpType;
  emoji: string;
  charge: number;
  maxCharge: number;
  key: string;
  stacks: number; // How many times you can use it
}

export const POWER_UP_CONFIG: Record<PowerUpType, Omit<PowerUpState, 'charge' | 'stacks'>> = {
  fire:      { type: 'fire',      emoji: '🔥', maxCharge: 40, key: '1' },
  lightning: { type: 'lightning', emoji: '⚡', maxCharge: 25, key: '2' },
  shield:    { type: 'shield',    emoji: '🛡️', maxCharge: 35, key: '3' },
  chain:     { type: 'chain',     emoji: '💥', maxCharge: 30, key: '4' },
};

export function createPowerUps(): PowerUpState[] {
  return Object.values(POWER_UP_CONFIG).map(cfg => ({ ...cfg, charge: 0, stacks: 0 }));
}

export function chargeAmount(wordLength: number, difficulty: number): number {
  return Math.ceil(wordLength * difficulty * 3);
}

export function distributeCharge(powerUps: PowerUpState[], amount: number): void {
  const perUp = Math.ceil(amount / powerUps.length);
  for (const pu of powerUps) {
    pu.charge += perUp;
    // Convert overflow charge into stacks
    while (pu.charge >= pu.maxCharge) {
      pu.charge -= pu.maxCharge;
      pu.stacks++;
    }
  }
}

/** Use one stack of a power-up. Returns true if successful. */
export function usePowerUp(powerUps: PowerUpState[], type: PowerUpType): boolean {
  const pu = powerUps.find(p => p.type === type);
  if (!pu || pu.stacks <= 0) return false;
  pu.stacks--;
  return true;
}

/** Check if a power-up key should trigger (has stacks available) */
export function isPowerUpKey(key: string, powerUps: PowerUpState[]): PowerUpType | null {
  const match = powerUps.find(p => p.key === key);
  return match && match.stacks > 0 ? match.type : null;
}
