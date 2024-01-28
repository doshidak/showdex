import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { type CalcdexPlayerKey } from '@showdex/interfaces/calc';
import { ToggleButton } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import { logger } from '@showdex/utils/debug';
import { useCalcdexContext } from '../CalcdexContext';
import styles from './SideControls.module.scss';

export interface SideControlsProps {
  className?: string;
  style?: React.CSSProperties;
  playerKey: CalcdexPlayerKey
}

const l = logger('@showdex/components/calc/SideControls');

export const SideControls = ({
  className,
  style,
  playerKey,
}: SideControlsProps): JSX.Element => {
  const { t } = useTranslation('honkdex');
  const colorScheme = useColorScheme();

  const {
    state,
    removePokemon,
    dupePokemon,
    movePokemon,
    activatePokemon,
  } = useCalcdexContext();

  const {
    pokemon: party,
    activeIndices,
    selectionIndex,
  } = state?.[playerKey] || {};

  const selectedPokemon = party?.[selectionIndex];

  const toggleActive = () => {
    if (state?.gameType === 'Singles') {
      return void activatePokemon(
        playerKey,
        activeIndices?.includes(selectionIndex) ? [] : [selectionIndex],
        `${l.scope}:toggleActive()`,
      );
    }

    const indices = activeIndices?.includes(selectionIndex)
      ? activeIndices.filter((i) => i !== selectionIndex)
      : [...(activeIndices || []), selectionIndex].slice(-2);

    activatePokemon(playerKey, indices, `${l.scope}:toggleActive()`);
  };

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <div className={styles.sideLabel}>
        {/* <div className={styles.pretitle}>
          Side
        </div> */}
        <div className={styles.letter}>
          {playerKey === 'p1' ? 'A' : 'B'}
        </div>
      </div>

      <div className={styles.actions}>
        <ToggleButton
          className={styles.actionButton}
          label={t('sideControls.activeLabel', 'Active')}
          active={selectedPokemon?.active}
          absoluteHover
          disabled={!selectedPokemon?.speciesForme}
          onPress={toggleActive}
        />

        <ToggleButton
          className={styles.actionButton}
          label={t('sideControls.dupeLabel', 'Dupe')}
          absoluteHover
          disabled={!selectedPokemon?.speciesForme}
          onPress={() => dupePokemon(
            playerKey,
            selectedPokemon,
            `${l.scope}:ToggleButton~Dupe:onPress()`,
          )}
        />

        <ToggleButton
          className={styles.actionButton}
          absoluteHover
          disabled={!selectedPokemon?.speciesForme}
          onPress={() => movePokemon(
            playerKey,
            selectedPokemon,
            playerKey === 'p1' ? 'p2' : 'p1',
            null,
            `${l.scope}:ToggleButton~Move:onPress()`,
          )}
        >
          <i className={`fa fa-arrow-${playerKey === 'p1' ? 'down' : 'up'}`} />
          <span>{playerKey === 'p1' ? 'B' : 'A'}</span>
        </ToggleButton>

        <ToggleButton
          className={styles.actionButton}
          absoluteHover
          disabled={!selectedPokemon?.speciesForme}
          onPress={() => removePokemon(
            playerKey,
            selectedPokemon,
            true,
            `${l.scope}:ToggleButton~Remove:onPress()`,
          )}
        >
          <i className="fa fa-close" />
        </ToggleButton>
      </div>
    </div>
  );
};
