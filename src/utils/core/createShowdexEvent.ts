/**
 * According to MDN, the `CustomEvent<T>` accepts an application-specific `details` property,
 * specified by the generic `T`.
 *
 * * This is basically our event payload, with the `type` to verify the message is from Showdex.
 * * `details` is a property of the `event` from the listener callback.
 *   - Note that there are some caveats to accessing these properties if the event is dispatched
 *     from a content script (where `browser` is available) to an injected script.
 *   - See `createShowdownEvent()` for more details.
 *
 * @since 1.0.3
 */
export interface ShowdexEventDetail<T = string> {
  type: string;
  payload?: T;
}

/**
 * Event types for the custom Showdex event.
 *
 * @since 1.0.3
 */
export type ShowdexEventType =
  | 'request'
  | 'response';

/**
 * Generates a custom Showdex event name based on the provided `type`.
 *
 * * Kept as a function so that the event names remain consistent.
 *   - Otherwise, the alternative would be hardcoding them across different files!
 *
 * @example
 * ```ts
 * getShowdexEventName('request');
 *
 * 'showdexrequest'
 * ```
 * @since 1.0.3
 */
export const getShowdexEventName = (type: ShowdexEventType): string => `showdex${type}`;

/* eslint-disable @typescript-eslint/indent */

/**
 * Custom event factory used for throwing the craziest Showdex parties.
 *
 * * Not really, it's actually just a custom event solely used to pass messages between the content script
 *   (`src/content.ts`) and the injected script (`src/main.ts`).
 *   - If `type` is `'request'`, the generated event name will become `'showdexrequest'`.
 *   - Likewise, if `type` is `'response'`, the event name will become `'showdexresponse'`.
 *   - Somewhere, some file (like `src/content.ts` and `src/pages/Hellodex/SettingsPane.tsx`) should be
 *     listening for these event names.
 *   - e.g., `window.addEventListener('showdexrequest', (e) => ...)`.
 * * Actually only used on Firefox, where we can't directly access the WebExtensions API inside injected scripts
 *   since they don't support Manifest V3 (MV3) yet.
 *   - Specifically, we'd need to provide the `externally_connectable` property, which isn't available in MV2.
 *   - For Chrome, this allows us to access `chrome.runtime` inside of an injected script, namely `runtimeFetch()`.
 * * More specifically, this is currently only being used in the `SettingsPane` to import the dehydrated
 *   `ShowdexSettings` from the user's clipboard, which requires reading it via `navigator.clipboard.readText()`.
 *   - `navigator.clipboard.writeText()` works right out of the box on Chrome and Firefox.
 *   - However, unlike in Chrome where it also works right out of the box, `navigator.clipboard.readText()`
 *     can only be accessed through browser extensions in Firefox, such as the content script.
 * * While we can opt to use `window.addEventListener('message', (e) => ...)` and `window.postMessage()`,
 *   these are very common and can be easily listened on by other entites on the page.
 *   - Mozilla recommends that we create our own `CustomEvent` to make sure there aren't any interferences.
 * * What they didn't tell us is specifically on Firefox, if the event's `detail` is generated from a
 *   content script, the injected script won't have access to the properties inside `detail`.
 *   - Apparently there's some concerns about passing objects around between content and injected scripts,
 *     so we need to use the not-so-very-clearly documented `cloneInto()` global, which Firefox provides.
 *   - This global is not available on any other browser, hence why we check if it exists first.
 *   - `cloneInto()` uses the same cloning algorithm as `structuredClone()`, though using the latter won't
 *     be enough and will still cause errors when accessing properties in `event.detail`.
 *   - Way that we use `cloneInto()` here allow us to properly clone (by Firefox's standards) the `detail`
 *     object to be accessible in the receiving `'showdexresponse'` listener inside the `SettingsPane`.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/clipboard
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/readText#browser_compatibility
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#using_window.postmessage_in_extensions_non-standard
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
 * @see https://stackoverflow.com/a/46081249
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts#sharing_content_script_objects_with_page_scripts
 * @since 1.0.3
 */
export const createShowdexEvent = <T = string>(
  type: ShowdexEventType,
  detail: ShowdexEventDetail<T>,
): CustomEvent<ShowdexEventDetail<T>> => new CustomEvent(getShowdexEventName(type), {
  detail: typeof cloneInto === 'function'
    ? cloneInto(detail, window)
    : detail,
});

/* eslint-enable @typescript-eslint/indent */
