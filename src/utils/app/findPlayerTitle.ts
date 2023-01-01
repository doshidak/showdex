import { ShowdexPlayerTitles } from '@showdex/consts/app';
import type { ShowdexPlayerTitle } from '@showdex/consts/app';
import { formatId } from './formatId';

/**
 * Finds a player title for the given `username`.
 *
 * * `username` will automatically be formatted into an ID, via `formatId()`.
 * * If the `username` is assigned to multiple titles, then the first match in the
 *   `ShowdexPlayerTitles` array will be returned.
 * * Not recommended that you manually sift through the `userIds` in the returned
 *   `ShowdexPlayerTitle` since not all elements will be type `string`!
 *   - User-specific title overrides are supported, so it may contain tuples.
 *   - Hence, this utility will override the `title` for you!
 *
 * @since 1.1.1
 */
export const findPlayerTitle = (
  username: string,
): ShowdexPlayerTitle => {
  const userId = formatId(username);

  if (!userId) {
    return null;
  }

  const matchedTitle = ShowdexPlayerTitles.find((t) => (
    t.userIds.map((id) => (Array.isArray(id) ? id[0] : id))
      .includes(userId)
  ));

  if (!matchedTitle) {
    return null;
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
