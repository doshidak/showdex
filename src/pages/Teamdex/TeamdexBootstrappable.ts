/**
 * @file `TeamdexBootstrappable.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.1.3
 */

/* eslint-disable max-classes-per-file */

import { teamdexSlice } from '@showdex/redux/store';
import { getTeambuilderPresets } from '@showdex/utils/presets';
import { logger } from '@showdex/utils/debug';
import { type BootdexBootstrappableLike, BootdexBootstrappable } from '../Bootdex/BootdexBootstrappable';

export type TeamdexBootstrappableLike = BootdexBootstrappableLike;
//   & Omit<typeof TeamdexBootstrappable, 'constructor'>
//   & (new () => TeamdexBootstrappable);

const l = logger('@showdex/pages/Teamdex/TeamdexBootstrappable');

export const MixinTeamdexBootstrappable = <
  TBootstrappable extends typeof BootdexBootstrappable,
>(
  Bootstrappable: TBootstrappable,
) => {
  abstract class TeamdexBootstrappableMixin extends (Bootstrappable as typeof BootdexBootstrappable & InstanceType<TBootstrappable>) {
    protected updateTeambuilderPresets(): void {
      this.startTimer();

      const { store } = TeamdexBootstrappableMixin.Adapter || {};
      const presets = getTeambuilderPresets();

      if (!presets.length) {
        return void this.endTimer('(no presets)');
      }

      store.dispatch(teamdexSlice.actions.setPresets(presets));
      this.endTimer();
    }
  }

  return TeamdexBootstrappableMixin;
};

export abstract class TeamdexBootstrappable extends MixinTeamdexBootstrappable(BootdexBootstrappable) {
  public static override readonly scope = l.scope;
}
