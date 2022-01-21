/**
 * client-storage.d.ts
 *
 * Provides local storage typings for the live PS client running on Backbone.js.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  type ClientStorageLoadTracker<
    TValue = unknown,
    TContext = unknown,
  > = ((callback: <T = TValue>(value: T) => void, context: TContext) => void) & {
    /**
     * @default false
     */
    isLoaded: boolean;

    value?: TValue;

    /**
     * @default []
     */
    callbacks: [typeof callback, typeof context][];

    load(value: TValue): void;
    update(value: TValue): void;
    unload(): void;
  };

  interface ClientStorageBackground {
    /**
     * @default ''
     */
    id: string;

    /**
     * @default 0
     */
    changeCount: number;

    set(bgUrl: string, bgid: string, noSave?: boolean): void;
    load(bgUrl: string, bgid: string, hues?: string[]): string[];
    loadHues(hues: string[]): void;
    extractMenuColors(bgUrl: string, bgid: string, noSave?: boolean): void;
    getHueSat(r: number, g: number, b: number): string;
  }

  interface ClientStorage {
    /**
     * @default `https://${Config.routes.client}`
     */
    origin: string;

    crossOriginFrame?: HTMLElement;

    /**
     * @default {}
     */
    crossOriginRequests: Record<string, unknown>;

    /**
     * @default 0
     */
    crossOriginRequestCount: number;

    /**
     * @default false
     */
    cantSave: boolean;

    loggingChat?: boolean;
    chatLogStreams?: Record<string, Stream>;

    whenPrefsLoaded: ClientStorageLoadTracker;
    whenTeamsLoaded: ClientStorageLoadTracker;
    whenAppLoaded: ClientStorageLoadTracker;
    fsReady: ClientStorageLoadTracker;

    prefs: (<T = unknown>(prop: string, value: T, save?: boolean) => boolean) & {
      /**
       * @default {}
       */
      data?: Record<string, unknown>;
    };

    bg: ClientStorageBackground;

    activeSetList?: ClientTeam;
    teams?: ClientTeam[];

    initialize(): void;
    safeJSON<T = unknown>(callback?: (data: T) => void): void;
    makeLoadTracker<TValue = unknown, TContext = unknown>(): ClientStorageLoadTracker<TValue, TContext>;
    save(): void;
    initPrefs(): void;
    onMessage<T extends HTMLElement = HTMLElement>($e: JQuery.Event<T>): void;
    postCrossOriginMessage<T = unknown>(data: T): boolean;
    loadTeams(): void;
    loadPackedTeams(buffer: string): void;
    saveTeams(): void;
    getPackedTeams(): void;
    saveTeam(): void;
    deleteTeam(): void;
    saveAllTeams(): void;
    deleteAllTeams(): void;
    unpackAllTeams(buffer: string): ClientTeam[];
    unpackLine(line: string): ClientTeam;
    packAllTeams(teams: ClientTeam[]): string;
    packTeam(team?: ClientTeam): string;
    fastUnpackTeam(buf?: string): Partial<Pokemon>[];
    unpackTeam(buf?: string): Partial<Pokemon>[];
    packedTeamNames(buf?: string): string[];
    packedTeamIcons(buf?: string): string;
    getTeamIcons(team: ClientTeam): string;
    getPackedTeam(team?: ClientTeam): ClientTeam;
    importTeam(buffer: string, teams: ClientTeam[]): ClientTeam;
    exportAllTeams(): string;
    exportFolder(folder: string): string;
    exportTeam(team?: ClientTeam): string;
    initDictionary(): void;
    initDictionary2(): void;
    revealFolder(): void;
    nwFindTextFilesRecursive(): void;
    nwLoadTeams(): void;
    nwLoadNextBatch(files: File[], offset: number, dirOffset: number): void;
    nwLoadTeamFile(filename: string, localApp: ClientApp): void;
    nwFinishedLoadingTeams(app?: ClientApp): void;
    teamCompare(a: ClientTeam, b: ClientTeam): number;
    nwDeleteAllTeams(): void;
    nwDeleteTeamFile(filename: string, callback?: () => void): void;
    nwSaveTeam(team: ClientTeam): void;
    nwSaveTeams(): void;
    nwDeleteTeam(team: ClientTeam): void;
    nwSaveAllTeams(): void;
    nwDoSaveAllTeams(): void;
    getLogMonth(): void;
    nwStartLoggingChat(): void;
    nwStopLoggingChat(): void;
    nwLogChat(roomid: string, line: string): void;
    startLoggingChat(): void;
    stopLoggingChat(): void;
    logChat(): void;
  }
}
