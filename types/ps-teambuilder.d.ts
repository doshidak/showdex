/**
 * @file `ps-teambuilder.d.ts` - Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-teambuilder.tsx`.
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 * @since 1.3.0
 */

/* eslint-disable max-classes-per-file */

declare namespace Showdown {
  /** Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-teamdropdown.tsx`. */
  class PSTeambuilder {
    public static draggedTeam?: Team = null;

    public static exportPackedTeam(team: Team, newFormat?: string): ReturnType<BattleTeams['export']>;
    public static splitPrefix(buffer: string, delimiter: string, prefixOffset = 0): [string, string];
    public static splitLast(buffer: string, delimiter: string): [string, string];
    /** Note that this'll directly mutate the provided Pokemon `set` object (hence the `void` return type). */
    public static parseExportedTeamLine(line: string, isFirstLine: boolean, set: PokemonSet): void;
    public static getNature(plus?: StatNameNoHp | '', minus?: StatNameNoHp | ''): NatureName;
    public static importTeam(buffer: string): PokemonSet[];
    public static importTeamBackup(buffer: string): Team[];
    public static dragStart(event: DragEvent): void;
  }

  interface TeamBoxProps {
    team?: Team;
    noLink?: boolean;
    button?: boolean;
    onClick?: () => void;
  }

  /** Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-teamdropdown.tsx`. */
  type TeamBox = (props: TeamBoxProps) => JSX.Element;

  /**
   * Team selector popup.
   *
   * * Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-teamdropdown.tsx`.
   */
  class TeamDropdownPanel extends PSRoomPanel {
    public static readonly id = 'teamdropdown' as const;
    public static readonly routes = ['teamdropdown'] as const;
    public static readonly location = 'modal-popup' as const;
    public static readonly noURL = true as const;

    public gen = '' as ID;
    public format?: string = null;

    public setFormat: (event: MouseEvent) => void;
    public click: (event: MouseEvent) => void;

    public getTeams(): Team[];
  }

  interface TeamDropdownProps {
    format: string;
  }

  /** Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-mainmenu.tsx`. */
  class TeamDropdown extends Preact.Component<TeamDropdownProps> {
    public declare base?: HTMLButtonElement;
    public teamFormat = '';
    public teamKey = '';

    /** Internally sets `this.teamKey` to `(this.base as HTMLButtonElement).value` & does a `forceUpdate()`. */
    public change: () => void;

    /** Returns the default `team.key`. */
    public getDefaultTeam(teambuilderFormat: string): string;
  }

  interface TeamFormProps {
    class?: string;
    selectType?: SelectType;
    format?: string;
    teamFormat?: string;
    hideFormat?: string;
    children: React.ReactNode;
    onSubmit?: (event: Event, format: string, team?: Team) => void;
    onValidate?: (event: Event, format: string, team?: Team) => void;
  }

  /** Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-mainmenu.tsx`. */
  class TeamForm extends Preact.Component<TeamFormProps> {
    public format = '';

    public changeFormat: (event: Event) => void;
    public submit: (event: Event, validate?: 'validate') => void;
    public handleClick: (event: Event) => void;
  }

  class TeambuilderRoom extends PSRoom {
    public readonly DEFAULT_FORMAT: ID;
    /**
     * * `''` - all
     * * `'gen<num><id>'` - format folder
     * * `'gen<num>'` - uncategorized gen folder
     * * `'<id>/'` - folder
     * * `'/'` - not in folder
     */
    public curFolder = '';
    public curFolderKeep = '';
    public searchTerms: string[] = [];

    public updateSearch: (value: string) => void;
    public matchesSearch: (team?: Team) => boolean;

    public createTeam(copyFrom?: Team, isBox = false): Team;
  }

  class TeambuilderPanel extends PSRoomPanel<TeambuilderRoom> {
    public static readonly id = 'teambuilder' as const;
    public static readonly routes = ['teambuilder'] as const;
    public static readonly Model = TeambuilderRoom as const;
    public static readonly icon: JSX.Element;
    public static readonly title = 'Teambuilder' as const;

    public static addDraggedTeam(event: DragEvent, folder?: string): void;

    public selectFolder: (event: MouseEvent) => void;
    public addFormatFolder: (event: Event) => void;
    public dragEnterTeam: (event: DragEvent) => void;
    public dragEnterFolder: (event: DragEvent) => void;
    public dragLeaveFolder: (event: DragEvent) => void;
    public dropFolder: (event: DragEvent) => void;
    public updateSearch: (event: KeyboardEvent) => void;
    public clearSearch: () => void;

    /**
     * * `undefined` = not dragging.
     * * `null` = dragging a new team.
     */
    public getDraggedTeam(event: DragEvent): Team | number | null;
    public renderFolder(value: string): JSX.Element;
    public renderFolderList(): JSX.Element;
  }

  /** Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-teambuilder-team.tsx`. */
  class TeamRoom extends PSRoom {
    public team: Team;
    public forceReload = false;

    public setFormat(format: string): void;
    public load(): void;
    public upload(isPrivate: boolean): void;
    public stripNicknames(packedTeam: string): ReturnType<BattleTeams['pack']>;
    public save(): void;
  }

  /** Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-teambuilder-team.tsx`. */
  class TeamPanel extends PSRoomPanel<TeamRoom> {
    public static readonly id = 'team' as const;
    public static readonly routes = ['team-*'] as const;
    public static readonly Model = TeamRoom as const;
    public static readonly title = 'Team' as const;
    public static formatResources: Record<string, FormatResource> = {};

    public static getFormatResources(format: string): Promise<FormatResource>;

    public handleRename: (event: Event) => void;
    public uploadTeam: (event: Event) => void;
    public restore: (event: Event) => void;
    public compare: (event: Event) => void;
    public changePrivacyPref: (event: Event) => void;
    public handleChangeFormat: (event: Event) => void;
    public save: () => void;

    public renderResources(): JSX.Element;
  }

  /** Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-teambuilder-team.tsx`. */
  class ViewTeamPanel extends PSRoomPanel {
    public static readonly id = 'viewteam' as const;
    public static readonly routes = ['viewteam-*'] as const;
    public static readonly Model = TeamRoom as const;
    public static readonly title = 'View Team' as const;

    public team?: Team = null;
    public teamData?: {
      team: string;
      private?: string;
      ownerid: ID;
      format: ID;
      title: string;
      views: number;
    } = null;
  }

  /** Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-teambuilder-team.tsx`. */
  type TeamStorage =
    | 'account'
    | 'disconnected'
    | 'local'
    | 'public';

  /** Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-teambuilder-team.tsx`. */
  class TeamStoragePanel extends PSRoomPanel {
    public static readonly id = 'teamstorage' as const;
    public static readonly routes = ['teamstorage-*'] as const;
    public static readonly location = 'modal-popup' as const;
    public static readonly noURL = true as const;

    public chooseOption: (event: MouseEvent) => void;

    public team(): Team;
  }
}
