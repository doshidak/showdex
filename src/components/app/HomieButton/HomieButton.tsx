import * as React from 'react';
import cx from 'classnames';
import {
  format,
  formatDuration,
  intervalToDuration,
  isValid,
} from 'date-fns';
import { Button, Tooltip } from '@showdex/components/ui';
import { type ShowdexSupporterTierMember, type ShowdexSupporterTierTerm } from '@showdex/interfaces/app';
import { useColorScheme } from '@showdex/redux/store';
import { findPlayerTitle } from '@showdex/utils/app';
import { env, formatId } from '@showdex/utils/core';
import { openUserPopup } from '@showdex/utils/host';
import { pluralize } from '@showdex/utils/humanize';
import { MemberIcon } from '../MemberIcon';
import styles from './HomieButton.module.scss';

export interface HomieButtonProps {
  className?: string;
  style?: React.CSSProperties;
  colorScheme?: Showdown.ColorScheme;
  homie: ShowdexSupporterTierMember;
  term?: ShowdexSupporterTierTerm;
  showTitles?: boolean;
}

const buildDateMs = parseInt(env('build-date'), 16) || null;
const buildDate = isValid(buildDateMs) ? new Date(buildDateMs) : null;

export const HomieButton = ({
  className,
  style,
  colorScheme: colorSchemeFromProps,
  homie,
  term = 'once',
  showTitles,
}: HomieButtonProps): JSX.Element => {
  const colorSchemeFromStore = useColorScheme();
  const colorScheme = colorSchemeFromProps || colorSchemeFromStore;
  const tooltipColorScheme: Showdown.ColorScheme = colorScheme === 'light' ? 'dark' : 'light';

  const {
    name,
    showdownUser,
    periods,
  } = homie || {};

  const userTitle = findPlayerTitle(name, showdownUser);
  const userLabelColor = userTitle?.color?.[colorScheme];
  const userTooltipLabelColor = userTitle?.color?.[tooltipColorScheme];

  const periodsCount = periods?.length || 0;
  const validPeriods = periods?.filter?.((p) => !!p?.[0] && isValid(new Date(p[0])));
  const active = term === 'once' || validPeriods?.some((p) => !p[1]);

  const nameStyle: React.CSSProperties = {
    ...(showTitles && userLabelColor ? {
      color: userLabelColor,
      textShadow: userTitle.colorGlow ? `0 0 4px ${userLabelColor}` : undefined,
    } : undefined),
    ...(active ? undefined : { opacity: 0.56 }),
  };

  const renderedUsername = (
    <>
      <span>{name}</span>

      {/*
        (showTitles && showdownUser && !!userTitle?.icon) &&
        <Svg
          className={styles.usernameIcon}
          style={userIconColor ? {
            color: userTitle.iconColorGlow ? '#FFFFFF' : userIconColor,
            boxShadow: userTitle.iconColorGlow ? `0 0 3px ${userIconColor}` : undefined,
          } : undefined}
          description={userTitle.iconDescription}
          src={getResourceUrl(`${userTitle.icon}.svg`)}
        />
      */}

      {
        (showTitles && showdownUser && !!userTitle?.icon) &&
        <MemberIcon
          className={styles.usernameIcon}
          member={homie}
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
              {/* <Svg
                className={styles.customTitleIcon}
                style={{ color: userTitle.iconColorGlow ? '#FFFFFF' : (userTooltipIconColor || userTooltipLabelColor) }}
                description={userTitle.iconDescription}
                src={getResourceUrl(`${userTitle.icon}.svg`)}
              /> */}
              <MemberIcon
                className={styles.customTitleIcon}
                member={homie}
              />
              <br />
            </>
          }

          {
            !!userTitle?.title &&
            <>
              <span
                className={styles.tooltipPlayerTitle}
                style={userTooltipLabelColor ? {
                  color: userTooltipLabelColor,
                  textShadow: userTitle.colorGlow ? `0 0 4px ${userTooltipLabelColor}` : undefined,
                } : undefined}
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
                <>{pluralize(periodsCount, 'time:s')}{' '}</>
              }
              on
              {validPeriods.map((period) => (
                <React.Fragment key={`${formatId(name)}:${period[0]}`}>
                  <br />
                  <strong>{format(new Date(period[0]), 'PP')}</strong>
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

  return showdownUser ? (
    <Button
      display="inline"
      className={cx(styles.userButton, className)}
      style={{ ...nameStyle, ...style }}
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
        className={cx(styles.userButtonless, className)}
        style={{ ...nameStyle, ...style }}
      >
        {renderedUsername}
      </span>
    </Tooltip>
  );
};
