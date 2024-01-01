import * as React from 'react';
import Svg from 'react-inlinesvg';
import { QRCodeCanvas } from 'qrcode.react';
import cx from 'classnames';
import LzString from 'lz-string';
import { type ErrorBoundaryComponentProps, BuildInfo } from '@showdex/components/debug';
import { Button, Scrollable } from '@showdex/components/ui';
import { useCalcdexBattleState } from '@showdex/redux/store';
import { getResourceUrl, nonEmptyObject } from '@showdex/utils/core';
import { sanitizeStackTrace } from '@showdex/utils/debug';
import { dehydrateCalcdex } from '@showdex/utils/hydro';
import styles from './CalcdexErrorBoundary.module.scss';

export interface CalcdexErrorBoundaryProps extends ErrorBoundaryComponentProps {
  className?: string;
  style?: React.CSSProperties;
  battleId?: string;
}

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

  const dehydratedState = React.useMemo(
    () => (nonEmptyObject(state) && dehydrateCalcdex(state, error)) || null,
    [error, state],
  );

  const [showState, setShowState] = React.useState(false);
  const [compressed, setCompressed] = React.useState<string>(null);

  React.useEffect(() => {
    if (compressed) {
      return;
    }

    setCompressed(LzString.compressToBase64(dehydratedState));
  }, [
    compressed,
    dehydratedState,
  ]);

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

          <Scrollable className={styles.errorStackContainer}>
            <div className={styles.errorStack}>
              {sanitizeStackTrace(error)}
            </div>
          </Scrollable>

          {
            !!compressed &&
            <>
              <div className={styles.qrDescription}>
                <p>
                  <strong>Please tell us about the problem.</strong>
                </p>

                <p>
                  We have created an error report contained within the QR code below
                  that you can screenshot and send to help us improve Showdex.
                </p>

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
                    {dehydratedState}
                  </div>
                </div>
              }

              <div className={styles.qrCodeContainer}>
                <QRCodeCanvas
                  value={compressed}
                  size={325}
                  // fgColor={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                  fgColor="#000000"
                  bgColor="transparent"
                />
              </div>
            </>
          }
        </div>
      </Scrollable>
    </div>
  );
};
