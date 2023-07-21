/**
 * For use with RTK Query only.
 *
 * @since 0.1.3
 */
export type ReduxTagType =
  | PokemonReduxTagType
  | ShowdownReduxTagType;

/**
 * For use with RTK Query tag providers only.
 *
 * @since 0.1.3
 */
export interface ReduxProvidedTag {
  type: ReduxTagType;
  id: string;
}

/**
 * For use with RTK Query endpoints from `pkmnApi` only.
 *
 * @since 0.1.3
 */
export enum PokemonReduxTagType {
  Preset = 'pokemon:preset',
}

/**
 * For use with RTK Query endpoints from `showdownApi` only.
 *
 * @since 1.0.7
 */
export enum ShowdownReduxTagType {
  Ladder = 'showdown:ladder',
}
