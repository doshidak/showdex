import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { createSideRoom } from '@showdex/utils/app';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import type { ShowdexBootstrapper } from '@showdex/main';
import { Hellodex } from './Hellodex';

const l = logger('@showdex/pages/Hellodex/Hellodex.bootstrap');

// Hellodex should only open once during initialization of the Showdown client
let opened = false;

export const hellodexBootstrapper: ShowdexBootstrapper = (store) => {
  l.debug(
    'Hellodex bootstrapper was invoked;',
    'determining if there\'s anything to do...',
  );

  if (!env.bool('hellodex-enabled')) {
    l.debug(
      'Hellodex bootstrap request was ignored',
      'since it has been disabled by the environment.',
    );

    return;
  }

  if (opened) {
    l.debug(
      'Hellodex bootstrap request was ignored',
      'since it has been opened already.',
    );

    return;
  }

  const hellodexRoomId = 'view-hellodex';

  const hellodexRoom = createSideRoom(hellodexRoomId, 'Hellodex', {
    icon: Math.random() > 0.5 ? 'smile-o' : 'heart',
    focus: true,
  });

  const reactHellodexRoom = ReactDOM.createRoot(hellodexRoom.el);

  reactHellodexRoom.render((
    <ReduxProvider store={store}>
      <Hellodex />
    </ReduxProvider>
  ));

  opened = true;
};
