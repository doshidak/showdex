import * as React from 'react';
import cx from 'classnames';
import { type GenerationNum } from '@smogon/calc';
import { BattleGenOptionTooltip, HomieButton } from '@showdex/components/app';
import { Dropdown } from '@showdex/components/form';
// import { ToggleButton } from '@showdex/components/ui';
import { ShowdexPatronTiers } from '@showdex/consts/app';
import { useAuthUsername, useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { buildFormatOptions, buildGenOptions } from '@showdex/utils/ui';
import { useCalcdexContext } from '../CalcdexContext';
import styles from './BattleInfo.module.scss';

export interface BattleInfoProps {
  className?: string;
  style?: React.CSSProperties;
}

const genOptions = buildGenOptions();

const flatMembers = ShowdexPatronTiers
  .filter((t) => t?.members?.length)
  .flatMap((t) => t.members);

const l = logger('@showdex/components/calc/BattleInfo');

export const BattleInfo = ({
  className,
  style,
}: BattleInfoProps): JSX.Element => {
  const colorScheme = useColorScheme();

  const authUsername = useAuthUsername();
  const authId = formatId(authUsername);

  const homie = React.useMemo(() => (
    flatMembers.find((m) => formatId(m.name) === authId)
  ) || {
    name: authUsername,
    showdownUser: true,
    periods: [],
  }, [
    authId,
    authUsername,
  ]);

  const {
    state,
    // settings,
    updateBattle,
  } = useCalcdexContext();

  const {
    operatingMode,
    battleId,
    gen,
    // legacy,
    format,
    // gameType,
  } = state || {};

  const formatOptions = React.useMemo(
    () => buildFormatOptions(gen),
    [gen],
  );

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <div>
        <div className={styles.labelContainer}>
          <div className={styles.dropdownLabel}>
            Gen
            {
              !!gen &&
              <>
                {' '}{gen}
              </>
            }
          </div>
        </div>

        <Dropdown
          aria-label="Generation Selector"
          hint="???"
          optionTooltip={BattleGenOptionTooltip}
          input={{
            name: `BattleInfo:${battleId}:Gen`,
            value: gen,
            onChange: (value: GenerationNum) => updateBattle({
              gen: value,
            }, `${l.scope}:Dropdown~Gen:input.onChange()`),
          }}
          options={genOptions}
          noOptionsMessage="No Generations"
          clearable={false}
          disabled={operatingMode !== 'standalone'}
        />
      </div>

      <div>
        <div className={styles.labelContainer}>
          <div className={styles.dropdownLabel}>
            Format
          </div>

          {/*
            !legacy &&
            <ToggleButton
              className={styles.toggleButton}
              label={gameType}
              tooltip={(
                <div className={styles.tooltipContent}>
                  Switch to{' '}
                  <strong>{gameType === 'Singles' ? 'Doubles' : 'Singles'}</strong>
                </div>
              )}
              tooltipDisabled={!settings?.showUiTooltips}
              absoluteHover
              disabled={operatingMode !== 'standalone'}
              onPress={() => updateBattle({
                gameType: gameType === 'Singles' ? 'Doubles' : 'Singles',
              }, `${l.scope}:ToggleButton~GameType:onPress()`)}
            />
          */}
        </div>

        <Dropdown
          aria-label="Battle Format Selector"
          hint="???"
          input={{
            name: `BattleInfo:${battleId}:Format`,
            value: format,
            onChange: (value: string) => updateBattle({
              format: value,
            }, `${l.scope}:Dropdown~Format:input.onChange()`),
          }}
          options={formatOptions}
          noOptionsMessage="No Formats"
          clearable={false}
          disabled={operatingMode !== 'standalone'}
        />
      </div>

      <div>
        <div className={styles.honkNameContainer}>
          <div className={styles.honkName}>
            {(!!battleId && `honk:${battleId.slice(-7)}`) || 'untitled honk'}
          </div>
        </div>

        {
          !__DEV__ &&
          <div className={styles.honkInProgress}>
            <i className="fa fa-heart" />

            <div className={styles.description}>
              hello{' '}
              <HomieButton
                homie={homie}
                term="monthly"
                showTitles
              />
              {' '}!!
              <em>something something</em> this is <strong>pre-&alpha;</strong> af &amp; all the little fixins are missing.
              hope you still enjoy!
            </div>
          </div>
        }
      </div>
    </div>
  );
};
