import * as React from 'react';
import { useRandomUuid } from '@showdex/utils/hooks';
import { SandwichContext } from './SandwichContext';

/**
 * Interface available to Consumers of the `SandwichContext`.
 *
 * @since 1.1.6
 */
export interface SandwichHookConsumables {
  id: string;
  active: boolean;
  requestOpen: () => void;
  notifyClose: () => void;
}

/**
 * Component visibility hook.
 *
 * * Parent `SandwichProvider` makes sure there's only one component visible at a time.
 *   - Primarily made to deal with all these custom tooltips stacking on top of each other.
 *   - e.g., You can open both the `PokeFormeTooltip` & `PokeTypeField` at the same time! LOL
 *   - (hence the name hehehe -- ifykyk)
 * * This does the IDing & mount/unmount handling for you.
 *   - Just plug & chug!
 * * Read `active` & when the user requests to open, call `requestOpen()`.
 *   - When they're done, call `notifyClose()`.
 *   - ez!
 *
 * @since 1.1.6
 */
export const useSandwich = (): SandwichHookConsumables => {
  const {
    // ids,
    activeId,
    mount,
    activate,
    unmount,
  } = React.useContext(SandwichContext);

  const id = useRandomUuid();
  const [regStatus, setRegStatus] = React.useState<'pending' | boolean>('pending');

  React.useEffect(() => {
    if (!id || regStatus !== 'pending') {
      return setRegStatus(false);
    }

    setRegStatus(mount(id));

    return () => unmount(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const output = React.useMemo<SandwichHookConsumables>(() => ({
    id,
    active: activeId === id,

    requestOpen: () => activate(id, true),
    notifyClose: () => activate(id, false),
  }), [
    activate,
    activeId,
    id,
  ]);

  return output;
};
