import * as React from 'react';
import cx from 'classnames';
import { type GenerationNum } from '@smogon/calc';
import { type BadgeInstance, Badge, CircularBar } from '@showdex/components/ui';
import { PokemonStatNames } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { useColorScheme } from '@showdex/redux/store';
import { calcPokemonHpPercentage } from '@showdex/utils/calc';
import { nonEmptyObject } from '@showdex/utils/core';
import { detectGenFromFormat, getDexForFormat, hasNickname } from '@showdex/utils/dex';
import { pluralize } from '@showdex/utils/humanize';
import { determineColorScheme } from '@showdex/utils/ui';
import { Picon } from '../Picon';
// import { PokeHpBar } from '../PokeHpBar';
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

  const types = (!!dirtyTypes?.length && dirtyTypes)
    || (!!currentTypes?.length && currentTypes)
    || (!!typesFromDex?.length && typesFromDex)
    || [];

  const abilities = (!!currentAbilities?.length && currentAbilities)
    || (nonEmptyObject(abilitiesFromDex) && Object.values(abilitiesFromDex))
    || [];

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
        label="Active"
        color="blue"
        duration={0}
      />

      <div className={styles.top}>
        <div className={styles.picon}>
          <Picon
            pokemon={{
              speciesForme,
              item: (!itemEffect && item) || null,
            }}
          />

          {
            (showStatus && !!hpPercentage && (hpPercentage !== 1)) &&
            <CircularBar
              className={styles.circularHp}
              value={hpPercentage}
            />
          }
        </div>

        <div className={styles.details}>
          <div className={cx(styles.detailsRow, styles.name)}>
            {/* {
              active &&
              <div className={styles.activeLabel}>
                Active
              </div>
            } */}

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
              {baseSpecies || 'MissingNo.'}
            </div>

            {
              !!forme &&
              <div className={styles.forme}>
                &ndash;{forme}
              </div>
            }

            {
              (!!level && level !== 100) &&
              <div className={styles.level}>
                L{level}
              </div>
            }
          </div>

          {
            !!nickname &&
            <div className={cx(styles.detailsRow, styles.nickname)}>
              <div className={styles.aka}>
                aka.
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
                    type={type}
                    highlight={!terastallized}
                    reverseColorScheme={reverseColorScheme}
                  />
                ))}
              </div>
            }

            {
              (!!teraType && teraType !== '???') &&
              <PokeType
                className={styles.teraType}
                type={teraType}
                teraTyping
                highlight={terastallized}
                reverseColorScheme={reverseColorScheme}
              />
            }
          </div>
        </div>
      </div>

      {/* {
        showStatus &&
        <div className={styles.status}>
          <PokeHpBar
            hp={hpPercentage}
            width={84}
            reverseColorScheme={reverseColorScheme}
          />

          <div className={styles.hpPercentage}>
            {Math.round(hpPercentage * 100)}%
          </div>

          <PokeStatus
            status={status === 'ok' ? undefined : status}
            override={status === 'ok' ? status : undefined}
            fainted={!hpPercentage}
            highlight
          />
        </div>
      } */}

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
                  {name}
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
                BST
              </div>

              <div className={cx(styles.statValue, styles.bst)}>
                {bst}
              </div>
            </div>
          }
        </div>
      }

      {
        (showAbility || (showItem && !!prevItem)) &&
        <div className={styles.specs}>
          {
            !!ability &&
            <>
              <div className={cx(styles.specName, abilityToggled && styles.active)}>
                {abilityToggled ? 'Active' : 'Ability'}
              </div>

              <div className={cx(styles.specValues, abilityToggled && styles.active)}>
                {ability}
              </div>
            </>
          }

          {
            (showAbility && !ability && !!abilities.length) &&
            <>
              <div className={styles.specName}>
                {pluralize(abilities.length, 'Abilit:ies:y', { printNum: false })}
              </div>
              <div className={styles.specValues}>
                {/* feeling lazy rn lmao */}
                <div>
                  {abilities.map((a) => (
                    <div key={`PokeGlanceContent:${id}:Abilities:${a}`}>
                      {a}
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
                {itemEffect}
              </div>
              <div className={styles.specValues}>
                <ItemIcon item={item} />
                <span>{item}</span>
              </div>
            </>
          }

          {
            (showItem && !!prevItem) &&
            <>
              <div className={cx(styles.specName, styles.centered)}>
                {prevItemEffect || 'Prev'}
              </div>
              <div className={cx(styles.specValues, styles.prev)}>
                <ItemIcon item={prevItem} />
                <span>{prevItem}</span>
              </div>
            </>
          }
        </div>
      }
    </div>
  );
};
