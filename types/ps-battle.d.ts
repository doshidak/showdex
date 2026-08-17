/**
 * @file `ps-battle.d.ts` - Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-battle.tsx`.
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @author Keith Choison <keith@tize.io>
 * @license AGPLv3
 * @since 1.3.0
 */

/* eslint-disable max-classes-per-file */

declare namespace Showdown {
  class BattlesRoom extends PSRoom {
    public override readonly classType = 'battle';
    /** `null` = still loading. */
    public formats = '';
    public filters = '';
    public battles: BattleDesc[] = [];

    public setFormat(format: string): void;
    public refresh(): void;
  }

  class BattlesPanel extends PSRoomPanel<BattlesRoom> {
    public static readonly id = 'battles';
    public static readonly routes = ['battles'];
    public static readonly Model = BattlesRoom;
    public static readonly location = 'right';
    public static readonly icon: JSX.Element;
    public static readonly title = 'Battles';

    public refresh: () => void;
    public changeFormat: (event: Event) => void;
    public applyFilters: (event: Event) => void;

    public renderBattleLink(battle: BattleDesc): JSX.Element;
  }

  class BattleRoom extends ChatRoom {
    public readonly classType = 'battle';
    public declare pmTarget: null;
    public declare challengeMenuOpen: false;
    public declare challengingFormat: null;
    public declare challengedFormat: null;
    public override battle: Battle;
    /** `null` if a spectator, otherwise the current player's info. */
    public side?: BattleRequestSideInfo = null;
    public request?: BattleRequest = null;
    public choices?: BattleChoiceBuilder = null;
    public autoTimerActivated?: boolean = null;

    public loadReplay(): void;
  }

  interface BattleDivProps {
    room: BattleRoom;
  }

  class BattleDiv extends Preact.Component<BattleDivProps> {
    public override shouldComponentUpdate(): false;
    public override componentDidMount(): void;
    public override render(): Preact.VNode;
  }

  interface TimerButtonProps {
    room: BattleRoom;
  }

  class TimerButton extends Preact.Component<TimerButtonProps> {
    public timerInterval?: number = null;

    public override componentWillUnmount(): void;
    public secondsToTime(seconds: number | true): string;
    public override render(): Preact.VNode;
  }

  // note: TRoom generic doesn't actually exist in the original class declaration, but exists here for TypeScript lol
  // (functionally has no effect in JS-land, unless you change the static Model member prop value, which should match the TRoom)
  class BattlePanel<TRoom extends BattleRoom = BattleRoom> extends PSRoomPanel<TRoom> {
    public static readonly id = 'battle';
    public static readonly routes = ['battle-*'];
    public static readonly Model = BattleRoom;

    /** Last displayed team. Won't show the most recent request until the last one is gone. */
    public team?: ServerPokemon[] = null;
    public battleHeight = 360;

    public static handleDrop(event: DragEvent): void;

    public send: (text: string, element?: HTMLElement) => void;
    public focusIfNoSelection: () => void;
    public onKey: (event: KeyboardEvent) => boolean;
    public toggleBoostedMove: (event: Event) => void;
    public handleDownloadReplay: (event: MouseEvent) => void;

    public updateLayout(): void;
    public receiveRequest(request?: BattleRequest): void;
    public notifyRequest(): void;
    public renderControls(): Showdown.Preact.VNode;
    public renderMoveButton(
      props?: {
        name: string;
        cmd: string;
        type: TypeName;
        tooltip: string;
        moveData: {
          pp?: number;
          maxpp?: number;
          disabled?: boolean;
        };
      },
    ): Preact.VNode;
    public renderPokemonButton(
      props: {
        pokemon?: Pokemon | ServerPokemon;
        cmd: string;
        noHPBar?: boolean;
        disabled?: boolean | 'fade';
        tooltip: string;
      },
    ): Preact.VNode;
    public renderMoveMenu(choices: BattleChoiceBuilder): Preact.VNode;
    public renderMoveControls(active: BattleRequestActivePokemon, choices: BattleChoiceBuilder): Preact.VNode[];
    public renderMoveTargetControls(request: BattleMoveRequest, choices: BattleChoiceBuilder): Preact.VNode[];
    public renderSwitchMenu(
      request: BattleMoveRequest | BattleSwitchRequest,
      choices: BattleChoiceBuilder,
      ignoreTrapping?: boolean,
    ): Preact.VNode;
    public renderTeamPreviewChooser(request: BattleTeamRequest, choices: BattleChoiceBuilder): Preact.VNode;
    public renderTeamList(): Preact.VNode;
    public renderChosenTeam(request: BattleTeamRequest, choices: BattleChoiceBuilder): Preact.VNode[];
    public renderOldChoices(request: BattleRequest, choices: BattleChoiceBuilder): Preact.VNode[];
    public renderPlayerWaitingControls(): Preact.VNode;
    public renderPlayerControls(request: BattleRequest): Preact.VNode;
    public renderAfterBattleControls(): Preact.VNode;
    public override render(): Preact.VNode;
  }

  class BattleOptionsPanel extends PSRoomPanel {
    public static readonly id = 'battleoptions';
    public static readonly routes = ['battleoptions'];
    public static readonly location = 'modal-popup';
    public static readonly noURL = true;

    public handleHardcoreMode: (event: Event) => void;
    public handleIgnoreSpectators: (event: Event | boolean) => void;
    public handleIgnoreOpponent: (event: Event | boolean) => void;
    public handleIgnoreNicks: (event: Event | boolean) => void;
    public handleAllSettings: (event: Event) => void;

    public getBattleRoom(): BattleRoom;
    public override render(): Preact.VNode;
  }

  // note: as is the case w/ the BattlePanel's TRoom generic, this TRoom generic has the same *typing* effect only
  class BattleForfeitPanel<TRoom extends PSRoom = PSRoom> extends PSRoomPanel<TRoom> {
    public static readonly id = 'forfeit';
    public static readonly routes = ['forfeitbattle'];
    public static readonly location = 'modal-popup';
    public static readonly noURL = true;

    public override render(): Preact.VNode;
  }
}
