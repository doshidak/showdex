import { ShowdexPlayerTitles, ShowdexSupporterTiers } from '@showdex/consts/app';
import { type ShowdexPlayerTitle } from '@showdex/interfaces/app';
import { formatId } from '@showdex/utils/core';

/**
 * Finds a player title for the given `name`.
 *
 * * `name` will automatically be formatted into an ID via `formatId()`, only if indicated to be
 *   a Showdown user ID from the `showdownUser` argument.
 * * If the `name` is assigned to multiple titles, then the first match in the
 *   `ShowdexPlayerTitles` array will be returned.
 * * Not recommended that you manually sift through the `userIds` in the returned
 *   `ShowdexPlayerTitle` since not all elements will be type `string`!
 *   - User-specific title overrides are supported, so it may contain tuples.
 *   - Hence, this utility will override the `title` for you!
 *
 * @since 1.1.1
 */
export const findPlayerTitle = (
  name: string,
  showdownUser?: boolean,
): ShowdexPlayerTitle => {
  const userId = showdownUser ? formatId(name) : name;

  if (!userId) {
    return null;
  }

  const matchedTitle = ShowdexPlayerTitles.find((t) => (
    showdownUser
      ? t.userIds.map((id) => (Array.isArray(id) ? id[0] : id))
      : t.supporterId
        ? ShowdexSupporterTiers
          .find((s) => !!s?.id && s.id === t.supporterId)
          ?.members
          ?.filter((m) => !!m?.name && !m.showdownUser)
          .map((m) => m.name)
          .filter(Boolean)
          || []
        : []
  ).includes(userId));

  if (!matchedTitle) {
    return null;
  }

  if (!showdownUser) {
    return matchedTitle;
  }

  const matchedUserId = matchedTitle.userIds
    .find((id) => (Array.isArray(id) ? id[0] : id) === userId);

  if (!Array.isArray(matchedUserId) || !matchedUserId[1]) {
    return matchedTitle;
  }

  return {
    ...matchedTitle,
    title: matchedUserId[1],
  };
};
