import * as React from 'react';
import cx from 'classnames';
import { ValueField } from '@showdex/components/form';
import {
  type TooltipProps,
  BaseButton,
  ToggleButton,
  Tooltip,
} from '@showdex/components/ui';
import { eacute } from '@showdex/consts/core';
import { PokemonStatuses, PokemonStatusTitles } from '@showdex/consts/dex';
import { type CalcdexPokemon, useColorScheme } from '@showdex/redux/store';
import { calcPokemonCurrentHp, calcPokemonHpPercentage, calcPokemonMaxHp } from '@showdex/utils/calc';
import { formatId } from '@showdex/utils/core';
import { useUserAgent } from '@showdex/utils/hooks';
import { PokeStatus } from '../PokeStatus';
import styles from './PokeStatusTooltip.module.scss';

export interface PokeStatusTooltipProps {
  className?: string;
  style?: React.CSSProperties;
  pokemon?: CalcdexPokemon;
  visible?: boolean;
  disabled?: boolean;
  children?: TooltipProps['children'];
  onPokemonChange?: (pokemon: DeepPartial<CalcdexPokemon>) => void;
  onRequestClose?: () => void;
}

export const PokeStatusTooltip = ({
  className,
  style,
  pokemon,
  visible,
  disabled,
  children,
  onPokemonChange,
  onRequestClose,
}: PokeStatusTooltipProps): JSX.Element => {
  const colorScheme = useColorScheme();

  // do the same non-macOS Tippy fucked position workaround in PokeFormeTooltip lmao
  // (I should look into a better tooltip library or make my own at some point hmm)
  const userAgent = useUserAgent();
  const nonMacOS = !['macos', 'ios'].includes(formatId(userAgent?.os?.name));

  const {
    ident,
    speciesForme,
    hp: rawHp,
    dirtyHp,
    status: currentStatus,
    dirtyStatus,
  } = pokemon || {};

  const friendlyPokemonKey = ident || speciesForme;
  // const pokemonKey = calcdexId || friendlyPokemonKey;

  const maxHp = calcPokemonMaxHp(pokemon);
  const hp = calcPokemonCurrentHp(pokemon);
  const hpPercentage = Math.round(calcPokemonHpPercentage(pokemon) * 100);

  const status = dirtyStatus ?? (currentStatus || 'ok');

  const statusLabel = !hp
    ? 'Fainted'
    : status === 'ok'
      ? 'Healthy'
      : (PokemonStatusTitles[status] || 'Status');

  const showHpResetButton = typeof dirtyHp === 'number'
    && dirtyHp !== rawHp;

  const showStatusResetButton = !!dirtyStatus
    && (!currentStatus || dirtyStatus !== currentStatus);

  return (
    <Tooltip
      className={styles.tooltipContainer}
      content={(
        <div
          className={cx(
            styles.container,
            !!colorScheme && styles[colorScheme],
            className,
          )}
          style={style}
        >
          <div className={styles.group}>
            <div className={styles.hpFields}>
              <ValueField
                className={styles.hpField}
                // inputClassName={styles.hpFieldInput}
                label={`Current HP value of the Pok${eacute}mon ${friendlyPokemonKey}`}
                hideLabel
                hint={hp}
                min={0}
                max={maxHp}
                step={1}
                shiftStep={15}
                loop
                clearOnFocus
                absoluteHover
                reverseColorScheme
                input={{
                  value: hp,
                  onChange: (value: number) => onPokemonChange?.({
                    dirtyHp: value,
                  }),
                }}
              />

              <div className={styles.hpValue}>
                {showHpResetButton ? (
                  <ToggleButton
                    className={styles.hpResetButton}
                    forceColorScheme={colorScheme === 'light' ? 'dark' : 'light'}
                    label="Reset"
                    absoluteHover
                    active
                    onPress={() => onPokemonChange?.({
                      dirtyHp: null,
                    })}
                  />
                ) : maxHp}
              </div>

              <div className={styles.hpLabel}>
                HP
              </div>

              {/* <div className={styles.hpSlash}>
                /
              </div> */}

              <ValueField
                className={styles.hpField}
                style={{ marginLeft: '0.64em' }}
                // inputClassName={styles.hpFieldInput}
                label={`Current HP % of the Pok${eacute}mon ${friendlyPokemonKey}`}
                hideLabel
                hint={hpPercentage}
                min={0}
                max={100}
                step={1}
                shiftStep={5}
                loop
                clearOnFocus
                absoluteHover
                reverseColorScheme
                input={{
                  value: hpPercentage,
                  onChange: (value: number) => onPokemonChange?.({
                    dirtyHp: Math.round(maxHp * (value / 100)),
                  }),
                }}
              />

              <div className={styles.hpLabel}>
                %
              </div>
            </div>
          </div>
          <div className={styles.group}>
            <div className={styles.groupHeader}>
              <div className={styles.groupTitle}>
                {statusLabel}
              </div>

              {
                showStatusResetButton &&
                <ToggleButton
                  className={styles.groupResetButton}
                  forceColorScheme={colorScheme === 'light' ? 'dark' : 'light'}
                  label="Reset"
                  absoluteHover
                  active
                  onPress={() => onPokemonChange?.({
                    dirtyStatus: null,
                  })}
                />
              }
            </div>

            <div className={styles.statusOptions}>
              {([
                // 'ok', // our pseudo-"Healthy" status
                ...PokemonStatuses,
              ] as CalcdexPokemon['dirtyStatus'][]).map((option) => {
                // we don't want this one
                // (don't tell me there's a status-less status too... o_O)
                if (option === '???') {
                  return null;
                }

                const ok = option === 'ok'; // ok
                const alive = hp > 0;

                // Pokemon must be alive in order to have one of these statuses
                // (we're not showing the FNT/RIP status here, but implied via the HP inputs & disabled status buttons)
                const selected = alive && status === option;

                const highlighted = alive
                  && !selected
                  && option === currentStatus;

                return (
                  <BaseButton
                    key={`PokeStatusTooltip:${speciesForme}:Status:${option}`}
                    className={cx(
                      styles.statusOptionButton,
                      selected && styles.selected,
                      highlighted && styles.highlighted,
                      !alive && styles.disabled,
                    )}
                    display="block"
                    hoverScale={1}
                    activeScale={selected ? 0.98 : undefined}
                    disabled={!alive}
                    onPress={() => onPokemonChange?.({
                      dirtyStatus: selected ? 'ok' : option,
                    })}
                  >
                    <PokeStatus
                      className={styles.statusOptionStatus}
                      labelClassName={styles.statusOptionStatusLabel}
                      status={ok ? undefined : option}
                      override={ok ? option : undefined}
                      reverseColorScheme
                      highlight={selected}
                    />
                  </BaseButton>
                );
              })}
            </div>
          </div>
        </div>
      )}
      visible={visible}
      interactive
      popperOptions={nonMacOS ? { strategy: 'fixed' } : undefined}
      placement="top-start"
      offset={[0, 7]}
      disabled={!speciesForme || disabled}
      onClickOutside={onRequestClose}
    >
      {children}
    </Tooltip>
  );
};
