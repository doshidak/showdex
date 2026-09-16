import {
  type GenerationNum,
  Field,
  Move,
  Pokemon,
  calculate,
} from '@smogon/calc';
import { type ShowdexCalcMods } from '@smogon/calc/dist/showdex';
import { describe, expect, it } from 'vitest';

// tests the Mud Sport & Water Sport mods in our @smogon/calc patch (see patches/@smogon__calc@0.11.0.patch)
const calcBasePower = (
  gen: GenerationNum,
  attacker: string,
  moveName: string,
  defender: string,
  mods?: ShowdexCalcMods,
) => {
  const result = calculate(
    gen,
    new Pokemon(gen, attacker, { evs: { spe: 252 } }),
    new Pokemon(gen, defender),
    new Move(gen, moveName),
    new Field(),
    mods,
  );

  return {
    basePower: result.rawDesc.moveBP,
    maxDamage: Math.max(...(result.damage as number[])),
  };
};

describe('@smogon/calc patch — Mud Sport & Water Sport', () => {
  it('halves Electric moves in gen 3 (Thunderbolt 95 -> 47)', () => {
    expect(calcBasePower(3, 'Jolteon', 'Thunderbolt', 'Vaporeon').basePower).toBe(95);
    expect(calcBasePower(3, 'Jolteon', 'Thunderbolt', 'Vaporeon', { isMudSport: true }).basePower).toBe(47);
  });

  it('halves Fire moves in gen 4, including dynamic BP moves (Eruption 150 -> 75)', () => {
    expect(calcBasePower(4, 'Typhlosion', 'Eruption', 'Snorlax').basePower).toBe(150);
    expect(calcBasePower(4, 'Typhlosion', 'Eruption', 'Snorlax', { isWaterSport: true }).basePower).toBe(75);
  });

  it('chains 1352/4096 w/ the other BP mods in gens 5+ (Thunderbolt 90 -> 30)', () => {
    const plain = calcBasePower(6, 'Jolteon', 'Thunderbolt', 'Vaporeon');
    const sport = calcBasePower(6, 'Jolteon', 'Thunderbolt', 'Vaporeon', { isMudSport: true });

    expect(plain.basePower).toBe(90);
    expect(sport.basePower).toBe(30);
    expect(sport.maxDamage).toBeLessThan(plain.maxDamage / 2);
  });

  it('applies to BP-calculating moves like Electro Ball & Heat Crash', () => {
    // Jolteon (361 Spe) is 3x+ faster than Snorlax (96 Spe) -> 120 BP; Emboar is 4x+ heavier than Jolteon -> 120 BP
    expect(calcBasePower(6, 'Jolteon', 'Electro Ball', 'Snorlax').basePower).toBe(120);
    expect(calcBasePower(6, 'Jolteon', 'Electro Ball', 'Snorlax', { isMudSport: true }).basePower).toBe(40);
    expect(calcBasePower(7, 'Emboar', 'Heat Crash', 'Jolteon').basePower).toBe(120);
    expect(calcBasePower(7, 'Emboar', 'Heat Crash', 'Jolteon', { isWaterSport: true }).basePower).toBe(40);
  });

  it('ignores moves of other types', () => {
    const sports = { isMudSport: true, isWaterSport: true };

    expect(calcBasePower(3, 'Vaporeon', 'Surf', 'Jolteon', sports).basePower).toBe(95);
    expect(calcBasePower(6, 'Vaporeon', 'Surf', 'Jolteon', sports).basePower).toBe(90);
    expect(calcBasePower(6, 'Jolteon', 'Thunderbolt', 'Vaporeon', { isWaterSport: true }).basePower).toBe(90);
  });
});
