import * as React from 'react';
import cx from 'classnames';
import styles from './PokeCalc.module.scss';

interface StageCalcProps {
  className?: string;
  style?: React.CSSProperties;
  battle: Showdown.Battle;
}

export const StageCalc = ({
  className,
  style,
  battle,
}: StageCalcProps): JSX.Element => {
  const {
    p1,
    p2,
    weather,
    pseudoWeather,
  } = battle || {};

  const p1SideConditions = Object.values(p1?.sideConditions || {});
  const p2SideConditions = Object.values(p2?.sideConditions || {});

  return (
    <div
      className={cx(className)}
      style={style}
    >
      <div className={cx(styles.tableGrid, styles.stageTable)}>
        <div className={cx(styles.tableItem, styles.statLabel, styles.left)}>
          Your Screens
        </div>
        <div className={cx(styles.tableItem, styles.statLabel)}>
          Weather
        </div>
        <div className={cx(styles.tableItem, styles.statLabel)}>
          Terrain
        </div>
        <div className={cx(styles.tableItem, styles.statLabel, styles.right)}>
          Their Screens
        </div>

        <div className={cx(styles.tableItem, styles.left)}>
          {p1SideConditions.length ? p1SideConditions.flatMap((c) => c?.[0]).join(' / ') : 'None'}
        </div>
        <div className={styles.tableItem}>
          {weather || 'None'}
        </div>
        <div className={styles.tableItem}>
          {pseudoWeather?.length ? pseudoWeather.map((weatherState, i) => {
            const [name, minTimeLeft, maxTimeLeft] = weatherState || [];
            const effect = name ? Dex?.getEffect?.(name) : null;

            return (
              <React.Fragment key={`StageCalc-PseudoWeather:${effect?.id || name || i}`}>
                {(effect?.name || name || '').replace(/\s?Terrain/i, '')}

                {
                  (typeof minTimeLeft === 'number' || typeof maxTimeLeft === 'number') &&
                  <span className={cx(styles.statLabel, styles.small)}>
                    {' '}
                    {minTimeLeft}
                    {typeof maxTimeLeft === 'number' && `~${maxTimeLeft}`}
                  </span>
                }
              </React.Fragment>
            );
          }) : 'None'}
        </div>
        <div className={cx(styles.tableItem, styles.right)}>
          {p2SideConditions.length ? p2SideConditions.flatMap((c) => c?.[0]).join(' / ') : 'None'}
        </div>
      </div>
    </div>
  );
};
