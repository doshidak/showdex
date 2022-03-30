/**
 * Removes crap like wildcard formes from the Pokemon's `speciesForme`.
 *
 * The following is a list of edge cases that made the extension crap itself:
 * * *-Mega (e.g., Lopunny-Mega -> Lopunny)
 * * *-Gmax (e.g., Alcremie-Gmax -> Alcremie)
 * * *-Original (e.g., Magerna-Original -> Magerna)
 * * Gastrodon-East -> Gastrodon
 * * Genesect-Burn -> Genesect
 * * Genesect-Chill -> Genesect
 * * Genesect-Douse -> Genesect
 * * Genesect-Shock -> Genesect
 * * Urshifu-Rapid-Strike -> Urshifu
 * * Zygarde-10% -> Zygarde
 * * Zygarde-Complete -> Zygarde
 *
 * @example 'Urshifu-*' -> 'Urshifu'
 * @since 0.1.0
 */
export const sanitizeSpeciesForme = (
  speciesForme: string,
): string => speciesForme?.replace?.(
  /-(?:\*|Mega|Gmax|Original|East|Burn|Chill|Douse|Shock|Rapid-Strike|10%|Complete)/gi,
  '',
);
