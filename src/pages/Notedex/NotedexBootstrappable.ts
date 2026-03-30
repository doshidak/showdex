/**
 * @file `NotedexBootstrappable.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

/* eslint-disable max-classes-per-file */

import { v4 as uuidv4 } from 'uuid';
import { notedexSlice } from '@showdex/redux/store';
import { logger } from '@showdex/utils/debug';
import { purgeNotesDb } from '@showdex/utils/storage';
import { BootdexBootstrappable } from '../Bootdex/BootdexBootstrappable';

export type NotedexBootstrappableLike =
  & Omit<typeof NotedexBootstrappable, 'constructor'>
  & (new (instanceId?: string) => NotedexBootstrappable);

const l = logger('@showdex/pages/Notedex/NotedexBootstrappable');

export const MixinNotedexBootstrappable = <
  TBootstrappable extends typeof BootdexBootstrappable,
>(
  Bootstrappable: TBootstrappable,
) => {
  abstract class NotedexBootstrappableMixin extends (Bootstrappable as typeof BootdexBootstrappable & InstanceType<TBootstrappable>) {
    public readonly instanceId: string;

    public static get rootState() {
      return NotedexBootstrappableMixin.Adapter?.rootState?.notedex;
    }

    public static generateInstanceId(): string {
      let instanceId = uuidv4();

      while (instanceId in (this.rootState?.notes || {})) {
        instanceId = uuidv4();
      }

      return instanceId;
    }

    public constructor(
      instanceId = NotedexBootstrappableMixin.generateInstanceId(),
    ) {
      super();

      this.instanceId = instanceId;
    }

    public get notedexState() {
      return NotedexBootstrappableMixin.rootState?.notes?.[this.instanceId];
    }

    protected prepare(): void {
      this.startTimer();

      if (!this.instanceId) {
        return void this.endTimer('(bad instanceId)');
      }

      if (this.notedexState?.id === this.instanceId) {
        return void this.endTimer('(already prepared)');
      }

      NotedexBootstrappableMixin.Adapter.store.dispatch(notedexSlice.actions.init({
        scope: l.scope,
        id: this.instanceId,
      }));
    }

    public destroy(): void {
      if (!this.instanceId) {
        return;
      }

      const { Adapter } = NotedexBootstrappableMixin;

      this.close();
      Adapter.store.dispatch(notedexSlice.actions.destroy({ scope: l.scope, id: this.instanceId }));
      void purgeNotesDb(this.instanceId);
    }
  }

  return NotedexBootstrappableMixin;
};

export abstract class NotedexBootstrappable extends MixinNotedexBootstrappable(BootdexBootstrappable) {
  public static override readonly scope = l.scope;
}
