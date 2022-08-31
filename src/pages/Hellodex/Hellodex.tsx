import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { useColorScheme } from '@showdex/components/app';
import { BaseButton, Button } from '@showdex/components/ui';
import { openUserPopup } from '@showdex/utils/app';
import { env, getResourceUrl } from '@showdex/utils/core';
import { printBuildInfo } from '@showdex/utils/debug';
import styles from './Hellodex.module.scss';

const forumUrl = env('hellodex-forum-url');
const githubUrl = env('hellodex-github-url');
const donationUrl = env('hellodex-donation-url');

export const Hellodex = (): JSX.Element => {
  const colorScheme = useColorScheme();

  return (
    <div
      className={cx(
        'showdex-module',
        styles.container,
        !!colorScheme && styles[colorScheme],
      )}
    >
      <div className={styles.content}>
        <div className={styles.banner}>
          <div className={styles.authors}>
            <Button
              className={styles.authorButton}
              labelClassName={styles.label}
              label="sumfuk"
              hoverScale={1}
              absoluteHover
              onPress={() => openUserPopup('sumfuk')}
            />

            <div className={styles.ampersand}>
              &amp;
            </div>

            <Button
              className={styles.authorButton}
              labelClassName={styles.label}
              label="camdawgboi"
              hoverScale={1}
              absoluteHover
              onPress={() => openUserPopup('camdawgboi')}
            />
          </div>
          <div className={styles.presents}>
            Presents
          </div>

          <div className={styles.extensionName}>
            Showdex
          </div>
          <div className={styles.extensionVersion}>
            {/* v{env('package-version', '#.#.#')} */}
            {printBuildInfo()?.replace(`${env('package-name', 'lol')}-`, '')}
          </div>

          {/* <div className={styles.spacer} /> */}
        </div>

        <div className={styles.nav}>
          <div className={cx(styles.navButtonContainer, styles.forumPostButton)}>
            <BaseButton
              className={styles.navButton}
              aria-label="Forum Post"
              hoverScale={1.05}
              activeScale={0.97}
              disabled={!forumUrl}
              onPress={() => window.open(forumUrl, '_blank', 'noopener,noreferrer')}
            >
              <span className={styles.label}>
                Forum
              </span>
              <Svg
                className={styles.icon}
                description="Signpost"
                src={getResourceUrl('signpost-rounded.svg')}
              />
              <span className={styles.label}>
                Post
              </span>
            </BaseButton>
          </div>

          <div className={cx(styles.navButtonContainer, styles.githubButton)}>
            <BaseButton
              className={styles.navButton}
              aria-label="GitHub"
              hoverScale={1.05}
              activeScale={0.97}
              disabled={!githubUrl}
              onPress={() => window.open(githubUrl, '_blank', 'noopener,noreferrer')}
            >
              <span className={styles.label}>
                Git
              </span>
              <Svg
                className={styles.icon}
                description="GitHub"
                src={getResourceUrl('github-face.svg')}
              />
              <span className={styles.label}>
                Hub
              </span>
            </BaseButton>
          </div>

          <Svg
            className={styles.showdexIcon}
            description="Showdex Icon"
            src={getResourceUrl('showdex.svg')}
          />
        </div>

        <div className={styles.donationContainer}>
          <p>
            If you enjoyed this extension,
            please consider donating to support further development.
          </p>
          <p>
            We created this as a passion project for the community,
            and we hope it helps you in your battles!
          </p>

          <BaseButton
            className={styles.donateButton}
            aria-label="Donate via PayPal"
            disabled={!donationUrl}
            onPress={() => window.open(donationUrl, '_blank', 'noopener,noreferrer')}
          >
            <span className={styles.labelAction}>
              Donate
            </span>
            <span className={styles.labelPreposition}>
              via
            </span>
            <Svg
              className={styles.paypalLogo}
              description="PayPal"
              src={getResourceUrl('paypal.svg')}
            />
          </BaseButton>
        </div>

        <div className={styles.credits}>
          <BaseButton
            className={styles.tizeButton}
            aria-label="Tize.io"
            onPress={() => window.open('https://tize.io', '_blank')}
          >
            <Svg
              className={styles.tizeLogo}
              description="Tize.io Logo"
              src={getResourceUrl('tize.svg')}
            />
          </BaseButton>

          <div>created with &hearts; by</div>
          <div>sumfuk/doshidak &amp; camdawgboi</div>
        </div>
      </div>
    </div>
  );
};
