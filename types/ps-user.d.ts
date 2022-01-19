/**
 * ps-user.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/client-main.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license APGLv3
 */

declare namespace Showdown {
  interface PSUser extends PSModel {
    /**
     * @default ''
     */
    name: string;

    /**
     * @default ''
     */
    group: string;

    /**
     * @default ''
     */
    userid: string;

    /**
     * @default false
     */
    named: boolean;

    /**
     * @default false
     */
    registered: boolean;

    /**
     * @default '1'
     */
    avatar: string;

    setName(fullName: string, named: boolean, avatar: string): void;
    logOut(): void;
  }
}
