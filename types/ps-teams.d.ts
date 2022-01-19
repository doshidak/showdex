/**
 * ps-teams.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/client-main.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  interface Team {
    name: string;
    format: string;
    packedTeam: string;
    folder: string;

    /**
     * Icon cache must be cleared (`null`) whenever `packedTeam` is modified.
     */
    iconCache: import('react').ReactNode;
    key: string;
  }

  interface PSTeams extends PSStreamModel<'team' | 'format'> {
    /**
     * * `false` = using ladder in the website
     *
     * @default false
     */
    usesLocalLadder: boolean;

    /**
     * @default []
     */
    list: Team[];

    /**
     * @default {}
     */
    byKey: { [key: string]: Team; };

    /**
     * @default []
     */
    deletedTeams: [Team, number][];

    (): this;

    teambuilderFormat(format: string): string;
    getKey(name: string): string;
    unpackAll(buffer?: string): void;
    push(team: Team): void;
    unshift(team: Team): void;
    delete(team: Team): void;
    undelete(): void;
    unpackOldBuffer(buffer: string): void;
    packAll(teams: Team[]): string;
    save(): void;
    unpackLine(line: string): Team;
  }
}
