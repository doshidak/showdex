/**
 * `client-battle-room.d.ts`
 *
 * Provides global `BattleRoom` typings for the live PS client running on Backbone.js.
 * Adapted from `pokemon-showdown-client/js/client-battle.js`.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  class BattleRoom extends ClientRoom {
    public id: string;
    public cid: string;
    public type: ClientRoomType = 'battle';
    public title = '';

    public minWidth = 320;
    public minMainWidth = 956;
    public leftWidth?: number;
    public maxWidth = 1180;
    public bestWidth = 659;
    public isSideRoom: boolean;

    public battle: Battle;
    public users: Record<string, ClientUser>;
    public userCount: { users: number; } = { users: 0 };
    public chatHistory: { index: number; lines: string[] };

    public choice?: ClientBattleChoice;
    public request?: BattleRequest;

    public autoTimerActivated = false;
    public battlePaused = false;
    public battleEnded: boolean;
    public expired: boolean;
    public controlsShown = false;
    public callbackWaiting: boolean;
    public timerInterval: number;

    public className: string;
    public el: HTMLDivElement;
    public $el: JQuery<HTMLDivElement>;
    public $battle: JQuery<HTMLDivElement>;
    public $chat: JQuery<HTMLDivElement>;
    public $chatAdd: JQuery<HTMLDivElement>;
    public $chatFrame: JQuery<HTMLDivElement>;
    public $chatbox: JQuery<HTMLDivElement>;
    public $controls: JQuery<HTMLDivElement>;
    public $foeHint: JQuery<HTMLDivElement>;
    public $options: JQuery<HTMLDivElement>;
    public $userList: JQuery<HTMLDivElement>;

    public tooltips: BattleTooltips;

    public notificationClass = '';
    public notifications = {};
    public subtleNotification = false;

    public events: Record<string, string>;
    public lastUpdate?: number;

    // Showdex-injected custom properties
    public toggleCalcdexOverlay?(): void;

    public constructor(props: {
      id: string;
      el?: JQuery<HTMLDivElement>;
      nojoin?: boolean;
      title?: string;
    });

    public join(): void;
    public showChat(): void;
    public hideChat(): void;
    public leave(): void;
    public requestLeave(e?: Event): boolean;
    public updateLayout(): void;
    public show(): void;
    public hide(): void;
    public receive<T = unknown>(data: T): void;
    public focus(e?: Event): void;
    public blur(): void;
    public init(data: string): void;
    public add(data: string): void;
    public toggleMessages(user: string): void;
    public setHardcoreMode(mode: boolean): void;

    public updateControls(): void;
    public updateControlsForPlayer(): void;
    public getTimerHTML(nextTick?: boolean): string;
    public updateMaxMove(): void;
    public updateZMove(): void;
    public updateTimer(): void;
    public openTimer(): void;
    public updateMoveControls(type: string): void;
    public displayParty(switchables: Partial<Pokemon>[], trapped?: boolean): void;
    public displayAllyParty(): void;
    public updateSwitchControls(type: string): void;
    public updateTeamControls(type: string): void;
    public updateTurnCounters(): void;
    public updateWaitControls(): void;
    public getPlayerChoicesHTML(): string;
    public sendDecision(message: string): void;
    public receiveRequest(request: BattleRequest, choiceText?: boolean): void;
    public notifyRequest(): void;
    public updateSideLocation(): void;
    public updateSide(): void;
    public swapSideConditions(): void;
    public changeWeather(weatherName: string, poke?: Pokemon, isUpkeep?: boolean, ability?: Effect): void;
    public addAlly(allyData?: Side): void;

    public joinBattle(): void;
    public setTimer(): void;
    public forfeit(): void;
    public prematureEnd(): void;
    public saveReplay(): void;
    public openBattleOptions(): void;
    public clickReplayDownloadButton(e: Event): void;
    // public switchSides(): void;
    public setViewpoint(sideid: SideID): void;
    public switchViewpoint(): void;
    public start(): void;
    public pause(): void;
    public resume(): void;
    public instantReplay(): void;
    public skipTurn(): void;
    public rewindTurn(): void;
    public goToEnd(): void;
    public register(userid: string): void;
    public closeAndMainMenu(): void;
    public closeAndRematch(): void;
    public winner(winner?: string): void;

    public chooseMove(pos: number, e: Event): boolean;
    public chooseMoveTarget(posString: string): void;
    public chooseShift(): void;
    public chooseSwitch(pos: number): boolean;
    public chooseSwitchTarget(posString: string): void;
    public chooseTeamPreview(pos: number): boolean;
    public chooseDisabled(data: string): void;
    public endChoice(): void;
    public nextChoice(): void;
    public endTurn(): void;
    public endLastTurn(): void;
    public undoChoice(pos: number): void;
    public clearChoice(): void;
    public leaveBattle(): void;
    public selectSwitch(): void;
    public selectMove(): void;
    public resetTurnsSinceMoved(): void;

    public readReplayFile(file: File): void;

    public send(data: string): void;
    public dispatchClickButton(e: Event): void;
    public dispatchClickBackground(e: Event): void;
    public requestNotifications(): void;
    public notify(title: string, body: string, tag?: string, once?: boolean): void;
    public subtleNotifyOnce(): void;
    public notifyOnce(title: string, body: string, tag?: string): void;
    public closeNotification(tag?: string, alreadyClosed?: boolean): void;
    public closeAllNotifications(skipUpdate?: boolean): void;
    public dismissNotification(tag?: string): void;
    public dismissAllNotifcations(skipUpdate?: boolean): void;
    public clickNotification(tag?: string): void;
    public close(): void;
    public destroy(alreadyLeft?: boolean): void;
  }
}
