chrome.runtime.onMessage.addListener((message, sender) => {
  switch ((<Record<string, string>> message).type) {
    case 'showPageAction': {
      chrome.pageAction.show(sender.tab.id);

      break;
    }

    case 'hidePageAction': {
      chrome.pageAction.hide(sender.tab.id);

      break;
    }

    default: break;
  }
});

export {};
