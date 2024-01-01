/**
 * Honkdex-specific settings.
 *
 * @since 1.2.0
 */
export interface ShowdexHonkdexSettings {
  /**
   * Whether the Honkdex is *visually* enabled.
   *
   * * When enabled (default), Honks can be viewed & created in the Hellodex.
   * * Disabling this won't clear any saved Honks.
   *
   * @default true
   * @since 1.2.0
   */
  visuallyEnabled: boolean;

  /**
   * Whether to show all formats in the format dropdown.
   *
   * * When disabled (default), all Randoms & Customs formats will be excluded from the list of options.
   *
   * @default false
   * @since 1.2.0
   */
  showAllFormats: boolean;

  /**
   * Whether to always allow Pokemon types to be edited.
   *
   * * When disabled, the `editPokemonTypes` Calcdex setting will be used.
   *
   * @default true
   * @since 1.2.0
   */
  alwaysEditTypes: boolean;

  /**
   * Whether to always allow moves to be edited.
   *
   * * When disabled, the `showMoveEditor` Calcdex setting will be used.
   *
   * @default true
   * @since 1.2.0
   */
  alwaysEditMoves: boolean;

  /**
   * Whether to expand the stats table to show all stats.
   *
   * * When enabled (default), base stats, IVs & EVs will be shown.
   *   - EVs may be hidden in legacy gens, unless the `showLegacyEvs` Calcdex setting is enabled.
   * * When disabled, the `lockGeneticsVisibility` Calcdex setting will be used.
   *
   * @default true
   * @since 1.2.0
   */
  alwaysShowGenetics: boolean;
}
