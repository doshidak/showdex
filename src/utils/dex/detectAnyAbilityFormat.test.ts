import { describe, expect, it } from 'vitest';
import { detectAnyAbilityFormat } from './detectAnyAbilityFormat';

describe('detectAnyAbilityFormat()', () => {
  it('detects every Hackmons variant', () => {
    expect(detectAnyAbilityFormat('gen9balancedhackmons')).toBe(true);
    expect(detectAnyAbilityFormat('gen9purehackmons')).toBe(true);
    expect(detectAnyAbilityFormat('gen9hackmonscup')).toBe(true);
    expect(detectAnyAbilityFormat('gen9doubleshackmonscup')).toBe(true);
  });

  it('detects every Almost Any Ability variant', () => {
    expect(detectAnyAbilityFormat('gen9almostanyability')).toBe(true);
    expect(detectAnyAbilityFormat('gen9tiershiftaaa')).toBe(true);
    expect(detectAnyAbilityFormat('gen9nationaldexaaa')).toBe(true);
    expect(detectAnyAbilityFormat('gen9aaaubers')).toBe(true);
  });

  it('detects Inheritance', () => {
    expect(detectAnyAbilityFormat('gen9inheritance')).toBe(true);
  });

  it('accepts display names too', () => {
    expect(detectAnyAbilityFormat('[Gen 9] Balanced Hackmons')).toBe(true);
  });

  it('ignores formats w/ normal ability legality', () => {
    expect(detectAnyAbilityFormat('gen9ou')).toBe(false);
    expect(detectAnyAbilityFormat('gen9randombattle')).toBe(false);
    expect(detectAnyAbilityFormat('gen9championsvgc2026regma')).toBe(false);
    expect(detectAnyAbilityFormat(9)).toBe(false);
    expect(detectAnyAbilityFormat(null)).toBe(false);
  });
});
