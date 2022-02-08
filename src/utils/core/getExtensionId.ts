export const getExtensionId = (): string => {
  if (chrome?.runtime?.id) {
    return chrome.runtime.id;
  }

  if (typeof document?.getElementById !== 'function') {
    return null;
  }

  /** @todo you should prob make the main script id an env var */
  const mainScript = document.getElementById('showdex-script-main');

  if (typeof mainScript?.getAttribute !== 'function') {
    return null;
  }

  return mainScript.getAttribute('data-ext-id');
};
