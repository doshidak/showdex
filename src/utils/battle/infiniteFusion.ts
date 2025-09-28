import { CalcdexPokemon } from '@showdex/interfaces/calc';

export function getFusionPartNames(pokemon: CalcdexPokemon): { headName: string; bodyName: string; } | null {
  // Find body name by parsing the `details` property.
  // Full text of `details` is something like "Houndoom, L76, F, fusion: Jolteon".
  // Match everything after "fusion: " until end of string or comma.
  if (!pokemon.details) {
    return null;
  }
  const bodyNameMatch = pokemon.details.match(/fusion: (.+?)(?:,|$)/);
  if (!bodyNameMatch || bodyNameMatch.length < 2) {
    return null;
  }

  return {
    headName: pokemon.speciesForme,
    bodyName: bodyNameMatch[1],
  };
}

export function calculateFusedBaseStats(head: Showdown.Species, body: Showdown.Species): Required<Showdown.StatsTable> {
  // Formula source: https://infinitefusion.fandom.com/wiki/Fusion_FAQs#Stats
  const fuseStat = (a: number, b: number) => Math.floor((2 * a) / 3 + b / 3);

  return {
    // Body primary stats
    atk: fuseStat(body.baseStats.atk, head.baseStats.atk),
    def: fuseStat(body.baseStats.def, head.baseStats.def),
    spe: fuseStat(body.baseStats.spe, head.baseStats.spe),
    // Head primary stats
    hp: fuseStat(head.baseStats.hp, body.baseStats.hp),
    spa: fuseStat(head.baseStats.spa, body.baseStats.spa),
    spd: fuseStat(head.baseStats.spd, body.baseStats.spd),
  };
}

// For some reason, these pokemon have their primary and secondary types swapped in IF.
const pokemonWithSwappedTypes = [
  'Magnemite',
  'Magneton',
  'Magnezone',
  'Spiritomb',
  'Ferroseed',
  'Ferrothorn',
  'Phantump',
  'Trevenant',
  'Sandygast',
  'Palossand',
];

export function getFusedTypes(head: Showdown.Species, body: Showdown.Species): Showdown.TypeName[] {
  // Type fusion logic source: https://infinitefusion.fandom.com/wiki/Fusion_FAQs#Typing

  const headTypes = head.types;
  const bodyTypes = body.types;

  // Swap types if needed
  if (pokemonWithSwappedTypes.includes(head.baseSpecies)) {
    [headTypes[1], headTypes[0]] = [headTypes[0], headTypes[1]];
  }
  if (pokemonWithSwappedTypes.includes(body.baseSpecies)) {
    [bodyTypes[1], bodyTypes[0]] = [bodyTypes[0], bodyTypes[1]];
  }

  // Always use head's primary type, unless it has a special "dominant" type.
  // In the current version the dominant type rule only applies to Normal/Flying pokemon where
  // the Flying type will always be picked over the Normal type regardless of other rules.
  const headPrimaryType = headTypes[0];
  let resultPrimaryType = headPrimaryType;
  const headHasSecondaryType = headTypes.length > 1;
  if (headHasSecondaryType) {
    const headSecondaryType = headTypes[1];
    const headIsNormalFlying = headPrimaryType === 'Normal' && headSecondaryType === 'Flying';
    if (headIsNormalFlying) {
      resultPrimaryType = 'Flying';
    }
  }

  // Figure out which type to use as secondary type from body.
  const bodyPrimaryType = bodyTypes[0];
  const bodyHasSecondaryType = bodyTypes.length > 1;
  // Use body primary type as the secondary type unless body has a secondary type.
  let resultSecondaryType = bodyPrimaryType;
  if (bodyHasSecondaryType) {
    const bodySecondaryType = bodyTypes[1];
    // Use secondary type from body. If head already provides that type then use body primary type.
    resultSecondaryType = resultPrimaryType === bodySecondaryType ? bodyPrimaryType : bodySecondaryType;
  }

  if (resultPrimaryType === resultSecondaryType) {
    // Deduplicate
    return [resultPrimaryType];
  }

  return [resultPrimaryType, resultSecondaryType];
}
