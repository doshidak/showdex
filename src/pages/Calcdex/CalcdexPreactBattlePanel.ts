/**
 * @file `CalcdexPreactBattlePanel.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

/* eslint-disable max-classes-per-file */

import type * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import cx from 'classnames';
import { calcdexSlice } from '@showdex/redux/store';
import { tRef } from '@showdex/utils/app';
import { nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { detectPreactHost } from '@showdex/utils/host';
import { BootdexPreactAdapter as Adapter } from '../Bootdex/BootdexPreactAdapter';
import { preact } from '../Bootdex/BootdexPreactBootstrappable';
import { type CalcdexBootstrappable } from './CalcdexBootstrappable';
import { CalcdexPreactBattle } from './CalcdexPreactBattle';
import { CalcdexPreactBattleTimerButton } from './CalcdexPreactBattleTimerButton';
import styles from './Calcdex.module.scss';

const PSBattleRoom = detectPreactHost(window) ? window.BattleRoom : null;
const PSBattlePanel = detectPreactHost(window) ? window.BattlePanel : null;

const l = logger('@showdex/pages/Calcdex/CalcdexPreactBattlePanel');

// make this a util, maybe? o_O
const findNamedIndex = (
  children: Showdown.Preact.ComponentChildren,
  name: string,
): number => preact?.toChildArray(children).findIndex((c) => (
  typeof c === 'string'
    ? c === name
    : typeof c?.type === 'string'
      ? c.type === name
      : c?.type?.name === name
));

export class CalcdexPreactBattleRoom extends PSBattleRoom {
  public static readonly scope = l.scope;

  public declare battle: CalcdexPreactBattle;

  /** Populated by the `CalcdexPreactBootstrapper`'s `patchCalcdexIdentifier()` & invoked by the `CalcdexPreactBattlePanel`. */
  public calcdexServerIdPatcher?: CalcdexBootstrappable['patchServerCalcdexIdentifier'] = null;

  public constructor(props: ConstructorParameters<typeof PSBattleRoom>[0]) {
    super(props);

    this.clientCommands = {
      ...this.clientCommands,
      ...this.parseClientCommands({
        calcdex(argv: string) {
          const [target, command] = argv.split('\x20');

          l.debug(
            'RECV', '/calcdex', argv,
            '\n', 'argv', '(target)', target, '(command)', command,
            '\n', 'battle.id', this.battle?.id,
          );

          // i.e., '/calcdex overlay toggle', where argv = 'overlay toggle'.split('\x20') -> ['overlay', 'toggle']
          if (
            !this.battle?.id
              || this.calcdexState?.renderMode !== 'overlay'
              || (target !== 'overlay' && command !== 'toggle')
          ) {
            return;
          }

          Adapter.store.dispatch(calcdexSlice.actions.update({
            scope: `${l.scope}:CalcdexPreactBattleRoom:clientCommands.calcdex()`,
            battleId: this.battle.id,
            overlayVisible: !this.calcdexState?.overlayVisible,
          }));

          this.update(null);
        },
      }),
    };
  }

  public get calcdexState() {
    return Adapter.rootState?.calcdex?.[this.battle?.id];
  }

  public get calcdexSettings() { // eslint-disable-line class-methods-use-this
    return Adapter.rootState?.showdex?.settings?.calcdex;
  }

  // note: actually not reliable when the user leaves the room since it'll be received by PS.receive() instead,
  // while the CalcdexPreactBattleRoom (i.e., this) is already destroy()'d, so this wouldn't fire :o
  // update (2025/08/22): just ended up creating a CalcdexPreactBattleForfeitPanel instead, so this here primarily
  // handles the winning case since the user would typically remain in the room for a bit after
  // (also wow these CalcdexPreactBattle* class names are getting kinda -vvv lol yolo)
  public override receiveLine(args: Showdown.Args): void {
    l.debug(
      'CalcdexPreactBattleRoom:receiveLine()', args,
      '\n', 'battle', this.battle?.id, this.battle,
      '\n', 'room', this.id, this,
    );

    // e.g., '|win|showdex_testee' -> args = ['win', 'showdex_testee']
    if (args[0] === 'win' && typeof this.battle?.calcdexWinHandler === 'function') {
      this.battle.calcdexWinHandler(args[1]);
    }

    // when args[0] is 'win' / 'tie', this will call this.receiveRequest(null),
    // which will nullify this.request & this.choices
    super.receiveLine(args);
  }

  public override destroy(): void {
    if (!detectPreactHost(window)) {
      return void super.destroy();
    }

    l.debug(
      'destroy()', 'called for the CalcdexPreactBattleRoom of', this.battle.id,
      '\n', 'room', this.id, this,
      '\n', 'battle', this.battle,
      '\n', 'state', this.calcdexState,
      '\n', 'settings', this.calcdexSettings,
    );

    if (this.battle.calcdexInit) {
      if (this.calcdexSettings?.closeOn === 'battle-tab' && this.battle.calcdexRoom?.id) {
        window.PS.leave(this.battle.calcdexRoomId); // -> CalcdexPreactRoom:destroy()
      }

      this.battle.destroy(false);
    }

    super.destroy();
  }
}

/** @todo switch to overlay <-> panel buttons or something lol -keith (2025/08/14) */
export class CalcdexPreactBattlePanel extends PSBattlePanel<CalcdexPreactBattleRoom> {
  public static readonly scope = l.scope;
  public static readonly Model = CalcdexPreactBattleRoom;

  // only used for Calcdexes w/ the 'overlay' renderMode
  // (note: ReactDOM.Root is inside the CalcdexPreactBattle)
  // private readonly __calcdexRef = preact?.createRef<HTMLDivElement>(); // moved to CalcdexPreactBattle:calcdexReactRef
  // private __calcdexVNode?: Showdown.Preact.VNode = null;

  protected get battleRoom() {
    return this.props.room;
  }

  protected get battle() {
    return this.battleRoom?.battle;
  }

  protected get battleRequest() {
    return this.battleRoom?.request;
  }

  protected get battleState() {
    return this.battleRoom?.calcdexState;
  }

  public override componentWillUnmount() {
    if (this.battle?.calcdexInit && this.battle.calcdexAsOverlay) {
      this.lockMobileZoom(false);
      this.battle.unmountCalcdexDom();
    }

    super.componentWillUnmount();
  }

  public override receiveRequest(request: Showdown.BattleRequest): void {
    if (!detectPreactHost(window) || !nonEmptyObject(request?.side)) {
      return void super.receiveRequest(request);
    }

    // note: this internally sets battle.myPokemon[] to request.side.pokemon[], but similar to the CalcdexClassicBootstrapper,
    // we'll want the version of myPokemon[] w/ a lil less valhalla (good song & VSTs tho)
    const myPokemon = [...(request.side.pokemon || [])];

    super.receiveRequest(request);

    if (this.battle?.id && myPokemon?.length && !this.battle.myPokemon?.length) {
      this.battle.myPokemon = myPokemon;
    }

    // note: this case is entirely possible in 'panel' renderMode's if the user refreshed the page mid-battle &
    // the CalcdexPreactBattleRoom loads before the CalcdexPanelRoom, typically when the first command received
    // from the server is to '/join' the CalcdexPreactBattleRoom; however, it's also entirely possible Showdex
    // couldn't swap out Showdown's Battle classes in time (e.g., Battle, BattleRequest, Side), so at that point oof
    if (!this.battle?.calcdexInit) {
      this.battle.runCalcdex();
    }

    this.battleRoom.calcdexServerIdPatcher?.(myPokemon);

    l.debug(
      'CalcdexPreactBattlePanel:receiveRequest()', 'for room', this.battleRoom?.id,
      '\n', 'myPokemon[]', '(argv:0)', myPokemon,
      '\n', '->', 'battle.myPokemon[]', this.battle?.myPokemon,
      '\n', 'request', '(super)', request,
      '\n', '->', 'room.request', this.battleRequest,
      '\n', 'battle.calcdexInit?', this.battle?.calcdexInit, 'calcdexStateInit?', this.battle?.calcdexStateInit,
      '\n', 'battle', this.battle?.id, this.battle,
      '\n', 'room', this.battleRoom,
    );

    // force a re-syncCalcdex() (via the injected room.battle.subscription()) w/ the new `request` data
    this.battle.subscription('callback');
  }

  protected lockMobileZoom(forceLock?: boolean): void {
    const { overlayVisible } = this.battleState || {};

    if (!this.battle?.calcdexAsOverlay || typeof $ !== 'function') {
      return;
    }

    const $existingMeta = $('meta[data-calcdex*="no-mobile-zoom"]');
    const nextContent = [
      'width=device-width',
      ...(forceLock ?? overlayVisible ? [
        'initial-scale=1',
        'maximum-scale=1',
      ] : ['user-scalable=yes']),
    ].join(',\x20');

    if (!$existingMeta.length) {
      return void $('head').append(`
        <meta
          name="viewport"
          content="${nextContent}"
          data-calcdex="no-mobile-zoom"
        />
      `);
    }

    $existingMeta.attr('content', nextContent);
  }

  protected renderToggleButton(style?: React.CSSProperties): Showdown.Preact.VNode {
    const { overlayVisible } = this.battleState || {};

    if (!this.battle?.calcdexAsOverlay) {
      return null;
    }

    const toggleButtonIcon = overlayVisible ? 'close' : 'calculator';
    const toggleButtonLabel = (
      typeof tRef.value === 'function'
        && tRef.value(`calcdex:overlay.control.${overlayVisible ? '' : 'in'}activeLabel`, '')
    ) || `${overlayVisible ? 'Close' : 'Open'} Calcdex`;

    // note: since I'm too lazy to figure out how to get Preact & React to play nicely in JSX-land (probably just adding 'preact' as a dep),
    // we're rendering the Preact manually via the preact.h() (alias of preact.createElement()) function
    // (equivalent to the inline injectToggleButton() helper in the prepareOverlay() method of the CalcdexClassicBootstrapper)
    return preact.h('button', {
      type: 'button',
      class: 'button',
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        columnGap: '0.4em',
        ...style,
      },
      name: 'toggleCalcdexOverlay',
      'data-cmd': '/calcdex overlay toggle',
      disabled: !this.battle?.calcdexInit,
    }, ...[
      preact.h('i', { class: cx('fa', `fa-${toggleButtonIcon}`), 'aria-hidden': true }),
      preact.h('span', null, toggleButtonLabel),
    ]);
  }

  protected renderCalcdexOverlay(): Showdown.Preact.VNode {
    const { overlayVisible } = this.battleState || {};

    if (!detectPreactHost(window) || !this.battle?.id || !this.battle.calcdexAsOverlay) {
      return null;
    }

    /* l.debug(
      'renderCalcdexOverlay()', 'for', this.battle.id,
      '\n', 'overlayVisible?', overlayVisible,
      '\n', 'battle.calcdexReactRef', this.battle.calcdexReactRef,
      '\n', 'battle.calcdexReactRoot', this.battle.calcdexReactRoot,
      '\n', 'battle.calcdexReactRenderer', '(typeof)', wtf(this.battle.calcdexReactRenderer),
    ); */

    if (!this.battle?.calcdexReactRoot && this.battle?.calcdexReactRef?.current) {
      this.battle.calcdexReactRoot = ReactDOM.createRoot(this.battle.calcdexReactRef.current, {
        identifierPrefix: CalcdexPreactBattlePanel.scope,
      });
    }

    this.battle.calcdexReactRenderer?.();

    return preact.h('div', {
      ref: this.battle?.calcdexReactRef,
      class: styles.overlayContainer,
      ...(!overlayVisible && { style: { display: 'none' } }),
      'data-showdex': 'calcdex',
      'data-calcdex': 'overlay',
    });
  }

  public override renderAfterBattleControls(): Showdown.Preact.VNode {
    // should spit out something like (as a VNode, ofc):
    // <div class="controls">
    //   <p><span style="float: right">...</span><button>...</button>...</p>
    //   <p>...</p>
    // </div>
    const controls = super.renderAfterBattleControls();

    /* l.debug(
      'renderAfterBattleControls()', 'for', this.battle.id,
      '\n', 'controls', controls,
    ); */

    if (!Array.isArray(controls?.props?.children)) {
      return controls;
    }

    const [firstParagraph] = controls.props.children as Showdown.Preact.VNode[];

    if (firstParagraph?.type !== 'p' || !Array.isArray(firstParagraph.props?.children)) {
      return controls;
    }

    const [firstSpan] = firstParagraph.props.children as Showdown.Preact.VNode[];

    if (
      firstSpan?.type !== 'span'
        || (
          !(firstSpan.props as Record<'style', string>)?.style?.includes('float: right')
            && (firstSpan.props as Record<'style', React.CSSProperties>)?.style?.float !== 'right'
        )
        || !Array.isArray(firstSpan.props.children)
    ) {
      return controls;
    }

    (firstSpan.props as Record<'style', React.CSSProperties>).style = {
      float: 'right',
      textAlign: 'right',
    };

    // place the toggle button after the replayDownloadButton
    const replayDownloadButtonIndex = firstSpan.props.children.findIndex((c) => (
      typeof c !== 'string'
        // e.g., { class: 'button replayDownloadButton', href: '//replay.pokemonshowdown.com/download', ... }
        && (c?.props as Record<'class', string>)?.class?.includes('replayDownloadButton')
    ));

    firstSpan.props.children.splice(replayDownloadButtonIndex + 1, 0, this.renderToggleButton({
      marginTop: 1, // alignment fix lol
      [replayDownloadButtonIndex > -1 ? 'marginLeft' : 'marginRight']: 6,
    }));

    return controls;
  }

  // in the Showdown 'preact' rewrite, there are 2 battle panel layouts: one for room.width < 700 & the other for >= 700;
  // instead of using the `float` CSS prop (as the 'classic' Backbone.js client host does), the rewrite absolutely positions
  // "floaty" buttons, including the <TimerButton>, which may not exist, such as when you're spectating; since we want
  // to position the Calcdex overlay button in a similar fashion to the 'classic' host, we'll look for these buttons,
  // wrap them in a <div> w/ the same absolute positioning & add the original buttons into it + our Calcdex button
  public override render() {
    const { room } = this.props;
    const { overlayVisible } = this.battleState || {};

    const panel = super.render();

    // both layouts are wrapped in a <PSPanelWrapper>, which renders all of its props.children[] into a <div>
    // (also note: panel.props.children wouldn't be an array if it was only rendering a single child, which if we're expecting
    // the proper virtual DOM for this BattlePanel, wouldn't be the case! [we're expecting lots of children, i.e., an array])
    if (!this.battle?.calcdexAsOverlay) {
      return panel;
    }

    // note: you wanna make sure this.renderCalcdexOverlay() comes first (it's absolutely positioned so all g),
    // otherwise some weird shenanigans may occur (when push()'d), like the <Calcdex>'s children[] being rendered inside
    // the .battle-controls-container instead & the <div> housing the <Calcdex> being empty; this requires two presses
    // of the toggle button for the <Calcdex> to visually appear again ... LOL
    // (suspecting this has something to do w/ Preact's indexing thingymabobers since what we're doing here to inject
    // VNode's is definitely of the sussy variety)
    panel.props.children = [
      this.renderCalcdexOverlay(),
      ...(Array.isArray(panel.props.children) ? panel.props.children : [panel.props.children]),
    ].filter(Boolean);

    // both layouts also render a ChatLog, ChatTextEntry & ChatUserList; since we're unable to modify the styling of them
    // (as their rendered container `style` props aren't exposed [tho some have the `class` name prop, like ChatLog]),
    // we'll just temporarily yeet them from this render() tick hehe lolol
    // (also we're still dealing in Preact virtual DOM nodes, so we can't use some jQuery $() magic here like in 'classic')
    if (overlayVisible) {
      // note: <ChatLog> will render a <div> in a <div>
      /* const chatLogIndex = findNamedIndex(panel.props.children, 'ChatLog');
      // const chatLog = panel.props.children[chatLogIndex] as Showdown.Preact.VNode;

      if (chatLogIndex > -1) {
        panel.props.children.splice(chatLogIndex, 1);
      } */

      const chatEntryIndex = findNamedIndex(panel.props.children, 'ChatTextEntry');

      if (chatEntryIndex > -1) {
        panel.props.children.splice(chatEntryIndex, 1);
      }

      /* const chatUserIndex = findNamedIndex(panel.props.children, 'ChatUserList');

      if (chatUserIndex > -1) {
        panel.props.children.splice(chatUserIndex, 1);
      } */

      // panel.props.children.push(this.renderCalcdexOverlay());
    }

    this.lockMobileZoom();

    // for the mobile layout (i.e., room.width < 700), we'll insert the Calcdex button to the right of the "Battle options"
    // button, which sits right beneath the <BattleDiv> (i.e., <div> containing all the pretty sprites & animations)
    // (note: the <TimerButton>, if rendered, is absolutely positioned top-right-ish above the <BattleDiv>)
    if (room?.width < 700) {
      // looking for:
      // <button data-href="battleoptions" ...>Battle options</button>
      const optionsButtonIndex = panel.props.children.findIndex((c) => (
        typeof c !== 'string' // since children[] is of type (string | VNode)[]
          && c?.props?.['data-href'] === 'battleoptions'
      ));

      if (optionsButtonIndex < 0) {
        return panel;
      }

      // note: the `style` prop may or may not be hydrated into an inline CSS string from its JSX object variant,
      // depending on how it's originally defined, e.g.:
      // props = { ..., style: { position: 'absolute', right: '75px', top: this.battleHeight } } (OR)
      // props = { ..., style: 'position: absolute;right: 75px;top: 247px;' }
      // (but for now, since I'm lazy, I'm just gunna assume it's a React.CSSProperties object [i.e., the former] lol)
      const optionsButton = panel.props.children[optionsButtonIndex] as Showdown.Preact.VNode;
      const { style: optionsButtonStyle } = optionsButton.props as Record<'style', React.CSSProperties | string>;

      // we're essentially moving its inlined CSS to the parent <div> container that will take its place
      delete (optionsButton.props as Record<'style', React.CSSProperties>).style;

      panel.props.children[optionsButtonIndex] = preact.h('div', {
        style: {
          position: 'absolute',
          top: this.battleHeight,
          ...(typeof optionsButtonStyle === 'string' ? null : optionsButtonStyle),
          right: 10, // overriding the `right: 75px` lol
          display: 'flex',
          alignItems: 'center',
          columnGap: 6,
        },
        'data-showdex': 'calcdex',
        'data-calcdex': 'overlay-controls',
        'data-calcdex-controls': 'battle-options',
      }, ...[
        optionsButton,
        this.renderToggleButton(),
      ]);

      return panel;
    }

    // as per panel-battle.tsx, this renders this.renderAfterBattleControls() for the battle controls
    if (this.battle.ended) {
      return panel;
    }

    // for the desktop layout (i.e., room.width >= 700), if the <TimerButton> exists, we'll insert the Calcdex button to
    // the right of it; otherwise, we'll insert the Calcdex button where the <TimerButton> would've been
    // (note: we'll find these nested inside the panel.props.children[]'s <div class="battle-controls-container">
    // <div class="battle-controls" ...><!-- ... in here ... --></div></div>)
    const battleControlsContainer = panel.props.children.find((c) => (
      typeof c !== 'string'
        && (c?.props as Record<'class', string>)?.class === 'battle-controls-container'
    )) as Showdown.Preact.VNode;

    if (!battleControlsContainer?.type) {
      return panel;
    }

    if (!Array.isArray(battleControlsContainer.props?.children)) {
      battleControlsContainer.props.children = [battleControlsContainer.props.children];
    }

    battleControlsContainer.props.children = battleControlsContainer.props.children.filter(Boolean);

    const battleControls = battleControlsContainer.props.children.find((c) => (
      typeof c !== 'string'
        && (c?.props as Record<'class', string>)?.class === 'battle-controls'
    )) as Showdown.Preact.VNode;

    if (!battleControls?.type) {
      return panel;
    }

    if (!Array.isArray(battleControls.props.children)) {
      battleControls.props.children = [battleControls.props.children];
    }

    // there may be some sneaky nulls amongst the children[], which would produce an invalid findNamedIndex()
    // since -- in my testing, at least -- the preact.toChildArray() used in that aforementioned helper func
    // basically does filter(Boolean); without that, you could accidentally mutate the wrong VNode!! :o
    battleControls.props.children = battleControls.props.children.filter(Boolean);

    // note: timerButton will be undefined if timerButtonIndex is -1
    const timerButtonIndex = findNamedIndex(battleControls.props.children, 'TimerButton');
    // const timerButton = battleControls.props.children[timerButtonIndex] as Showdown.Preact.VNode;

    if (timerButtonIndex > -1) {
      // delete (timerButton.props as Record<'style', React.CSSProperties>).style;
      battleControls.props.children.splice(timerButtonIndex, 1);
    }

    const wrappedOverlayControls = preact.h('div', {
      style: {
        position: 'absolute',
        top: 2,
        right: 10,
        display: 'flex',
        alignItems: 'center',
        columnGap: 6,
      },
      'data-showdex': 'calcdex',
      'data-calcdex': 'overlay-controls',
      'data-calcdex-controls': 'battle-timer',
    }, ...[
      preact.h(CalcdexPreactBattleTimerButton, { room }),
      this.renderToggleButton(),
    ].filter(Boolean));

    battleControls.props.children = [
      wrappedOverlayControls,
      ...battleControls.props.children,
    ];

    return panel;
  }
}
