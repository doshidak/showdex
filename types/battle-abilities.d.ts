/**
 * battle-abilities.d.ts
 *
 * Adapted from `pokemon-showdown-client/build-tools/build-indexes`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  interface BattleAbilities {
    [abilityId: string]: Showdown.Ability;
  }
}
