/**
 * Detects if the Pokemon's `speciesForme` ends with the `'-Mega'` suffix.
 *
 * * Also passes if there are additional mega formes, such as `'Charizard-Mega-X'` and `'Mewtwo-Mega-Y'`.
 *
 * @since 1.0.2
 */
export const hasMegaForme = (speciesForme: string): boolean => !!speciesForme
  && /-(?:Mega(?:-[A-Z]+)?|Ultra)$/i.test(speciesForme);
