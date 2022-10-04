import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import cx from 'classnames';
import type { SwitchProps } from './Switch';
import styles from './Switch.module.scss';

export interface SwitchTrackProps extends Pick<SwitchProps, 'input'> {
  className?: string;
  style?: React.CSSProperties;
  backdropClassName?: string;
  backdropStyle?: React.CSSProperties;
  trackClassName?: string;
  trackStyle?: React.CSSProperties;
  name?: string;
  width?: number;
  children?: React.ReactNode;
}

export const SwitchTrack = ({
  className,
  style,
  backdropClassName,
  backdropStyle,
  trackClassName,
  trackStyle,
  name,
  width,
  // input,
  // disabled,
  children,
}: SwitchTrackProps): JSX.Element => {
  const { setNodeRef } = useDroppable({
    id: `Switch:${name || '???'}:SwitchTrack:Droppable`,
  });

  return (
    <span
      className={cx(
        styles.track,
        className,
      )}
      style={{
        ...style,
        width,
      }}
    >
      <span
        className={cx(
          styles.backdrop,
          backdropClassName,
        )}
        style={backdropStyle}
      >
        <span className={styles.innerBackdrop} />
      </span>

      <span
        ref={setNodeRef}
        className={cx(
          styles.trackContainer,
          trackClassName,
        )}
        style={trackStyle} // confusing prop names, I know lol
      >
        {children}
      </span>
    </span>
  );
};
