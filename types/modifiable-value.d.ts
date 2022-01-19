/**
 * modifiable-value.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-tooltips.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface ModifiableValue {
    /**
     * @default 0
     */
    value: number;

    /**
     * @default 0
     */
    maxValue: number;

    comment?: string[];
    battle?: Battle;
    pokemon?: Pokemon;
    serverPokemon?: ServerPokemon;
    itemName?: string;
    abilityName?: string;
    weatherName?: string;

    /**
     * @default false
     */
    isAccuracy: boolean;

    (battle: Battle, pokemon: Pokemon, serverPokemon: ServerPokemon): this;

    reset(value?: number, isAccuracy?: boolean): void;

    tryItem(itemName?: string): boolean;
    tryAbility(abilityName?: string): boolean;
    tryWeather(weatherName?: string): boolean;
    itemModify(factor: number, itemName?: string): boolean;
    abilityModify(factor: number, abilityName?: string): boolean;
    weatherModify(factor: number, weatherName?: string, name?: string): boolean;
    modify(factor: number, name?: string): boolean;
    set(value: number, reason?: string): true;
    setRange(value: number, maxValue: number, reason?: string): true;
    round(value: number): void;
    toString(): string;
  }
}
