import * as React from 'react';
// import useSize from '@react-hook/size';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { BuildInfo } from '@showdex/components/debug';
import { useSandwich } from '@showdex/components/layout';
import { BaseButton, Button, Scrollable } from '@showdex/components/ui';
import {
  useAuthUsername,
  useCalcdexSettings,
  useCalcdexState,
  useColorScheme,
  useGlassyTerrain,
  useHellodexSettings,
  useHellodexState,
} from '@showdex/redux/store';
import { findPlayerTitle } from '@showdex/utils/app';
import { env, getResourceUrl } from '@showdex/utils/core';
import { useRoomNavigation } from '@showdex/utils/hooks';
import { openUserPopup } from '@showdex/utils/host';
import { BattleRecord } from './BattleRecord';
import { FooterButton } from './FooterButton';
import { GradientButton } from './GradientButton';
import { InstanceButton } from './InstanceButton';
import { PatronagePane } from './PatronagePane';
import { SettingsPane } from './SettingsPane';
import { useHellodexSize } from './useHellodexSize';
import styles from './Hellodex.module.scss';

export interface HellodexProps {
  openCalcdexInstance?: (battleId: string) => void;
  openHonkdexInstance?: (instanceId?: string) => void;
  removeHonkdexInstances?: (...instanceIds: string[]) => void;
}

const packageVersion = `v${env('package-version', 'X.X.X')}`;
const versionSuffix = env('package-version-suffix');
const buildDate = env('build-date');
const buildSuffix = env('build-suffix');
const forumUrl = env('hellodex-forum-url');
const repoUrl = env('hellodex-repo-url');
const communityUrl = env('hellodex-community-url');

export const Hellodex = ({
  openCalcdexInstance,
  openHonkdexInstance,
  removeHonkdexInstances,
}: HellodexProps): JSX.Element => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  useHellodexSize(contentRef);

  const authName = useAuthUsername();
  const authTitle = findPlayerTitle(authName, true);

  // globally listen for left/right key presses to mimic native keyboard navigation behaviors
  // (only needs to be loaded once and seems to persist even after closing the Hellodex tab)
  useRoomNavigation();

  const colorScheme = useColorScheme();
  const glassyTerrain = useGlassyTerrain();
  const settings = useHellodexSettings();
  const calcdexSettings = useCalcdexSettings();

  const state = useHellodexState();
  const calcdexState = useCalcdexState();

  const neverOpens = calcdexSettings?.openOnStart === 'never';
  const instancesEmpty = !Object.keys(calcdexState).length;

  // donate button visibility
  const showDonateButton = settings?.showDonateButton;

  // pane visibilities
  const {
    active: patronageVisible,
    requestOpen: openPatronagePane,
    notifyClose: closePatronagePane,
  } = useSandwich();

  const {
    active: settingsVisible,
    requestOpen: openSettingsPane,
    notifyClose: closeSettingsPane,
  } = useSandwich();

  const toggleSettingsPane = settingsVisible ? closeSettingsPane : openSettingsPane;

  return (
    <div
      className={cx(
        'showdex-module',
        styles.container,
        !!colorScheme && styles[colorScheme],
        glassyTerrain && styles.glassy,
      )}
    >
      <BuildInfo
        position="top-right"
      />

      <div
        ref={contentRef}
        className={cx(
          styles.content,
          ['xs', 'sm'].includes(state.containerSize) && styles.verySmol,
        )}
      >
        {
          patronageVisible &&
          <PatronagePane
            onRequestClose={closePatronagePane}
          />
        }

        {
          settingsVisible &&
          <SettingsPane
            onRequestClose={closeSettingsPane}
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
                label="BOT Keith"
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
                label="analogcam"
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
              <span className={styles.extensionVersionSuffix}>
                {!!versionSuffix && `-${versionSuffix}`}
                {__DEV__ && !!buildDate && `-b${buildDate.slice(-4)}`}
                {!!buildSuffix && `-${buildSuffix}`}
                {__DEV__ && '-dev'}
              </span>
            </div>
          </div>

          <div className={styles.instancesContainer}>
            <div
              className={cx(
                styles.instancesContent,
                !showDonateButton && styles.hiddenDonation,
              )}
            >
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
                          onPress={openSettingsPane}
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

                  <div className={styles.divider}>
                    <div className={styles.dividerLine} />
                    <div className={styles.dividerLabel}>
                      or
                    </div>
                    <div className={styles.dividerLine} />
                  </div>

                  <GradientButton
                    className={styles.honkButton}
                    aria-label="Create New Honkdex"
                    hoverScale={1}
                    onPress={() => openHonkdexInstance?.()}
                  >
                    <span>
                      {/* Create{' '} */}
                      <strong>New</strong>
                    </span>
                    <i
                      className="fa fa-car"
                      style={{ padding: '0 8px' }}
                    />
                    <strong>Honk</strong>
                    <span>dex</span>
                  </GradientButton>
                </div>
              ) : (
                <Scrollable className={styles.scrollableInstances}>
                  <div className={styles.instances}>
                    <GradientButton
                      className={cx(styles.instanceButton, styles.newHonkButton)}
                      display="block"
                      aria-label="New Honkdex"
                      hoverScale={1}
                      onPress={() => openHonkdexInstance()}
                    >
                      <i
                        className="fa fa-plus"
                        style={{ fontSize: 10, lineHeight: 11 }}
                      />
                      <i
                        className="fa fa-car"
                        style={{ padding: '0 8px' }}
                      />
                      <strong>Honk</strong>
                      <span>dex</span>
                    </GradientButton>

                    {Object.values(calcdexState).reverse().filter((b) => !!b?.battleId).map((instance) => (
                      <InstanceButton
                        key={`Hellodex:InstanceButton:${instance.battleId}`}
                        className={styles.instanceButton}
                        instance={instance}
                        authName={authName}
                        onPress={() => (
                          instance.operatingMode === 'standalone'
                            ? openHonkdexInstance
                            : openCalcdexInstance
                        )?.(instance.battleId)}
                        onRequestRemove={() => removeHonkdexInstances?.(instance.battleId)}
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
            showDonateButton &&
            <div
              className={cx(
                styles.donations,
                settings?.showBattleRecord && styles.withBattleRecord,
              )}
            >
              <GradientButton
                className={styles.donateButton}
                aria-label="Support Showdex"
                onPress={openPatronagePane}
              >
                {authTitle?.title ? (
                  <i
                    className="fa fa-heart"
                    style={{ padding: '0 8px' }}
                  />
                ) : (
                  <>
                    <strong>Show</strong>
                    <span>dex</span>
                    <strong style={{ margin: '0 7px' }}>
                      Some
                    </strong>
                    <strong>Love</strong>
                  </>
                )}
              </GradientButton>

              <div
                className={cx(
                  styles.donateFootnote,
                  !!authTitle?.title && styles.withTitle,
                )}
              >
                {authTitle?.title ? (
                  <>Thanks for supporting Showdex!</>
                ) : (
                  <>
                    If you enjoyed this extension,
                    please consider supporting further development.
                  </>
                )}
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
              className={cx(styles.linkItem, styles.settingsButton)}
              labelClassName={styles.linkButtonLabel}
              iconAsset={settingsVisible ? 'close-circle.svg' : 'cog.svg'}
              iconDescription={settingsVisible ? 'Close Circle Icon' : 'Cog Icon'}
              label={settingsVisible ? 'Close' : 'Settings'}
              aria-label="Showdex Extension Settings"
              tooltip={`${settingsVisible ? 'Close' : 'Open'} Showdex Settings`}
              onPress={toggleSettingsPane}
            />

            {
              (forumUrl || repoUrl || communityUrl).startsWith('https://') &&
              <div
                className={cx(
                  styles.linkItem,
                  styles.linkSeparator,
                )}
              />
            }

            {
              forumUrl?.startsWith('https://') &&
              <FooterButton
                className={cx(styles.linkItem, styles.linkButton)}
                iconClassName={styles.signpostIcon}
                labelClassName={styles.linkButtonLabel}
                iconAsset="signpost.svg"
                iconDescription="Signpost Icon"
                label="Smogon"
                aria-label="Showdex Thread on Smogon Forums"
                tooltip="Discuss on Smogon Forums"
                onPress={() => window.open(forumUrl, '_blank', 'noopener,noreferrer')}
              />
            }

            {
              repoUrl?.startsWith('https://') &&
              <FooterButton
                className={cx(styles.linkItem, styles.linkButton)}
                labelClassName={styles.linkButtonLabel}
                iconAsset="github-face.svg"
                iconDescription="GitHub Octocat Icon"
                label="GitHub"
                aria-label="Showdex Source Code on GitHub"
                tooltip="Peep the Source Code on GitHub"
                onPress={() => window.open(repoUrl, '_blank', 'noopener,noreferrer')}
              />
            }

            {
              communityUrl?.startsWith('https://') &&
              <FooterButton
                className={cx(styles.linkItem, styles.linkButton)}
                labelClassName={styles.linkButtonLabel}
                iconAsset="discord.svg"
                iconDescription="Discord Clyde Icon"
                label="Discord"
                aria-label="Official Showdex Discord"
                tooltip="Join Our Discord Community!"
                onPress={() => window.open(communityUrl, '_blank', 'noopener,noreferrer')}
              />
            }

            {/* {
              releasesUrl?.startsWith('https://') &&
              <FooterButton
                className={cx(styles.linkItem, styles.linkButton)}
                iconClassName={styles.sparkleIcon}
                labelClassName={styles.linkButtonLabel}
                iconAsset="sparkle.svg"
                iconDescription="Sparkle Icon"
                label="New"
                aria-label="Latest Release Notes on GitHub"
                tooltip={`See What's New in ${packageVersion}`}
                onPress={() => window.open(releasesUrl, '_blank', 'noopener,noreferrer')}
              />
            } */}

            {/* {
              bugsUrl?.startsWith('https://') &&
              <FooterButton
                className={cx(styles.linkItem, styles.linkButton)}
                iconClassName={styles.bugIcon}
                labelClassName={styles.linkButtonLabel}
                iconAsset="bug.svg"
                iconDescription="Ladybug Icon"
                label="Bugs"
                aria-label="Known Issues/Bugs on GitHub"
                tooltip="See Known Issues"
                onPress={() => window.open(bugsUrl, '_blank', 'noopener,noreferrer')}
              />
            } */}

            {/* {
              featuresUrl?.startsWith('https://') &&
              <FooterButton
                className={cx(styles.linkItem, styles.linkButton)}
                iconClassName={styles.clipboardIcon}
                labelClassName={styles.linkButtonLabel}
                iconAsset="clipboard-heart.svg"
                iconDescription="Clipboard Heart Icon"
                label="Todo"
                aria-label="Planned and Upcoming Features on GitHub"
                tooltip="See Upcoming Features"
                onPress={() => window.open(featuresUrl, '_blank', 'noopener,noreferrer')}
              />
            } */}
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
            created with <i className="fa fa-heart" /> by
            <br />
            BOT Keith &amp; analogcam
          </div>
        </div>
      </div>
    </div>
  );
};
