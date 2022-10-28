import * as React from 'react';
import cx from 'classnames';
import { Dropdown } from '@showdex/components/form';
import { TableGrid, TableGridItem } from '@showdex/components/layout';
import {
  Badge,
  Button,
  ToggleButton,
  Tooltip,
} from '@showdex/components/ui';
import { useCalcdexSettings, useColorScheme } from '@showdex/redux/store';
import { buildMoveOptions } from '@showdex/utils/battle';
import { formatDamageAmounts } from '@showdex/utils/calc';
import { upsizeArray } from '@showdex/utils/core';
import type { GenerationNum } from '@smogon/calc';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { BadgeInstance } from '@showdex/components/ui';
import type { CalcdexBattleRules, CalcdexPokemon } from '@showdex/redux/store';
import type { ElementSizeLabel } from '@showdex/utils/hooks';
import type { SmogonMatchupHookCalculator } from './useSmogonMatchup';
import { PokeMoveOptionTooltip } from './PokeMoveOptionTooltip';
import styles from './PokeMoves.module.scss';

export interface PokeMovesProps {
  className?: string;
  style?: React.CSSProperties;
  gen: GenerationNum;
  format?: string;
  rules?: CalcdexBattleRules;
  pokemon: CalcdexPokemon;
  movesCount?: number;
  containerSize?: ElementSizeLabel;
  calculateMatchup: SmogonMatchupHookCalculator;
  onPokemonChange?: (pokemon: DeepPartial<CalcdexPokemon>) => void;
}

export const PokeMoves = ({
  className,
  style,
  gen,
  format,
  rules,
  pokemon,
  movesCount = 4,
  containerSize,
  calculateMatchup,
  onPokemonChange,
}: PokeMovesProps): JSX.Element => {
  const settings = useCalcdexSettings();
  const colorScheme = useColorScheme();

  // const dex = getDexForFormat(format);

  const copiedRefs = React.useRef<BadgeInstance[]>([]);

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || '???';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

  const moveOptions = React.useMemo(
    () => buildMoveOptions(format, pokemon, settings?.showAllOptions),
    [format, pokemon, settings],
  );

  const matchups = React.useMemo(() => upsizeArray(
    pokemon?.moves || [],
    movesCount,
    null,
    true,
  ).map((moveName) => calculateMatchup?.(moveName) || null), [
    calculateMatchup,
    movesCount,
    pokemon,
  ]);

  const showZToggle = format?.includes('nationaldex')
    || gen === 6
    || gen === 7;

  const showMaxToggle = !rules?.dynamax
    && (
      format?.includes('nationaldex')
        || (gen === 8 && !format?.includes('bdsp'))
    );

  const handleMoveChange = (name: MoveName, index: number) => {
    const moves = [...(pokemon?.moves || [] as MoveName[])];

    if (!Array.isArray(moves) || (moves?.[index] && moves[index] === name)) {
      return;
    }

    // when move is cleared, `name` will be null/undefined, so coalesce into an empty string
    moves[index] = (name?.replace('*', '') ?? '') as MoveName;

    onPokemonChange?.({
      moves,
    });
  };

  // copies the matchup result description to the user's clipboard when the damage range is clicked
  const handleDamagePress = (index: number, description: string) => {
    if (typeof navigator === 'undefined' || typeof index !== 'number' || index < 0 || !description) {
      return;
    }

    // wrapped in an unawaited async in order to handle any thrown errors
    void (async () => {
      try {
        await navigator.clipboard.writeText(description);

        copiedRefs.current?.[index]?.show();
      } catch (error) {
        // no-op when an error is thrown while writing to the user's clipboard
        (() => {})();
      }
    })();
  };

  return (
    <TableGrid
      className={cx(
        styles.container,
        containerSize === 'xs' && styles.verySmol,
        // ['md', 'lg', 'xl'].includes(containerSize) && styles.veryThicc,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      {/* table headers */}
      <TableGridItem
        className={cx(styles.header, styles.movesHeader)}
        align="left"
        header
      >
        <div className={styles.headerTitle}>
          Moves
        </div>

        {/* <ToggleButton
          className={cx(styles.toggleButton, styles.autoButton)}
          label="Auto"
          tooltip="Auto-Set Revealed Moves"
          // disabled={!pokemon}
          disabled
          onPress={() => {}}
        /> */}

        {
          showZToggle &&
          <ToggleButton
            className={cx(styles.toggleButton, styles.ultButton)}
            label="Z"
            tooltip={`${pokemon?.useZ ? 'Deactivate' : 'Activate'} Z-Moves`}
            tooltipDisabled={!settings?.showUiTooltips}
            primary
            active={pokemon?.useZ}
            disabled={!pokemon?.speciesForme}
            onPress={() => onPokemonChange?.({
              useZ: !pokemon?.useZ,
              useMax: false,
            })}
          />
        }

        {
          showMaxToggle &&
          <ToggleButton
            className={cx(
              styles.toggleButton,
              styles.ultButton,
              showZToggle && styles.lessSpacing,
            )}
            label="Max"
            tooltip={`${pokemon?.useMax ? 'Deactivate' : 'Activate'} Max Moves`}
            tooltipDisabled={!settings?.showUiTooltips}
            primary
            active={pokemon?.useMax}
            disabled={!pokemon?.speciesForme}
            onPress={() => onPokemonChange?.({
              useZ: false,
              useMax: !pokemon?.useMax,
            })}
          />
        }
      </TableGridItem>

      <TableGridItem
        className={cx(styles.header, styles.dmgHeader)}
        header
      >
        <div className={styles.headerTitle}>
          DMG
        </div>

        <ToggleButton
          className={styles.toggleButton}
          label="Crit"
          tooltip={`${pokemon?.criticalHit ? 'Hide' : 'Show'} Critical Hit Damages`}
          tooltipDisabled={!settings?.showUiTooltips}
          primary
          active={pokemon?.criticalHit}
          disabled={!pokemon?.speciesForme}
          onPress={() => onPokemonChange?.({
            criticalHit: !pokemon?.criticalHit,
          })}
        />
      </TableGridItem>

      <TableGridItem
        className={styles.header}
        header
      >
        <div className={styles.headerTitle}>
          KO %
        </div>
      </TableGridItem>

      {/* (actual) moves */}
      {Array(movesCount).fill(null).map((_, i) => {
        // const moveName = pokemon?.moves?.[i];
        // const move = moveName ? dex?.moves.get(moveName) : null;
        // const moveDescription = move?.shortDesc || move?.desc;

        // const maxPp = move?.noPPBoosts ? (move?.pp || 0) : Math.floor((move?.pp || 0) * (8 / 5));
        // const remainingPp = Math.max(maxPp - (ppUsed || maxPp), 0);

        const {
          defender,
          move: calcMove,
          description,
          damageRange,
          koChance,
          koColor,
        } = matchups[i] || {};

        // const moveName = calcMove?.name;
        const moveName = pokemon?.moves?.[i] || calcMove?.name;

        // Z/Max/G-Max moves bypass the original move's accuracy
        // (only time these moves can "miss" is if the opposing Pokemon is in a semi-vulnerable state,
        // after using moves like Fly, Dig, Phantom Force, etc.)
        // const showAccuracy = !pokemon?.useMax
        //   && typeof move?.accuracy !== 'boolean'
        //   && (move?.accuracy || -1) > 0
        //   && move.accuracy !== 100;

        // const showMoveStats = !!move?.type;

        // const damageButtonDisabled = !settings?.showMatchupTooltip
        //   || !settings?.copyMatchupDescription
        //   || !description?.raw;

        const showDamageAmounts = !!description?.damageAmounts
          && (
            settings?.showMatchupDamageAmounts === 'always'
              || (settings?.showMatchupDamageAmounts === 'nfe' && defender?.species.nfe)
          );

        const matchupTooltip = settings?.showMatchupTooltip && description?.raw ? (
          <div className={styles.descTooltip}>
            <Badge
              ref={(ref) => { copiedRefs.current[i] = ref; }}
              className={styles.copiedBadge}
              label="Copied!"
              color="green"
            />

            {settings?.prettifyMatchupDescription ? (
              <>
                {description?.attacker}
                {
                  !!description?.defender &&
                  <>
                    {
                      !!description.attacker &&
                      <>
                        <br />
                        vs
                        <br />
                      </>
                    }
                    {description.defender}
                  </>
                }
                {(!!description?.damageRange || !!description?.koChance) && ':'}
                {
                  !!description?.damageRange &&
                  <>
                    <br />
                    {description.damageRange}
                  </>
                }
                {
                  !!description?.koChance &&
                  <>
                    <br />
                    {description.koChance}
                  </>
                }
              </>
            ) : description.raw}

            {
              showDamageAmounts &&
              <>
                <br />
                <br />
                {settings?.formatMatchupDamageAmounts ? (
                  <>({formatDamageAmounts(description.damageAmounts)})</>
                ) : (
                  <>({description.damageAmounts})</>
                )}
              </>
            }
          </div>
        ) : null;

        return (
          <React.Fragment
            key={`PokeMoves:Moves:${pokemonKey}:MoveRow:${i}`}
          >
            <TableGridItem align="left">
              <Dropdown
                aria-label={`Move Slot ${i + 1} for Pokemon ${friendlyPokemonName}`}
                hint="--"
                // tooltip={calcMove?.type ? (
                //   <div className={styles.moveTooltip}>
                //     {
                //       !!moveDescription &&
                //       <div className={styles.moveDescription}>
                //         {moveDescription}
                //       </div>
                //     }
                //
                //     <div className={styles.moveProperties}>
                //       <PokeType
                //         className={styles.moveType}
                //         type={calcMove.type}
                //         reverseColorScheme
                //       />
                //
                //       {
                //         !!calcMove.category &&
                //         <div className={styles.moveProperty}>
                //           <div className={styles.propertyName}>
                //             {calcMove.category.slice(0, 4)}
                //           </div>
                //
                //           {/* note: Dex.forGen(1).moves.get('seismictoss').basePower = 1 */}
                //           {/* lowest BP of a move whose BP isn't dependent on another mechanic should be 10 */}
                //           {
                //             (calcMove?.bp ?? 0) > 2 &&
                //             <div className={styles.propertyValue}>
                //               {calcMove.bp}
                //             </div>
                //           }
                //         </div>
                //       }
                //
                //       {
                //         showAccuracy &&
                //         <div className={styles.moveProperty}>
                //           <div className={styles.propertyName}>
                //             ACC
                //           </div>
                //
                //           <div className={styles.propertyValue}>
                //             {move.accuracy}%
                //           </div>
                //         </div>
                //       }
                //
                //       {
                //         !!calcMove?.priority &&
                //         <div className={styles.moveProperty}>
                //           <div className={styles.propertyName}>
                //             PRI
                //           </div>
                //
                //           <div className={styles.propertyValue}>
                //             {calcMove.priority > 0 && '+'}
                //             {calcMove.priority}
                //           </div>
                //         </div>
                //       }
                //     </div>
                //   </div>
                // ) : null}
                // optionTooltip={moveOptionTooltip}
                optionTooltip={PokeMoveOptionTooltip}
                optionTooltipProps={{
                  format,
                  pokemon,
                  hidden: !settings?.showMoveTooltip,
                }}
                input={{
                  name: `PokeMoves:Moves:${pokemonKey}:Dropdown:${i}`,
                  value: moveName,
                  onChange: (name: MoveName) => handleMoveChange(name, i),
                }}
                options={moveOptions}
                noOptionsMessage="No Moves Found"
                disabled={!pokemon?.speciesForme}
              />
            </TableGridItem>

            <TableGridItem>
              {/* [XXX.X% &ndash;] XXX.X% */}
              {/* (note: '0 - 0%' damageRange will be reported as 'N/A') */}
              {(!!damageRange && (settings?.showNonDamageRanges || damageRange !== 'N/A')) ? (
                settings?.showMatchupTooltip && settings.copyMatchupDescription ? (
                  <Button
                    className={cx(
                      styles.damageButton,
                      // damageButtonDisabled && styles.disabled,
                    )}
                    labelClassName={cx(
                      styles.damageButtonLabel,
                      damageRange === 'N/A' && styles.noDamage,
                    )}
                    tabIndex={-1} // not ADA compliant, obviously lol
                    label={damageRange}
                    tooltip={matchupTooltip}
                    tooltipTrigger="mouseenter"
                    hoverScale={1}
                    // activeScale={damageButtonDisabled ? 1 : undefined}
                    absoluteHover
                    // disabled={!settings?.showMatchupTooltip || !settings?.copyMatchupDescription || !description?.raw}
                    disabled={!description?.raw}
                    onPress={() => handleDamagePress(i, [
                      description.raw,
                      showDamageAmounts && `(${description.damageAmounts})`,
                    ].filter(Boolean).join(' '))}
                  />
                ) : (
                  <Tooltip
                    content={matchupTooltip}
                    offset={[0, 10]}
                    delay={[1000, 50]}
                    trigger="mouseenter"
                    touch={['hold', 500]}
                    disabled={!settings?.showMatchupTooltip}
                  >
                    <div
                      className={cx(
                        styles.damageButtonLabel,
                        styles.noCopy,
                        damageRange === 'N/A' && styles.noDamage,
                      )}
                    >
                      {damageRange}
                    </div>
                  </Tooltip>
                )
              ) : null}
            </TableGridItem>

            <TableGridItem
              style={{
                ...(!koChance ? { opacity: 0.3 } : null),
                ...(koColor ? { color: koColor } : null),
              }}
            >
              {/* XXX% XHKO */}
              {koChance}
            </TableGridItem>
          </React.Fragment>
        );
      })}
    </TableGrid>
  );
};
