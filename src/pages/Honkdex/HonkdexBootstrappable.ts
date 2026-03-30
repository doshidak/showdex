/**
 * @file `HonkdexBootstrappable.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

/* eslint-disable max-classes-per-file */

import { v4 as uuidv4 } from 'uuid';
import { type GenerationNum } from '@smogon/calc';
import { calcdexSlice } from '@showdex/redux/store';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { purgeHonksDb } from '@showdex/utils/storage';
import { detectDoublesFormat, getGenfulFormat } from '@showdex/utils/dex';
import { BootdexBootstrappable } from '../Bootdex/BootdexBootstrappable';

export type HonkdexBootstrappableLike =
  & Omit<typeof HonkdexBootstrappable, 'constructor'>
  & (new (instanceId?: string, gen?: GenerationNum, format?: string) => HonkdexBootstrappable);

const l = logger('@showdex/pages/Honkdex/HonkdexBootstrappable');

const defaultGen = env.int<GenerationNum>('honkdex-default-gen', env.int<GenerationNum>('calcdex-default-gen', null));
const defaultFormat = env('honkdex-default-format');

// note: in 'standalone' mode, maxPokemon will extend by the HONKDEX_PLAYER_EXTEND_POKEMON value when the length of
// the pokemon[] exceeds the current value; HONKDEX_PLAYER_MIN_POKEMON is the minimum shown Pokemon in the UI,
// hence it's also the initial value during state initialization
const maxPokemon = env.int('honkdex-player-min-pokemon', 0);

export const MixinHonkdexBootstrappable = <
  TBootstrappable extends typeof BootdexBootstrappable,
>(
  Bootstrappable: TBootstrappable,
) => {
  abstract class HonkdexBootstrappableMixin extends (Bootstrappable as typeof BootdexBootstrappable & InstanceType<TBootstrappable>) {
    public readonly instanceId: string;
    public readonly gen: GenerationNum;
    public readonly format: string;

    public constructor(
      instanceId = uuidv4(),
      gen?: GenerationNum,
      format?: string,
    ) {
      super();

      this.instanceId = instanceId;

      // Check if state exists for this ID
      const state = this.calcdexState;

      // Prioritize passed values, then state values. Otherwise, use the default.
      this.gen = gen ?? state?.gen ?? defaultGen;
      const targetFormat = format ?? state?.format ?? defaultFormat;
      this.format = getGenfulFormat(this.gen, targetFormat);

      // Now perform the sanity check
      if (this.calcdexState?.battleId && this.calcdexState.gen !== this.gen) {
        this.instanceId = uuidv4();
      }
    }

    public get calcdexState() {
      return HonkdexBootstrappableMixin.Adapter?.rootState?.calcdex?.[this.instanceId];
    }

    /**
     * Prepares a `CalcdexBattleState` for this Honkdex instance, or no-op's if one already exists.
     *
     * @since 1.3.0
     */
    protected prepare(): void {
      this.startTimer();

      if (!this.instanceId) {
        return void this.endTimer('(bad instanceId)');
      }

      const { Adapter } = HonkdexBootstrappableMixin;

      if (this.calcdexState?.battleId === this.instanceId) {
        return void this.endTimer('(already prepared)');
      }

      Adapter.store.dispatch(calcdexSlice.actions.init({
        scope: l.scope,

        operatingMode: 'standalone',
        battleId: this.instanceId, // should've made an `id` prop in hindsight, so recycling battleId v_v
        gen: this.gen,
        format: this.format,
        gameType: detectDoublesFormat(this.format) ? 'Doubles' : 'Singles',
        turn: 0,
        active: false, // technically not an active battle!
        renderMode: 'panel', // always rendered inside of a 'panel' in 'standalone' mode
        playerKey: 'p1',
        opponentKey: 'p2',
        switchPlayers: false,

        p1: {
          name: 'Side A', // these don't matter; won't show up in the UI
          rating: -1,
          active: true,
          maxPokemon,
        },

        p2: {
          name: 'Side B',
          rating: -1,
          active: true,
          maxPokemon,
        },
      }));
    }

    /**
     * Creates or opens an existing Honkdex tab for this instance.
     *
     * @since 1.2.0
     */
    public abstract open(): void;

    /**
     * Removes all traces of the associated Honkdex.
     *
     * * Removal involves the following steps:
     *   - Leaving the room (if applicable),
     *   - Destroying it from the `CalcdexSliceState`, &
     *   - Finally purging it from Showdex's IndexedDB honks store.
     *
     * @since 1.2.0
     */
    public destroy(): void {
      if (!this.instanceId) {
        return;
      }

      const { Adapter } = HonkdexBootstrappableMixin;

      this.close();
      Adapter.store.dispatch(calcdexSlice.actions.destroy(this.instanceId));
      void purgeHonksDb(this.instanceId);
    }
  }

  return HonkdexBootstrappableMixin;
};

export abstract class HonkdexBootstrappable extends MixinHonkdexBootstrappable(BootdexBootstrappable) {
  public static override readonly scope = l.scope;
}
