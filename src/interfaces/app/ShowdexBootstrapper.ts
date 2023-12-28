import { type RootStore } from '@showdex/redux/store';

/**
 * Setup function that runs during Showdex initialization.
 *
 * @since 0.1.3
 */
export type ShowdexBootstrapper = (
  store?: RootStore,
  data?: string,
  roomId?: string,
) => void;
