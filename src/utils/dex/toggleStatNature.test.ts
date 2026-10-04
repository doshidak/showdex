import { describe, expect, it } from 'vitest';
import { toggleStatNature } from './toggleStatNature';

describe('toggleStatNature()', () => {
  it('boosts stat from neutral nature with sensible default lowered stat', () => {
    expect(toggleStatNature('Hardy', 'atk', '+')).toBe('Adamant');
    expect(toggleStatNature('Hardy', 'spa', '+')).toBe('Modest');
    expect(toggleStatNature('Hardy', 'spe', '+')).toBe('Timid');
    expect(toggleStatNature('Hardy', 'def', '+')).toBe('Bold');
    expect(toggleStatNature('Hardy', 'spd', '+')).toBe('Calm');
  });

  it('lowers stat from neutral nature with sensible default boosted stat', () => {
    expect(toggleStatNature('Hardy', 'spa', '-')).toBe('Adamant');
    expect(toggleStatNature('Hardy', 'atk', '-')).toBe('Modest');
    expect(toggleStatNature('Hardy', 'spe', '-')).toBe('Quiet');
    expect(toggleStatNature('Hardy', 'def', '-')).toBe('Mild');
    expect(toggleStatNature('Hardy', 'spd', '-')).toBe('Rash');
  });

  it('removes boost and reverts to neutral Hardy when clicking + on an already boosted stat', () => {
    expect(toggleStatNature('Adamant', 'atk', '+')).toBe('Hardy');
    expect(toggleStatNature('Modest', 'spa', '+')).toBe('Hardy');
    expect(toggleStatNature('Jolly', 'spe', '+')).toBe('Hardy');
  });

  it('removes cut and reverts to neutral Hardy when clicking - on an already lowered stat', () => {
    expect(toggleStatNature('Adamant', 'spa', '-')).toBe('Hardy');
    expect(toggleStatNature('Modest', 'atk', '-')).toBe('Hardy');
    expect(toggleStatNature('Brave', 'spe', '-')).toBe('Hardy');
  });

  it('re-targets boosted stat while keeping existing lowered stat', () => {
    // Adamant (+Atk, -SpA) + 'spe' -> Jolly (+Spe, -SpA)
    expect(toggleStatNature('Adamant', 'spe', '+')).toBe('Jolly');
    // Modest (+SpA, -Atk) + 'spe' -> Timid (+Spe, -Atk)
    expect(toggleStatNature('Modest', 'spe', '+')).toBe('Timid');
  });

  it('re-targets lowered stat while keeping existing boosted stat', () => {
    // Adamant (+Atk, -SpA) - 'spe' -> Brave (+Atk, -Spe)
    expect(toggleStatNature('Adamant', 'spe', '-')).toBe('Brave');
    // Modest (+SpA, -Atk) - 'spe' -> Quiet (+SpA, -Spe)
    expect(toggleStatNature('Modest', 'spe', '-')).toBe('Quiet');
  });

  it('flips orientation when setting opposite modifier on currently modified stat', () => {
    // Modest (+SpA, -Atk) with + 'atk' flips to Adamant (+Atk, -SpA)
    expect(toggleStatNature('Modest', 'atk', '+')).toBe('Adamant');
    // Adamant (+Atk, -SpA) with - 'atk' flips to Modest (+SpA, -Atk)
    expect(toggleStatNature('Adamant', 'atk', '-')).toBe('Modest');
  });

  it('preserves attacker orientation when lowering Spe from a speed-boosting nature', () => {
    // Jolly (+Spe, -SpA) -> lowering speed gives Brave (+Atk, -Spe)
    expect(toggleStatNature('Jolly', 'spe', '-')).toBe('Brave');
    // Timid (+Spe, -Atk) -> lowering speed gives Quiet (+SpA, -Spe)
    expect(toggleStatNature('Timid', 'spe', '-')).toBe('Quiet');
  });

  it('ignores hp and returns unchanged nature', () => {
    expect(toggleStatNature('Adamant', 'hp' as any, '+')).toBe('Adamant');
    expect(toggleStatNature('Modest', 'hp' as any, '-')).toBe('Modest');
  });

  it('handles undefined current nature gracefully', () => {
    expect(toggleStatNature(undefined, 'atk', '+')).toBe('Adamant');
    expect(toggleStatNature(undefined, 'spa', '-')).toBe('Adamant');
  });
});
