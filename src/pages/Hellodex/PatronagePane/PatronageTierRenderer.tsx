import * as React from 'react';
import cx from 'classnames';
import { Button } from '@showdex/components/ui';
import { bullop } from '@showdex/consts/core';
import { formatId, openUserPopup } from '@showdex/utils/app';
import type { ShowdexSupporterTier } from '@showdex/consts/app';
import styles from './PatronagePane.module.scss';

/**
 * Internally-used tier renderer factory.
 *
 * * Return value of the outer function matches the function signature of
 *   the `callbackFn` argument of `Array.prototype.map()`.
 *   - This means you can specify this factory as the first argument
 *     after you specify the `key` (see example).
 *
 * @example
 * ```tsx
 * <div className={styles.info}>
 *   {ShowdexDonorTiers.map(TierRenderer('DonorTier'))}
 * </div>
 * ```
 * @since 1.1.5
 */
export const PatronageTierRenderer = (
  key: string,
) => (
  tier: ShowdexSupporterTier,
  index?: number,
): JSX.Element => {
  const {
    title,
    names,
  } = tier || {};

  // note: we're not checking if `names[]` is empty since we render an mdash if it is
  if (!title || !Array.isArray(names)) {
    return null;
  }

  const containerKey = `PatronagePane:${key}:${formatId(title)}`;
  const notFirstTier = index > 0;
  const namesCount = names.length;

  return (
    <React.Fragment key={containerKey}>
      <div
        className={styles.heading}
        style={notFirstTier ? { marginTop: 15 } : undefined}
      >
        {title}
      </div>

      <div
        className={cx(
          styles.value,
          !names.length && styles.empty,
        )}
      >
        {names.length ? names.map((n, i) => {
          const name = Array.isArray(n) ? n[0] : n;

          if (!name) {
            return null;
          }

          const username = formatId(name);
          const nameKey = `${key}:${username}`;

          const active = !Array.isArray(n) || n[1];
          const nameStyle: React.CSSProperties = active ? undefined : {
            opacity: 0.5,
          };

          const user = Array.isArray(n) && n[2];
          const notLastChild = i < namesCount - 1;

          return (
            <React.Fragment key={nameKey}>
              {user ? (
                <Button
                  display="inline"
                  className={styles.userButton}
                  labelStyle={nameStyle}
                  label={name}
                  tooltip={(
                    <div className={styles.tooltipContent}>
                      Open <strong>{name}</strong>'s Profile
                    </div>
                  )}
                  absoluteHover
                  onPress={() => openUserPopup(name)}
                />
              ) : (
                <span style={nameStyle}>
                  {name}
                </span>
              )}
              {
                notLastChild &&
                <span style={{ opacity: 0.3 }}>
                  {' '}{bullop}{' '}
                </span>
              }
            </React.Fragment>
          );
        }) : <>&mdash;</>}
      </div>
    </React.Fragment>
  );
};
