import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { format, formatDistance, isValid } from 'date-fns';
import { Button, Tooltip } from '@showdex/components/ui';
import { type ShowdexSupporterTier } from '@showdex/consts/app';
import { bullop } from '@showdex/consts/core';
import { findPlayerTitle, openUserPopup } from '@showdex/utils/app';
import { env, formatId, getResourceUrl } from '@showdex/utils/core';
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
    names,
  } = tier || {};

  // note: we're not checking if `names[]` is empty since we render an mdash if it is
  if (!title || !Array.isArray(names)) {
    return null;
  }

  const tooltipColorScheme: Showdown.ColorScheme = colorScheme === 'light'
    ? 'dark'
    : 'light';

  const containerKey = `PatronagePane:${key}:${formatId(title)}`;
  const notFirstTier = index > 0;
  const namesCount = names.length;

  const buildDateMs = parseInt(env('build-date'), 16) || null;
  const buildDate = isValid(buildDateMs) ? new Date(buildDateMs) : null;

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

          const showdownUser = Array.isArray(n) && n[1];
          const notLastChild = i < namesCount - 1;

          const startIsoDate = Array.isArray(n) ? n[2] : null;
          const startDate = startIsoDate?.includes('-') && isValid(new Date(startIsoDate))
            ? new Date(startIsoDate)
            : null;

          const endIsoDate = Array.isArray(n) ? n[3] : null;
          const endDate = endIsoDate?.includes('-') && isValid(new Date(endIsoDate))
            ? new Date(endIsoDate)
            : null;

          const userTitle = findPlayerTitle(name, showdownUser);
          const userLabelColor = userTitle?.color?.[colorScheme];
          const userTooltipLabelColor = userTitle?.color?.[tooltipColorScheme];
          const userIconColor = userTitle?.iconColor?.[colorScheme];

          const active = term === 'once' || (
            !!startDate // start date string (should exist)
              && !endDate // end date string (should not exist)
          );

          const nameStyle: React.CSSProperties = {
            ...(showTitles && userLabelColor ? { color: userLabelColor } : undefined),
            ...(active ? undefined : { opacity: 0.56 }),
          };

          const renderedUsername = (
            <>
              <span>{name}</span>

              {
                (showTitles && showdownUser && !!userTitle?.icon) &&
                <Svg
                  className={styles.usernameIcon}
                  style={userIconColor ? { color: userIconColor } : undefined}
                  description={userTitle.iconDescription}
                  src={getResourceUrl(`${userTitle.icon}.svg`)}
                />
              }
            </>
          );

          const renderedTooltip = userTitle?.title || startDate ? (
            <div className={styles.tooltipContent}>
              {
                showTitles &&
                <>
                  {
                    (userTitle?.custom && !!userTitle?.icon) &&
                    <>
                      <Svg
                        className={styles.customTitleIcon}
                        style={{ color: userIconColor || userLabelColor }}
                        description={userTitle.iconDescription}
                        src={getResourceUrl(`${userTitle.icon}.svg`)}
                      />
                      <br />
                    </>
                  }

                  {
                    !!userTitle?.title &&
                    <>
                      <span
                        className={styles.tooltipPlayerTitle}
                        style={userTooltipLabelColor ? { color: userTooltipLabelColor } : undefined}
                      >
                        {userTitle.title}
                      </span>
                      <br />
                    </>
                  }
                </>
              }

              {startDate && term === 'once' ? (
                <>
                  Donated on{' '}
                  {/* <br /> */}
                  {/* {format(startDate, 'PP \'at\' pp')} */}
                  {format(startDate, 'PP')}
                </>
              ) : startDate && (endDate || buildDate) && term === 'monthly' ? (
                <>
                  {/* {endDate ? 'Supported' : 'Supporter'}{' '} */}
                  {/* {endDate && 'Supported '} */}
                  {/* for{' '} */}
                  {/* {formatDistance(
                    startDate,
                    endDate || buildDate,
                  ).replace(/1(?=\x20)/, 'a')} */}
                  {(() => {
                    const formatted = formatDistance(startDate, endDate || buildDate)
                      .replace(/1(?=\x20)/, 'a')
                      .replace('about', '');

                    if (formatted.includes('day')) {
                      return null;
                    }

                    if (endDate) {
                      return `Supported for ${formatted}`;
                    }

                    return `for ${formatted}`;
                  })()}
                </>
              ) : null}
            </div>
          ) : showdownUser ? (
            <div className={styles.tooltipContent}>
              Open <strong>{name}</strong>'s Profile
            </div>
          ) : null;

          return (
            <React.Fragment key={`${key}:${formatId(name)}`}>
              {showdownUser ? (
                <Button
                  display="inline"
                  className={styles.userButton}
                  style={nameStyle}
                  tooltip={renderedTooltip}
                  absoluteHover
                  onPress={() => openUserPopup(name)}
                >
                  {renderedUsername}
                </Button>
              ) : (
                <Tooltip
                  content={renderedTooltip}
                  placement="top"
                  offset={[0, 10]}
                  delay={[1000, 50]}
                  trigger="mouseenter"
                  touch={['hold', 500]}
                  disabled={!renderedTooltip}
                >
                  <span
                    className={styles.userButtonless}
                    style={nameStyle}
                  >
                    {renderedUsername}
                  </span>
                </Tooltip>
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
