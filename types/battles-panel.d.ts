/**
 * `battles-panel.d.ts`
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

  class BattlesPanel extends PSRoom {
    public override readonly classType: 'battles';

    /**
     * @default ''
     */
    public format: string;
    public battles?: BattleDesc[];

    public constructor(options: RoomOptions);

    public setFormat(format: string): void;
    public refresh(): void;
  }
}
