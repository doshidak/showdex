import qs from 'qs';
import { nonEmptyObject } from '@showdex/utils/core';

export interface ReduxBasePayload {
  id: string;
}

export const buildQueryUrl = <TPayload extends ReduxBasePayload>(
  url: string,
  query?: DeepPartial<TPayload>,
): string => {
  if (!Object.keys(query || {}).length) {
    return url;
  }

  return [
    url,

    // even if the URL length was client-enforced, someone could easily just `curl` a looong URL lol
    nonEmptyObject(query) && qs.stringify(query),
  ].filter(Boolean).join('?');
};
