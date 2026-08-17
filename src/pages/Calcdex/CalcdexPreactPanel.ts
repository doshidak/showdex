/**
 * @file `CalcdexPreactPanel.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

/* eslint-disable max-classes-per-file */

import * as ReactDOM from 'react-dom/client';
import cx from 'classnames';
import { calcdexSlice } from '@showdex/redux/store';
import { logger } from '@showdex/utils/debug';
import { detectPreactHost } from '@showdex/utils/host';
import {
  BootdexPreactBootstrappable as Bootstrappable,
  preact,
  PSPanelWrapper,
  PSRoom,
  PSRoomPanel,
} from '../Bootdex/BootdexPreactBootstrappable';
import { CalcdexPreactBattleRoom } from './CalcdexPreactBattlePanel';
// import { CalcdexDomRenderer } from './CalcdexRenderer';

const l = logger('@showdex/pages/Calcdex/CalcdexPreactPanel');

export class CalcdexPreactRoom extends PSRoom {
  public static readonly scope = l.scope;

  public override title = 'Calcdex';
  public override type = 'calcdex';
  public override readonly classType = 'calcdex';
  public override location = 'right' as const;
  public override noURL = true;

  public get battleId() {
    return this.id?.replace(/^calcdex-/i, '');
  }

  public get battleRoom() {
    if (!detectPreactHost(window)) {
      return null;
    }

    return window.PS.rooms?.[this.battleId as Showdown.RoomID] as CalcdexPreactBattleRoom;
  }

  public get battle() {
    return this.battleRoom?.battle;
  }

  public get calcdexSettings() { // eslint-disable-line class-methods-use-this
    return Bootstrappable.Adapter.rootState?.showdex?.settings?.calcdex;
  }

  public override destroy() {
    if (!detectPreactHost(window)) {
      return void super.destroy();
    }

    const { battle } = this;

    if (battle?.id) {
      battle.closeCalcdex();
    } else if (this.battleId && this.calcdexSettings?.destroyOnClose) {
      Bootstrappable.Adapter.store.dispatch(calcdexSlice.actions.destroy(this.battleId));
    }

    super.destroy();
  }

  public rewriteHistory(): void { // eslint-disable-line class-methods-use-this
    if (!detectPreactHost(window)) {
      return;
    }

    /* if (this.battleRoom?.id) {
      return void window.PS.focusRoom(this.battleRoom.id);
    } */

    Bootstrappable.rewriteHistory(
      '/calcdex',
      window.location?.pathname?.replace('/calcdex-', '/'),
    );
  }
}

export class CalcdexPreactPanel extends PSRoomPanel<CalcdexPreactRoom> {
  public static readonly scope = l.scope;
  public static readonly id = 'calcdex';
  public static readonly routes = ['calcdex', 'calcdex-*'];
  public static readonly Model = CalcdexPreactRoom;
  public static readonly location = 'right' as const;
  public static readonly icon = preact?.h('i', { class: cx('fa', 'fa-calculator'), 'aria-hidden': true });
  public static readonly title = 'Calcdex';
  public static readonly noURL = true;

  // see Hellodex for more info on these shenanigans
  // update (2025/08/22): now using the calcdexReact* ones from the CalcdexPanelBattle for consistency w/
  // the 'overlay' Calcdex renderMode, i.e., the CalcdexPanelBattleRoom
  // private readonly __calcdexRef = preact?.createRef<HTMLDivElement>();
  // private __reactRoot?: ReactDOM.Root = null;

  /* public override componentDidMount() {
    super.componentDidMount();

    if (!detectPreactHost(window) || !this.__calcdexRef?.current || this.__reactRoot) {
      return;
    }

    const { room } = this.props;
    const { Adapter, Manager, openUserPopup } = BootdexPreactBootstrappable;

    this.__reactRoot = ReactDOM.createRoot(this.__calcdexRef.current);

    CalcdexDomRenderer(this.__reactRoot, {
      store: Adapter.store,
      battleId: room.id?.split('-').slice(1).join('-'),
      onUserPopup: openUserPopup,
      onRequestHellodex: () => void Manager?.openHellodex(),
      onRequestHonkdex: (id) => void Manager?.openHonkdex(id),
      // onCloseOverlay: () => void 0, // note: unused when the calcdexSettings.openAs is 'panel' (i.e., this) duh
    });
  }

  public override componentWillUnmount() {
    if (this.__reactRoot) {
      this.__reactRoot.unmount();
      this.__reactRoot = null;
    }

    super.componentWillUnmount();
  } */

  protected get calcdexPanelRoom() {
    return this.props.room;
  }

  protected get battle() {
    return this.calcdexPanelRoom?.battle;
  }

  public override focus(): void {
    super.focus();
    this.calcdexPanelRoom?.rewriteHistory();
  }

  public override componentWillUnmount() {
    this.battle?.unmountCalcdexDom();
    super.componentWillUnmount();
  }

  protected renderCalcdexPanel(): Showdown.Preact.VNode {
    if (!detectPreactHost(window) || !this.battle?.id || this.battle.calcdexAsOverlay) {
      return null;
    }

    if (!this.battle.calcdexReactRoot && this.battle.calcdexReactRef?.current) {
      this.battle.calcdexReactRoot = ReactDOM.createRoot(this.battle.calcdexReactRef.current, {
        identifierPrefix: CalcdexPreactPanel.scope,
      });
    }

    this.battle.calcdexReactRenderer?.();

    return preact.h('div', {
      // ref: this.__calcdexRef,
      ref: this.battle.calcdexReactRef,
      'data-showdex': 'calcdex',
      'data-calcdex': 'panel',
    });
  }

  public override render(): Showdown.Preact.VNode {
    const { room } = this.props;

    if (!detectPreactHost(window)) {
      return null;
    }

    return preact.h(PSPanelWrapper, { room }, this.renderCalcdexPanel());
  }
}
