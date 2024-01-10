import { type CalcdexPlayerKey, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { importPokePaste } from './importPokePaste';

const SummaryTag = '</summary>';

/**
 * Internal helper function to parse the `stepQueue` from a `!showteam` chat command.
 *
 * @since 1.1.3
 */
const parseRevealedTeamSheet = (
  format: string,
  stepQueue: string,
): CalcdexPokemonPreset[] => {
  if (!stepQueue.startsWith('|c|')) {
    return [];
  }

  const [
    , // this is just 'c'
    rawPlayerName,
    rawSheet,
  ] = stepQueue // e.g., '|c| showdex_tester|/raw <div class="infobox"><details>...'
    .split('|') // -> ['', 'c', ' showdex_tester', '/raw <div class="infobox"><details>...']
    .filter(Boolean) // -> ['c', ' showdex_tester', '/raw <div class="infobox"><details>...']
    .map((s) => s.replace(/\/raw\x20?/i, '')); // -> ['c', ' showdex_tester', '<div class="infobox"><details>...']

  // grab everything after the </summary>, but before the </details>
  // e.g., '<div class="infobox"><details><summary>View team</summary>Chien-Pao @ Heavy-Duty Boots  <br />...<br /></details></div>'
  // -> 'Chien-Pao @ Heavy-Duty Boots  <br />Ability: Sword of Ruin  <br />Tera Type: Dark  <br />...<br/>'
  const rawPokePastes = rawSheet.slice(
    rawSheet.indexOf(SummaryTag) + SummaryTag.length, // we don't want the </summary> part
    rawSheet.indexOf('</details>'),
  );

  if (!rawPokePastes) {
    return [];
  }

  // don't format the playerName as an ID!
  // first char of the name seems to be the role marker for the user; blank if none, star if a player in battle, etc.
  const playerName = rawPlayerName?.slice(1)?.trim();

  // convert <br>'s padded with spaces before with newlines (while keeping <br>'s on their own lines in-tact),
  // replace all HTML entities of the forwards slash ('/') with the actual character, and
  // split the string using <br> as the delimiter (remember when we left in unpadded <br>'s?)
  const pokePastes = rawPokePastes
    .replace(/\x20+<br\x20*\/?>/gi, '\n')
    .replace(/&#x2f;/gi, '/') // e.g., 'EVs: 252 HP &#x2f; 4 Def &#x2f; 252 SpD' -> 'EVs: 252 HP / 4 Def / 252 SpD'
    .split(/<br\x20*\/?>/gi)
    .filter(Boolean);

  if (!pokePastes.length) {
    return [];
  }

  // note: playerName doesn't affect the calcdexId hashing
  return pokePastes.map((pokePaste) => ({
    ...importPokePaste(pokePaste, format, 'Shown Team', 'sheet'),
    playerName,
  }));
};

/**
 * Internal helper function to parse the `stepQueue` from an open team sheet.
 *
 * @since 1.1.3
 */
const parseOpenTeamSheet = (
  format: string,
  stepQueue: string,
): CalcdexPokemonPreset[] => {
  // this will be our final return value
  const output: CalcdexPokemonPreset[] = [];

  if (!stepQueue.startsWith('|uhtml|ots|')) {
    return output;
  }

  const [
    , // this is just 'uhtml'
    , // and this is just 'ots'
    rawSheets, // can include multiple for each active player
  ] = stepQueue // e.g., '|uhtml|ots|<div class="infobox" style="margin-top:5px"><details>...'
    .split('|') // -> ['', 'uhtml', 'ots', '<div class="infobox" style="margin-top:5px"><details>...']
    .filter(Boolean); // -> ['uhtml', 'ots', '<div class="infobox" style="margin-top:5px"><details>...']

  if (!rawSheets) {
    return output;
  }

  // -> [
  //  '<div class="infobox" style="margin-top:5px"><details><summary>Open Team Sheet for showdex_tester</summary>...</details>',
  //  '<div class="infobox" style="margin-top:5px"><details><summary>Open Team Sheet for showdex_testee</summary>...</details>',
  // ]
  const splitRawSheets = rawSheets.split('</div>').filter(Boolean);

  if (!splitRawSheets.length) {
    return output;
  }

  splitRawSheets.forEach((rawSheet) => {
    // extract the playerName from the <summary>
    // (don't format the playerName as an ID!)
    const [, rawPlayerName] = /<summary>open\x20+team\x20+sheet\x20+for\x20+(.+)<\/summary>/i.exec(rawSheet) || [];
    const playerName = rawPlayerName?.trim();

    // also don't bother processing this sheet if we don't know who it belongs to
    if (!playerName) {
      return;
    }

    // grab only the PokePaste parts and process them similarly to parseRevealedTeamSheet()
    const rawPokePastes = rawSheet.slice(
      rawSheet.indexOf(SummaryTag) + SummaryTag.length,
      rawSheet.indexOf('</details>'),
    );

    if (!rawPokePastes) {
      return;
    }

    const pokePastes = rawPokePastes
      .replace(/\x20+<br\x20*\/?>/gi, '\n')
      .replace(/&#x2f;/gi, '/') // despite open team sheets potentially not including EVs/IVs, we'll do this anyways
      .split(/<br\x20*\/?>/gi)
      .filter(Boolean);

    if (!pokePastes.length) {
      return;
    }

    output.push(...pokePastes.map((pokePaste) => ({
      ...importPokePaste(pokePaste, format, 'Team Sheet', 'sheet'),
      playerName,
    })));
  });

  return output;
};

/**
 * Parse a team based on the specification provided @
 * https://github.com/smogon/pokemon-showdown/blob/master/sim/TEAMS.md
 *
 * @author malaow3 <malaow3@yahoo.com>
 * @since 1.1.8
 */
const parsePackedTeam = (
  team: string,
  playerNames: Partial<Record<CalcdexPlayerKey, string>>,
  format: string,
): CalcdexPokemonPreset[] => {
  // First, split the string into the two showteam parts
  team = team.trim();
  // Remove the showteam part
  team = team.slice(team.indexOf('|showteam|') + 10);

  // Get the player
  const playerKey = team.slice(0, team.indexOf('|')) as CalcdexPlayerKey;
  // Remove the player part
  team = team.slice(team.indexOf('|') + 1);
  const playerName = playerNames[playerKey];

  // Get the team and convert to export format.
  const mons = team.split(']');
  const pokePastes: string[] = [];
  for (let i = 0; i < mons.length; i++) {
    const mondata = mons[i];
    if (!mondata) continue;
    const mon = mondata.split('|');
    // Create the pokepaste
    // As of October 2023, the format is:
    // 0: nickname
    // 1: species -- empty if no nickname
    // 2: item
    // 3: ability
    // 4: moves -- comma separated
    // 5: nature
    // 6: evs -- comma separated, order is HP, Atk, Def, SpA, SpD, Spe
    // 7: gender
    // 8: ivs -- comma separated, order is HP, Atk, Def, SpA, SpD, Spe
    // 9: shiny
    // 10: level
    // 11: misc - comma separated, order is happiness, pokeball, hp type, gigantamax, dynamax level, tera type

    let pokePaste = '';
    // Check if species is empty
    if (mon[1] === '') {
      pokePaste += `${mon[0]}`;
    } else {
      pokePaste += `${mon[1]} (${mon[0]})`;
    }
    // Check if item is empty
    if (mon[2] !== '') {
      let item = mon[2];
      // Add a space before each capital letter, excluding the first
      item = item.replace(/([A-Z])/g, ' $1').trimStart();
      pokePaste += ` @ ${item}`;
    }
    pokePaste += '\n';

    // Check if ability is empty
    if (mon[3] !== '') {
      let ability = mons[3];
      ability = ability.replace(/([A-Z])/g, ' $1').trimStart();
      pokePaste += `Ability: ${ability}\n`;
    }
    // Check if tera type and hidden power type are empty
    if (mon[11] !== '') {
      const misc = mon[11].split(',');
      if (misc[2] !== '') {
        pokePaste += 'Hidden Power: ' + misc[2] + '\n';
      }
      if (misc[5] !== '') {
        pokePaste += 'Tera Type: ' + misc[5] + '\n';
      }
    }

    if (mon[10]) {
      pokePaste += `Level: ${mon[10]}\n`;
    }

    // Check if EVs are empty
    if (mon[6] !== '') {
      const evs = mon[6].split(',');
      pokePaste += 'EVs:';
      if (evs[0] !== '') {
        pokePaste += ` ${evs[0]} HP /`;
      }
      if (evs[1] !== '') {
        pokePaste += ` ${evs[1]} Atk /`;
      }
      if (evs[2] !== '') {
        pokePaste += ` ${evs[2]} Def /`;
      }
      if (evs[3] !== '') {
        pokePaste += ` ${evs[3]} SpA /`;
      }
      if (evs[4] !== '') {
        pokePaste += ` ${evs[4]} SpD /`;
      }
      if (evs[5] !== '') {
        pokePaste += ` ${evs[5]} Spe`;
      }
      // Remove the last slash
      pokePaste = pokePaste.slice(0, -1);
      pokePaste += '\n';
    }
    // Check if nature is empty
    if (mon[5] !== '') {
      pokePaste += `${mon[5]} Nature\n`;
    }

    // Check if IVs are empty
    if (mon[8] !== '') {
      const ivs = mon[8].split(',');
      pokePaste += 'IVs:';
      if (ivs[0] !== '') {
        pokePaste += ` ${ivs[0]} HP /`;
      }
      if (ivs[1] !== '') {
        pokePaste += ` ${ivs[1]} Atk /`;
      }
      if (ivs[2] !== '') {
        pokePaste += ` ${ivs[2]} Def /`;
      }
      if (ivs[3] !== '') {
        pokePaste += ` ${ivs[3]} SpA /`;
      }
      if (ivs[4] !== '') {
        pokePaste += ` ${ivs[4]} SpD /`;
      }
      if (ivs[5] !== '') {
        pokePaste += ` ${ivs[5]} Spe`;
      }
      // Remove the last slash
      pokePaste = pokePaste.slice(0, -1);
      pokePaste += '\n';
    }

    // Add the moves
    const moves = mon[4].split(',');
    for (let j = 0; j < moves.length; j++) {
      const move = moves[j];
      // Add a space before each capital letter, excluding the first
      pokePaste += `- ${move.replace(/([A-Z])/g, ' $1').trimStart()}\n`;
    }
    pokePastes.push(pokePaste);
  }

  return pokePastes.map((pokePaste) => ({
    ...importPokePaste(pokePaste, format, 'Shown Team', 'sheet'),
    playerName,
  }));
};

/**
 * Reads team sheets revealed in battle and returns `CalcdexPokemonPreset[]`s from the provided `stepQueue`.
 *
 * * Team sheets can be revealed by the format (e.g., VGC 2023) or the `!showteam` chat command.
 * * This does **not** validate who the team belongs to, just simply converts the HTML output into presets.
 * * Provided `stepQueue` should have the following syntax:
 *   - `'|uhtml|ots|<html>'` for team sheets and
 *   - `'|c| <username>|/raw <html>'` for `!showteam`.
 *   - If the `stepQueue` doesn't start with `'|c|'` or `'|uhtml|ots|'`, an empty array (i.e., `[]`) will be returned.
 * * For open team sheets, the `stepQueue` will include sheets for all active players.
 *   - In this instance, you can distinguish each player using the `playerName` property of each returned
 *     `CalcdexPokemonPreset`.
 *   - If the `playerName` couldn't be determined from the team sheet HTML, no PokePastes will be processed for that sheet.
 *   - Note that this preset builder will always populate the `playerName`.
 *   - Also note that these types of sheets may not include the Pokemon's spread (e.g., EVs, IVs, nature).
 * * Only PokePastes that were able to be parsed will be included.
 *   - This means you'll have to search through the array using `.find()`, for instance, to get the preset
 *     for the forme you're looking for.
 * * Guaranteed to at least return an empty array (i.e., `[]`) if reading fails at any point.
 *
 * @since 1.1.3
 */
export const getTeamSheetPresets = (
  format: string,
  stepQueue: string,
  playerNames: Partial<Record<CalcdexPlayerKey, string>>,
): CalcdexPokemonPreset[] => {
  if (!format || !stepQueue) {
    return [];
  }

  if (stepQueue.startsWith('|c|')) {
    return parseRevealedTeamSheet(format, stepQueue);
  }
  if (stepQueue.includes('|raw|<div class="infobox" style="margin-top:5px">')) {
    // Replace the `|raw|` with `|uhtml|ots|` so we can parse it like an accepted teamsheet.
    stepQueue = stepQueue.replace('|raw|', '|uhtml|ots|');
    // Trim everything before the first `|uhtml|ots|` so we can parse it like an accepted teamsheet.
    stepQueue = stepQueue.slice(stepQueue.indexOf('|uhtml|ots|'));
  }
  // Similar fix to handle FORCED ots
  if (stepQueue.includes('|showteam|')) {
    stepQueue = stepQueue.slice(stepQueue.indexOf('|showteam|'));
    return parsePackedTeam(stepQueue, playerNames, format);
  }
  // if it ain't this either, then probably something we don't know how to parse
  // (in which case, this will just return an empty array anyways)
  return parseOpenTeamSheet(format, stepQueue);
};
