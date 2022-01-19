/**
 * ps-models.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-core.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  interface PSModel {
    /**
     * @default []
     */
    subscriptions: PSSubscription[];

    subscribe(listener: () => void): PSSubscription;
    subscribeAndRun(listener: () => void): PSSubscription;
    update(): void;
  }

  interface PSStreamModel<T = string> {
    /**
     * @default []
     */
    subscriptions: PSSubscription[];

    /**
     * @default []
     */
    updates: T[];

    subscribe(listener: (value: T) => void): PSSubscription;
    subscribeAndRun(listener: (value: T) => void): PSSubscription;
    update(value: T): void;
  }

  interface PSSubscription {
    observable: PSModel | PSStreamModel<unknown>;
    listener: (value?: unknown) => void;

    (observable: PSModel | PSStreamModel<unknown>, listener: (value?: unknown) => void): this;

    unsubscribe(): void;
  }
}
