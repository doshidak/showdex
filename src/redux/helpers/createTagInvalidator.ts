import type { ReduxTagType } from '@showdex/redux/services';
import type { ReduxBasePayload } from './buildQueryUrl';
import type { ReduxProvidedTag } from './createTagProvider';

/* eslint-disable @typescript-eslint/indent */

export const createTagInvalidator = <TPayload extends ReduxBasePayload>(
  tagType: ReduxTagType,
  additionalTags?: ReduxProvidedTag[] | ((result: TPayload) => ReduxProvidedTag[]),
  omitAnyId?: boolean,
) => (
  result: TPayload,
): ReduxProvidedTag[] => {
  const tags = typeof additionalTags === 'function' ?
    additionalTags(result) :
    additionalTags;

  if (!tagType) {
    return Array.isArray(tags) ? tags.filter(Boolean) : [];
  }

  return [
    ...(Array.isArray(tags) ? tags.filter(Boolean) : []),

    !!result?.id && {
      type: tagType,
      id: result.id,
    },

    !omitAnyId && {
      type: tagType,
      id: '*',
    },
  ].filter(Boolean);
};

/* eslint-enable @typescript-eslint/indent */
