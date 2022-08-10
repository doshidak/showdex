import { logger } from '@showdex/utils/debug';
import { getExtensionId } from './getExtensionId';

interface RuntimeFetchMessage {
  type: 'fetch';
  url: RequestInfo;
  options?: RequestInit;
}

interface RuntimeFetchMessageResponse<T = unknown> {
  ok: boolean;
  status: number;
  jsonValue: T;
}

interface RuntimeFetchResponse<T = unknown> {
  ok: boolean;
  status: number;
  json: () => T;
}

const l = logger('@showdex/utils/core/runtimeFetch');

export const runtimeFetch = async <T = unknown>(url?: RequestInfo, options?: RequestInit): Promise<RuntimeFetchResponse<T>> => {
  const extensionId = getExtensionId();

  l.debug(
    'runtimeFetch() -> await fetch()',
    '\n', 'url', url,
    '\n', 'options', options,
    '\n', 'extensionId', extensionId,
  );

  /**
   * @todo when promises come out for Chrome MV3 extensions
   * @see https://developer.chrome.com/docs/extensions/reference/runtime/#event-onMessageExternal
   */
  // return chrome.runtime.sendMessage<RuntimeFetchMessage, T>(extensionId, {
  //   type: 'fetch',
  //   url,
  //   options,
  // });

  return new Promise<RuntimeFetchResponse<T>>((resolve, reject) => {
    chrome.runtime.sendMessage<RuntimeFetchMessage, RuntimeFetchMessageResponse<T>>(extensionId, {
      type: 'fetch',
      url,
      options,
    }, (response) => {
      l.debug(
        'runtimeFetch() <- await fetch()',
        '\n', 'url', url,
        '\n', 'options', options,
        '\n', 'extensionId', extensionId,
        '\n', (response instanceof Error ? 'error' : 'response'), response,
      );

      if (response instanceof Error) {
        reject(response);
      } else {
        resolve({
          ok: response.ok,
          status: response.status,
          json: () => response.jsonValue,
        });
      }
    });
  });
};
