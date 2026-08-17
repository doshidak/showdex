/**
 * @file `CalcdexPreactBattleForfeitPanel.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

/* eslint-disable max-classes-per-file */

import { logger } from '@showdex/utils/debug';
import { detectPreactHost } from '@showdex/utils/host';
import { PSRoom } from '../Bootdex/BootdexPreactBootstrappable';
import { type CalcdexPreactBattleRoom } from './CalcdexPreactBattlePanel';

const PSBattleForfeitPanel = detectPreactHost(window) ? window.BattleForfeitPanel : null;

const l = logger('@showdex/pages/Calcdex/CalcdexPreactBattleForfeitPanel');

export class CalcdexPreactBattleForfeitRoom extends PSRoom {
  public static readonly scope = l.scope;

  public override location = 'modal-popup' as const;

  protected get battleRoom() {
    return this.getParent() as CalcdexPreactBattleRoom;
  }

  protected get battle() {
    return this.battleRoom?.battle;
  }

  public override handleSend(line?: string, element = this.currentElement): string {
    // e.g., line = '/closeand /inopener /closeand /forfeit'
    // -> commands = ['/closeand', '/inopener', '/closeand', '/forfeit']
    const commands = line?.split('\x20').filter(Boolean);

    l.debug(
      'CalcdexPreactBattleForfeitRoom:handleSend()', 'line', line,
      '\n', 'commands', commands,
      '\n', 'element', element,
      '\n', 'battle', this.battle?.id, this.battle,
      '\n', 'room', this.battleRoom?.id, this.battleRoom,
    );

    if (
      commands?.includes('/forfeit')
        && this.battleRoom?.id
        && this.battle?.calcdexInit
        && !this.battle.ended
    ) {
      // note: calling this without a `winner` arg will result in a loss being recorded for the auth player
      // (which is what we want cause we're in the CalcdexPreactBattleForfeitRoom rn)
      this.battle?.calcdexWinHandler();
    }

    return super.handleSend(line, element);
  }
}

export class CalcdexPreactBattleForfeitPanel extends PSBattleForfeitPanel<CalcdexPreactBattleForfeitRoom> {
  public static readonly scope = l.scope;
  public static readonly Model = CalcdexPreactBattleForfeitRoom;

  // on second thought, would this receive the '|win|showdex_testee' step ??? o_O idk
  /* public override receiveLine(args: Showdown.Args): void {
    // as of the date of writing this file on 2025/08/22, this is a no-op in the original PSBattleForfeitPanel
    // (but calling it anyways just in case it's not a no-op in the future LOL)
    super.receiveLine(args);
  } */
}
