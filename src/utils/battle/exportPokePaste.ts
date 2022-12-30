import { PokemonPokePasteStatMap } from '@showdex/consts/pokemon';
// import type { GenerationNum } from '@smogon/calc';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { detectLegacyGen } from './detectLegacyGen';
import { getDexForFormat } from './getDexForFormat';
import { hasNickname } from './hasNickname';

/**
 * Internally-used helper function to export a `Showdown.StatsTable` to the PokePaste syntax.
 *
 * @example
 * ```ts
 * exportStatsTable({
 *   hp: 0,
 *   atk: 252,
 *   def: 4,
 *   spa: 0,
 *   spd: 0,
 *   spe: 252,
 * }, 0);
 *
 * '252 Atk / 4 Def / 252 Spe'
 * ```
 * @since 1.0.3
 */
const exportStatsTable = (
  table: Showdown.StatsTable,
  ignoreValue?: number,
) => Object.entries(table || {}).reduce<string[]>((
  prev,
  [stat, value]: [Showdown.StatName, number],
) => {
  if (typeof value !== 'number' || (typeof ignoreValue === 'number' && value === ignoreValue)) {
    return prev;
  }

  const statMapping = PokemonPokePasteStatMap[stat];

  if (statMapping) {
    prev.push(`${value} ${statMapping}`);
  }

  return prev;
}, []).join(' / ');

/**
 * Exports the passed-in `CalcdexPokemon` to a `string` in the Teambuilder/PokePaste syntax.
 *
 * * Essentially a re-implementation of the global `Showdown.exportTeam()`, but for an individual
 *   `CalcdexPokemon`, making use of `CalcdexPokemon`-specific properties wherever available.
 *   - For instance, we set the ability as the `dirtyAbility`, if set, over the `ability`.
 *
 * @example
 * ```ts
 * // note: this object is not a complete CalcdexPokemon, obviously
 * exportPokePaste({
 *   name: 'Smogonbirb',
 *   speciesForme: 'Talonflame',
 *   gender: 'F',
 *   item: null,
 *   dirtyItem: 'Flyinium Z',
 *   shiny: false,
 *   ability: 'Gale Wings',
 *   dirtyAbility: null,
 *   level: 100,
 *   nature: 'Jolly',
 *   ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
 *   evs: { hp: 0, atk: 252, def: 4, spa: 0, spd: 0, spe: 252 },
 *   moves: ['Brave Bird', 'Flare Blitz', 'Swords Dance', 'Roost'],
 * });
 *
 * `
 * Smogonbirb (Talonflame) (F) @ Flyinium Z
 * Ability: Gale Wings
 * EVs: 252 Atk / 4 Def / 252 Spe
 * Jolly Nature
 * - Brave Bird
 * - Flare Blitz
 * - Swords Dance
 * - Roost
 * `
 * ```
 * @see https://pokepast.es/syntax.html
 * @since 1.0.3
 */
export const exportPokePaste = (
  pokemon: DeepPartial<CalcdexPokemon>,
  format?: string,
): string => {
  if (!pokemon?.speciesForme) {
    return null;
  }

  const dex = getDexForFormat(format);
  const legacy = detectLegacyGen(format);

  const {
    name,
    speciesForme,
    gender,
    item,
    prevItem,
    dirtyItem,
    shiny,
    ability,
    dirtyAbility,
    level,
    // happiness, // doesn't exist in CalcdexPokemon atm
    types,
    teraType,
    nature,
    ivs,
    evs,
    moves,
  } = pokemon;

  // contains each line of the syntax, which will be joined with newlines (\n) at the ned
  const output: string[] = [
    speciesForme,
  ];

  // <name | speciesForme> [(<speciesForme>)] [(<gender>)] [@ <item>]
  const dexCurrentForme = dex?.species.get(speciesForme);

  const battleOnlyFormes = Array.isArray(dexCurrentForme?.battleOnly)
    ? [...dexCurrentForme.battleOnly]
    : [dexCurrentForme.battleOnly].filter(Boolean);

  const actualForme = battleOnlyFormes[0] || dexCurrentForme.name;

  if (actualForme && actualForme !== output[0]) {
    output[0] = actualForme;
  }

  const hasGmaxForme = output[0].endsWith('-Gmax');

  if (hasGmaxForme) {
    output[0] = output[0].replace('-Gmax', '');
  }

  if (hasNickname(pokemon)) {
    output[0] = `${name} (${output[0]})`;
  }

  if (['M', 'F'].includes(gender)) {
    output[0] += ` (${gender})`;
  }

  const currentItem = dirtyItem ?? (prevItem || item);

  if (currentItem) {
    output[0] += ` @ ${currentItem}`;
  }

  // Ability: <ability>
  const currentAbility = dirtyAbility ?? ability;

  if (currentAbility) {
    output.push(`Ability: ${currentAbility}`);
  }

  // Shiny: <Yes/No>
  if (shiny) {
    output.push('Shiny: Yes');
  }

  // Tera Type: <teraType>
  // (<teraType> shouldn't print when '???' or matches the default Tera type, i.e., the first type of the Pokemon)
  if (teraType && teraType !== '???' && teraType !== types[0]) {
    output.push(`Tera Type: ${teraType}`);
  }

  // Gigantamax: <Yes/No>
  if (hasGmaxForme) {
    output.push('Gigantamax: Yes');
  }

  // Level: <value> (where <value> is not 100)
  if (typeof level === 'number' && level !== 100) {
    output.push(`Level: ${level}`);
  }

  // Happiness: <value> (where <value> is not 255)

  // IVs: <value> <stat> ...[/ <value> <stat>] (where <value> is not 31)
  // EVs: <value> <stat> ...[/ <value> <stat>] (where <value> is not 0)
  // (where <stat> is HP, Atk, Def, SpA, SpD, or Spe)
  if (Object.keys(ivs || {}).length) {
    const exportedIvs = exportStatsTable(ivs, 31);

    if (exportedIvs) {
      output.push(`IVs: ${exportedIvs}`);
    }
  }

  if (!legacy && Object.keys(evs || {}).length) {
    const exportedEvs = exportStatsTable(evs, 0);

    if (exportedEvs) {
      output.push(`EVs: ${exportedEvs}`);
    }
  }

  // <nature> Nature
  if (nature) {
    output.push(`${nature} Nature`);
  }

  // - <moveName>
  if (moves?.length) {
    // e.g., 'Hidden Power Fire' -> 'Hidden Power [Fire]'
    // (though, the Teambuilder will accept the former, i.e., 'Hidden Power Fire')
    output.push(...moves.filter(Boolean).map((moveName) => '- ' + (
      moveName?.includes('Hidden Power')
        ? moveName.replace(/(?<=Hidden\sPower\s)(\w+)$/, '[$1]')
        : moveName
    )));
  }

  return output.join('\n') || null;
};
