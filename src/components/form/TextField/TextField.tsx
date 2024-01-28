import * as React from 'react';
import cx from 'classnames';
import { Tooltip } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import { type BaseTextFieldProps, BaseTextField } from './BaseTextField';
import { useTextFieldHandle } from './useTextFieldHandle';
import styles from './TextField.module.scss';

export interface TextFieldProps extends BaseTextFieldProps {
  className?: string;
  style?: React.CSSProperties;
  inputClassName?: string;
  tooltip?: React.ReactNode;
  absoluteHover?: boolean;
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(({
  className,
  style,
  inputClassName,
  tooltip,
  absoluteHover,
  input,
  disabled,
  onContextMenu,
  ...props
}: TextFieldProps, forwardedRef): JSX.Element => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  useTextFieldHandle(
    inputRef,
    forwardedRef,
    input,
  );

  // keep track of the active state internally
  // (instead of using meta.active from react-final-form)
  const [active, setActive] = React.useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setActive(true);
    input?.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setActive(false);
    input?.onBlur?.(e);
  };

  const colorScheme = useColorScheme();

  return (
    <Tooltip
      content={tooltip}
      offset={[0, 10]}
      delay={[0, 50]}
      trigger="focusin"
      disabled={disabled && !tooltip}
    >
      <div
        className={cx(
          styles.container,
          !!colorScheme && styles[colorScheme],
          absoluteHover && styles.absoluteHover,
          active && styles.active,
          disabled && styles.disabled,
          className,
        )}
        style={style}
        onContextMenu={onContextMenu || ((e) => {
          e?.preventDefault();
          e?.stopPropagation();
        })}
      >
        <BaseTextField
          inputRef={inputRef}
          {...props}
          inputClassName={cx(
            styles.input,
            inputClassName,
          )}
          input={{
            ...input,
            value: input?.value,
            onFocus: handleFocus,
            onBlur: handleBlur,
          }}
          disabled={disabled}
        />
      </div>
    </Tooltip>
  );
});
