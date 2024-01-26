import { type CalcdexLeanSide } from './CalcdexLeanSide';
import { type CalcdexPlayerSide } from './CalcdexPlayerSide';
import { type CalcdexPokemon } from './CalcdexPokemon';

export interface CalcdexPlayer extends CalcdexLeanSide {
  /**
   * Whether the player is active in the battle.
   *
   * * This value will initially be `false` until the player is properly initialized.
   * * For most battles with only two players, `'p3'` and `'p4'` will typically have this property set to `false`.
   *
   * @default false
   * @since 1.1.3
   */
  active?: boolean;

  /**
   * Player's Elo rating.
   *
   * @since 0.1.0
   */
  rating?: string | number;

  /**
   * Index of the `CalcdexPokemon` that is currently active on the field.
   *
   * @deprecated As of v1.0.4, not being used anymore in favor of `activeIndices`.
   * @default -1
   * @since 0.1.0
   */
  activeIndex?: number;

  /**
   * Indices of `CalcdexPokemon` that are currently active on the field.
   *
   * @default []
   * @since 1.0.4
   */
  activeIndices?: number[];

  /**
   * Index of the `CalcdexPokemon` that the user is currently viewing.
   *
   * @default 0
   * @since 0.1.0
   */
  selectionIndex?: number;

  /**
   * Whether `selectionIndex` should automatically update whenever `activeIndex` updates.
   *
   * @default true
   * @since 0.1.2
   */
  autoSelect?: boolean;

  /**
   * Maximum amount of Pokemon for this player.
   *
   * * Keeping this player-specific since that's how Showdown keeps it lol (i.e., `totalPokemon`).
   *
   * @default process.env.CALCDEX_PLAYER_MAX_POKEMON
   * @since 1.0.4
   */
  maxPokemon?: number;

  /**
   * Keeps track of the ordering of the Pokemon.
   *
   * * Each element should be some unique identifier for the Pokemon that's hopefully somewhat consistent.
   *   - Wouldn't recommend using `searchid` as it includes the `speciesForme`, subject to change.
   *   - For instance, `searchid` may read `'p1: Zygarde|Zygarde'`, but later read `'p1: Zygarde|Zygarde-Complete'`.
   *   - `ident` seems to be the most viable property here.
   * * Typically should only be used for ordering `myPokemon` on initialization.
   *   - Array ordering of `myPokemon` switches to place the last-switched in Pokemon first.
   *   - Since `calcdexId` internally uses the `slot` value, this re-ordering mechanic produces inconsistent IDs.
   *   - In randoms, assuming `myPokemon` belongs to `'p1'`, `p1.pokemon` will be empty until Pokemon are revealed,
   *     while `myPokemon` remains populated, but with shifting indices.
   * * Not necessary to use this for opponent and spectating players,
   *   since the ordering of `p1.pokemon` and `p2.pokemon` remains consistent.
   *   - Even in randoms, the server sends the client each Pokemon as they're revealed,
   *     and maintains that order in the battle state (again, under `p1.pokemon` and `p2.pokemon`).
   *
   * @since 0.1.3
   */
  pokemonOrder?: string[];

  /**
   * Player's current Pokemon, all converted into our custom `CalcdexPokemon` objects.
   *
   * * Does not need to be populated with the maximum number of Pokemon,
   *   but should not exceed that amount.
   *   - Maximum can be configured via the `CALCDEX_PLAYER_MAX_POKEMON` environment variable.
   *
   * @since 0.1.0
   */
  pokemon?: CalcdexPokemon[];

  /**
   * Whether the player has already Dynamaxed (including Gigantamax, if applicable) one of their Pokemon.
   *
   * * If `true`, this will disable the Max toggles for all of the player's Pokemon in `PokeMoves`.
   *   - Note that once the battle is over (`active` in `CalcdexBattleState` is `false`), the Max toggles will
   *     be re-enabled again.
   * * Obviously for non-Gen 9 formats, this isn't being used.
   *
   * @default false
   * @since 1.1.3
   */
  usedMax?: boolean;

  /**
   * Whether the player has already Terastallized one of their Pokemon.
   *
   * * If `true`, this will disable the Tera toggles for all of the player's Pokemon in `PokeMoves`.
   *   - Note that once the battle is over (`active` in `CalcdexBattleState` is `false`), the Tera toggles will
   *     be re-enabled again.
   * * Obviously for non-Gen 9 formats, this isn't being used.
   *
   * @default false
   * @since 1.1.3
   */
  usedTera?: boolean;

  /**
   * Field conditions on the player's side.
   *
   * * As of v1.1.3, these are now directly being stored in the `CalcdexPlayer`, as opposed to the
   *   `CalcdexBattleField` in prior versions.
   *   - `attackerSide` and `defenderSide` in `CalcdexBattleField` is still used, but dynamically assigned
   *     in the `createSmogonField()` utility depending on who's attacking and defending.
   *   - This will allow us to keep track of individual field conditions of each player, particularly in FFA
   *     (Free-For-All) modes, where there could be up to 4 unique players in a single battle.
   *
   * @since 1.1.3
   */
  side?: CalcdexPlayerSide;
}
