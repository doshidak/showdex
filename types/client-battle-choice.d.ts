/**
 * client-battle-choice.d.ts
 *
 * Provides `battle.choice` typings for the live PS client running on Backbone.js.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  interface ClientBattleChoice {
    type: string;

    /**
     * @default []
     */
    choices: string[];

    /**
     * @default {}
     */
    switchFlags: Record<string, unknown>;

    /**
     * @default {}
     */
    switchOutFlags: Record<string, unknown>;

    freedomDegrees?: number;
    canSwitch?: number;
    done?: number;
    waiting?: boolean;
  }
}
