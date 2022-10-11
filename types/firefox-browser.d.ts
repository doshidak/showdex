/**
 * `firefox-browser.d.ts`
 *
 * Typings for some built-in Firefox-exclusive browser globals in WebExtension content scripts.
 *
 * @author Keith Choison <keith@tize.io>
 * @author MDN Web Docs <mdn-github@mozilla.com>
 * @license CC-BY-SA-2.5 (Prose)
 * @license CC0-1.0-Universal (Code)
 * @see https://github.com/mdn/content/blob/50387f75a66eb5c32c3c08e85e879c7a61b1e25d/files/en-us/mozilla/add-ons/webextensions/sharing_objects_with_page_scripts/index.md
 * @since 1.0.3
 */

declare namespace FirefoxBrowser {
  interface ExportFunctionOptions {
    defineAs?: string;
  }

  /* eslint-disable @typescript-eslint/ban-types */

  /**
   * Given a function defined in the content script, `exportFunction()` exports it to
   * the page script's scope, so the page script can call it.
   *
   * @example
   * ```js
   * // execute content script in the active tab
   * function loadContentScript() {
   *   browser.tabs.executeScript({
   *     file: '/content_scripts/export.js',
   *   });
   * }
   *
   * // add loadContentScript() as a listener to clicks on the browser action
   * browser.browserAction.onClicked.addListener(loadContentScript);
   *
   * // show a notification when we get messages from the content script
   * browser.runtime.onMessage.addEventListener((message) => {
   *   browser.notifications.create({
   *     type: 'basic',
   *     title: 'Message from the page',
   *     message: message.content,
   *   });
   * });
   *
   * // define a function in the content script's scope,
   * // then export it into the page script's scope
   * function notify(message) {
   *   browser.runtime.sendMessage({ content: `Function call: ${message}` });
   * }
   *
   * exportFunction(notify, window, { defineAs: 'notify' });
   *
   * // now the page script can call notify()
   * window.notify('Message from the page script!');
   * ```
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts#exportfunction
   */
  type ExportFunction = <T extends Function>(
    func: T,
    targetScope: unknown,
    options?: ExportFunctionOptions,
  ) => void;

  /* eslint-enable @typescript-eslint/ban-types */

  interface CloneIntoOptions {
    cloneFunctions?: boolean;
    wrapReflectors?: boolean;
  }

  /**
   * Given an object defined in the content script, this creates a clone of the object in the page script's scope,
   * thereby making the clone accessible to page scripts.
   *
   * * By default, this uses the structured clone algorithm to clone the object,
   *   meaning that functions in the object are not included in the clone.
   *   - To include functions, pass the `cloneFunctions` option.
   *
   * @example
   * ```js
   * // create an object that contains functions in the content script's scope,
   * // then clone it into the page script's scope.
   * // because the object contains functions, the cloneInto call must include the `cloneFunctions` option.
   * const messenger = {
   *   notify(message) {
   *     browser.runtime.sendMessage({
   *       content: `Object method call: ${message}`,
   *     });
   *   },
   * };
   *
   * window.wrappedJSObject.messenger = cloneInto(
   *   messenger,
   *   window,
   *   { cloneFunctions: true },
   * );
   *
   * // now page scripts see a new property on the window, `messenger`, which has a function notify()
   * window.messenger.notify('Message from the page script!');
   * ```
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts#cloneinto
   * @see https://github.com/emoji-gen/clone-into/blob/main/src/index.ts
   */
  type CloneInto = <T>(
    obj: T,
    targetScope: unknown,
    options?: CloneIntoOptions,
  ) => T;
}
