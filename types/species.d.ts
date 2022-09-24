/**
 * species.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-dex-data.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  type SpeciesEvoType =
    | 'trade'
    | 'useItem'
    | 'levelMove'
    | 'levelExtra'
    | 'levelFriendship'
    | 'levelHold'
    | 'other';

  interface Species extends Effect {
    readonly effectType: 'Species';

    readonly baseSpecies: string;
    readonly forme: string;
    readonly formeid: string;
    readonly spriteid: string;
    readonly baseForme: string;

    readonly num: number;
    readonly types: ReadonlyArray<TypeName>;
    readonly abilities: Readonly<{ 0: string; 1?: string; H?: string; S?: string; }>;
    readonly baseStats: Readonly<{ [stat in StatName]: number; }>;
    readonly weightkg: number;

    readonly heightm: number;
    readonly gender: GenderName;
    readonly color: string;
    readonly genderRatio?: Readonly<{ M: number; F: number; }>;
    readonly eggGroups: ReadonlyArray<string>;
    readonly tags: ReadonlyArray<string>;

    readonly otherFormes?: ReadonlyArray<string>;
    readonly cosmeticFormes?: ReadonlyArray<string>;
    readonly evos?: ReadonlyArray<string>;
    readonly prevo: string;
    readonly evoType: SpeciesEvoType | '';
    readonly evoLevel: number;
    readonly evoMove: string;
    readonly evoItem: string;
    readonly evoCondition: string;
    readonly requiredItems: ReadonlyArray<string>;
    readonly tier: string;
    readonly isTotem: boolean;
    readonly isMega: boolean;
    readonly canGigantamax: boolean;
    readonly isPrimal: boolean;
    readonly battleOnly?: string | string[];
    readonly isNonstandard?: string;
    readonly unreleasedHidden: boolean | 'Past';
    readonly changesFrom?: string;

    (id: string, name: string, data: Partial<Species>): this;
  }
}
