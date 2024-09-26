import * as React from 'react';
import Svg from 'react-inlinesvg';
// import { QRCodeCanvas } from 'qrcode.react';
import cx from 'classnames';
import FileSaver from 'file-saver';
import LzString from 'lz-string';
import { GradientButton } from '@showdex/components/app';
import { type ErrorBoundaryComponentProps, BuildInfo } from '@showdex/components/debug';
import {
  type BadgeInstance,
  Badge,
  BaseButton,
  Button,
  Scrollable,
  Tooltip,
} from '@showdex/components/ui';
import { useCalcdexBattleState } from '@showdex/redux/store';
import {
  env,
  getResourceUrl,
  nonEmptyObject,
  writeClipboardText,
} from '@showdex/utils/core';
import { logger, sanitizeStackTrace, wtf } from '@showdex/utils/debug';
// import { dehydrateCalcdex } from '@showdex/utils/hydro';
import styles from './CalcdexErrorBoundary.module.scss';

export interface CalcdexErrorBoundaryProps extends ErrorBoundaryComponentProps {
  className?: string;
  style?: React.CSSProperties;
  battleId?: string;
}

const l = logger('@showdex/components/calc/CalcdexErrorBoundary');

/**
 * Renders the error stack & dehydrated Calcdex state (as a QR Code) to the user.
 *
 * * Meant to be used as the `component` prop for `ErrorBoundary`.
 *   - You'll also need to pass `battleId` to `ErrorBoundary`, which will pass it to this component.
 *
 * @since 1.0.3
 */
export const CalcdexErrorBoundary = ({
  className,
  style,
  error,
  battleId,
}: CalcdexErrorBoundaryProps): JSX.Element => {
  // const colorScheme = useColorScheme();

  const state = useCalcdexBattleState(battleId);
  const calcdexName = state?.operatingMode === 'standalone' ? 'Honkdex' : 'Calcdex';

  const sanitizedStack = React.useMemo(() => sanitizeStackTrace(error), [error]);
  const payload = React.useMemo(() => (nonEmptyObject(state) && ({
    error: {
      stack: sanitizedStack,
      name: error?.name,
      message: error?.message,
      __wtf: wtf(error),
    },

    env: {
      dict: env.dict(),
      navigator: { userAgent: global.navigator?.userAgent || '???', __wtf: wtf(global.navigator) },
      window: {
        // obvi if `global` isn't global, then we're not in Kansas uh I mean JS
        location: { href: global.window?.location?.href, __wtf: wtf(global.window?.location) },
        app: {
          fragment: global.window?.app?.fragment,
          initialFragment: global.window?.app?.initialFragment,
          __wtf: wtf(global.window?.app),
        },
        Dex: { gen: global.window?.Dex?.gen, __wtf: wtf(global.window?.Dex) },
        __wtf: wtf(global.window),
        __SHOWDEX_INIT: global.window?.__SHOWDEX_INIT,
      },
    },

    state,
    dumper: l.scope,
    created: new Date().toISOString(),
  })) || null, [
    error,
    state,
    sanitizedStack,
  ]);

  const copiedBadgeRef = React.useRef<BadgeInstance>(null);
  const copiedFailedBadgeRef = React.useRef<BadgeInstance>(null);
  const [showState, setShowState] = React.useState(false);

  const handlePayloadCopy = () => void (async () => {
    try {
      await writeClipboardText(JSON.stringify(payload));
      copiedBadgeRef.current?.show();
    } catch (err) {
      if (__DEV__) {
        l.error(
          'Failed to write error payload to clipboard:',
          '\n', err,
          '\n', '(You will only see this error on development.)',
        );
      }

      copiedFailedBadgeRef.current?.show();
    }
  })();

  const handlePayloadDownload = () => {
    const compressed = LzString.compressToUint8Array(JSON.stringify(payload));
    const blob = new Blob([compressed]);

    FileSaver.saveAs(blob, [
      env('build-name'),
      calcdexName.toLowerCase(),
      [
        state?.battleId || state?.format,
        `t${new Date(payload.created).valueOf().toString(16).toUpperCase()}`,
      ].filter(Boolean).join('-'),
      'bin',
      'lz',
    ].filter(Boolean).join('.'));
  };

  return (
    <div
      className={cx(
        styles.container,
        // !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <Scrollable className={styles.contentContainer}>
        <BuildInfo
          position="top-right"
        />

        <div className={styles.content}>
          <div className={styles.header}>
            <Svg
              className={styles.icon}
              description="Error Icon"
              src={getResourceUrl('error-circle-outline.svg')}
            />

            <div className={styles.title}>
              {calcdexName}
            </div>

            {
              !!state?.format &&
              <div className={styles.battleInfo}>
                <span className={styles.format}>
                  {state.format}
                </span>

                {
                  state.operatingMode === 'battle' &&
                  <>
                    <br />
                    <span className={styles.playerName}>
                      {state.p1?.name || 'Player 1'}
                    </span>
                    <span className={styles.versus}>
                      vs
                    </span>
                    <span className={styles.playerName}>
                      {state.p2?.name || 'Player 2'}
                    </span>
                  </>
                }
              </div>
            }

            <div className={styles.subtitle}>
              {calcdexName} has failed <em>successfully</em> and needs to close.
              <br />
              We are sorry for the inconvenience.
            </div>

            {/* <div className={styles.description}>
              If you were in the middle of something,
              <br />
              the information you were working on might be lost.
            </div> */}
          </div>

          <Tooltip
            content="Copy Error Report to Clipboard"
            delay={[1000, 50]}
            trigger="mouseenter"
            touch={['hold', 500]}
          >
            <BaseButton
              className={styles.errorStackButton}
              display="block"
              aria-label="Copy Error Report to Clipboard"
              hoverScale={1}
              activeScale={0.98}
              onPress={handlePayloadCopy}
            >
              <Scrollable className={styles.errorStackContainer}>
                <div className={styles.errorStack}>
                  {sanitizedStack || error}
                </div>
              </Scrollable>

              <Badge
                ref={copiedBadgeRef}
                className={styles.copiedBadge}
                label="Copied!"
                color="green"
              />

              <Badge
                ref={copiedFailedBadgeRef}
                className={styles.copiedBadge}
                label="Failed"
                color="red"
              />
            </BaseButton>
          </Tooltip>

          {
            !!payload &&
            <>
              <div className={styles.description}>
                <p>
                  <strong>Please tell us about the problem.</strong>
                </p>

                <p>
                  We have created an error report contained within the generated file below
                  that you can download and send to help us improve Showdex.
                </p>
              </div>

              <div className={styles.downloadContainer}>
                <Tooltip
                  content="Save Error Report to File"
                  delay={[1000, 50]}
                  trigger="mouseenter"
                  touch={['hold', 500]}
                >
                  <GradientButton
                    className={cx(styles.downloadButton, styles.overrideShadow)}
                    aria-label="Download Error Report"
                    hoverScale={1}
                    onPress={handlePayloadDownload}
                  >
                    <span className={styles.verbLabel}>
                      Download
                    </span>
                    Report
                  </GradientButton>
                </Tooltip>
              </div>

              <div className={styles.description}>
                <p>
                  To {showState ? 'hide' : 'see'} what data this error report contains,
                  {' '}
                  <Button
                    className={styles.showButton}
                    label="click here"
                    tooltip={`${showState ? 'Hide' : 'Show'} Error Report`}
                    highlight
                    absoluteHover
                    onPress={() => setShowState(!showState)}
                  />
                  .
                </p>
              </div>

              {
                showState &&
                <div className={cx(styles.errorStackContainer, styles.reportContents)}>
                  <div className={styles.dehydratedState}>
                    {JSON.stringify(payload, null, 2)}
                  </div>
                </div>
              }

              {/* <div className={styles.qrCodeContainer}>
                <QRCodeCanvas
                  value={compressed}
                  size={325}
                  // fgColor={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                  fgColor="#000000"
                  bgColor="transparent"
                />
              </div> */}
            </>
          }
        </div>
      </Scrollable>
    </div>
  );
};
