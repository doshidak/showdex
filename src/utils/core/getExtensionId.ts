/**
 * Returns the exact runtime extension ID by reading the `data-ext-id` attribute
 * of the injected `<script>` tag for `main.js` from `content`.
 *
 * @since 0.1.0
 */
export const getExtensionId = (): string => {
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
