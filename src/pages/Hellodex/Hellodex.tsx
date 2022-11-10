import * as React from 'react';
// import useSize from '@react-hook/size';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { BuildInfo } from '@showdex/components/debug';
import { BaseButton, Button, Scrollable } from '@showdex/components/ui';
import {
  useCalcdexSettings,
  useCalcdexState,
  useColorScheme,
  useHellodexSettings,
} from '@showdex/redux/store';
import { getAuthUsername, openUserPopup } from '@showdex/utils/app';
import { env, getResourceUrl } from '@showdex/utils/core';
import { useElementSize, useRoomNavigation } from '@showdex/utils/hooks';
import { BattleRecord } from './BattleRecord';
import { FooterButton } from './FooterButton';
import { InstanceButton } from './InstanceButton';
import { SettingsPane } from './SettingsPane';
import styles from './Hellodex.module.scss';

export interface HellodexProps {
  openCalcdexInstance?: (battleId: string) => void;
}

const packageVersion = `v${env('package-version', '#.#.#')}`;
const donationUrl = env('hellodex-donation-url');
const forumUrl = env('hellodex-forum-url');
const repoUrl = env('hellodex-repo-url');
const releasesUrl = env('hellodex-releases-url');
const bugsUrl = env('hellodex-bugs-url');
const featuresUrl = env('hellodex-features-url');

export const Hellodex = ({
  openCalcdexInstance,
}: HellodexProps): JSX.Element => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  const { size } = useElementSize(contentRef, {
    initialWidth: 400,
    initialHeight: 700,
  });

  const authName = getAuthUsername();

  // globally listen for left/right key presses to mimic native keyboard navigation behaviors
  // (only needs to be loaded once and seems to persist even after closing the Hellodex tab)
  useRoomNavigation();

  const settings = useHellodexSettings();
  const calcdexSettings = useCalcdexSettings();
  const neverOpens = calcdexSettings?.openOnStart === 'never';

  const calcdexState = useCalcdexState();
  const instancesEmpty = !Object.keys(calcdexState).length;

  // const handleInstancePress = (battleId: string) => {
  //   if (typeof app === 'undefined' || !Object.keys(app.rooms || {}).length || !battleId) {
  //     return;
  //   }
  //
  //   // check if the Calcdex tab is already open
  //   const calcdexRoomId = getCalcdexRoomId(battleId);
  //
  //   if (!(calcdexRoomId in app.rooms)) {
  //     return;
  //   }
  //
  //   const calcdexRoom = app.rooms[calcdexRoomId] as unknown as HtmlRoom;
  //
  //   if (calcdexRoom.tabHidden) {
  //     calcdexRoom.tabHidden = false;
  //   }
  //
  //   // no need to call app.topbar.updateTabbar() since app.focusRoomRight() will call it for us
  //   // (app.focusRoomRight() -> app.updateLayout() -> app.topbar.updateTabbar())
  //   app.focusRoomRight(calcdexRoomId);
  // };

  // settings pane visibility
  const [settingsVisible, setSettingsVisible] = React.useState(false);

  const colorScheme = useColorScheme();

  return (
    <div
      className={cx(
        'showdex-module',
        styles.container,
        !!colorScheme && styles[colorScheme],
      )}
    >
      <BuildInfo
        position="top-right"
      />

      <div
        ref={contentRef}
        className={cx(
          styles.content,
          ['xs', 'sm'].includes(size) && styles.verySmol,
        )}
      >
        {
          settingsVisible &&
          <SettingsPane
            inBattle={['xs', 'sm'].includes(size)}
            onRequestClose={() => setSettingsVisible(false)}
          />
        }

        <Svg
          className={styles.showdexIcon}
          description="Showdex Icon"
          src={getResourceUrl('showdex.svg')}
        />

        <div className={styles.topContent}>
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
              Present
            </div>

            <div className={styles.extensionName}>
              Showdex
            </div>
            <div className={styles.extensionVersion}>
              {packageVersion}
            </div>

            {/* <div className={styles.spacer} /> */}
          </div>

          <div className={styles.instancesContainer}>
            <div className={styles.instancesContent}>
              {instancesEmpty ? (
                <div className={styles.empty}>
                  <Svg
                    className={styles.emptyIcon}
                    description={neverOpens ? 'Error Circle Icon' : 'Info Circle Icon'}
                    src={getResourceUrl(neverOpens ? 'error-circle.svg' : 'info-circle.svg')}
                  />

                  <div className={styles.emptyLabel}>
                    {neverOpens ? (
                      <>
                        Calculator will never open based on your configured
                        {' '}
                        <Button
                          className={styles.spectateButton}
                          labelClassName={styles.spectateButtonLabel}
                          label="settings"
                          tooltip="Open Settings"
                          hoverScale={1}
                          absoluteHover
                          onPress={() => setSettingsVisible(true)}
                        />
                        .
                      </>
                    ) : (
                      <>
                        Calculator will automatically open when you

                        {
                          ['always', 'playing'].includes(calcdexSettings?.openOnStart) &&
                          <>
                            {' '}
                            <strong>play</strong>
                          </>
                        }

                        {
                          calcdexSettings?.openOnStart === 'always' &&
                          <>
                            {' '}or
                          </>
                        }

                        {
                          ['always', 'spectating'].includes(calcdexSettings?.openOnStart) &&
                          <>
                            {' '}
                            <Button
                              className={cx(
                                styles.spectateButton,
                                typeof app === 'undefined' && styles.disabled,
                              )}
                              labelClassName={styles.spectateButtonLabel}
                              label="spectate"
                              tooltip="View Active Battles"
                              hoverScale={1}
                              absoluteHover
                              disabled={typeof app === 'undefined'}
                              onPress={() => app.joinRoom('battles', 'battles')}
                            />
                          </>
                        }

                        {' '}a battle.
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <Scrollable className={styles.scrollableInstances}>
                  <div className={styles.instances}>
                    {Object.values(calcdexState).reverse().filter((b) => !!b?.battleId).map(({
                      battleId,
                      format,
                      active,
                      p1,
                      p2,
                    }) => (
                      <InstanceButton
                        key={`Hellodex:InstanceButton:${battleId}`}
                        className={styles.instanceButton}
                        format={format}
                        authName={authName}
                        playerName={p1?.name}
                        opponentName={p2?.name}
                        active={active}
                        // onPress={() => handleInstancePress(battle.battleId)}
                        onPress={() => openCalcdexInstance?.(battleId)}
                      />
                    ))}

                    {
                      settings?.showBattleRecord &&
                      <div className={styles.battleRecordSpacer} />
                    }
                  </div>
                </Scrollable>
              )}
            </div>

            {
              settings?.showBattleRecord &&
              <BattleRecord
                className={styles.battleRecord}
              />
            }
          </div>

          {
            donationUrl?.startsWith('https://') &&
            <div
              className={cx(
                styles.donations,
                settings?.showBattleRecord && styles.withBattleRecord,
              )}
            >
              <BaseButton
                className={styles.donateButton}
                aria-label="Donate via PayPal"
                // disabled={!donationUrl}
                onPress={() => window.open(donationUrl, '_blank')}
              >
                <span className={styles.labelAction}>
                  Donate
                </span>
                <span className={styles.labelPreposition}>
                  via
                </span>
                <span className={styles.labelAction}>
                  PayPal
                </span>
                {/* <Svg
                  className={styles.paypalLogo}
                  description="PayPal"
                  src={getResourceUrl('paypal.svg')}
                  // src={getResourceUrl('donate-mask.svg')}
                /> */}
                {/* <svg width="100%" height="100%">
                  <rect x="0" y="0" width="100%" height="100%" fill="#000000" fillOpacity="1" mask="url(#donateMask)" />

                  <mask id="donateMask">
                    <rect x="0" y="0" width="100%" height="100%" fill="#FFFFFF" />
                    <text x="0" y="50%" fill="#FFFFFF" textAnchor="middle" fontWeight="600">DONATE</text>
                    <text x="25" y="50%" dx="30px" fill="#FFFFFF" textAnchor="middle" fontWeight="300">VIA</text>
                    <Svg src={getResourceUrl('paypal.svg')} />
                  </mask>
                </svg> */}
              </BaseButton>

              <div className={styles.donateFootnote}>
                If you enjoyed this extension,
                please consider donating to help support further development.
              </div>
            </div>
          }
        </div>

        <div className={styles.footer}>
          <div
            className={cx(
              styles.links,
              settingsVisible && styles.settingsVisible,
            )}
          >
            <FooterButton
              className={styles.settingsButton}
              iconAsset={settingsVisible ? 'close-circle.svg' : 'cog.svg'}
              iconDescription={settingsVisible ? 'Close Circle Icon' : 'Cog Icon'}
              label={settingsVisible ? 'Close' : 'Settings'}
              aria-label="Showdex Extension Settings"
              tooltip={`${settingsVisible ? 'Close' : 'Open'} Showdex Settings`}
              onPress={() => setSettingsVisible(!settingsVisible)}
            />

            {
              forumUrl?.startsWith('https://') &&
              <FooterButton
                className={cx(styles.linkButton, styles.forumButton)}
                iconAsset="signpost.svg"
                iconDescription="Signpost Icon"
                label="Smogon"
                aria-label="Smogon Forums Post"
                tooltip="Visit Thread on Smogon Forums"
                // disabled={!forumUrl}
                onPress={() => window.open(forumUrl, '_blank', 'noopener,noreferrer')}
              />
            }

            {
              repoUrl?.startsWith('https://') &&
              <FooterButton
                className={cx(styles.linkButton, styles.repoButton)}
                iconAsset="github-face.svg"
                iconDescription="GitHub Octocat Face Icon"
                label="GitHub"
                aria-label="Source Code on GitHub"
                tooltip="Peep the Code on GitHub"
                // disabled={!repoUrl}
                onPress={() => window.open(repoUrl, '_blank', 'noopener,noreferrer')}
              />
            }

            {
              releasesUrl?.startsWith('https://') &&
              <FooterButton
                className={styles.linkButton}
                iconClassName={styles.sparkleIcon}
                iconAsset="sparkle.svg"
                iconDescription="Sparkle Icon"
                label="New"
                aria-label="Latest Release Notes on GitHub"
                tooltip={`See What's New in ${packageVersion}`}
                // disabled={!releasesUrl}
                onPress={() => window.open(releasesUrl, '_blank', 'noopener,noreferrer')}
              />
            }

            {
              bugsUrl?.startsWith('https://') &&
              <FooterButton
                className={styles.linkButton}
                iconClassName={styles.bugIcon}
                iconAsset="bug.svg"
                iconDescription="Ladybug Icon"
                label="Bugs"
                aria-label="Known Issues/Bugs on GitHub"
                tooltip="See Known Issues"
                // disabled={!bugsUrl}
                onPress={() => window.open(bugsUrl, '_blank', 'noopener,noreferrer')}
              />
            }

            {
              featuresUrl?.startsWith('https://') &&
              <FooterButton
                className={styles.linkButton}
                iconClassName={styles.clipboardIcon}
                iconAsset="clipboard-heart.svg"
                iconDescription="Clipboard Heart Icon"
                label="Todo"
                aria-label="Planned and Upcoming Features on GitHub"
                tooltip="See Upcoming Features"
                // disabled={!featuresUrl}
                onPress={() => window.open(featuresUrl, '_blank', 'noopener,noreferrer')}
              />
            }
          </div>

          <BaseButton
            className={cx(styles.tizeButton, styles.hideWhenSmol)}
            aria-label="Tize.io"
            onPress={() => window.open('https://tize.io', '_blank')}
          >
            <Svg
              className={styles.tizeLogo}
              description="Tize.io Logo"
              src={getResourceUrl('tize.svg')}
            />
          </BaseButton>

          <div className={cx(styles.credits, styles.hideWhenSmol)}>
            created with &hearts; by
            <br />
            sumfuk/doshidak &amp; camdawgboi
          </div>
        </div>
      </div>
    </div>
  );
};
