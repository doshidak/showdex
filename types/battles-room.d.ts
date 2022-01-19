/**
 * battles-room.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/panel-battle.tsx`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  type BattleDesc = {
    id: string;
    minElo?: number | string;
    p1?: string;
    p2?: string;
    p3?: string;
    p4?: string;
  };

  interface BattlesRoom extends PSRoom {
    override readonly classType: 'battles';

    /**
     * @default ''
     */
    format: string;
    battles?: BattleDesc[];

    (options: RoomOptions): this;

    setFormat(format: string): void;
    refresh(): void;
  }
}
