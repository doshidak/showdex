/**
 * battle-log.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-log.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface BattleLog {
    elem: HTMLDivElement;
    innerElem: HTMLDivElement;
    scene?: BattleScene;
    preemptElem?: HTMLDivElement;

    /**
     * @default true
     */
    atBottom: boolean;
    className: string;
    battleParser?: BattleTextParser;

    joinLeave?: {
      joins: string[];
      leaves: string[];
      element: HTMLDivElement;
    };

    lastRename?: {
      from: string;
      to: string;
      element: HTMLDivElement;
    };

    /**
     * * `-1` = spectator: "Red sent out Pikachu!" "Blue's Eevee used Tackle!"
     * * `0` = player: "Go! Pikachu!" "The opposing Eevee used Tackle!"
     * * `1` = opponent: "Red sent out Pikachu!" "Eevee used Tackle!"
     *
     * @default -1
     */
    perspective: -1 | 0 | 1;

    (elem: HTMLDivElement, scene?: BattleScene, innerElem?: HTMLDivElement): this;

    onScroll: () => void;

    reset(): void;
    destroy(): void;

    add<TArgs extends unknown[], TKwArgs extends Record<string, unknown>>(args: TArgs, kwArgs?: TKwArgs, preempt?: boolean): void;
    addBattleMessage<TArgs extends unknown[], TKwArgs extends Record<string, unknown>>(args: TArgs, kwArgs?: TKwArgs): void;
    textList(list: string[]): string;

    /**
     * To avoid trolling with nicknames, we can't just run this through `parseMessage`.
     */
    parseLogMessage(message: string): [string, string];
    message(message: string, sceneMessage?: string): void;
    addNode<T extends HTMLElement = HTMLElement>(node: T, preempt?: boolean): void;
    updateScroll(): void;
    addDiv(className: string, innerHTML: string, preempt?: boolean): void;
    prependDiv(className: string, innerHTML: string, preempt?: boolean): void;
    addSpacer(): void;
    changeUhtml(id: string, htmlSrc: string, forceAdd?: boolean): void;
    static unlinkNodeList(nodeList: ArrayLike<HTMLElement>, classStart: string): void;
    unlinkChatFrom(userid: string): void;
    preemptCatchup(): void;
    static escapeFormat(formatid: string): string;
    static escapeHTML(str: string, jsEscapeToo?: boolean): string;
    static unescapeHTML(str: string): string;

    /**
     * @default {}
     */
    static colorCache: { [userid: string]: string; };

    /** @deprecated */
    static hashColor(name: string): string;
    static usernameColor(name: string): string;
    static HSLToRGB(H: number, S: number, L: number): { R: number; G: number; B: number; };
    static prefs<T = unknown>(name: string): T;

    parseChatMessage(message: string, name: string, timestamp: string, isHighlighted?: boolean): [string, string, boolean?];
    static parseMessage(str: string, isTrusted = false): string;

    static interstice: {
      isWhitelisted(uri: string): boolean;
      getURI(uri: string): string;
    };

    static tagPolicy?: <T = unknown>(tagName: string, attribs: string[]) => T;
    static initSanitizeHTML(): void;
    static localizeTime(full: string, date: string, time: string, timezone?: string): string;
    static sanitizeHTML(input: string): string;

    static createReplayFile<T = unknown>(room: T): string;
    static createReplayFileHref<T = unknown>(room: T): string;
  }
}
