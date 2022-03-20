// chrome.runtime.onMessage.addListener((message: Record<string, unknown>, sender) => {
//   switch (<string> message?.type) {
//     case 'showPageAction': {
//       chrome.pageAction.show(sender.tab.id);
//
//       break;
//     }
//
//     case 'hidePageAction': {
//       chrome.pageAction.hide(sender.tab.id);
//
//       break;
//     }
//
//     default: break;
//   }
// });

chrome.runtime.onMessageExternal.addListener((message: Record<string, unknown>, _sender, sendResponse) => {
  switch (<string> message?.type) {
    case 'fetch': {
      void (async () => {
        try {
          const response = await fetch(<string> message?.url, {
            method: 'GET',
            ...(<Record<string, unknown>> message?.options),
            headers: {
              Accept: 'application/json',
              ...(<Record<string, unknown>> (<Record<string, unknown>> message?.options)?.headers),
            },
          });

          const json = await <Promise<Record<string, unknown>>> response.json();

          sendResponse({
            ok: response.ok,
            status: response.status,
            jsonValue: json,
          });
        } catch (error) {
          sendResponse(error);
        }
      })();

      // fetch(<string> message?.url, {
      //   method: 'GET',
      //   ...(<Record<string, unknown>> message?.options),
      //   headers: {
      //     Accept: 'application/json',
      //     ...(<Record<string, unknown>> (<Record<string, unknown>> message?.options)?.headers),
      //   },
      // }).then((response) => sendResponse(response)).catch((error) => sendResponse(error));

      return true; // use `sendResponse` asynchronously
    }

    default: break;
  }
});

export {};
