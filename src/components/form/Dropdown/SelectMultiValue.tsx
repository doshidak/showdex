import * as React from 'react';
import cx from 'classnames';
import type { GroupBase, MultiValueProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import styles from './Dropdown.module.scss';

/* eslint-disable @typescript-eslint/indent */

export const SelectMultiValue = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  components: {
    Container,
    Label,
    Remove,
  },
  data,
  cropWithEllipsis,
  isFocused,
  isDisabled,
  removeProps,
  selectProps,
  innerProps,
  children,
}: MultiValueProps<Option, Multi, Group>): JSX.Element => (
  <Container
    innerProps={{
      className: cx(
        styles.multiValue,
        isDisabled && styles.disabled,
        className,
      ),
      ...innerProps,
    }}
    selectProps={selectProps}
    data={data}
  >
    <Label
      innerProps={{
        className: cx(
          styles.valueLabel,
          cropWithEllipsis && styles.crop,
          className,
        ),
      }}
      selectProps={selectProps}
      data={data}
    >
      {children}
    </Label>

    <Remove
      innerProps={{
        className: cx(
          styles.remove,
          isFocused && styles.focused,
          className,
        ),
        ...removeProps,
      }}
      selectProps={selectProps}
      data={data}
    />
  </Container>
);

/* eslint-enable @typescript-eslint/indent */
