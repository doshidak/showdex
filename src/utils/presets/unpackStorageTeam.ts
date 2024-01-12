import { type AbilityName, type ItemName, type MoveName } from '@smogon/calc';
import { PokemonNatures, PokemonNeutralNatures, PokemonTypes } from '@showdex/consts/dex';
import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { calcPresetCalcdexId } from '@showdex/utils/calc';
import { clamp } from '@showdex/utils/core';
import { detectGenFromFormat, getDefaultSpreadValue, getDexForFormat } from '@showdex/utils/dex';

/**
 * Converts a single `packedTeam` from the Teambuilder into `CalcdexPokemonPreset[]`s.
 *
 * * Note that the term *team* here refers to a collection of Pokemon sets/presets, typically 6 for non-box teams.
 * * Showdown's Teambuilder will store packed teams under the `LocalStorage` key `'showdown_teams'`,
 *   deliminated by newlines (i.e., `'\n'`).
 * * While we could've tapped into Showdown's `Storage.fastUnpackTeam()`, the logic has been reimplemented
 *   for finer control over how the `CalcdexPokemonPreset` is assembled.
 * * Update (2024/01/12): Discovered an edge case where formatless teams & boxes will be saved as `'gen9'` (or whatever
 *   the current gen is), so we'll parse it as `'gen9unknown'` as to not break anything expecting a format... like the
 *   great `endsWith()` crash of v1.2.1 due to `getGenlessFormat()` in `legalLockedFormat()` returning `null` LOL.
 * * Guaranteed to at least return an empty array (i.e., `[]`) if unpacking fails at any point.
 *
 * There is a very specific format that Showdown uses when packing each team into `LocalStorage`:
 *
 * ```plaintext
 * <format>[-box]]<teamName>|[<pokemon>[...(]<pokemon>)]]
 * ```
 *
 * where:
 *
 * * `<format>` is the name of the format with the `'gen<#>'` prefix, suffixed by `'-box'` if the team is a box,
 *   - e.g., `'gen9ou'`, `'gen9ou-box'`
 *   - Note that the `<format>` and `<teamName>` are deliminated by a closed bracket (i.e., `']'`).
 * * `<teamName>` is the name of the team, and
 *   - e.g., `'Untitled 1'`
 * * `<pokemon>` is each Pokemon on the team, deliminated by closed brackets (i.e., `']'`).
 *
 * Each `<pokemon>` is formatted as such (with added line breaks and indentations for clarity):
 *
 * ```plaintext
 * <nickname|speciesForme>
 *   |[<id(speciesForme)>]
 *   |[<id(item)>]
 *   |<id(ability)>
 *   |[<id(moves[0])>[...(,<id(moves[i])>)]
 *   |[<nature>]
 *   |[<evs.hp>[,<evs.atk>,<evs.def>,<evs.spa>,<evs.spd>,<evs.spe>]]
 *   |[<gender>]
 *   |[<ivs.hp>,<ivs.atk>,<ivs.def>,<ivs.spa>,<ivs.spd>,<ivs.spe>]
 *   |[<shiny>]
 *   |[<level>]
 *   |[<happiness>][,[<hpType>],[<id(pokeball)>],[<gigantamax>],[<dynamaxLevel>],[<teraType>]]
 * ```
 *
 * where:
 *
 * * `<id(prop)>` is the value of `formatId(prop)`,
 *   - Likewise, `<id(prop1|prop2)>` is the value of `formatId(prop1 || prop2)`.
 * * `<id(speciesForme)>` if not equal to `<id(nickname)>`,
 * * `<evs.*>` if type `number` and not `0`,
 * * `<ivs.*>` if type `number` and not `31`,
 * * `<shiny>` is `'S'` if `true`,
 * * `<level>` if type `number` and not `100`,
 * * `<happiness>` if type `number` and not `255`,
 * * `<hpType>` is the *Hidden Power* type if there exists no typed *Hidden Power* in `moves[]`,
 * * `<gigantamax>` is `'G'` if `true`, and
 * * `<dynamaxLevel>` if type `number` and not `10`.
 *
 * @since 1.1.2
 */
export const unpackStorageTeam = (
  packedTeam: string,
): CalcdexPokemonPreset[] => {
  // this will be our final return value
  const output: CalcdexPokemonPreset[] = [];

  if (!packedTeam?.includes(']')) {
    return output;
  }

  const teamIndex = packedTeam.indexOf('|');

  if (teamIndex < 0) {
    return output;
  }

  const [
    rawFormat,
    presetName = 'Teambuilder',
  ] = packedTeam.slice(0, teamIndex).split(']');

  const box = rawFormat?.endsWith('-box');
  const format = rawFormat?.replace('-box', '');
  const gen = detectGenFromFormat(format);

  if (!format || !gen) {
    return output;
  }

  const defaultIv = getDefaultSpreadValue('iv', format);
  const defaultEv = getDefaultSpreadValue('ev', format);

  const packedPokemon = packedTeam
    .slice(teamIndex + 1)
    .split(']')
    .filter((p) => p?.includes('|'));

  if (!packedPokemon.length) {
    return output;
  }

  const dex = getDexForFormat(format);

  packedPokemon.forEach((packed) => {
    const preset: CalcdexPokemonPreset = {
      calcdexId: null,
      id: null,
      source: box ? 'storage-box' : 'storage',
      name: presetName,
      gen,
      format,
      // nickname: null,
      speciesForme: null,
      // shiny: false,
      level: 100,
      ability: null,
      item: null,
      nature: 'Hardy',
      moves: [],

      // update (2023/01/05): IV parsing may not happen since the split value could be an empty string
      ivs: {
        hp: defaultIv,
        atk: defaultIv,
        def: defaultIv,
        spa: defaultIv,
        spd: defaultIv,
        spe: defaultIv,
      },

      // update (2023/07/25): now adding EVs cause apparently they're sometimes used in legacy gens lol
      evs: {
        hp: defaultEv,
        atk: defaultEv,
        def: defaultEv,
        spa: defaultEv,
        spd: defaultEv,
        spe: defaultEv,
      },
    };

    // update (2024/01/12): handling an edge case where if you don't set a format, the team gets saved as 'gen9', e.g.,
    // 'gen9]showdex-v1.2.1/badteam|badaludon|archaludon|assaultvest|stamina|dracometeor,flashcannon,...'
    if (preset.format === `gen${preset.gen}`) {
      preset.format += 'unknown'; // e.g., 'gen9unknown'
    }

    const [
      nickname,
      speciesId,
      itemId,
      abilityId,
      packedMoves,
      nature,
      packedEvs,
      gender,
      packedIvs,
      shiny,
      level,
      packedProps,
    ] = packed.split('|');

    // note: speciesId won't exist if it's equal to nickname (handled in Showdown when packing)
    // e.g., 'Dondozo||leftovers|...' (nickname: 'Dondozo', speciesId: '') vs.
    // 'Big Fish|dondozo|leftovers|...' (nickname: 'Big Fish', speciesId: 'dondozo')
    const dexSpecies = dex.species.get(speciesId || nickname);

    if (!dexSpecies?.exists) {
      return;
    }

    preset.speciesForme = dexSpecies.name;

    // just in case lol
    if (!preset.speciesForme) {
      return;
    }

    // if both nickname and speciesId exist, then we know nickname is actually the nickname
    // (instead of the speciesForme, as shown in the example above)
    const hasNickname = !!nickname && !!speciesId;

    if (hasNickname) {
      preset.nickname = nickname;

      // update (2023/01/04): we'll name the preset after the nickname, then put the original
      // set name in parentheses so buildPresetOptions() will move that into the option's subLabel
      preset.name = `${nickname} (${presetName})`;
    }

    if (itemId) {
      const dexItem = dex.items.get(itemId);

      if (dexItem?.exists) {
        preset.item = dexItem.name as ItemName;
      }
    }

    if (abilityId && abilityId !== 'noability') {
      const dexAbility = dex.abilities.get(abilityId);

      if (dexAbility?.exists) {
        preset.ability = dexAbility.name as AbilityName;
      }
    }

    if (packedMoves) {
      packedMoves.split(',').forEach((moveId) => {
        if (!moveId) {
          return;
        }

        const dexMove = dex.moves.get(moveId);

        if (!dexMove?.exists || preset.moves.includes(dexMove.name as MoveName)) {
          return;
        }

        preset.moves.push(dexMove.name as MoveName);
      });
    }

    if (PokemonNatures.includes(nature as Showdown.NatureName)) {
      preset.nature = PokemonNeutralNatures.includes(nature as Showdown.NatureName)
        ? 'Hardy'
        : nature as Showdown.NatureName;
    }

    if (packedEvs?.includes(',')) {
      const [
        hpEv,
        atkEv,
        defEv,
        spaEv,
        spdEv,
        speEv,
      ] = packedEvs.split(',');

      // update (2023/07/25): apparently legacy gens can use this now, so gotta do the gross parsedEvs thing lol
      const parsedEvs: Showdown.StatsTable = {
        hp: parseInt(hpEv, 10),
        atk: parseInt(atkEv, 10),
        def: parseInt(defEv, 10),
        spa: parseInt(spaEv, 10),
        spd: parseInt(spdEv, 10),
        spe: parseInt(speEv, 10),
      };

      preset.evs = {
        hp: clamp(0, parsedEvs.hp === 0 ? 0 : (parsedEvs.hp || defaultEv), 252),
        atk: clamp(0, parsedEvs.atk === 0 ? 0 : (parsedEvs.atk || defaultEv), 252),
        def: clamp(0, parsedEvs.def === 0 ? 0 : (parsedEvs.def || defaultEv), 252),
        spa: clamp(0, parsedEvs.spa === 0 ? 0 : (parsedEvs.spa || defaultEv), 252),
        spd: clamp(0, parsedEvs.spd === 0 ? 0 : (parsedEvs.spd || defaultEv), 252),
        spe: clamp(0, parsedEvs.spe === 0 ? 0 : (parsedEvs.spe || defaultEv), 252),
      };
    }

    if (['M', 'F', 'N'].includes(gender)) {
      preset.gender = gender as Showdown.GenderName;
    }

    if (packedIvs?.includes(',')) {
      // note: if the value in Teambuilder is the max DV/IV, then the split value will be an empty string
      // (btw, parseInt('', 10) is NaN)
      const [
        hpIv,
        atkIv,
        defIv,
        spaIv,
        spdIv,
        speIv,
      ] = packedIvs.split(',');

      // parsing first cause IVs default to a non-0 value, but can be 0 (NaN, like 0, is falsy btw)
      // (also doing it like this to avoid an additional for loop)
      const parsedIvs: Showdown.StatsTable = {
        hp: parseInt(hpIv, 10),
        atk: parseInt(atkIv, 10),
        def: parseInt(defIv, 10),
        spa: parseInt(spaIv, 10),
        spd: parseInt(spdIv, 10),
        spe: parseInt(speIv, 10),
      };

      // gross, but we need to differentiate between NaN (i.e., empty string, so defaultIv) and 0 (should NOT be defaultIv!)
      preset.ivs = {
        hp: clamp(0, parsedIvs.hp === 0 ? 0 : (parsedIvs.hp || defaultIv), 31),
        atk: clamp(0, parsedIvs.atk === 0 ? 0 : (parsedIvs.atk || defaultIv), 31),
        def: clamp(0, parsedIvs.def === 0 ? 0 : (parsedIvs.def || defaultIv), 31),
        spa: clamp(0, parsedIvs.spa === 0 ? 0 : (parsedIvs.spa || defaultIv), 31),
        spd: clamp(0, parsedIvs.spd === 0 ? 0 : (parsedIvs.spd || defaultIv), 31),
        spe: clamp(0, parsedIvs.spe === 0 ? 0 : (parsedIvs.spe || defaultIv), 31),
      };
    }

    if (shiny) {
      preset.shiny = shiny === 'S';
    }

    if (level) {
      preset.level = clamp(0, parseInt(level, 10) || 100, 100);
    }

    if (packedProps?.includes(',')) {
      const [
        happiness,
        hpType,
        pokeballId,
        gigantamax,
        dynamaxLevel,
        teraType,
      ] = packedProps.split(',');

      if (happiness) {
        preset.happiness = clamp(0, parseInt(happiness, 10) || 255, 255);
      }

      if (PokemonTypes.includes(hpType as Showdown.TypeName)) {
        preset.hiddenPowerType = hpType as Showdown.TypeName;
      }

      if (pokeballId) {
        const dexPokeball = dex.items.get(pokeballId);

        if (dexPokeball?.exists) {
          preset.pokeball = dexPokeball.name;
        }
      }

      if (gigantamax === 'G' && dexSpecies.canGigantamax) {
        const dexGigantamax = dex.species.get(`${preset.speciesForme}-Gmax`);

        if (dexGigantamax?.exists) {
          preset.speciesForme = dexGigantamax.name;
          preset.gigantamax = true;
        }
      }

      if (dynamaxLevel) {
        preset.dynamaxLevel = clamp(0, parseInt(dynamaxLevel, 10) || 10, 10);
      }

      if (PokemonTypes.includes(teraType as Showdown.TypeName)) {
        preset.teraTypes = [teraType as Showdown.TypeName];
      }
    }

    // use the BattleStatGuesser to display a more descriptive preset name if there's no nickname
    if (!hasNickname && typeof BattleStatGuesser === 'function') {
      const guesser = new BattleStatGuesser(format);

      const guessedRole = guesser.guessRole({
        ...preset,
        species: preset.speciesForme,
      });

      if (guessedRole && guessedRole !== '?') {
        preset.name = `${guessedRole} (${presetName})`;
      }
    }

    preset.calcdexId = calcPresetCalcdexId(preset);
    preset.id = preset.calcdexId;

    const presetIndex = output.findIndex((p) => p?.calcdexId === preset.calcdexId);

    if (presetIndex > -1) {
      output.splice(presetIndex, 1, preset);
    } else {
      output.push(preset);
    }
  });

  return output;
};
