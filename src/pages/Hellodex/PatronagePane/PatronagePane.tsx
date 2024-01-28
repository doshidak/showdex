import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { MemberIcon } from '@showdex/components/app';
import { BuildInfo } from '@showdex/components/debug';
import {
  type BaseButtonProps,
  BaseButton,
  Scrollable,
  Tooltip,
} from '@showdex/components/ui';
import { ShowdexDonorTiers, ShowdexPatronTiers } from '@showdex/consts/app';
import {
  useAuthUsername,
  useColorScheme,
  useGlassyTerrain,
  useHellodexState,
} from '@showdex/redux/store';
import { findPlayerTitle } from '@showdex/utils/app';
import { env, getResourceUrl } from '@showdex/utils/core';
import { GradientButton } from '../GradientButton';
import { PatronageTierRenderer } from './PatronageTierRenderer';
import styles from './PatronagePane.module.scss';

export interface PatronagePaneProps {
  className?: string;
  style?: React.CSSProperties;
  onRequestClose?: BaseButtonProps['onPress'];
}

const donationUrl = env('hellodex-donation-url');
const patronageUrl = env('hellodex-patronage-url');

export const PatronagePane = ({
  className,
  style,
  onRequestClose,
}: PatronagePaneProps): JSX.Element => {
  const { t } = useTranslation('hellodex');
  const state = useHellodexState();
  const colorScheme = useColorScheme();
  const glassyTerrain = useGlassyTerrain();

  const authUser = useAuthUsername();
  const authTitle = findPlayerTitle(authUser, true);

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        glassyTerrain && styles.glassy,
        ['xs', 'sm'].includes(state.containerSize) && styles.verySmol,
        className,
      )}
      style={style}
    >
      <Tooltip
        content={t('patronage.header.closeTooltip')}
        offset={[0, 10]}
        delay={[1000, 50]}
        trigger="mouseenter"
        touch={['hold', 500]}
      >
        <BaseButton
          className={styles.closeButton}
          display="inline"
          aria-label={t('patronage.header.closeTooltip')}
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
              {/* <Svg
                className={styles.icon}
                style={authTitle?.iconColor?.[colorScheme] ? {
                  color: authTitle.iconColor[colorScheme],
                } : undefined}
                src={getResourceUrl(`${authTitle?.icon || 'sparkle'}.svg`)}
                description={authTitle?.iconDescription || 'Sparkle Icon'}
              /> */}
              <MemberIcon
                className={styles.icon}
                member={{
                  name: authUser,
                  showdownUser: true,
                  periods: null,
                }}
                defaultSrc="sparkle"
              />
            </div>

            <Trans
              t={t}
              i18nKey={`patronage.header.${authTitle?.title ? 'supporterTitle' : 'defaultTitle'}`}
              parent="div"
              className={styles.title}
              shouldUnescape
              values={{ name: authUser || 'You' }}
              components={{
                dash: (
                  <span
                    className={styles.thin}
                    style={{ opacity: 0.48 }}
                  >
                    &mdash;
                  </span>
                ),
                thin: <span className={styles.thin} />,
                heart: <i className="fa fa-heart" />,
                supporter: <span style={{ color: authTitle?.color?.[colorScheme] }} />,
              }}
            />

            {/* <div className={styles.title}>
              {authTitle?.title ? (
                <>
                  <span className={styles.thin}>
                    Showdex
                  </span>
                  {' '}
                  <i className="fa fa-heart" />
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
            </div> */}
          </div>

          <div className={styles.supportMethods}>
            <div className={styles.supportMethod}>
              <div className={styles.title}>
                {t('patronage.paypal.name')}
              </div>

              <div className={styles.info}>
                <Trans
                  t={t}
                  i18nKey="patronage.paypal.description"
                  parent="div"
                  className={styles.description}
                  style={{ marginBottom: 16 }}
                  shouldUnescape
                />

                {ShowdexDonorTiers.map(PatronageTierRenderer('DonorTier', colorScheme))}
              </div>

              <div className={styles.buttonContainer}>
                <GradientButton
                  className={styles.button}
                  aria-label={t('patronage.paypal.action.aria')}
                  disabled={!donationUrl?.startsWith('https://')}
                  onPress={() => window.open(donationUrl, '_blank')}
                >
                  <Trans
                    t={t}
                    i18nKey="patronage.paypal.action.label"
                    shouldUnescape
                  />
                </GradientButton>
              </div>
            </div>

            <div className={styles.supportMethod}>
              <div className={styles.title}>
                {t('patronage.patreon.name')}
              </div>

              <div className={styles.info}>
                <Trans
                  t={t}
                  i18nKey="patronage.patreon.description"
                  parent="div"
                  className={styles.description}
                  style={{ marginBottom: 16 }}
                  shouldUnescape
                />

                {ShowdexPatronTiers.map(PatronageTierRenderer('PatronTier', colorScheme, true))}
              </div>

              <div className={styles.buttonContainer}>
                <GradientButton
                  className={styles.button}
                  aria-label={t(`patronage.patreon.${authTitle?.title ? 'supporterAction' : 'defaultAction'}.aria`)}
                  disabled={!patronageUrl?.startsWith('https://')}
                  onPress={() => window.open(patronageUrl, '_blank')}
                >
                  <Trans
                    t={t}
                    i18nKey={`patronage.patreon.${authTitle?.title ? 'supporterAction' : 'defaultAction'}.label`}
                    shouldUnescape
                  />
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      </Scrollable>
    </div>
  );
};
