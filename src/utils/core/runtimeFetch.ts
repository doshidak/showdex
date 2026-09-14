import { HttpMethod } from '@showdex/consts/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { env } from './getEnv';
import { getExtensionId } from './getExtensionId';
import { safeJsonParse } from './safeJsonParse';

export interface RuntimeFetchMessage {
  type?: 'fetch';
  url: RequestInfo;
  options?: RequestInit;
}

export interface RuntimeFetchMessageResponse {
  ok: boolean;
  status: number;
  headers: Record<string, string>;
  value: string;
  /**
   * Populated by the background script when its `fetch()` threw.
   *
   * * `Error`s don't survive the structured clone that `chrome.runtime.sendMessage()` puts responses
   *   through (they arrive as a bare `{}`), so the reason has to ride along as a plain `string`.
   *
   * @since 1.4.2
   */
  error?: string;
}

export interface RuntimeFetchResponse<T = unknown> extends Pick<RuntimeFetchMessageResponse, 'ok' | 'status' | 'headers'> {
  text: () => string;
  json: () => T;
}

const l = logger('@showdex/utils/core/runtimeFetch()');

/**
 * Browser-agnostic message sender.
 *
 * * Since `chrome`'s `runtime.sendMessage()` does not support `Promise`s yet (uses a callback), it's wrapped in a `Promise`.
 * * ~~For other `browser`s, `runtime.sendMessage()` returns a `Promise`, so this will `await` and return the message response.~~
 *   - Since `runtimeFetch()` is bundled with the injected `<script>`, we have direct access to `fetch()` since we're in MV2 (Manifest v2).
 *
 * @see https://developer.chrome.com/docs/extensions/reference/runtime/#event-onMessageExternal
 * @since 1.0.1
 */
const sendFetchMessage = async <T = unknown>(
  extensionId: string,
  message: RuntimeFetchMessage,
): Promise<RuntimeFetchResponse<T>> => {
  if (env('build-target') !== 'standalone' && typeof chrome !== 'undefined') {
    return new Promise<RuntimeFetchResponse<T>>((
      resolve,
      reject,
    ) => {
      chrome.runtime.sendMessage<RuntimeFetchMessage, RuntimeFetchMessageResponse>(extensionId, {
        type: 'fetch',
        ...message,
      }, (response) => {
        // l.debug(
        //   'runtimeFetch() <- chrome.runtime.sendMessage() <- fetch()',
        //   '\n', 'url', message?.url,
        //   '\n', 'extensionId', extensionId,
        //   '\n', 'message', message,
        //   '\n', (response instanceof Error ? 'error' : 'response'), response,
        // );

        if (response instanceof Error) {
          return void reject(response);
        }

        // note: chrome.runtime.sendMessage() responses are structured-cloned, so the background's send(error)
        // arrives here as a plain `{}` (never an Error), & a failure to reach the background at all (e.g., a
        // cold service worker) invokes this callback w/ an undefined response & sets runtime.lastError.
        // both used to blow right past the instanceof check above & resolve w/ an undefined `value`, whose
        // json() is null -- which then exploded in whatever was awaiting us (RIP i18n)
        const { lastError } = chrome.runtime;

        if (lastError || !response || response.error || typeof response.ok !== 'boolean') {
          return void reject(new Error(
            lastError?.message
              || response?.error
              || `Couldn't runtimeFetch() ${typeof message?.url === 'string' ? message.url : '(that URL)'} for some reason o_O`,
          ));
        }

        resolve({
          ok: response.ok,
          status: response.status,
          headers: response.headers,
          text: () => response.value,
          json: () => safeJsonParse<T>(response.value),
        });
      });
    });
  }

  const response = await fetch(message?.url, {
    method: HttpMethod.GET,
    ...message?.options,
    headers: {
      Accept: 'application/json',
      ...message?.options?.headers,
    },
  });

  const value = await response.text();

  // l.debug(
  //   'runtimeFetch() <- browser.runtime.sendMessage() <- fetch()',
  //   '\n', 'url', message?.url,
  //   '\n', 'extensionId', extensionId,
  //   '\n', 'message', message,
  //   '\n', (response instanceof Error ? 'error' : 'response'), response,
  // );

  const headers: Record<string, string> = {};

  for (const [headerName, headerValue] of response.headers) {
    if (!headerName || !headerValue) {
      continue;
    }

    headers[headerName.toLowerCase()] = headerValue;
  }

  return {
    ok: response.ok,
    status: response.status,
    headers,
    text: () => value,
    json: () => safeJsonParse<T>(value),
  };
};

export const runtimeFetch = async <T = unknown>(
  url?: RequestInfo,
  options?: RequestInit,
): Promise<RuntimeFetchResponse<T>> => {
  const endTimer = runtimer(l.scope);
  const extensionId = getExtensionId();

  // l.debug(
  //   'runtimeFetch() -> sendMessage() -> fetch()',
  //   '\n', 'url', url,
  //   '\n', 'options', options,
  //   '\n', 'extensionId', extensionId,
  // );

  const response = await sendFetchMessage<T>(extensionId, {
    url,
    options,
  });

  endTimer('(fetch complete)', 'url', url);

  return response;
};
