/**
 * `chat-room.d.ts`
 *
 * Adapted from `pokemon-showdown-client/src/panel-chat.tsx`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  class ChatPanel extends PSRoom {
    /**
     * @default 'chat'
     */
    public readonly classType: 'chat' | 'battle';

    /**
     * @default {}
     */
    public users: {
      [userid: string]: string;
    };

    /**
     * @default 0
     */
    public usersCount: number;

    /**
     * @default true
     */
    public readonly canConnect: boolean;

    public pmTarget?: string;

    /**
     * @default false
     */
    public challengeMenuOpen: boolean;
    public challengingFormat?: string;
    public challengedFormat?: string;

    public constructor(options: RoomOptions);

    public connect(): void;
    public destroy(): void;

    public updateTarget(force?: boolean): void;
    public handleMessage(line: string): void;
    public send(line: string, direct?: boolean): void;

    public openChallenge(): void;
    public cancelChallenge(): void;

    public setUsers(count: number, usernames: string[]): void;
    public addUser(username: string): void;
    public removeUser(username: string, noUpdate?: boolean): void;
    public renameUser(username: string, oldUsername: string): void;
  }
}
