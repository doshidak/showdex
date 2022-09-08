import * as React from 'react';
import cx from 'classnames';
import { useColorScheme } from '@showdex/components/app';
import { BuildInfo } from '@showdex/components/debug';
import { detectPlayerKeyFromBattle } from '@showdex/utils/battle';
import { logger } from '@showdex/utils/debug';
import { FieldCalc } from './FieldCalc';
import { PlayerCalc } from './PlayerCalc';
import { useCalcdex } from './useCalcdex';
import styles from './Calcdex.module.scss';

interface CalcdexProps {
  battle?: Showdown.Battle;
  // tooltips?: Showdown.BattleTooltips;
}

const l = logger('@showdex/pages/Calcdex/Calcdex');

export const Calcdex = ({
  battle,
  // tooltips,
}: CalcdexProps): JSX.Element => {
  const colorScheme = useColorScheme();

  const {
    dex,
    state,
    updatePokemon,
    updateField,
    // setActiveIndex,
    setSelectionIndex,
    setAutoSelect,
  } = useCalcdex({
    battle,
    // tooltips,
  });

  l.debug(
    'rendering...',
    '\n', 'colorScheme', colorScheme,
    '\n', 'p1.pokemon', battle?.p1?.pokemon,
    '\n', 'p2.pokemon', battle?.p2?.pokemon,
    '\n', 'state', state,
  );

  const {
    battleId,
    gen,
    format,
    rules,
    field,
    p1,
    p2,
  } = state;

  // playerKey is a ref in case `battle` becomes `null`
  const playerKey = React.useRef(detectPlayerKeyFromBattle(battle));
  const opponentKey = playerKey.current === 'p1' ? 'p2' : 'p1';

  React.useEffect(() => {
    if (playerKey.current) {
      return;
    }

    const detectedKey = detectPlayerKeyFromBattle(battle);

    if (detectedKey) {
      playerKey.current = detectedKey;
    }
  }, [
    battle,
  ]);

  const player = playerKey.current === 'p1' ? p1 : p2;
  const opponent = playerKey.current === 'p1' ? p2 : p1;

  if (!state?.battleId) {
    return null;
  }

  return (
    <div
      className={cx(
        'showdex-module',
        styles.container,
        !!colorScheme && styles[colorScheme],
      )}
    >
      <div className={styles.content}>
        <BuildInfo
          position="top-right"
        />

        <PlayerCalc
          dex={dex}
          gen={gen}
          format={format}
          rules={rules}
          playerKey={playerKey.current}
          player={player}
          opponent={opponent}
          field={field}
          defaultName="Player"
          onPokemonChange={updatePokemon}
          onIndexSelect={(index) => setSelectionIndex(
            playerKey.current,
            index,
          )}
          onAutoSelectChange={(autoSelect) => setAutoSelect(
            playerKey.current,
            autoSelect,
          )}
        />

        <FieldCalc
          className={styles.fieldCalc}
          battleId={battleId}
          playerKey={playerKey.current}
          field={field}
          onFieldChange={updateField}
        />

        <PlayerCalc
          className={styles.opponentCalc}
          dex={dex}
          gen={gen}
          format={format}
          rules={rules}
          playerKey={opponentKey}
          player={opponent}
          opponent={player}
          field={field}
          defaultName="Opponent"
          onPokemonChange={updatePokemon}
          onIndexSelect={(index) => setSelectionIndex(
            opponentKey,
            index,
          )}
          onAutoSelectChange={(autoSelect) => setAutoSelect(
            opponentKey,
            autoSelect,
          )}
        />
      </div>
    </div>
  );
};
