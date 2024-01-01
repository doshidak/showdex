// import * as React from 'react';
import { type ShowdexBootstrapper } from '@showdex/interfaces/app';
import { teamdexSlice } from '@showdex/redux/store';
import { logger, runtimer } from '@showdex/utils/debug';
import { getTeambuilderPresets } from '@showdex/utils/presets';

const l = logger('@showdex/pages/Teamdex/TeamdexBootstrapper()');

export const TeamdexBootstrapper: ShowdexBootstrapper = (store) => {
  l.silly(
    'Teamdex bootstrapper was invoked;',
    'determining if there\'s anything to do...',
  );

  // create a local helper function to dispatch an update
  const updateTeambuilderPresets = () => {
    // used for debugging purposes only
    const endTimer = runtimer(`${l.scope}:updateTeambuilderPresets()`, l);

    const presets = getTeambuilderPresets();

    if (!presets.length) {
      return endTimer('(no presets)');
    }

    store.dispatch(teamdexSlice.actions.setPresets(presets));

    endTimer();
  };

  const endTimer = runtimer(l.scope, l);

  // override app.user.trigger() to listen for 'saveteams', in order to update the converted presets
  if (typeof app.user?.trigger === 'function' && !app.user.teamdexInit) {
    l.debug('Hooking into the client\'s app.user.trigger()...');

    const userTrigger = app.user.trigger.bind(app.user) as typeof app.user.trigger;

    app.user.trigger = (name, ...argv) => {
      // run this first to make sure the data is freshly mutated before we run our injected bit
      const output = userTrigger(name, ...argv);

      if (name === 'saveteams') {
        updateTeambuilderPresets();
      }

      return output;
    };

    app.user.teamdexInit = true;
  }

  l.debug('Registering callback to Storage.whenTeamsLoaded()...');

  // on first init, either convert the presets if ready, or register a callback to convert once ready
  const teamsLoaded = (Storage as unknown as Showdown.ClientStorage)?.whenTeamsLoaded?.isLoaded;

  if (typeof teamsLoaded === 'boolean' && !teamsLoaded) {
    (Storage as unknown as Showdown.ClientStorage).whenTeamsLoaded(updateTeambuilderPresets, null);
  } else {
    // fuck it, attempt to update it anyways
    updateTeambuilderPresets();
  }

  endTimer('(bootstrap complete)');
};
