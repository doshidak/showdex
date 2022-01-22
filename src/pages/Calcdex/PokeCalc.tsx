import * as React from 'react';
import cx from 'classnames';
import { PokeStatus, PokeType } from '@showdex/components/app';
import { upsizeArray } from '@showdex/utils/core';
import styles from './PokeCalc.module.scss';

interface PokeCalcProps {
  className?: string;
  style?: React.CSSProperties;
  pokemon: Showdown.Pokemon;
  tooltips?: Showdown.BattleTooltips;
}

export const PokeCalc = ({
  className,
  style,
  pokemon,
  tooltips,
}: PokeCalcProps): JSX.Element => {
  const species = Dex?.species?.get?.(pokemon?.speciesForme);

  const {
    abilities,
    baseStats,
  } = species || {};

  const types = pokemon?.ident ? tooltips?.getPokemonTypes?.(pokemon) : null;
  const possibleAbilities = Object.values(abilities || {});
  const currentHp = ((pokemon?.hp || 0) / (pokemon?.maxhp || 1)) * 100;

  const boostedStats: Showdown.PokemonStats = {
    atk: (baseStats?.atk || 0) * (1 + (pokemon?.boosts?.atk || 0) * 0.5),
    def: (baseStats?.def || 0) * (1 + (pokemon?.boosts?.def || 0) * 0.5),
    spa: (baseStats?.spa || 0) * (1 + (pokemon?.boosts?.spa || 0) * 0.5),
    spd: (baseStats?.spd || 0) * (1 + (pokemon?.boosts?.spd || 0) * 0.5),
    spe: (baseStats?.spe || 0) * (1 + (pokemon?.boosts?.spe || 0) * 0.5),
  };

  return (
    <div
      className={cx(className)}
      style={style}
    >
      <div className={styles.row}>
        <div>
          {pokemon?.name || pokemon?.ident || '???'}

          <span className={styles.small}>
            <span style={{ opacity: 0.5 }}>
              {pokemon?.level ? ` Lv.${pokemon.level}` : null}
            </span>

            {
              !!types?.length &&
              <>
                {' '}
                {types.map((type, i) => (
                  <PokeType
                    key={`PokeCalc-PokeType:${pokemon.ident}:${type}`}
                    style={types.length > 1 && i === 0 ? { marginRight: 2 } : null}
                    type={type}
                  />
                ))}
              </>
            }
          </span>

          <br />

          <span className={styles.statLabel}>
            HP
          </span>
          {' '}

          <span
            className={styles.hpBar}
            style={{ marginBottom: 2 }}
          >
            <span
              className={cx(
                styles.valueBar,
                // pokemon?.hpcolor === 'g' && styles.green,
                // pokemon?.hpcolor === 'y' && styles.yellow,
                // pokemon?.hpcolor === 'r' && styles.red,
              )}
              style={{ width: `${currentHp.toFixed(2)}%` }}
            />
          </span>

          {' '}
          {typeof pokemon?.hp === 'number' ? `${Math.ceil(currentHp)}%` : '???'}

          {
            !!pokemon?.status &&
            <>
              {' '}
              <PokeStatus
                status={pokemon.status}
              />
            </>
          }
        </div>

        <div>
          <span className={styles.statLabel}>
            Set
          </span>
          {' '}
          &lt;- @TODO -&gt;
        </div>
      </div>

      <div
        className={cx(styles.row, styles.section)}
        style={{ alignItems: 'flex-start' }}
      >
        <div style={{ flex: 1, marginRight: 5 }}>
          <span className={styles.statLabel}>
            Ability
          </span>
          <br />
          {pokemon?.ability || pokemon?.baseAbility || possibleAbilities.join(' / ') || '???'}
        </div>

        <div style={{ flex: 1, margin: '0 5px' }}>
          <span className={styles.statLabel}>
            Nature
          </span>
          <br />
          &lt;- @TODO -&gt;
        </div>

        <div style={{ flex: 1, marginLeft: 5 }}>
          <span className={styles.statLabel}>
            Item
          </span>
          <br />
          {pokemon?.item || (pokemon?.prevItem ? 'None' : '???')}
          {
            !!pokemon?.itemEffect &&
            <span className={cx(styles.statLabel, styles.small)}>
              {' '}{pokemon.itemEffect}
            </span>
          }
          {
            !!pokemon?.prevItem &&
            <>
              <br />
              <span className={styles.small}>
                <span className={styles.statLabel}>
                  PREV{' '}
                </span>
                {pokemon.prevItem}
                {
                  !!pokemon.prevItemEffect &&
                  <span className={styles.statLabel}>
                    {' '}{pokemon.prevItemEffect}
                  </span>
                }
              </span>
            </>
          }
        </div>

        {/* <div style={{ flex: 1.25 }}>
          <span className={styles.statLabel}>
            Opposing Screens
          </span>
          <br />
          &lt;- @TODO -&gt;
        </div> */}
      </div>

      <div className={cx(styles.tableGrid, styles.movesTable, styles.section)}>
        <div className={cx(styles.tableItem, styles.left, styles.statLabel)}>
          Moves
        </div>
        {/* <div className={cx(styles.tableItem, styles.statLabel)}>
              BP
            </div> */}
        <div className={cx(styles.tableItem, styles.statLabel)}>
          DMG
        </div>
        <div className={cx(styles.tableItem, styles.statLabel)}>
          % KO
        </div>

        {upsizeArray(pokemon?.moveTrack, 4).map((track, i) => {
          // const [moveid, ppUsed] = track || [];
          const [moveid] = track || [];

          const move = moveid ? Dex?.moves?.get?.(moveid) : null;
          const transformed = !!moveid && moveid?.charAt(0) === '*'; // moves used by a transformed Ditto
          const moveName = transformed ? moveid.substring(1) : moveid;

          // const maxPp = move?.noPPBoosts ? (move?.pp || 0) : Math.floor((move?.pp || 0) * (8 / 5));
          // const remainingPp = Math.max(maxPp - (ppUsed || maxPp), 0);

          const showAccuracy = typeof move?.accuracy !== 'boolean' &&
            (move?.accuracy || -1) > 0 &&
            move.accuracy !== 100;

          return (
            <React.Fragment key={`PokeCalc:MoveTrack-${pokemon?.ident || '???'}:${moveName || i}`}>
              <div className={cx(styles.tableItem, styles.left)}>
                {moveName || '???'}
                {/*
                  (!!moveid && activePokemon.lastMove === move?.id) &&
                  <span className={cx(styles.statLabel, styles.small)}>
                    {' '}Last
                  </span>
                */}

                <br />

                {/* <span className={styles.small}>
                  {/* <span className={styles.statLabel}>
                    TYPE{' '}
                  </span> *\/}
                  [{typeAbbrevs[move?.type] || '???'}]
                </span> */}

                {/* <span className={styles.small}>
                  <span className={styles.statLabel}>
                    {' '}PP{' '}
                  </span>
                  {remainingPp}/{maxPp}
                </span> */}

                {/*
                      (!!moveid && !!move?.category) &&
                      <span className={styles.small}>
                        <span className={styles.statLabel}>
                          {' '}{move.category.slice(0, 4).toUpperCase()}{' '}
                        </span>
                        {move.basePower || null}
                      </span>
                    */}

                {
                  showAccuracy &&
                  <span className={styles.small}>
                    <span className={styles.statLabel}>
                      {' '}ACC{' '}
                    </span>
                    {move.accuracy}%
                  </span>
                }

                {
                  !!move?.priority &&
                  <span className={styles.small}>
                    <span className={styles.statLabel}>
                      {' '}PRI{' '}
                    </span>
                    {move.priority > 0 ? `+${move.priority}` : move.priority}
                  </span>
                }
              </div>

              {/* <div className={cx(styles.tableItem)}>
                    {
                      (!!moveid && !!move?.category) &&
                      <>
                        {move.category !== 'Status' ? (
                          <>
                            {move.basePower || '--'}
                            <br />
                          </>
                        ) : null}
                        <span className={cx(styles.statLabel, styles.small)}>
                          {move.category.slice(0, 4).toUpperCase() || '???'}
                        </span>
                      </>
                    }
                  </div> */}

              <div className={cx(styles.tableItem)}>
                XXX.X% &ndash; XXX.X%
              </div>

              <div className={cx(styles.tableItem)}>
                XXX% XHKO
              </div>
            </React.Fragment>
          );
        })}

        <div className={cx(styles.tableGrid, styles.statsTable, styles.section)}>
          <div className={cx(styles.tableItem, styles.statLabel)} />
          <div className={cx(styles.tableItem, styles.statLabel)}>
            HP
          </div>
          <div className={cx(styles.tableItem, styles.statLabel)}>
            ATK
          </div>
          <div className={cx(styles.tableItem, styles.statLabel)}>
            DEF
          </div>
          <div className={cx(styles.tableItem, styles.statLabel)}>
            SPA
          </div>
          <div className={cx(styles.tableItem, styles.statLabel)}>
            SPD
          </div>
          <div className={cx(styles.tableItem, styles.statLabel)}>
            SPE
          </div>

          <div className={cx(styles.tableItem, styles.statLabel, styles.right)}>
            EVs
          </div>
          <div className={cx(styles.tableItem)}>
            ???
          </div>
          <div className={cx(styles.tableItem)}>
            ???
          </div>
          <div className={cx(styles.tableItem)}>
            ???
          </div>
          <div className={cx(styles.tableItem)}>
            ???
          </div>
          <div className={cx(styles.tableItem)}>
            ???
          </div>
          <div className={cx(styles.tableItem)}>
            ???
          </div>

          <div className={cx(styles.tableItem)} />
          <div className={cx(styles.tableItem)}>
            {baseStats?.hp || '???'}
          </div>
          <div
            className={cx(
              styles.tableItem,
              (pokemon?.boosts?.atk || 0) > 0 && styles.positive,
              (pokemon?.boosts?.atk || 0) < 0 && styles.negative,
            )}
          >
            {boostedStats.atk || '???'}
          </div>
          <div
            className={cx(
              styles.tableItem,
              (pokemon?.boosts?.def || 0) > 0 && styles.positive,
              (pokemon?.boosts?.def || 0) < 0 && styles.negative,
            )}
          >
            {boostedStats.def || '???'}
          </div>
          <div
            className={cx(
              styles.tableItem,
              (pokemon?.boosts?.spa || 0) > 0 && styles.positive,
              (pokemon?.boosts?.spa || 0) < 0 && styles.negative,
            )}
          >
            {boostedStats.spa || '???'}
          </div>
          <div
            className={cx(
              styles.tableItem,
              (pokemon?.boosts?.spd || 0) > 0 && styles.positive,
              (pokemon?.boosts?.spd || 0) < 0 && styles.negative,
            )}
          >
            {boostedStats.spd || '???'}
          </div>
          <div
            className={cx(
              styles.tableItem,
              (pokemon?.boosts?.spe || 0) > 0 && styles.positive,
              (pokemon?.boosts?.spe || 0) < 0 && styles.negative,
            )}
          >
            {boostedStats.spe || '???'}
          </div>

          <div className={cx(styles.tableItem, styles.statLabel, styles.right)}>
            STAGE
          </div>
          <div className={cx(styles.tableItem)} />
          <div className={cx(styles.tableItem)}>
            {(pokemon?.boosts?.atk || 0) > 0 && '+'}
            {pokemon?.boosts?.atk || 0}
          </div>
          <div className={cx(styles.tableItem)}>
            {(pokemon?.boosts?.def || 0) > 0 && '+'}
            {pokemon?.boosts?.def || 0}
          </div>
          <div className={cx(styles.tableItem)}>
            {(pokemon?.boosts?.spa || 0) > 0 && '+'}
            {pokemon?.boosts?.spa || 0}
          </div>
          <div className={cx(styles.tableItem)}>
            {(pokemon?.boosts?.spd || 0) > 0 && '+'}
            {pokemon?.boosts?.spd || 0}
          </div>
          <div className={cx(styles.tableItem)}>
            {(pokemon?.boosts?.spe || 0) > 0 && '+'}
            {pokemon?.boosts?.spe || 0}
          </div>
        </div>

      </div>
    </div>
  );
};
