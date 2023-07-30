import * as React from 'react';
import { type SandwichContextState, SandwichContext } from './SandwichContext';

export interface SandwichProviderProps {
  children?: React.ReactNode;
}

export const SandwichProvider = ({
  children,
}: SandwichProviderProps): JSX.Element => {
  const [ids, setIds] = React.useState<string[]>([]);
  const [activeId, setActiveId] = React.useState<string>(null);

  const value = React.useMemo<SandwichContextState>(() => ({
    ids,
    activeId,

    mount: (id) => {
      if (!id || ids.includes(id)) {
        return false;
      }

      setIds((prevIds) => [...prevIds, id]);

      return true;
    },

    activate: (id, active = true) => {
      if (!id || !ids.includes(id) || (!active && activeId !== id)) {
        return false;
      }

      if (active && activeId === id) {
        return true;
      }

      setActiveId(active ? id : null);

      return true;
    },

    unmount: (id) => {
      if (!id) {
        return;
      }

      setIds((prevIds) => prevIds.filter((prevId) => prevId !== id));

      if (activeId === id) {
        setActiveId(null);
      }
    },
  }), [
    activeId,
    ids,
  ]);

  return (
    <SandwichContext.Provider value={value}>
      {children}
    </SandwichContext.Provider>
  );
};
