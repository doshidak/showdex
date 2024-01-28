import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { type GenerationNum } from '@smogon/calc';
import { type BadgeInstance, Badge, CircularBar } from '@showdex/components/ui';
import { PokemonBoosterAbilities, PokemonStatNames } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { useColorScheme } from '@showdex/redux/store';
import { calcPokemonHpPercentage } from '@showdex/utils/calc';
import { formatId, nonEmptyObject } from '@showdex/utils/core';
import { detectGenFromFormat, getDexForFormat, hasNickname } from '@showdex/utils/dex';
import { determineColorScheme } from '@showdex/utils/ui';
import { Picon } from '../Picon';
import { PokeStatus } from '../PokeStatus';
import { PokeType } from '../PokeType';
import styles from './PokeGlance.module.scss';
import { ItemIcon } from '../ItemIcon';

export interface PokeGlanceProps {
  className?: string;
  style?: React.CSSProperties;
  pokemon: Partial<CalcdexPokemon>;
  format?: string | GenerationNum;
  showNickname?: boolean;
  showAbility?: boolean;
  showItem?: boolean;
  showStatus?: boolean;
  showBaseStats?: boolean;
  reverseColorScheme?: boolean;
}

export const PokeGlance = ({
  className,
  style,
  pokemon,
  format,
  showNickname,
  showAbility,
  showItem,
  showStatus,
  showBaseStats,
  reverseColorScheme,
}: PokeGlanceProps): JSX.Element => {
  const { t } = useTranslation('calcdex');
  const currentColorScheme = useColorScheme();
  const colorScheme = determineColorScheme(currentColorScheme, reverseColorScheme);

  const dex = getDexForFormat(format);
  const gen = detectGenFromFormat(format);

  const {
    active,
    name: pokemonName,
    speciesForme,
    level,
    types: currentTypes,
    dirtyTypes,
    teraType: revealedTeraType,
    dirtyTeraType,
    terastallized,
    abilities: currentAbilities,
    ability: revealedAbility,
    dirtyAbility,
    abilityToggled,
    item: revealedItem,
    itemEffect,
    dirtyItem,
    prevItem,
    prevItemEffect,
    status: currentStatus,
    dirtyStatus,
    boostedStat,
    dirtyBoostedStat,
  } = pokemon || {};

  const nickname = (showNickname && hasNickname(pokemon) && pokemonName) || null;
  const hpPercentage = calcPokemonHpPercentage(pokemon);
  const teraType = dirtyTeraType || revealedTeraType;
  const status = dirtyStatus || (currentStatus || 'ok');
  const ability = (showAbility && (dirtyAbility || revealedAbility)) || null;
  const item = (showItem && (dirtyItem ?? revealedItem)) || null;

  const {
    id,
    exists,
    baseSpecies,
    forme,
    types: typesFromDex,
    abilities: abilitiesFromDex,
    baseStats,
    bst,
  } = dex?.species.get(speciesForme) || {};

  const translatedBaseSpecies = (!!baseSpecies && t(`pokedex:species.${formatId(baseSpecies)}`, baseSpecies))
    || t('pokedex:species.missingno');

  const translatedForme = (
    !!baseSpecies
      && !!forme
      && t(`pokedex:species.${formatId(baseSpecies + forme)}`, '').replace(`${translatedBaseSpecies}-`, '')
  ) || forme;

  const types = (!!dirtyTypes?.length && dirtyTypes)
    || (!!currentTypes?.length && currentTypes)
    || (!!typesFromDex?.length && typesFromDex)
    || [];

  const abilities = (
    (!!currentAbilities?.length && currentAbilities)
      || (nonEmptyObject(abilitiesFromDex) && Object.values(abilitiesFromDex))
      || []
  ).filter((a) => !!a && formatId(a) !== 'noability');

  const shouldShowAbility = showAbility && !!(ability || abilities.length);
  const shouldShowItem = showItem && !!prevItem;

  const activeBadgeRef = React.useRef<BadgeInstance>(null);

  React.useEffect(() => {
    activeBadgeRef.current?.[active ? 'show' : 'hide']();
  }, [
    active,
  ]);

  return (
    <div
      className={cx(
        styles.container,
        active && styles.pokemonActive,
        showStatus && styles.withStatus,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <Badge
        ref={activeBadgeRef}
        className={styles.activeBadge}
        label={t('common:labels.active', 'Active')}
        color="blue"
        duration={0}
      />

      <div className={styles.top}>
        <div className={styles.picon}>
          {
            (showStatus && !!hpPercentage && (hpPercentage !== 1)) &&
            <CircularBar
              className={styles.circularHp}
              value={hpPercentage}
            />
          }

          <Picon
            pokemon={{
              speciesForme,
              item: (!itemEffect && item) || null,
            }}
          />
        </div>

        <div className={styles.details}>
          <div className={cx(styles.detailsRow, styles.name)}>
            {
              (showStatus && (status !== 'ok' || !hpPercentage || hpPercentage !== 1)) &&
              <PokeStatus
                className={styles.status}
                containerSize="xs" // purposefully set to save space
                status={status === 'ok' ? undefined : status}
                override={status === 'ok' ? `${Math.round(hpPercentage * 100)}%` : undefined}
                fainted={!hpPercentage}
                highlight
                reverseColorScheme={reverseColorScheme}
              />
            }

            <div
              className={cx(
                styles.species,
                (!exists || !baseSpecies) && styles.empty,
              )}
            >
              {translatedBaseSpecies}
            </div>

            {
              !!translatedForme &&
              <div className={styles.forme}>
                &ndash;{translatedForme}
              </div>
            }

            {
              (!!level && level !== 100) &&
              <div className={styles.level}>
                {t('poke.info.level.label', 'L')}{level}
              </div>
            }
          </div>

          {
            !!nickname &&
            <div className={cx(styles.detailsRow, styles.nickname)}>
              <div className={styles.aka}>
                {t('common:labels.aka', 'aka')}
              </div>

              <div className={styles.value}>
                {nickname}
              </div>
            </div>
          }

          <div className={cx(styles.detailsRow, styles.spaced)}>
            {
              !!types.length &&
              <div className={styles.types}>
                {types.map((type) => (
                  <PokeType
                    key={`PokeGlanceContent:${id}:PokeType:${type}`}
                    className={styles.type}
                    containerSize={types.length > 1 && teraType ? 'sm' : 'xl'}
                    type={type}
                    highlight={!terastallized}
                    reverseColorScheme={reverseColorScheme}
                  />
                ))}
              </div>
            }

            {
              !!teraType &&
              <PokeType
                className={styles.teraType}
                containerSize={types.length > 1 ? 'sm' : 'xl'}
                type={teraType}
                teraTyping
                highlight={terastallized}
                reverseColorScheme={reverseColorScheme}
              />
            }
          </div>
        </div>
      </div>

      {
        (showBaseStats && nonEmptyObject(baseStats)) &&
        <div className={styles.stats}>
          {PokemonStatNames.map((stat) => {
            if (gen === 1 && stat === 'spd') {
              return null;
            }

            const name = gen === 1 && stat === 'spa' ? 'spc' : stat;
            const value = baseStats[stat];

            return (
              <div
                key={`PokeGlanceContent:${id}:BaseStatsTable:${name}`}
                className={styles.stat}
              >
                <div className={styles.statName}>
                  {t(`pokedex:stats.${formatId(name)}.1`, name)}
                </div>

                <div className={styles.statValue}>
                  {value || '???'}
                </div>
              </div>
            );
          })}

          {
            !!bst &&
            <div className={styles.stat}>
              <div className={styles.statName}>
                {t('pokedex:stats.bst_one.1', 'BST')}
              </div>

              <div className={cx(styles.statValue, styles.bst)}>
                {bst}
              </div>
            </div>
          }
        </div>
      }

      {
        (shouldShowAbility || shouldShowItem) &&
        <div className={styles.specs}>
          {
            !!ability &&
            <>
              <div className={cx(styles.specName, abilityToggled && styles.active)}>
                {t(abilityToggled ? 'common:labels.active' : 'pokedex:headers.ability_one')}
              </div>

              <div className={cx(styles.specValues, abilityToggled && styles.active)}>
                {t(`pokedex:abilities.${formatId(ability)}`, ability)}

                {
                  (PokemonBoosterAbilities.includes(ability) && !!(dirtyBoostedStat || boostedStat)) &&
                  <span className={styles.boostedStat}>
                    {' '}
                    {t(
                      `pokedex:stats.${formatId(dirtyBoostedStat || boostedStat)}.1`,
                      dirtyBoostedStat || boostedStat,
                    )}
                  </span>
                }
              </div>
            </>
          }

          {
            (shouldShowAbility && !ability) &&
            <>
              <div className={styles.specName}>
                {t('pokedex:headers.ability', { count: abilities.length })}
              </div>
              <div className={styles.specValues}>
                {/* feeling lazy rn lmao */}
                <div>
                  {abilities.map((a) => (
                    <div key={`PokeGlanceContent:${id}:Abilities:${a}`}>
                      {t(`pokedex:abilities.${formatId(a)}`, a)}
                    </div>
                  ))}
                </div>
              </div>
            </>
          }

          {
            (!!item && !!itemEffect) &&
            <>
              <div className={cx(styles.specName, styles.centered)}>
                {t(`pokedex:effects.${formatId(itemEffect)}`, itemEffect)}
              </div>
              <div className={styles.specValues}>
                <ItemIcon item={item} />
                <span>{t(`pokedex:items.${formatId(item)}`, item)}</span>
              </div>
            </>
          }

          {
            (showItem && !!prevItem) &&
            <>
              <div className={cx(styles.specName, styles.centered)}>
                {t(`pokedex:effects.${formatId(prevItemEffect)}`, prevItemEffect) || t('common:labels.previous')}
              </div>
              <div className={cx(styles.specValues, styles.prev)}>
                <ItemIcon item={prevItem} />
                <span>{t(`pokedex:items.${formatId(prevItem)}`, prevItem)}</span>
              </div>
            </>
          }
        </div>
      }
    </div>
  );
};
