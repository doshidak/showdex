import * as React from 'react';
import cx from 'classnames';
import { Picon } from '@showdex/components/app';
// import { upsizeArray } from '@showdex/utils/core';
// import { serializePokemon } from '@showdex/utils/debug';
import { BaseButton } from '@showdex/components/ui';
import type { Generation, GenerationNum } from '@pkmn/data';
// import type { Smogon } from '@pkmn/smogon';
// import type { State } from '@smogon/calc';
import type {
  CalcdexBattleField,
  CalcdexPlayer,
  CalcdexPokemon,
} from './CalcdexReducer';
import { PokeCalc } from './PokeCalc';
import styles from './PlayerCalc.module.scss';

interface PlayerCalcProps {
  className?: string;
  style?: React.CSSProperties;
  // player?: Showdown.Side;
  // opponent?: Showdown.Side;
  // pokemon?: CalcdexPokemon[];
  // opponentPokemon?: CalcdexPokemon[];
  // selectedIndex?: number;
  // opponentIndex?: number;
  // sideKey?: 'attackerSide' | 'defenderSide';
  player: CalcdexPlayer;
  opponent: CalcdexPlayer;
  // field?: State.Field;
  field?: CalcdexBattleField;
  // tooltips?: Showdown.BattleTooltips;
  // smogon?: Smogon;
  // format?: string;
  gen?: GenerationNum;
  dex?: Generation;
  defaultName?: string;
  // onFieldChange?: (field: Partial<State.Field>) => void;
  onPokemonChange?: (pokemon: Partial<CalcdexPokemon>) => void;
  onIndexSelect?: (index: number) => void;
}

export const PlayerCalc = ({
  className,
  style,
  player,
  opponent,
  // pokemon,
  // opponentPokemon,
  // selectedIndex,
  // opponentIndex,
  // sideKey,
  field,
  // tooltips,
  // smogon,
  // format,
  gen,
  dex,
  defaultName = 'p1',
  // onFieldChange,
  onPokemonChange,
  onIndexSelect,
}: PlayerCalcProps): JSX.Element => {
  // const [battleNonce, setBattleNonce] = React.useState<string>(null);

  // React.useEffect(() => {
  //   if (battle?.nonce && battle.nonce !== battleNonce) {
  //     setBattleNonce(battle.nonce);
  //   }
  // }, [
  //   battle,
  //   battleNonce,
  // ]);

  // React.useEffect(() => console.log('pokemon:', pokemon), [pokemon]);
  // React.useEffect(() => console.log('opponentPokemon:', opponentPokemon), [opponentPokemon]);

  const {
    sideid: playerSideId,
    name,
    rating,
    pokemon,
    activeIndex,
    selectionIndex: playerIndex,
  } = player || {};

  const {
    sideid: opponentSideId,
    pokemon: opponentPokemons,
    selectionIndex: opponentIndex,
  } = opponent || {};

  // const active = active?.[0];
  const activePokemon = pokemon[activeIndex];

  /** @todo move this outside to Calcdex in order to calc matchups based on current selection for both sides */
  // const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
  // const selected = pokemon?.[selectedIndex];
  // const vsPokemon = opponentPokemon?.[opponentIndex];

  const playerPokemon = pokemon[playerIndex];
  const opponentPokemon = opponentPokemons[opponentIndex];

  // probs not something worth rendering anyway
  // if (!Array.isArray(player?.pokemon)) {
  //   return null;
  // }

  return (
    <div
      className={cx(styles.container, className)}
      style={style}
    >
      <div className={styles.playerBar}>
        <div className={styles.username}>
          {name || defaultName}

          {
            !!rating &&
            <>
              <br />
              <span style={{ fontSize: 8, opacity: 0.5 }}>
                ELO{' '}
                {rating}
              </span>
            </>
          }
        </div>

        <div className={styles.teamList}>
          {Array(6).fill(null).map((_, i) => {
            const mon = pokemon?.[i];

            return (
              <BaseButton
                key={`Picon-${mon?.calcdexId || mon?.ident || defaultName}:${i}`}
                className={cx(
                  styles.piconButton,
                  // !!activePokemon?.ident && !!mon?.ident && mon.ident === activePokemon.ident && styles.active,
                  // !!playerPokemon?.ident && !!mon?.ident && mon.ident === playerPokemon.ident && styles.selected,
                  !!activePokemon?.calcdexId && (activePokemon?.calcdexId === mon?.calcdexId) && styles.active,
                  !!playerPokemon?.calcdexId && (playerPokemon?.calcdexId === mon?.calcdexId) && styles.selected,
                  (mon?.fainted || !mon?.hp) && styles.fainted,
                )}
                aria-label={`Select ${mon?.name || mon?.speciesForme || mon?.ident}`}
                hoverScale={1.175}
                disabled={!mon}
                onPress={() => onIndexSelect?.(i)}
              >
                <Picon
                  className={styles.picon}
                  pokemon={mon || 'pokeball-none'}
                />

                <div className={styles.background} />
              </BaseButton>
            );
          })}
        </div>
      </div>

      <PokeCalc
        style={{ paddingTop: 15 }}
        // pokemon={selected}
        // vsPokemon={vsPokemon}
        playerPokemon={playerPokemon}
        opponentPokemon={opponentPokemon}
        // tooltips={tooltips}
        // format={format}
        // smogon={smogon}
        field={{
          ...field,
          attackerSide: playerSideId === 'p1' ? field?.attackerSide : field?.defenderSide,
          defenderSide: playerSideId === 'p1' ? field?.defenderSide : field?.attackerSide,
        }}
        gen={gen}
        dex={dex}
        onPokemonChange={onPokemonChange}
      />

      {/* <pre>active: {serializePokemon(active?.[0], true)}</pre> */}
    </div>
  );
};
