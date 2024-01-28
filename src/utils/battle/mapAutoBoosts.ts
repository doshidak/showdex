import { type AbilityName, type GenerationNum, type ItemName } from '@smogon/calc';
import { PokemonBoostNames } from '@showdex/consts/dex';
import {
  type CalcdexAutoBoostEffect,
  type CalcdexAutoBoostMap,
  type CalcdexBattleField,
  type CalcdexPlayer,
  type CalcdexPlayerKey,
  type CalcdexPokemon,
  CalcdexPlayerKeys,
} from '@showdex/interfaces/calc';
import { determineAutoBoostEffect, getDexForFormat } from '@showdex/utils/dex';
import { chunkStepQueueTurns } from './chunkStepQueueTurns';

const relevantStep = (step: string) => (
  (step?.startsWith('|-ability|') && step.endsWith('|boost'))
    || (step?.startsWith('|-enditem|') && step.endsWith('Seed'))
);

const boostStep = (step: string) => step?.startsWith('|-boost') || step?.startsWith('|-unboost');

const identRegex = (
  playerKey?: CalcdexPlayerKey,
  searchName?: string,
) => new RegExp(`(${playerKey || 'p\\d'})[a-z]?:\\s*(${searchName || ''}[\\w\\s-]*)`, 'i');

/**
 * Creates a mapping of the `pokemon`'s applied auto-boost effects from the provided `stepQueue[]`.
 *
 * * Though not required, additional battle state information can be provided in `config` to build more accurate mappings.
 * * Note that this is meant to be used during a battle sync, as implied by the required `stepQueue[]` argument.
 * * Guaranteed to return an empty object.
 *
 * @since 1.2.3
 */
export const mapAutoBoosts = (
  pokemon: CalcdexPokemon,
  stepQueue: string[],
  config?: {
    format?: string | GenerationNum;
    players?: Partial<Record<CalcdexPlayerKey, CalcdexPlayer>>;
    field?: CalcdexBattleField;
  },
): CalcdexAutoBoostMap => {
  const output: CalcdexAutoBoostMap = {};

  if (!pokemon?.speciesForme || !pokemon.playerKey || !stepQueue?.length) {
    return output;
  }

  const {
    format,
    players,
    field,
  } = config || {};

  const dex = getDexForFormat(format);

  const {
    name: nickname,
    speciesForme,
    playerKey,
    // ability: revealedAbility,
    // dirtyAbility,
    // item: revealedItem,
    // dirtyItem,
  } = pokemon;

  const searchName = (nickname || speciesForme)?.split('-')[0];
  // const ability = dirtyAbility || revealedAbility;
  // const item = dirtyItem ?? revealedItem;

  // looking for steps like these in the following `chunks[]` (including the chunk at turn/index 0):
  // '|-ability|p1a: My Cool Lando-T|Intimidate|boost' -> '|-unboost|p2a: Zacian|atk|1'
  // '|-ability|p1a: My Cool Lando-T|Intimidate|boost' -> '|-boost|p2a: Contrarian|atk|1'
  // '|-ability|p2a: Zacian|Intrepid Sword|boost' -> '|-boost|p2a: Zacian|atk|1'
  // '|-ability|p1a: My Cool Genesect|Download|boost' -> '|-boost|p1a: My Cool Genesect|spa|1'
  // '|-enditem|p1a: Hawlucha|Grassy Seed' -> '|-boost|p1a: Hawlucha|def|1|[from] item: Grassy Seed'
  const chunks = chunkStepQueueTurns(stepQueue);
  const relevantChunks = chunks.filter((c) => c?.some(relevantStep));

  if (!relevantChunks.length) {
    return output;
  }

  relevantChunks.forEach((chunk) => {
    // note: there could be multiple effects going off in one turn, hence another loop
    const effectStartIndices = chunk
      .map((s, i) => (relevantStep(s) ? i : null))
      .filter((i) => typeof i === 'number');

    effectStartIndices.forEach((effectStartIndex) => {
      const effectStep = chunk[effectStartIndex];

      if (!effectStep?.includes('|')) {
        return;
      }

      // e.g., effectStep = '|-ability|p1a: My Cool Lando-T|Intimidate|boost', '|-enditem|p1a: My Cool Lando-T|Grassy Seed'
      const [
        , // e.g., ''
        opcodePart, // e.g., '-ability', '-enditem'
        sourceIdentPart, // e.g., 'p1a: My Cool Lando-T'
        sourceEntityPart, // e.g., 'Intimidate', 'Grassy Seed'
      ] = effectStep.split('|');

      const effectDict: CalcdexAutoBoostEffect['dict'] = opcodePart?.includes('item')
        ? 'items'
        : 'abilities';

      const dexEffect = dex?.[effectDict]?.get(sourceEntityPart);
      const sourceEffect = (dexEffect?.exists && dexEffect.name as AbilityName | ItemName) || null;

      if (!sourceIdentPart || !sourceEffect) {
        return;
      }

      const effectStartChunk = chunk.slice(effectStartIndex + 1);
      const effectEndIndex = effectStartChunk.findIndex((s) => !boostStep(s));

      const effectChunk = effectStartChunk.slice(
        0,
        effectEndIndex < 1 ? effectStartChunk.length : effectEndIndex,
      );

      // e.g., if playerKey = 'p1' & speciesForme = 'Zacian', look for steps like:
      // '|-boost|p1a: Zacian|atk|1', '|-unboost|p1a: Zacian|atk|1', etc.
      const boostSteps = effectChunk.filter((s) => boostStep(s) && identRegex(playerKey, searchName).test(s));

      if (!boostSteps.length) {
        return;
      }

      const [
        , // e.g., 'p1a: My Cool Lando-T'
        sourceKeyPart, // e.g., 'p1'
        sourceNamePart, // e.g., 'My Cool Lando-T'
      ] = identRegex().exec(sourceIdentPart) || [];

      const sourceKey = (
        CalcdexPlayerKeys.includes(sourceKeyPart as CalcdexPlayerKey)
          && sourceKeyPart as CalcdexPlayerKey
      ) || null;

      // const sourceSearchName = sourceNamePart?.replace('-*', ''); // e.g., 'Zacian-*' -> 'Zacian'
      const sourceSearchName = sourceNamePart?.split('-')[0];

      const sourcePokemon = sourceKey && players?.[sourceKey]?.pokemon?.length
        ? players[sourceKey].pokemon.find((p) => [
          p?.ident, // e.g., 'p1: Zacian-*'
          p?.name, // e.g., 'Zacian'
          p?.speciesForme, // e.g., 'Zacian-Crowned'
          p?.details, // e.g., 'Zacian-Crowned'
          p?.searchid, // e.g., 'p1: Zacian-*|Zacian-Crowned'
        ].filter(Boolean).some((n) => n.includes(sourceSearchName)))
        : null;

      if (!sourceKey || !sourcePokemon?.calcdexId) {
        return;
      }

      const activePokemon = CalcdexPlayerKeys.flatMap((k) => (
        players[k]?.pokemon?.filter((p) => (
          p?.active
            && p.calcdexId !== sourcePokemon.calcdexId
        ))
      )).filter(Boolean);

      output[sourceEffect] = determineAutoBoostEffect(sourcePokemon, {
        format,
        targetPokemon: pokemon,
        activePokemon,
        field,
      });

      output[sourceEffect].dict = effectDict;
      output[sourceEffect].active = pokemon.active;

      // this is possible since chunk[] is an array (i.e., an object) filter()'d from another array (i.e., chunks[]),
      // so we're their comparing memory addresses (references), not their contents
      output[sourceEffect].turn = chunks.indexOf(chunk);

      if (!output[sourceEffect].once && !output[sourceEffect].active) {
        delete output[sourceEffect];

        return;
      }

      // override the `boosts` w/ the ones reported by the client
      output[sourceEffect].boosts = {};

      boostSteps.forEach((step) => {
        // e.g., step = '|-boost|p1a: My Cool Lando-T|def|1|[from] item: Grassy Seed'
        const [
          , // e.g., ''
          boostOpcodePart, // e.g., '-boost' or '-unboost'
          , // eslint-disable-line comma-style -- e.g., 'p1a: My Cool Lando-T'
          boostStatPart, // e.g., 'def'
          boostStagePart, // e.g., '1'
        ] = step.split('|');

        const multiplier = boostOpcodePart?.includes('unboost') ? -1 : 1;
        const boostedStat = (
          PokemonBoostNames.includes(boostStatPart as Showdown.StatNameNoHp)
            && boostStatPart as Showdown.StatNameNoHp
        ) || null;

        if (!boostedStat) {
          return;
        }

        output[sourceEffect].boosts[boostedStat] = (parseInt(boostStagePart, 10) || 0) * multiplier;
      });
    });
  });

  return output;
};
