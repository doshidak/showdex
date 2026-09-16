import { describe, expect, it } from 'vitest';
import { sanitizeField } from './sanitizeField';

const battle = (
  pseudoWeather: [name: string, minTimeLeft: number, maxTimeLeft: number][],
  p1Volatiles: Record<string, unknown> = {},
  p2Volatiles: Record<string, unknown> = {},
) => ({
  pseudoWeather,
  p1: { active: [{ volatiles: p1Volatiles }] },
  p2: { active: [{ volatiles: p2Volatiles }, null] },
}) as unknown as Partial<Showdown.Battle>;

describe('sanitizeField() — Mud Sport & Water Sport', () => {
  it('detects them as pseudo-weather in gens 6+', () => {
    const field = sanitizeField(battle([['Mud Sport', 0, 5], ['Water Sport', 0, 5]]));

    expect(field.isMudSport).toBe(true);
    expect(field.isWaterSport).toBe(true);
  });

  it('detects them as volatiles on any active Pokemon in gens 3-5', () => {
    const field = sanitizeField(battle([], {}, { watersport: ['watersport'] }));

    expect(field.isMudSport).toBe(false);
    expect(field.isWaterSport).toBe(true);
  });

  it('is off when neither is present', () => {
    const field = sanitizeField(battle([['Gravity', 0, 5]]));

    expect(field.isGravity).toBe(true);
    expect(field.isMudSport).toBe(false);
    expect(field.isWaterSport).toBe(false);
  });

  it('is off w/o a battle', () => {
    expect(sanitizeField().isMudSport).toBe(false);
  });
});
