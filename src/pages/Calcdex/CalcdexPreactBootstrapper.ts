/**
 * @file `CalcdexPreactBootstrapper.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import type * as ReactDOM from 'react-dom/client';
import { calcdexSlice } from '@showdex/redux/store';
import { formatId, nonEmptyObject } from '@showdex/utils/core';
import { logger, wtf } from '@showdex/utils/debug';
import { detectPreactHost } from '@showdex/utils/host';
import { BootdexPreactBootstrappable } from '../Bootdex/BootdexPreactBootstrappable';
import { MixinCalcdexBootstrappable } from './CalcdexBootstrappable';
import { CalcdexPreactBattle } from './CalcdexPreactBattle';
import { CalcdexPreactBattleForfeitPanel } from './CalcdexPreactBattleForfeitPanel';
import { CalcdexPreactBattlePanel, CalcdexPreactBattleRoom } from './CalcdexPreactBattlePanel';
import { CalcdexPreactBattleSide } from './CalcdexPreactBattleSide';
import { type CalcdexPreactRoom, CalcdexPreactPanel } from './CalcdexPreactPanel';
import { CalcdexDomRenderer } from './CalcdexRenderer';

const l = logger('@showdex/pages/Calcdex/CalcdexPreactBootstrapper');

export class CalcdexPreactBootstrapper extends MixinCalcdexBootstrappable(BootdexPreactBootstrappable) {
  public static override readonly scope = l.scope;

  // note: battleId = CalcdexPreactBattlePanel's id, roomId = CalcdexPreactPanel's id
  public readonly roomId: Showdown.RoomID;

  // note: omitting the battleId will perform the pre-run() stuff only
  public constructor(battleId?: string) {
    super(battleId);

    this.roomId = ((!!battleId && `calcdex-${battleId}`) || null) as Showdown.RoomID;
  }

  protected get battleRoom() {
    if (!detectPreactHost(window)) {
      return null;
    }

    return window.PS.rooms?.[this.battleId] as CalcdexPreactBattleRoom;
  }

  protected get battle() {
    return this.battleRoom?.battle;
  }

  protected get battleRequest() {
    // l.debug('battleRequest()', this.battleRoom?.request, '\n', 'battleRoom', this.battleRoom);

    return this.battleRoom?.request;
  }

  protected get calcdexRoom() {
    if (!detectPreactHost(window)) {
      return null;
    }

    return window.PS.rooms?.[this.roomId] as CalcdexPreactRoom;
  }

  protected override startTimer(): void {
    super.startTimer(CalcdexPreactBootstrapper.scope);
  }

  protected patchCalcdexIdentifier(): void {
    this.startTimer();

    if (!detectPreactHost(window)) {
      return void this.endTimer('(bad preact)', window.__SHOWDEX_HOST);
    }

    if (!this.battle?.id) {
      return void this.endTimer('(bad battle.id)');
    }

    if (this.battle.calcdexIdPatched) {
      return void this.endTimer('(already patched)');
    }

    this.battleRoom.calcdexServerIdPatcher = (myPokemon) => void this.patchServerCalcdexIdentifier(myPokemon);
    this.battle.calcdexClientIdPatcher = (pKey, add, argv) => this.patchClientCalcdexIdentifier(pKey, add, argv);
    this.battle.calcdexIdPatched = true;

    this.endTimer('(preact patch ok)');
  }

  protected renderCalcdex(dom: ReactDOM.Root): void {
    if (!detectPreactHost(window)) {
      return;
    }

    l.debug(
      'renderCalcdex()', 'for', this.battleId,
      '\n', 'dom', dom,
    );

    if (!this.battleId || !dom) {
      return;
    }

    const {
      Adapter,
      Manager,
      openUserPopup,
    } = CalcdexPreactBootstrapper as unknown as typeof BootdexPreactBootstrappable;

    CalcdexDomRenderer(dom, {
      store: Adapter.store,
      battleId: this.battleId,
      onUserPopup: openUserPopup,
      onRequestHellodex: () => void Manager?.openHellodex(),
      onRequestHonkdex: (id) => void Manager?.openHonkdex(id),
      onCloseOverlay: () => void this.battleRoom?.send('/calcdex overlay toggle'),
    });
  }

  public open(): void {
    if (!detectPreactHost(window) || !this.battleState?.battleId) {
      return;
    }

    const shouldFocusBattle = this.battleRoom?.id
      && (!window.PS.room?.id || window.PS.room.id !== this.battleRoom.id);

    if (this.battleState.renderMode === 'overlay') {
      if (!window.PS.rooms[this.battleId]?.id) {
        return void this.destroy();
      }

      if (shouldFocusBattle) {
        window.PS.focusRoom(this.battleRoom.id);
      }

      if (!shouldFocusBattle || !this.battleState.overlayVisible) {
        this.battleRoom.send('/calcdex overlay toggle');
      }

      return;
    }

    void (window.PS.rooms[this.roomId]?.id ? window.PS.focusRoom(this.roomId) : window.PS.join(this.roomId));

    // refocus the battleRoom that the tabbed Calcdex pertains to, if still joined
    if (shouldFocusBattle) {
      window.PS.focusRoom(this.battleRoom.id);
    }
  }

  public closeCalcdex(): void {
    if (!detectPreactHost(window) || !this.battleId || !nonEmptyObject(window.PS?.rooms)) {
      return;
    }

    if (this.calcdexRoom?.id) {
      window.PS.leave(this.roomId); // -> CalcdexPreactRoom:destroy()
    }
  }

  public close(): void {
    if (!detectPreactHost(window) || !this.battleId || !nonEmptyObject(window.PS?.rooms)) {
      return;
    }

    this.closeCalcdex();

    if (this.battleRoom?.id) {
      window.PS.leave(this.battleRoom.id); // -> CalcdexPreactBattleRoom:destroy() -> CalcdexPreactBattle:destroy()
    }
  }

  public destroy(): void {
    if (!detectPreactHost(window)) {
      return;
    }

    const { Adapter } = CalcdexPreactBootstrapper;

    l.debug(
      'destroy()', 'called for', this.battleId,
      '\n', 'room', this.battleRoom,
      '\n', 'battle', this.battle,
      '\n', 'state', this.battleState,
    );

    this.close();

    // in case close() ended up no-op'ing cause we're in neither the calcdexRoom nor the battleRoom,
    // we'll make sure to destroy the Calcdex state too at this point if it still exists
    if (!this.battleState?.battleId) {
      return;
    }

    Adapter.store.dispatch(calcdexSlice.actions.destroy(this.battleId));
  }

  public run(): void {
    this.startTimer();

    if (!detectPreactHost(window)) {
      return void this.endTimer('(bad preact)', window.__SHOWDEX_HOST);
    }

    l.silly(
      'Calcdex Preact bootstrapper was invoked;',
      'determining if there\'s anything to do...',
      '\n', 'battleId', this.battleId,
    );

    // note: the CalcdexPreactBattle that's instantiated from the original Showdown.Battle will determine the calcdexDisabled
    // value for the other openOnStart values
    // (CalcdexPreactBattlePanel -> CalcdexPreactBattleRoom -> CalcdexPreactBattle [via fromBattle(room.battle, room)])
    if (this.calcdexSettings?.openOnStart === 'never') {
      l.debug(
        'Calcdex Preact bootstrap request was ignored',
        'since it has been completely disabled by the user\'s settings.',
        '\n', 'battleId', this.battleId,
        '\n', 'settings.openOnStart', this.calcdexSettings.openOnStart, this.calcdexSettings,
      );

      return void this.endTimer('(calcdex denied)');
    }

    if (!this.battleId) {
      l.debug('Hard-swapping the Showdown.Battle for the CalcdexPreactBattle...');
      window.Battle = CalcdexPreactBattle;

      l.debug('Hard-swapping the Showdown.Side for the CalcdexPreactBattleSide...');
      window.Side = CalcdexPreactBattleSide;

      // this panel is for 'overlay' renderMode's
      l.debug(
        'Swapping the Showdown.BattlePanel for the CalcdexPreactBattlePanel',
        'by adding it to the PS.roomTypes...',
      );

      window.PS.addRoomType(CalcdexPreactBattlePanel);

      l.debug(
        'Swapping the Showdown.BattleForfeitPanel for the CalcdexPreactBattleForfeitPanel',
        'by adding it to the PS.roomTypes...',
      );

      window.PS.addRoomType(CalcdexPreactBattleForfeitPanel);

      // this panel is for 'panel' renderMode's (lol)
      l.debug('Adding the CalcdexPreactPanel to the PS.roomTypes...');
      window.PS.addRoomType(CalcdexPreactPanel);

      // rejoin any Showdown.BattleRoom's that we were in before this bootstrapped
      // (typically occurs when the user refreshes the page mid-battle, so we join the BattleRoom first)
      // (note: this is a lil jank & can leave the battle in some corrupted half-init state;
      // refreshing again seems to do trick LOL inb4 I break Showdown again)
      const existingBattleRooms = (Object.keys(window.PS.rooms) as Showdown.RoomID[])
        .filter((roomId) => roomId.startsWith('battle-'));

      l.debug('Reloading any existing Showdown.BattleRoom\'s...', existingBattleRooms);

      // note: we're only *visually* leaving the original Showdown.BattleRoom since calling PS.leave()
      // will also do more stuff like calling destroy() n stuff, hence this bit lol
      existingBattleRooms.forEach((roomId) => {
        const leftRoomIndex = window.PS.leftRoomList.indexOf(roomId);

        if (leftRoomIndex > -1) {
          window.PS.leftRoomList.splice(leftRoomIndex, 1);
        }

        const rightRoomIndex = window.PS.rightRoomList.indexOf(roomId);

        if (rightRoomIndex > -1) {
          window.PS.rightRoomList.splice(rightRoomIndex, 1);
        }

        delete window.PS.rooms[roomId];
        // window.PS.update(); // no need for this actually
        window.PS.join(roomId);
      });

      l.debug(
        'Bootstrapped the Calcdex Preact pre-bootstrap!',
        '\n', 'Battle', '(typeof)', wtf(window.Battle), window.Battle,
        '\n', 'Side', '(typeof)', wtf(window.Side), window.Side,
        '\n', 'PS.roomTypes', window.PS.roomTypes,
      );

      return void this.endTimer('(calcdex enabled)');
    }

    // at this point, the CalcdexPreactBootstrapper should've been instantiated w/ a battleId
    if (!this.battleId.startsWith?.('battle-')) {
      l.debug(
        'Calcdex Preact bootstrap request was ignored for', this.battleId,
        'since it\'s not targeting a Showdown.BattleRoom-like.',
      );

      return void this.endTimer('(wrong room)', this.battleId);
    }

    const { Adapter } = CalcdexPreactBootstrapper;

    if (!this.battle?.id) {
      if (!this.battleState?.battleId) {
        l.debug(
          'Calcdex Preact bootstrap request was ignored for', this.battleId,
          'since no proper Showdown.Battle-like exists within the current CalcdexPreactBattleRoom.',
          '\n', 'battle', '(typeof)', wtf(this.battle), this.battle,
          '\n', 'state', '(typeof)', wtf(this.battleState), this.battleState,
        );

        return void this.endTimer('(bad battle)', this.battleId);
      }

      if (this.battleState.active) {
        Adapter.store.dispatch(calcdexSlice.actions.update({
          scope: l.scope,
          battleId: this.battleId,
          active: false,
        }));
      }

      if (
        this.battleState.renderMode === 'panel'
          && this.calcdexSettings.closeOn !== 'never'
          && this.battleRoom?.id
      ) {
        l.debug(
          'Leaving the CalcdexPreactRoom', this.roomId,
          'w/ a destroyed CalcdexPreactBattle due to the user\'s settings...',
          '\n', 'room', this.battleRoom,
          '\n', 'battle', this.battleId, this.battle,
          '\n', 'state', this.battleState,
          '\n', 'settings', this.calcdexSettings,
        );

        window.PS.leave(this.roomId);

        return void this.endTimer('(calcdex destroyed)', this.battleId);
      }

      l.debug(
        'CalcdexSliceState for', this.battleId, 'exists in Redux,',
        'but the CalcdexPreactBattle was forcibly ended, probably.',
        '\n', 'battle', '(typeof)', wtf(this.battle), this.battle,
        '\n', 'room', this.battleRoom.id, this.battleRoom,
        '\n', 'state', this.battleState,
      );

      return void this.endTimer('(battle destroyed)', this.battleId);
    }

    if (this.battle.calcdexDisabled) {
      l.debug(
        'Calcdex Preact bootstrap request was ignored for', this.battleId,
        'since it has been disabled by the user\'s settings.',
        '\n', 'settings.openOnStart', this.calcdexSettings.openOnStart, this.calcdexSettings,
        '\n', 'battle.calcdexDisabled?', this.battle.calcdexDisabled, this.battle,
      );

      return void this.endTimer('(calcdex denied)', this.battleId);
    }

    if (this.initDisabled) {
      if (__DEV__) {
        l.debug(
          'Calcdex Preact bootstrap request was ignored for', this.battleId,
          'since the CalcdexBattle is marked as nonexistent & shouldn\'t be initialized!',
          '\n', 'stepQueue[]', '(matched)', this.battle.stepQueue.find((s) => s?.startsWith('|noinit|nonexistent|')),
          '\n', 'battle', this.battle,
        );
      }

      return void this.endTimer('(noinit nonexistent)', this.battleId);
    }

    if (!this.battle.calcdexStateInit) {
      this.initCalcdexState();
    }

    if (!this.battle.stepQueue?.length || !this.battle.stepQueue.some((q) => q?.startsWith('|player|'))) {
      l.debug(
        'Calcdex Preact bootstrap request was ignored for', this.battleId,
        'due to there being no initialized CalcdexPreactBattleSide players yet!',
        '\n', 'battle.stepQueue[]', this.battle.stepQueue,
        '\n', 'battle', this.battle,
      );

      return void this.endTimer('(uninit players)', this.battleId);
    }

    if (this.battle.calcdexInit) {
      // force a battle sync if we've received some data, but the active battle is just idling
      if (this.battle.calcdexStateInit && this.battle.atQueueEnd) {
        this.battle.subscription('atqueueend');
      }

      return void this.endTimer('(too damn filthy)', this.battleId);
    }

    this.patchCalcdexIdentifier();

    if (typeof this.battle.calcdexWinHandler !== 'function') {
      // hoping that this will fire before the battle is destroy()'d (otherwise we'll have to do that 'classic' jank)
      this.battle.calcdexWinHandler = (winner) => {
        l.debug(
          'CalcdexPreactBattle:calcdexWinHandler()', 'for winner', winner, 'in', this.battleId,
          '\n', 'battle.calcdexAuthPlayerKey', this.battle?.calcdexAuthPlayerKey,
          '\n', 'battle.calcdexBattleRecorded?', this.battle?.calcdexBattleRecorded,
          '\n', 'battle', '(typeof)', wtf(this.battle), this.battle,
        );

        // if the calcdexAuthPlayerKey doesn't exist, that means the user isn't a player in this battle (i.e., they're a spectator)
        if (!this.battle?.calcdexAuthPlayerKey || this.battle?.calcdexBattleRecorded) {
          return;
        }

        const { name: authPlayerName } = this.battle[this.battle.calcdexAuthPlayerKey] || {};
        const authPlayerNameId = (!!authPlayerName && formatId(authPlayerName)) || null;

        if (!authPlayerNameId) {
          return;
        }

        const winnerId = (!!winner && formatId(winner)) || null;
        const won = !!winnerId && authPlayerNameId === winnerId;

        // note: not providing the forceResult arg will cause the function to lookup the battle's stepQueue[],
        // which may or may not have the '|win|...' step we're looking for yet
        this.updateBattleRecord(won ? 'win' : 'loss');
        this.battle.calcdexBattleRecorded = true;
      };
    }

    // note: this is a shitty workaround to allow any class that has access to this.battle to render the Calcdex 'overlay' LOL
    // (presumably when this.battle.calcdexReactRoot is ready, such as in the CalcdexPreactBattlePanel's renderCalcdexOverlay();
    // in all other cases, this.battle.calcdexReactRoot is basically null)
    // update (2025/08/22): for consistency in the biznass logic, opting to use this for all Calcdex renderMode's,
    // i.e., the shitty workaround just became the only workaround lolol
    this.battle.calcdexReactRenderer = () => void this.renderCalcdex(this.battle.calcdexReactRoot);

    if (!this.battle.calcdexAsOverlay) {
      window.PS.join(this.roomId);
    }

    l.debug(
      'About to inject some real filth into the subscription() for the CalcdexPreactBattle', this.battleId,
      '\n', 'battle.subscription()', '(typeof)', wtf(this.battle.subscription),
      '\n', 'battle', '(typeof)', wtf(this.battle), this.battle,
    );

    this.prevBattleSubscription = this.battle.subscription?.bind?.(this.battle) as Showdown.Battle['subscription'];
    this.battle.subscribe(this.battleSubscription);
    this.battle.calcdexInit = true;

    if (this.battle.atQueueEnd) {
      this.battle.subscription('atqueueend');
    }

    this.endTimer('(bootstrap complete)', this.battleId);
  }
}
