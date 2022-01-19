/**
 * chat-room.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/panel-chat.tsx`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  interface ChatRoom extends PSRoom {
    /**
     * @default 'chat'
     */
    readonly classType: 'chat' | 'battle';

    /**
     * @default {}
     */
    users: { [userid: string]: string };

    /**
     * @default 0
     */
    usersCount: number;

    /**
     * @default true
     */
    readonly canConnect: boolean;

    pmTarget?: string;

    /**
     * @default false
     */
    challengeMenuOpen: boolean;
    challengingFormat?: string;
    challengedFormat?: string;

    (options: RoomOptions): this;

    connect(): void;
    destroy(): void;

    updateTarget(force?: boolean): void;
    handleMessage(line: string): void;
    send(line: string, direct?: boolean): void;

    openChallenge(): void;
    cancelChallenge(): void;

    setUsers(count: number, usernames: string[]): void;
    addUser(username: string): void;
    removeUser(username: string, noUpdate?: boolean): void;
    renameUser(username: string, oldUsername: string): void;
  }
}
