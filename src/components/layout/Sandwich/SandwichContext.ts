import * as React from 'react';

/**
 * State stored in a `SandwichContext`.
 *
 * @since 1.1.6
 */
export interface SandwichContextState {
  /**
   * IDs of registered components.
   *
   * * Components provide this value through the hook that consumes the `SandwichContext`.
   * * These don't need to be unique app-wide; they only need to be unique to the parent `SandwichProvider`.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.1.6
   */
  ids: string[];

  /**
   * ID of a registered component that's currently open.
   *
   * * Components should check this ID against their own to determine if they should be open.
   * * Falsy values indicate that nothing is open.
   *
   * @default null
   * @since 1.1.6
  */
  activeId: string;

  mount: (id: string) => boolean;
  activate: (id: string, active?: boolean) => boolean;
  unmount: (id: string) => void;
}

export const SandwichContext = React.createContext<SandwichContextState>({
  ids: [],
  activeId: null,
  mount: () => false,
  activate: () => false,
  unmount: () => {},
});
