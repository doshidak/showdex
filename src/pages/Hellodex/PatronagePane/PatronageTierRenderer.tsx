import * as React from 'react';
import cx from 'classnames';
import { HomieButton } from '@showdex/components/app';
import { bullop } from '@showdex/consts/core';
import { type ShowdexSupporterTier } from '@showdex/interfaces/app';
import { formatId } from '@showdex/utils/core';
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
  colorScheme: Showdown.ColorScheme = 'light',
  showTitles?: boolean,
) => (
  tier: ShowdexSupporterTier,
  index?: number,
): JSX.Element => {
  const {
    title,
    term,
    // names,
    members,
  } = tier || {};

  // note: we're not checking if `members[]` is empty since we render an mdash if it is
  if (!title || !Array.isArray(members)) {
    return null;
  }

  const containerKey = `PatronagePane:${key}:${formatId(title)}`;
  const notFirstTier = index > 0;
  const membersCount = members.length;

  return (
    <React.Fragment key={containerKey}>
      <div
        className={styles.heading}
        style={notFirstTier ? { marginTop: 16 } : undefined}
      >
        {title}
      </div>

      <div
        className={cx(
          styles.value,
          !membersCount && styles.empty,
        )}
      >
        {membersCount ? members.map((member, i) => {
          const { name } = member || {};

          if (!name) {
            return null;
          }

          const childKey = `${key}:${formatId(name)}`;
          const notLastChild = i < membersCount - 1;

          return (
            <React.Fragment key={childKey}>
              <HomieButton
                colorScheme={colorScheme}
                homie={member}
                term={term}
                showTitles={showTitles}
              />

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
