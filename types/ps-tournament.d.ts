/**
 * @file `ps-tournament.d.ts` - Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-chat-tournament.tsx`.
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @author Keith Choison <keith@tize.io>
 * @license AGPLv3
 * @since 1.3.0
 */

/* eslint-disable max-classes-per-file */

declare namespace Showdown {
  interface TreeNode {
    children?: TreeNode[];
  }

  interface TournamentTreeBracketNode extends TreeNode {
    parent?: TournamentTreeBracketNode;
    children?: TournamentTreeBracketNode[];
    x: number;
    y: number;
    state: string;
    team: string;
    room: string;
    result: string;
    score: [number, number];
  }

  interface TournamentElimBracketNode extends TournamentTreeBracketNode {
    parent?: TournamentElimBracketNode;
    children?: TournamentElimBracketNode[];
    team1: string;
    team2: string;
    highlightLink?: boolean;
    abbreviated?: boolean;
  }

  interface TournamentTreeBracketData {
    type: 'tree';
    users: string[];
    rootNode: TournamentTreeBracketNode;
  }

  interface TournamentTableBracketData {
    type: 'table';
    users: string[];
    tableContents: {
      state: string;
      room: string;
      result: string;
      score: [number, number];
    }[][];
    tableHeaders: {
      rows: string[];
      cols: string[];
    };
    scores: number[];
  }

  interface TournamentInfo {
    format?: string;
    teambuilderFormat?: string;
    generator?: string;
    isActive?: boolean;
    isJoined?: boolean;
    isStarted?: boolean;
    challenging?: string;
    challenged?: string;
    challenges?: string[];
    challengeBys?: string[];
    bracketData?: TournamentTreeBracketData | TournamentTableBracketData;
  }

  class ChatTournament extends PSModel {
    public info: TournamentInfo = {};
    public updates: TournamentInfo = {};
    public room: ChatRoom;
    public boxVisible = false;
    public selectedChallenge = 0;
    public joinLeave?: {
      join: string[];
      leave: string[];
      messageId: string;
    } = null;

    public static arrayToPhrase(array: string[], finalSeparator = 'and'): string;

    public constructor(room: ChatRoom);
    public tryAdd(line: string): boolean;
    public handleJoinLeave(action: 'join' | 'leave', name: string): void;
    public tournamentName(): string;
    public receiveLine(args: Args): true | void;
  }

  interface TournamentBoxProps {
    tour: ChatTournament;
    left?: number;
  }

  class TournamentBox extends Preact.Component<TournamentBoxProps> {
    public subscription: PSSubscription;

    public acceptChallenge: (event: Event, format: string, team?: Team) => void;
    public validate: (event: Event, format: string, team?: Team) => void;
    public toggleVisibility: () => void;

    public selectChallengeUser(event: Event): void;
    public renderTournamentTools(): JSX.Element;
  }

  interface TournamentBracketProps {
    tour: ChatTournament;
    poppedOut?: boolean;
    abbreviated?: boolean;
  }

  class TournamentBracket extends Preact.Component<TournamentBracketProps> {
    public subscription: PSSubscription;
    public dragging?: { x: number; y: number; } = null;

    public onMouseDown: (event: MouseEvent) => void;
    public onMouseMove: (event: MouseEvent) => void;
    public onMouseUp: (event: MouseEvent) => void;
    public popOut: (event: Event) => void;

    public renderTableBracket(): JSX.Element;
  }

  interface TournamentTreeBracketProps {
    data: TournamentTreeBracketData;
    abbreviated?: boolean;
  }

  class TournamentTreeBracket extends Preact.Component<TournamentTreeBracketProps> {
    /** Customizes the tree size. Height is for a single player, a full node is double that. */
    public static nodeSize = {
      width: 160,
      height: 15,
      radius: 5,
      separationX: 20,
      separationY: 10,
      textOffset: 4,
    };

    public d3Loader?: Promise<void> = null;

    public forEachTreeNode<TNode extends TreeNode>(
      node: TNode,
      callback: (node: TNode, depth: number) => void,
      depth = 0,
    ): void;
    public cloneTree<TNode extends TreeNode>(node: TNode): TNode;
    public generateTreeBracket(data: TournamentTreeBracketData, abbreviated?: boolean): void;
  }

  class TourPopOutPanel extends PSRoomPanel {
    public static readonly id = 'tourpopout' as const;
    public static readonly routes = ['tourpopout'] as const;
    public static readonly location = 'modal-popup' as const;
    public static readonly noURL = true as const;
  }
}
