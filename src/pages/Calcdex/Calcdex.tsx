import * as React from 'react';
import cx from 'classnames';
import { BuildInfo } from '@showdex/components/debug';
import { Scrollable } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
// import { logger } from '@showdex/utils/debug';
import { FieldCalc } from './FieldCalc';
import { PlayerCalc } from './PlayerCalc';
import { useCalcdex } from './useCalcdex';
import styles from './Calcdex.module.scss';

interface CalcdexProps {
  battle?: Showdown.Battle;
}

// const l = logger('@showdex/pages/Calcdex/Calcdex');

export const Calcdex = ({
  battle,
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
  } = useCalcdex({ battle });

  const {
    battleId,
    gen,
    format,
    rules,
    playerKey,
    authPlayerKey,
    opponentKey,
    p1,
    p2,
    field,
  } = state;

  // playerKey is a ref in case `battle` becomes `null`
  // const playerKey = React.useRef(detectPlayerKeyFromBattle(battle));
  // const opponentKey = playerKey.current === 'p2' ? 'p1' : 'p2';

  // detect if the logged-in user is also a player (currently just for FieldCalc lol)
  // (and is also a ref for the same reason as playerKey)
  // const authPlayerKey = React.useRef(detectAuthPlayerKeyFromBattle(battle));

  // React.useEffect(() => {
  //   const detectedKey = detectPlayerKeyFromBattle(battle);
  //   const detectedAuthKey = detectAuthPlayerKeyFromBattle(battle);
  //
  //   if (detectedKey && playerKey.current !== detectedKey) {
  //     playerKey.current = detectedKey;
  //   }
  //
  //   if (detectedAuthKey && authPlayerKey.current !== detectedAuthKey) {
  //     authPlayerKey.current = detectedAuthKey;
  //   }
  // }, [
  //   battle,
  // ]);

  // map the sides as the player and opponent to track them easier
  const player = playerKey === 'p1' ? p1 : p2;
  const opponent = opponentKey === 'p1' ? p1 : p2;

  return (
    <div
      className={cx(
        'showdex-module',
        styles.container,
        !!colorScheme && styles[colorScheme],
      )}
    >
      {
        !!battleId &&
        <Scrollable className={styles.content}>
          <BuildInfo
            position="top-right"
          />

          <PlayerCalc
            dex={dex}
            gen={gen}
            format={format}
            rules={rules}
            playerKey={playerKey}
            player={player}
            opponent={opponent}
            field={field}
            defaultName="Player"
            onPokemonChange={updatePokemon}
            onIndexSelect={(index) => setSelectionIndex(
              playerKey,
              index,
            )}
            onAutoSelectChange={(autoSelect) => setAutoSelect(
              playerKey,
              autoSelect,
            )}
          />

          <FieldCalc
            className={styles.fieldCalc}
            battleId={battleId}
            gen={gen}
            authPlayerKey={authPlayerKey}
            playerKey={playerKey}
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
        </Scrollable>
      }
    </div>
  );
};
