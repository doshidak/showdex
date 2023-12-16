import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import {
  type Duration,
  format,
  formatDuration,
  intervalToDuration,
  isValid,
} from 'date-fns';
import { Button, Tooltip } from '@showdex/components/ui';
import { bullop } from '@showdex/consts/core';
import { type ShowdexSupporterTier } from '@showdex/interfaces/app';
import { findPlayerTitle } from '@showdex/utils/app';
import { env, formatId, getResourceUrl } from '@showdex/utils/core';
import { openUserPopup } from '@showdex/utils/host';
import { pluralize } from '@showdex/utils/humanize';
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

  const tooltipColorScheme: Showdown.ColorScheme = colorScheme === 'light'
    ? 'dark'
    : 'light';

  const containerKey = `PatronagePane:${key}:${formatId(title)}`;
  const notFirstTier = index > 0;
  const membersCount = members.length;

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
          !membersCount && styles.empty,
        )}
      >
        {membersCount ? members.map((member, i) => {
          const {
            name,
            showdownUser,
            periods,
          } = member || {};

          if (!name) {
            return null;
          }

          const childKey = `${key}:${formatId(name)}`;
          const notLastChild = i < membersCount - 1;

          const periodsCount = periods?.length || 0;
          const validPeriods = periods?.filter?.((p) => !!p?.[0] && isValid(new Date(p[0])));

          /*
          const startIsoDate = Array.isArray(n) ? n[2] : null;
          const startDate = startIsoDate?.includes('-') && isValid(new Date(startIsoDate))
            ? new Date(startIsoDate)
            : null;

          const endIsoDate = Array.isArray(n) ? n[3] : null;
          const endDate = endIsoDate?.includes('-') && isValid(new Date(endIsoDate))
            ? new Date(endIsoDate)
            : null;
          */

          const userTitle = findPlayerTitle(name, showdownUser);
          const userLabelColor = userTitle?.color?.[colorScheme];
          const userTooltipLabelColor = userTitle?.color?.[tooltipColorScheme];
          const userIconColor = userTitle?.iconColor?.[colorScheme];
          const userTooltipIconColor = userTitle?.iconColor?.[tooltipColorScheme];

          const active = term === 'once' || validPeriods?.some((p) => !p[1]);

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

          const renderedTooltip = userTitle?.title || validPeriods?.length ? (
            <div className={styles.tooltipContent}>
              {
                showTitles &&
                <>
                  {
                    (userTitle?.custom && !!userTitle?.icon) &&
                    <>
                      <Svg
                        className={styles.customTitleIcon}
                        style={{ color: userTooltipIconColor || userTooltipLabelColor }}
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

              {
                !!validPeriods?.length &&
                <>
                  {
                    term === 'once' &&
                    <>
                      Donated{' '}
                      {
                        periodsCount > 1 &&
                        <strong>{pluralize(periodsCount, 'time:s')}{' '}</strong>
                      }
                      on
                      {validPeriods.map((period) => (
                        <React.Fragment key={`${childKey}:${period[0]}`}>
                          <br />
                          {format(new Date(period[0]), 'PP')}
                        </React.Fragment>
                      ))}
                    </>
                  }

                  {
                    term === 'monthly' &&
                    <>
                      {(() => {
                        const duration = validPeriods.reduce((prev, period) => {
                          const [startDate, endDate] = period;

                          const periodDuration = intervalToDuration({
                            start: new Date(startDate),
                            end: new Date(endDate || buildDate),
                          });

                          Object.keys(prev).forEach((unit) => {
                            if (!periodDuration?.[unit]) {
                              return;
                            }

                            prev[unit] += periodDuration[unit];
                          });

                          return prev;
                        }, {
                          years: 0,
                          months: 0,
                          // weeks: 0, // apparently not a thing in date-fns@2.30.0 o_O
                          days: 0,
                          hours: 0,
                          minutes: 0,
                          seconds: 0,
                        } as Duration);

                        // do some rounding up
                        if (duration.seconds > 30) {
                          duration.minutes++;
                          duration.seconds = 0;
                        }

                        if (duration.minutes > 30) {
                          duration.hours++;
                          duration.minutes = 0;
                        }

                        if (duration.hours > 12) {
                          duration.days++;
                          duration.hours = 0;
                        }

                        /*
                        if (duration.days > 3) {
                          duration.weeks++;
                          duration.days = 0;
                        }

                        if (duration.weeks > 2) {
                          duration.months++;
                          duration.weeks = 0;
                        }
                        */

                        if (duration.days > 15) {
                          duration.months++;
                          duration.days = 0;
                        }

                        // this one doesn't round up, but handles overflows from prior roundings
                        if (duration.months > 11) {
                          duration.years++;
                          duration.months = Math.max(duration.months - 12, 0);
                        }

                        /*
                        const formatted = formatDistance(startDate, endDate || buildDate)
                          .replace(/1(?=\x20)/, 'a')
                          .replace('about', '');

                        if (formatted.includes('day')) {
                          return null;
                        }
                        */

                        const formatted = formatDuration(duration, {
                          format: ['years', 'months'],
                          zero: false,
                          delimiter: ' & ',
                        }).replace(/1(?=\x20)/, 'a');

                        if (!formatted) {
                          return null;
                        }

                        return `${active ? '' : 'Supported '}for ${formatted}`;
                      })()}
                    </>
                  }
                </>
              }
            </div>
          ) : showdownUser ? (
            <div className={styles.tooltipContent}>
              Open <strong>{name}</strong>'s Profile
            </div>
          ) : null;

          return (
            <React.Fragment key={childKey}>
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
