import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { formatId } from '@showdex/utils/core';
import { getDexForFormat } from '@showdex/utils/dex';

export type RandomBattlesValidationCheckGroup =
  | 'species'
  | 'tera-blast'
  | 'type-count'
  | 'type-weakness'
  | 'type-double-weakness'
  | 'freeze-dry';

export interface RandomBattlesValidationCheck {
  id: string;
  label: string;
  count: number;
  limit: number;
  ok: boolean;
  group: RandomBattlesValidationCheckGroup;
}

export interface RandomBattlesValidationSummary {
  passed: number;
  total: number;
}

export interface RandomBattlesValidationResult {
  active: boolean;
  format?: string;
  teamSize: number;
  limitFactor: number;
  isMonotype: boolean;
  checks: RandomBattlesValidationCheck[];
  summary: RandomBattlesValidationSummary;
}

export interface CalcRandomBattlesValidationOptions {
  format?: string;
  gen?: number;
  pokemon?: CalcdexPokemon[];
  maxTeamSize?: number;
}

const teraBlastSpeciesIds = new Set([
  'ogerpon',
  'ogerponhearthflame',
  'ogerponwellspring',
  'ogerponcornerstone',
  'terapagos',
]);

const getTypeId = (typeName?: string): string => formatId(typeName || '');

const normalizeSpeciesIds = (dex: Showdown.ModdedDex, pokemon?: CalcdexPokemon) => {
  const speciesName = pokemon?.transformedForme
    || pokemon?.speciesForme
    || pokemon?.name
    || '';
  const species = speciesName ? dex?.species?.get?.(speciesName) : null;
  const baseSpecies = species?.baseSpecies || species?.name || speciesName;

  return {
    speciesId: formatId(species?.name || speciesName),
    baseSpeciesId: formatId(baseSpecies),
  };
};

const resolvePokemonTypes = (dex: Showdown.ModdedDex, pokemon?: CalcdexPokemon): Showdown.TypeName[] => {
  // First try direct types if they exist
  if (pokemon?.dirtyTypes?.length) {
    return pokemon.dirtyTypes.filter(Boolean);
  }

  if (pokemon?.types?.length) {
    return pokemon.types.filter(Boolean);
  }

  // Otherwise, look up the species in the dex
  const speciesName = pokemon?.transformedForme
    || pokemon?.speciesForme
    || pokemon?.species
    || pokemon?.name
    || '';
  
  if (!speciesName) {
    return [];
  }

  const species = dex?.species?.get?.(speciesName);
  return (species?.types || []).filter(Boolean) as Showdown.TypeName[];
};

const getDamageMultiplier = (
  dex: Showdown.ModdedDex,
  attackType: Showdown.TypeName,
  defenderTypes: Showdown.TypeName[],
): number => {
  if (!attackType || !defenderTypes?.length) {
    return 1;
  }

  return defenderTypes.reduce((multiplier, defenderType) => {
    if (!defenderType) {
      return multiplier;
    }

    const typeData = dex?.types?.get?.(defenderType);
    if (!typeData) {
      return multiplier;
    }

    const damageTaken = (typeData?.damageTaken || {}) as Record<string, number>;
    // Use attackType directly (capitalized) instead of attackTypeId (lowercased)
    const modifier = damageTaken[attackType] ?? 0;

    if (modifier === 1) {
      return multiplier * 2;
    }

    if (modifier === 2) {
      return multiplier * 0.5;
    }

    if (modifier === 3) {
      return 0;
    }

    return multiplier;
  }, 1);
};

const collectMoves = (pokemon?: CalcdexPokemon): string[] => [
  ...(pokemon?.moves || []),
  ...(pokemon?.revealedMoves || []),
  ...(pokemon?.serverMoves || []),
].filter(Boolean);

const getAbilityId = (pokemon?: CalcdexPokemon): string => formatId(
  pokemon?.dirtyAbility
    || pokemon?.ability
    || pokemon?.baseAbility
    || '',
);

const getAttackTypes = (): Showdown.TypeName[] => [
  'Normal',
  'Fighting',
  'Flying',
  'Poison',
  'Ground',
  'Rock',
  'Bug',
  'Ghost',
  'Steel',
  'Fire',
  'Water',
  'Grass',
  'Electric',
  'Psychic',
  'Ice',
  'Dragon',
  'Dark',
  'Fairy',
];

export const calcRandomBattlesValidation = (
  options: CalcRandomBattlesValidationOptions,
): RandomBattlesValidationResult => {
  try {
    const format = options?.format || '';
    const formatKey = formatId(format);
    const isRandom = /random/.test(formatKey);
    const isMonotype = /monotype/.test(formatKey);

    const dex = getDexForFormat(format);
    const pokemon = (options?.pokemon || []).filter(Boolean);
    const maxTeamSize = Math.max(options?.maxTeamSize || 0, pokemon.length || 0, 6);
    const limitFactor = Math.max(1, Math.round(maxTeamSize / 6));

    if (!isRandom || !pokemon.length || !dex) {
      return {
        active: false,
        format,
        teamSize: maxTeamSize,
        limitFactor,
        isMonotype,
        checks: [],
        summary: {
          passed: 0,
          total: 0,
        },
      };
    }

    const attackTypes = getAttackTypes();
    const speciesCounts = new Map<string, number>();
    const typeCounts = new Map<Showdown.TypeName, number>();
    const weakCounts = new Map<Showdown.TypeName, number>();
    const doubleWeakCounts = new Map<Showdown.TypeName, number>();

    let teraBlastUsers = 0;
    let freezeDryWeakCount = 0;

    pokemon.forEach((entry) => {
      if (!entry) return;

      const { speciesId, baseSpeciesId } = normalizeSpeciesIds(dex, entry);
      const types = resolvePokemonTypes(dex, entry);
      const abilityId = getAbilityId(entry);
      const moves = collectMoves(entry);
      const speciesKey = baseSpeciesId || speciesId;

      if (speciesKey) {
        speciesCounts.set(speciesKey, (speciesCounts.get(speciesKey) || 0) + 1);
      }

      if (
        teraBlastSpeciesIds.has(speciesId)
          || teraBlastSpeciesIds.has(baseSpeciesId)
          || moves.some((move) => formatId(move) === 'terablast')
      ) {
        teraBlastUsers += 1;
      }

      if (types.length) {
        new Set(types).forEach((typeName) => {
          typeCounts.set(typeName, (typeCounts.get(typeName) || 0) + 1);
        });
      }

      if (!isMonotype && types.length) {
        attackTypes.forEach((attackType) => {
          const multiplier = getDamageMultiplier(dex, attackType, types);

          if (multiplier > 1) {
            weakCounts.set(attackType, (weakCounts.get(attackType) || 0) + 1);
          }

          if (multiplier >= 4) {
            doubleWeakCounts.set(attackType, (doubleWeakCounts.get(attackType) || 0) + 1);
          }
        });

        // Fluffy and Dry Skin abilities count as Fire weakness
        const hasFireWeakAbility = abilityId === 'dryskin' || abilityId === 'fluffy';
        if (hasFireWeakAbility) {
          const fireMultiplier = getDamageMultiplier(dex, 'Fire', types);
          // Only add if not already counted (multiplier <= 1 means not weak to Fire normally)
          if (fireMultiplier <= 1) {
            weakCounts.set('Fire', (weakCounts.get('Fire') || 0) + 1);
          }
        }

        const iceMultiplier = getDamageMultiplier(dex, 'Ice', types);
        const isWater = types.includes('Water');
        const hasFreezeDryVulnerability = abilityId === 'dryskin' || abilityId === 'fluffy';

        if (iceMultiplier > 1 || isWater || hasFreezeDryVulnerability) {
          freezeDryWeakCount += 1;
        }
      }
    });

    const checks: RandomBattlesValidationCheck[] = [];
  const maxSpeciesCount = Math.max(0, ...Array.from(speciesCounts.values()));

  checks.push({
    id: 'species-clause',
    label: 'Species Clause',
    count: maxSpeciesCount,
    limit: 1,
    ok: maxSpeciesCount <= 1,
    group: 'species',
  });

  checks.push({
    id: 'tera-blast-users',
    label: 'Tera Blast Users',
    count: teraBlastUsers,
    limit: 1,
    ok: teraBlastUsers <= 1,
    group: 'tera-blast',
  });

  if (!isMonotype) {
    const typeLimit = 2 * limitFactor;
    const weakLimit = 3 * limitFactor;
    const doubleWeakLimit = 1 * limitFactor;
    const freezeDryLimit = 4 * limitFactor;

    attackTypes.forEach((typeName) => {
      const count = typeCounts.get(typeName) || 0;

      if (count > 0) {
        checks.push({
          id: `type-count-${getTypeId(typeName)}`,
          label: `${typeName} Type`,
          count,
          limit: typeLimit,
          ok: count <= typeLimit,
          group: 'type-count',
        });
      }
    });

    attackTypes.forEach((typeName) => {
      const count = weakCounts.get(typeName) || 0;

      checks.push({
        id: `type-weak-${getTypeId(typeName)}`,
        label: `Weak to ${typeName}`,
        count,
        limit: weakLimit,
        ok: count <= weakLimit,
        group: 'type-weakness',
      });
    });

    attackTypes.forEach((typeName) => {
      const count = doubleWeakCounts.get(typeName) || 0;

      if (count > 0) {
        checks.push({
          id: `type-double-weak-${getTypeId(typeName)}`,
          label: `Double weak to ${typeName}`,
          count,
          limit: doubleWeakLimit,
          ok: count <= doubleWeakLimit,
          group: 'type-double-weakness',
        });
      }
    });

    checks.push({
      id: 'freeze-dry-weakness',
      label: 'Weak to Freeze-Dry',
      count: freezeDryWeakCount,
      limit: freezeDryLimit,
      ok: freezeDryWeakCount <= freezeDryLimit,
      group: 'freeze-dry',
    });
  }

  const passed = checks.filter((check) => check.ok).length;

  return {
    active: true,
    format,
    teamSize: maxTeamSize,
    limitFactor,
    isMonotype,
    checks,
    summary: {
      passed,
      total: checks.length,
    },
  };
  } catch (error) {
    // Gracefully handle errors in validation calculation
    console.error('[Random Battles Validation Error]', error);
    return {
      active: false,
      format: options?.format,
      teamSize: options?.maxTeamSize || 0,
      limitFactor: 1,
      isMonotype: false,
      checks: [],
      summary: {
        passed: 0,
        total: 0,
      },
    };
  }
};
