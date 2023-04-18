import type { ReduxTagType } from '@showdex/redux/services';
import type { ReduxBasePayload } from './buildQueryUrl';

export interface ReduxProvidedTag {
  type: ReduxTagType;
  id: string;
}

/* eslint-disable @typescript-eslint/indent */

export const createTagProvider = <TPayload extends ReduxBasePayload>(
  tagType: ReduxTagType,
  additionalTags?: ReduxProvidedTag[] | ((result: TPayload[]) => ReduxProvidedTag[]),
  omitAnyId?: boolean,
) => (
  result: TPayload[],
): ReduxProvidedTag[] => {
  const tags = typeof additionalTags === 'function' ?
    additionalTags(result) :
    additionalTags;

  if (!tagType || !Array.isArray(result)) {
    return Array.isArray(tags) ? tags.filter(Boolean) : [];
  }

  return [
    ...(Array.isArray(tags) ? tags : []).filter(Boolean),

    ...(result.map((resource) => (resource?.id ? ({
      type: tagType,
      id: resource.id,
    }) : null)) || []).filter(Boolean),

    !omitAnyId && {
      type: tagType,
      id: '*',
    },
  ].filter(Boolean);
};

/* eslint-enable @typescript-eslint/indent */
