import * as React from 'react';
import type { FieldInputProps } from 'react-final-form';
import type { TextFieldElement, TextFieldValue } from './BaseTextField';

/* eslint-disable @typescript-eslint/indent */

export const useTextFieldHandle = <
  FieldValue extends TextFieldValue = string,
  T extends TextFieldElement = HTMLInputElement,
>(
  ref: React.MutableRefObject<T>,
  forwardedRef: React.ForwardedRef<T>,
  input: FieldInputProps<FieldValue, T>,
): void => React.useImperativeHandle(forwardedRef, () => ({
  ...ref?.current,

  focus: (options?: FocusOptions) => {
    if (typeof ref?.current?.focus === 'function') {
      ref.current.focus(options);

      // place the cursor at the end of the value
      // (logic will be placed at end of stack by setTimeout, otherwise, cursor may not be moved at all!)
      setTimeout(() => {
        const selectionIndex = input?.value?.toString?.()?.length || 0;

        if ('selectionStart' in ref.current && 'selectionEnd' in ref.current) {
          ref.current.selectionStart = selectionIndex;
          ref.current.selectionEnd = selectionIndex;
        }
      });
    }
  },
}), [
  input?.value,
  ref,
]);

/* eslint-enable @typescript-eslint/indent */
