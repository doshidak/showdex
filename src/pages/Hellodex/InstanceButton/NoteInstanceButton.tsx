/**
 * @file `NoteInstanceButton.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import cx from 'classnames';
import { type BaseButtonProps, type ButtonElement, BaseButton } from '@showdex/components/ui';
import { type NotedexSliceInstance } from '@showdex/redux/store';
import { type InstanceButtonRef } from './InstanceButton';
import styles from './InstanceButton.module.scss';

export interface NoteInstanceButtonProps extends Omit<BaseButtonProps, 'display'> {
  instance: NotedexSliceInstance;
  onRequestRemove?: () => void;
}

export type NoteInstanceButtonRef = InstanceButtonRef;

export const NoteInstanceButton = React.forwardRef<NoteInstanceButtonRef, NoteInstanceButtonProps>(({
  className,
  instance,
  hoverScale = 1,
  activeScale = 0.98,
  onPress,
  onContextMenu,
  onRequestRemove,
  ...props
}: NoteInstanceButtonProps, forwardedRef): React.JSX.Element => {
  const containerRef = React.useRef<ButtonElement>(null);
  const { t } = useTranslation('hellodex');
  const [removalQueued, setRemovalQueued] = React.useState(false);
  const removalRequestTimeout = React.useRef<NodeJS.Timeout>(null);

  const queueRemovalRequest = React.useCallback(() => {
    if (typeof onRequestRemove !== 'function') {
      return;
    }

    if (removalQueued) {
      if (removalRequestTimeout.current) {
        clearTimeout(removalRequestTimeout.current);
        removalRequestTimeout.current = null;
      }

      return void setRemovalQueued(false);
    }

    removalRequestTimeout.current = setTimeout(onRequestRemove, 3000);
    setRemovalQueued(true);
  }, [
    onRequestRemove,
    removalQueued,
  ]);

  React.useImperativeHandle(forwardedRef, () => ({
    ...containerRef.current,
    queueRemoval: queueRemovalRequest,
  }));

  return (
    <BaseButton
      ref={containerRef}
      {...props}
      className={cx(
        styles.container,
        // active && styles.active,
        instance?.saved && styles.saved,
        removalQueued && styles.removing,
        className,
      )}
      display="block"
      hoverScale={hoverScale}
      activeScale={activeScale}
      onPress={removalQueued ? queueRemovalRequest : onPress}
      onContextMenu={(e) => {
        if (removalQueued) {
          queueRemovalRequest();
        }

        onContextMenu(e);
      }}
    >
      <div className={cx(styles.icon, styles.standaloneIcon)}>
        <i className="fa fa-sticky-note" />
      </div>

      <div className={styles.info}>
        <Trans
          t={t}
          i18nKey="common:products.notedex_one"
          parent="div"
          className={styles.format}
          shouldUnescape
        />

        <div className={styles.honkName}>
          {instance?.name || instance?.defaultName || t(
            'instances.notedex.untitledLabel',
            'untitled note',
          )}
        </div>
      </div>

      <BaseButton
        className={styles.removeButton}
        aria-label="Permanently Delete Note"
        hoverScale={1}
        activeScale={0.98}
        disabled={typeof onRequestRemove !== 'function'}
        onPress={queueRemovalRequest}
      >
        <i className="fa fa-times-circle" />
      </BaseButton>

      {
        removalQueued &&
        <div className={styles.undoOverlay}>
          {t('instances.notedex.undoLabel')}
        </div>
      }
    </BaseButton>
  );
});

NoteInstanceButton.displayName = 'NoteInstanceButton';
