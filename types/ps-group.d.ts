/**
 * ps-group.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/client-main.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  interface PSGroup {
    name?: string;
    type?: 'leadership' | 'staff' | 'punishment';
    order: number;
  }
}
