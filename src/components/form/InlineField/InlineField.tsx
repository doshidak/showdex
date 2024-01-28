import * as React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import cx from 'classnames';
import type { FieldRenderProps } from 'react-final-form';
import { useColorScheme } from '@showdex/redux/store';
import { nonEmptyObject } from '@showdex/utils/core';
import styles from './InlineField.module.scss';

export interface InlineFieldProps extends FieldRenderProps<string, HTMLSpanElement> {
  className?: string;
  style?: React.CSSProperties;
  tabIndex?: number,
  label?: string;
  hint?: string;
  disabled?: boolean;
  onContextMenu?: (event: React.MouseEvent<HTMLSpanElement>) => void;
}

/**
 * Inline text input.
 *
 * * Renders only a single `span` element, so most of its main styling (`font-family`, `font-size`, etc.)
 *   will be inherited from its parent.
 * * Displays `'inline-block'`, so it can fit seamlessly between words in a paragraph, for instance.
 *   - UI elements that indicate the hover and active states do not take up any space on the DOM.
 *   - (If you're wondering how, they're absolutely positioned!)
 * * Black magic involves using the `contentEditable` prop, which allows you to edit a DOM element.
 *   - Combined with the `'textbox'` ARIA `role`, we mimic editable inline text (browser does most of the layout work, thankfully).
 *   - By default, the `spellCheck` is enabled for editable content, so we disable that shit to hide all potential gross underlines.
 * * Finally, the `suppressContentEditableWarning` prop is enabled to prevent React flooding the console with warnings.
 *   - React no longer has control over the element's inner HTML (i.e., its children) once `contentEditable` is enabled.
 *   - Since we render `initialValue.current` as the only child, React gets very angry until we acknowledge that we know what we're doing.
 *   - Luckily for us, I don't! c:
 * * Fun fact: this is another component imported from our now dedge `@tizeio/web` project.
 *
 * @since 1.2.0
 */
export const InlineField = React.forwardRef<HTMLSpanElement, InlineFieldProps>(({
  className,
  style,
  tabIndex = 0,
  label,
  hint,
  input,
  meta,
  disabled,
  onContextMenu,
}: InlineFieldProps, forwardedRef): JSX.Element => {
  const colorScheme = useColorScheme();
  const containerRef = React.useRef<HTMLSpanElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => containerRef.current,
  );

  const [activeState, setActiveState] = React.useState(meta?.active || false);
  const initialValue = React.useRef(input?.value);

  const usingForm = nonEmptyObject(meta);
  const active = usingForm ? meta.active : activeState;
  // const hasError = false; /** @todo import `hasFormError()` from `@tizeio/web/utils/form` */

  const handleFocus = (
    event: React.FocusEvent<HTMLSpanElement>,
  ) => {
    if (!usingForm) {
      setActiveState(true);
    }

    input?.onFocus?.(event);
  };

  const handleBlur = (
    event: React.FocusEvent<HTMLSpanElement>,
  ) => {
    if (!usingForm) {
      setActiveState(false);
    }

    input?.onBlur?.(event);
  };

  // handle key presses
  useHotkeys([
    'esc',
    'enter',
    'shift+enter',
  ].join(', '), (e, handler) => {
    if (!containerRef.current) {
      return;
    }

    e?.preventDefault?.();
    e?.stopImmediatePropagation?.();

    switch (handler.key) {
      // revert to the initial value
      case 'esc': {
        containerRef.current.innerText = initialValue.current;
        input?.onChange(initialValue.current);

        break;
      }

      // update the initial value (only when there are no validation errors)
      case 'enter': {
        // if (hasError) {
        //   return; // also prevents the field from blurring
        // }

        initialValue.current = containerRef.current.innerText?.replace(/\n/g, '') || '';
        input?.onChange(initialValue.current);

        break;
      }

      default: {
        break;
      }
    }

    containerRef.current.blur();
  }, {
    enabled: !disabled && active,
    enableOnContentEditable: true,
  }, [
    active,
    disabled,
    // hasError,
    initialValue,
    input,
  ]);

  React.useEffect(() => {
    const currentText = containerRef.current?.innerText?.replace(/\n/g, '') || '';

    if (active && currentText === hint) {
      containerRef.current.innerText = '';
    }

    if (!active && !currentText && containerRef.current) {
      containerRef.current.innerText = hint;
    }
  }, [
    active,
    hint,
    input,
  ]);

  return (
    <span
      ref={containerRef}
      role="textbox"
      className={cx(
        styles.container,
        active && styles.active,
        (!input?.value && !active) && styles.hint,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
      tabIndex={disabled ? -1 : tabIndex}
      aria-label={label}
      contentEditable={!disabled}
      suppressContentEditableWarning
      spellCheck={false}
      onInput={(e) => input?.onChange(e?.currentTarget?.innerText)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onContextMenu={onContextMenu || ((e) => {
        e?.preventDefault();
        e?.stopPropagation();
      })}
    >
      {initialValue.current}
    </span>
  );
});
