/**
 * @file `CalcdexPreactBattle.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import type * as ReactDOM from 'react-dom/client';
import { NIL as NIL_UUID } from 'uuid';
import { calcdexSlice } from '@showdex/redux/store';
import { detectAuthPlayerKeyFromBattle } from '@showdex/utils/battle';
import { calcBattleCalcdexNonce } from '@showdex/utils/calc';
import { logger, wtf } from '@showdex/utils/debug';
import { detectPreactHost } from '@showdex/utils/host';
import { BootdexManager as Manager } from '../Bootdex/BootdexManager';
import { BootdexPreactAdapter as Adapter } from '../Bootdex/BootdexPreactAdapter';
import { BootdexPreactBootstrappable, preact } from '../Bootdex/BootdexPreactBootstrappable';
import { type CalcdexBootstrappable } from './CalcdexBootstrappable';
// import { CalcdexPreactBattleSide } from './CalcdexPreactBattleSide';
import { type CalcdexPreactRoom } from './CalcdexPreactPanel';

const l = logger('@showdex/pages/Calcdex/CalcdexPreactBattle');

// note: same Showdown.Battle class is used on both 'classic' & 'preact' __SHOWDEX_HOST's
const { Battle } = window;

/**
 * *hell ... it's about time* (... that Showdex properly `extends` the `Showdown.Battle` class instead of directly poking at it LOL.)
 *
 * * Note that we store some Calcdex values in the `Showdown.Battle` itself since the `CalcdexBootstrappable`'s are frequently
 *   recreated (e.g., `new`'d once for some function), so any non-`static` prop values won't be presered obvi (hence we store them here!).
 *   - Otherwise this is just a vanilla `Showdown.Battle` class.
 *
 * @todo technically has no dependency on `'preact'` `__SHOWDEX_HOST`'s, but opting to keep this separate from the `'classic'`
 *   `__SHOWDEX_HOST` for now (as of v1.3.0) in case this breaks everything ... *again* hehe
 * @todo remove the injected `calcdex*` props definitions (& rename `nonce`) in the `battle.d.ts` after refactoring this
 *   into `CalcdexHostBattle`.
 * @since 1.3.0
 */
export class CalcdexPreactBattle extends Battle {
  public static readonly scope = l.scope;

  /** `RoomID` of the `CalcdexPreactPanel`, only used when the `calcdexAsOverlay` is `false` (i.e., `'panel'` `renderMode`). */
  public calcdexRoomId?: Showdown.RoomID = null;
  /** Populated by the `CalcdexPreactBattlePanel` when the `calcdexAsOverlay` is `true` (i.e., `'overlay'` `renderMode`). */
  public calcdexReactRoot?: ReactDOM.Root = null;
  /** Also populated by the `CalcdexPreactBattlePanel` when the `calcdexAsOverlay` is `true` (i.e., `'overlay'` `renderMode`). */
  public calcdexReactRef?: React.RefObject<HTMLDivElement> = { current: null };
  /** Populated by the `CalcdexPreactBootstrapper` & invoked by the `CalcdexPreactBattlePanel` for Calcdexes of any `renderMode`. */
  public calcdexReactRenderer?: () => void = null;
  public calcdexAsOverlay = false;
  /** Whether the Calcdex shouldn't initialize (like AT ALL!) for this battle :o */
  public calcdexDisabled = false;
  /** Whether the `CalcdexBootstrappable` did its " *t h i n g* " o_O */
  public calcdexInit = false;
  /** Whether the `CalcdexSliceState` for this battle is `init()`'d in Redux & ready to *Stealth Rock* & *Rollout*. */
  public calcdexStateInit = false;
  /** Whether the `CalcdexBootstrappable`'s `patchCalcdexIdentifier()` patch has been applied to this here `Showdown.Battle`. */
  public calcdexIdPatched = false;
  /**
   * Whether the Calcdex along w/ all of its Redux slice data & rendered DOM elements are yeeted from memory
   * (& if `true`, should disregard any other `calcdex*` prop!).
   */
  public calcdexDestroyed = false;
  public calcdexSheetsAccepted = false;
  /** Whether this battle was already recorded into the Hellodex battle win/loss record. */
  public calcdexBattleRecorded = false;

  /** Populated by the `CalcdexPreactBootstrapper`'s `patchCalcdexIdentifier()` & invoked by the `CalcdexPreactBattleSide`'s `addPokemon()`. */
  public calcdexClientIdPatcher?: CalcdexBootstrappable['patchClientCalcdexIdentifier'] = null;
  public calcdexWinHandler?: (winner?: string) => void = null;

  /* public static fromBattle(
    battle: Showdown.Battle,
    battleRoom?: Showdown.BattleRoom,
  ) {
    if (!battle?.id) {
      return null;
    }

    const calcdexBattle = new this({
      ...battle, // note: this only copies *some* props from the `battle`, e.g., id, autoresize, isReplay, etc.
      $frame: battle.scene.$frame,
      $logFrame: $(battle.scene.log.elem),
      log: battleRoom?.backlog?.map((logs) => `|${logs?.join('|') || ''}`),
    });

    // ({ scene: calcdexBattle.scene } = battle);

    return calcdexBattle;
  } */

  public constructor(options: ConstructorParameters<typeof Battle>[0] = {}) {
    super(options);

    // note: other instance props like calcdexReady 'n such will be directly mutated from the outside
    const { hasSinglePanel } = BootdexPreactBootstrappable;

    this.calcdexDisabled = this.calcdexSettings?.openOnStart === 'never'
      || (this.calcdexSettings?.openOnStart === 'playing' && !this.calcdexAuthPlayerKey)
      || (this.calcdexSettings?.openOnStart === 'spectating' && !!this.calcdexAuthPlayerKey);

    if (this.calcdexDisabled) {
      return;
    }

    // note: 'showdown' is the *Auto* openAs (i.e., "match Showdown's layout"), so it's the one that should defer
    // to hasSinglePanel() -- the guard has to exclude 'panel' (an explicit "always a panel tab"), not 'showdown'.
    // excluding 'showdown' inverted both: Auto never consulted hasSinglePanel() (so it always opened as a panel
    // tab, even in single-panel mode) & an explicit 'panel' *did* (so it could open as an overlay against the
    // user's wishes). only 'overlay' behaved. see calcdex.openAs.options.showdown.tooltip for the contract.
    this.calcdexAsOverlay = this.calcdexSettings?.openAs === 'overlay'
      || (this.calcdexSettings?.openAs !== 'panel' && hasSinglePanel());

    if (this.calcdexAsOverlay) {
      this.calcdexReactRef = preact.createRef<HTMLDivElement>();

      return;
    }

    // note: this is for 'panel' renderMode's only!!
    this.calcdexRoomId = `calcdex-${this.id}` as Showdown.RoomID;
  }

  public get calcdexNonce() {
    return this.id && !this.calcdexDisabled /* && (this.calcdexInit || this.calcdexStateInit) */
      ? calcBattleCalcdexNonce(this) || NIL_UUID
      : null;
  }

  public get calcdexAuthPlayerKey() {
    return detectAuthPlayerKeyFromBattle(this);
  }

  public get calcdexState() {
    return Adapter.rootState?.calcdex?.[this.id];
  }

  public get calcdexSettings() { // eslint-disable-line class-methods-use-this
    return Adapter.rootState?.showdex?.settings?.calcdex;
  }

  public get calcdexRoom() {
    if (!detectPreactHost(window)) {
      return null;
    }

    return window.PS.rooms?.[this.calcdexRoomId] as CalcdexPreactRoom;
  }

  public runCalcdex() {
    l.debug('runCalcdex()', this.id, '(init)', this.calcdexInit, '(state)', this.calcdexStateInit);

    if (
      !detectPreactHost(window)
        || !this.id
        || this.calcdexInit
        || typeof this.subscription !== 'function'
    ) {
      return;
    }

    Manager.runCalcdex(this.id);
  }

  public override run(str: string, preempt?: boolean): void {
    super.run(str, preempt);

    if (this.calcdexDisabled || this.calcdexInit) {
      return;
    }

    this.runCalcdex();
  }

  /**
   * Unmounts & clears any references to DOM elements associated w/ rendering this battle's Calcdex.
   *
   * @since 1.3.0
   */
  public destroyCalcdexDom() {
    if (!detectPreactHost(window)) {
      return;
    }

    l.debug(
      'destroyCalcdexDom()', 'for the CalcdexPreactBattle', this.id,
      '\n', 'calcdexReactRoot', this.calcdexReactRoot,
      '\n', 'calcdexReactRef', this.calcdexReactRef,
      '\n', 'calcdexReactRenderer', '(typeof)', wtf(this.calcdexReactRenderer),
    );

    if (typeof this.calcdexReactRoot?.unmount !== 'function') {
      return;
    }

    this.calcdexReactRoot.unmount();
    this.calcdexReactRoot = null;
    this.calcdexReactRef = { current: null };
    this.calcdexReactRenderer = null;
  }

  /**
   * Destroys the Redux `CalcdexSliceState` of this battle's Calcdex.
   *
   * * Not `force`'ing will respect the user's `calcdexSettings`, specifically `destroyOnClose`,
   *   when the `renderMode` of this battle's Calcdex is `'panel'`.
   * * `force` has no effect when the Calcdex's `renderMode` is `'overlay'`.
   *
   * @since 1.3.0
   */
  public destroyCalcdexState(force?: boolean) {
    if (!detectPreactHost(window)) {
      return;
    }

    l.debug(
      'destroyCalcdexState()', 'for the CalcdexPreactBattle', this.id,
      '\n', 'force?', force,
      '\n', 'calcdexStateInit?', this.calcdexStateInit,
      '\n', 'calcdexAsOverlay?', this.calcdexAsOverlay,
      '\n', 'settings.destroyOnClose?', this.calcdexSettings?.destroyOnClose,
    );

    if (
      !this.id
        || !this.calcdexStateInit
        || (!this.calcdexAsOverlay && !force && !this.calcdexSettings?.destroyOnClose)
    ) {
      return;
    }

    Adapter.store.dispatch(calcdexSlice.actions.destroy(this.id));
    this.calcdexStateInit = false;
  }

  /**
   * Destroys data for this battle & its associated Calcdex from memory.
   *
   * * `force` (defaults to `true` when this is called w/out any args) is passed to the `destroyCalcdexState()`.
   *
   * @since 1.3.0
   */
  public override destroy(force = true): void {
    if (!detectPreactHost(window) || this.calcdexDestroyed) {
      return void super.destroy();
    }

    l.debug(
      'destroy()', 'called for the CalcdexPreactBattle', this.id,
      '\n', 'force?', force,
      '\n', 'battle', this,
    );

    this.destroyCalcdexDom();
    this.destroyCalcdexState(force);
    this.calcdexDestroyed = !this.calcdexReactRoot && !this.calcdexStateInit;

    // this basically calls destroy() on this.sprite (if it exists), then nulls both that & this.side
    super.destroy();
  }
}
