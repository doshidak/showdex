import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { BuildInfo } from '@showdex/components/debug';
import { BaseButton, Scrollable, Tooltip } from '@showdex/components/ui';
import { ShowdexDonorTiers, ShowdexPatronTiers } from '@showdex/consts/app';
import { useAuthUsername, useColorScheme } from '@showdex/redux/store';
import { findPlayerTitle } from '@showdex/utils/app';
import { env, getResourceUrl } from '@showdex/utils/core';
import type { BaseButtonProps } from '@showdex/components/ui';
import type { ElementSizeLabel } from '@showdex/utils/hooks';
import hellodexStyles from './Hellodex.module.scss';
import styles from './PatronagePane.module.scss';

export interface PatronagePaneProps {
  className?: string;
  style?: React.CSSProperties;
  containerSize?: ElementSizeLabel,
  onRequestClose?: BaseButtonProps['onPress'];
}

const donationUrl = env('hellodex-donation-url');
const patronageUrl = env('hellodex-patronage-url');

export const PatronagePane = ({
  className,
  style,
  containerSize = 'md',
  onRequestClose,
}: PatronagePaneProps): JSX.Element => {
  const authUser = useAuthUsername();
  const authTitle = findPlayerTitle(authUser);
  const colorScheme = useColorScheme();

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        ['xs', 'sm'].includes(containerSize) && styles.verySmol,
        className,
      )}
      style={style}
    >
      <Tooltip
        content="Close Supporter Info"
        offset={[0, 10]}
        delay={[1000, 50]}
        trigger="mouseenter"
        touch={['hold', 500]}
      >
        <BaseButton
          className={styles.closeButton}
          display="inline"
          aria-label="Close Supporter Info"
          onPress={onRequestClose}
        >
          <Svg
            className={styles.closeIcon}
            src={getResourceUrl('close-circle.svg')}
            description="Close Circle Icon"
          />
        </BaseButton>
      </Tooltip>

      <Scrollable className={styles.contentContainer}>
        <BuildInfo
          position="top-right"
        />

        <div className={styles.content}>
          <div className={styles.header}>
            <div
              className={styles.iconContainer}
              style={authTitle?.color?.[colorScheme] ? {
                color: authTitle.color[colorScheme],
                boxShadow: [
                  `0 0 1px ${colorScheme === 'dark' ? '#FFFFFF4D' : '#00000026'}`,
                  `0 0 25px ${authTitle.color[colorScheme]}${colorScheme === 'dark' ? '80' : '4D'}`,
                ].join(', '),
              } : undefined}
            >
              <Svg
                className={styles.icon}
                src={getResourceUrl(`${authTitle?.icon || 'sparkle'}.svg`)}
                description={authTitle?.iconDescription || 'Sparkle Icon'}
              />
            </div>

            <div className={styles.title}>
              {authTitle?.title ? (
                <>
                  <span className={styles.thin}>
                    Showdex
                  </span>
                  {' '}
                  <i className="fa fa-heart" />
                  {/* <span className={styles.thin}>
                    's
                  </span> */}
                  <br />
                  <span
                    style={authTitle.color?.[colorScheme] ? {
                      color: authTitle.color[colorScheme],
                    } : undefined}
                  >
                    {authUser || 'You'}
                  </span>
                </>
              ) : (
                <>
                  Show
                  <span className={styles.thin}>
                    dex
                  </span>
                  {' '}Some
                  <br />
                  <span className={styles.thin} style={{ opacity: 0.5 }}>
                    &mdash;{' '}
                  </span>
                  <i className="fa fa-heart" />
                  <span className={styles.thin} style={{ opacity: 0.5 }}>
                    {' '}&mdash;
                  </span>
                </>
              )}
            </div>
          </div>

          <div className={styles.supportMethods}>
            <div className={styles.supportMethod}>
              <div className={styles.title}>
                PayPal
              </div>

              <div className={styles.info}>
                <div className={styles.description} style={{ marginBottom: 15 }}>
                  <em>One-time</em> donations will entitle you to the benefits of the lowest
                  Patreon tier, excluding benefits awarded to active pledges.{' '}
                  <em>Monthly</em> donations will entitle you to the benefits of the closest
                  matching Patreon tier to your donation amount.
                </div>

                {ShowdexDonorTiers.map((tier, i) => (
                  <React.Fragment key={`PatronagePane:ShowdexDonorTiers:${tier.title}`}>
                    <div
                      className={styles.heading}
                      style={i > 0 ? { marginTop: 15 } : undefined}
                    >
                      {tier.title}
                    </div>

                    <div
                      className={styles.value}
                      style={!tier.names?.length ? {
                        opacity: 0.3,
                        userSelect: 'none',
                      } : undefined}
                    >
                      {tier.names?.length ? (
                        tier.names.map((n) => (Array.isArray(n) ? n[0] : n)).join(', ')
                      ) : <>&mdash;</>}
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <div className={styles.buttonContainer}>
                <BaseButton
                  className={cx(hellodexStyles.donateButton, styles.button)}
                  aria-label="Donate via PayPal"
                  disabled={!donationUrl?.startsWith('https://')}
                  onPress={() => window.open(donationUrl, '_blank')}
                >
                  <span className={hellodexStyles.labelThicc}>
                    Donate
                  </span>
                  <span className={hellodexStyles.labelThin} style={{ margin: '0 5px' }}>
                    via
                  </span>
                  <span className={hellodexStyles.labelThicc}>
                    PayPal
                  </span>
                </BaseButton>
              </div>
            </div>

            <div className={styles.supportMethod}>
              <div className={styles.title}>
                Patreon
              </div>

              <div className={styles.info}>
                <div className={styles.description} style={{ marginBottom: 15 }}>
                  All Patreon tiers are <em>monthly</em> donations, entitling you to additional benefits
                  compared to those of <em>one-time</em> donations. Please visit our Patreon for more details.
                  Batteries not included.
                </div>

                {ShowdexPatronTiers.map((tier, i) => (
                  <React.Fragment key={`PatronagePane:ShowdexPatronTiers:${tier.title}`}>
                    <div
                      className={styles.heading}
                      style={i > 0 ? { marginTop: 15 } : undefined}
                    >
                      {tier.title}
                    </div>

                    <div
                      className={styles.value}
                      style={!tier.names?.length ? {
                        opacity: 0.3,
                        userSelect: 'none',
                      } : undefined}
                    >
                      {tier.names?.length ? (
                        tier.names.map((n) => (Array.isArray(n) ? n[0] : n)).join(', ')
                      ) : <>&mdash;</>}
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <div className={styles.buttonContainer}>
                <BaseButton
                  className={cx(hellodexStyles.donateButton, styles.button)}
                  aria-label={authTitle ? 'Visit Our Patreon' : 'Become a Patron'}
                  disabled={!patronageUrl?.startsWith('https://')}
                  onPress={() => window.open(patronageUrl, '_blank')}
                >
                  <span className={hellodexStyles.labelThicc}>
                    {authTitle ? 'Visit' : 'Become'}
                  </span>
                  <span className={hellodexStyles.labelThin} style={{ margin: '0 5px' }}>
                    {authTitle ? 'our' : 'a'}
                  </span>
                  <span className={hellodexStyles.labelThicc}>
                    {authTitle ? 'Patreon' : 'Patron'}
                  </span>
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </Scrollable>
    </div>
  );
};
