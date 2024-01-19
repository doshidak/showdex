import { type ShowContextMenuParams, useContextMenu as useContexifyMenu } from 'react-contexify';
// import { useRandomUuid } from '@showdex/utils/hooks';

export interface ContextMenuHookValue {
  // id: string;
  show: (params: ShowContextMenuParams) => void;
  hideAll: () => void;
  hideAfter: (call: () => void) => () => void;
}

/**
 * Nice wrapper around `react-contexify`'s `useContextMenu()` that auto-generates the required `id` prop for you.
 *
 * * ~~All you gotta do is pass the `id` to the corresponding `ContextMenu` component, then use the `show()` & `hideAll()`
 *   functions as you normally would.~~
 * * Jk, it's better to just pass an ID in every time to `show()` as you should only use one instance of this hook.
 *   - This hook is now just useful for its `hideAfter()` function wrapper lol.
 *
 * @since 1.2.3
 */
export const useContextMenu = <TProps>(
  props?: TProps,
): ContextMenuHookValue => {
  // const id = useRandomUuid();

  const {
    show,
    hideAll,
  } = useContexifyMenu({
    // id,
    props,
  });

  return {
    // id,
    show,
    hideAll,
    hideAfter: (call) => () => {
      hideAll();
      call?.();
    },
  };
};
