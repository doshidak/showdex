<p align="center">
  <strong>(~˘▾˘)~　ＷＥＬＣＯＭＥ　ＴＯ　~(˘▾˘~)</strong>
</p>

<h2 align="center">
  <code>@showdex/assets/i18n</code>
</h2>

**Hiya !**

Thanks for expressing interest in helping us make competitive Pokémon more accessible to more people for more Elo to be extracted by everyone &hearts;

　　**\ (•◡•) /**

## How It Works

Witchcraft & sorcery. Sometimes called [**`i18next`**](https://www.i18next.com).

* [Have a quick look](https://www.i18next.com/translation-function/essentials) at it if you're not familiar with its syntax or features, such as [**namespaces**](https://i18next.com/principles/namespaces) or [**nesting**](https://i18next.com/translation-function/nesting), e.g., `"$t(common:labels.active)"`.
* Shouldn't be too wild to figure out tho!

> **Note**  
> Showdex's UI currently doesn't natively support RTL (right-to-left) languages. This isn't to say you couldn't translate them, but the UI, particularly the alignment, might look pretty off.

### File Structure

All text displayed to the user is stored here in these directories, separated by locale.

> [`en`](./en) refers to English, [`fr`](./fr) refers to French, etc.

Each JSON file within each locale refers to a [i18next **namespace**](https://i18next.com/principles/namespaces). This way, we can separate text for the different parts of Showdex. (Also helps keep the translation strings focused in terms of their scope, so that you wouldn't find settings text in the same file that has the Pokémon types!)

> You can think of these as **groups**, **directories** or **folders**, basically.

### Namespaces

Pretty straightforward, actually!

* [**`common`**](./en/common.json) &mdash; Includes some commonly used labels like "Active", "Import", etc. Mostly used for UI buttons. Not all of them are used atm, but ya never know, ya know ?!
* [**`pokedex`**](./fr/pokedex.json) &mdash; Includes all strings related to Pokémon mechanics, such as abilities, items, species & types. I may have *slightly* muddied the organization a bit by including keys like `types` & `nonvolatiles` that include additional labels that will be shown at different viewports/screen sizes. fucc it yolo
* [**`calcdex`**](./en/calcdex.json) &mdash; Includes all strings used in the Calcdex, such as UI labels, tooltips & dropdown .
* [**`honkdex`**](./en/honkdex.json) &mdash; Includes all strings used specifically in the Honkdex, which isn't much, since most of them comes from the Calcdex (it's still a Calcdex underneath, technically).
* [**`hellodex`**](./en/hellodex.json) &mdash; Includes most strings used in the Hellodex, with the exception of the settings.
* [**`settings`**](./en/settings.json) &mdash; Includes all strings used in the Hellodex settings, separated because there's A LOT of strings in here! Settings usually have multiple options as well, each with their own lengthy explainer tooltips cause ya boy running with `-vvv`[^1] (also Pokémon sometimes hard to explain ngl).

[^1]: `-v` refers to the **verbose** option flag, typical of shell bins/binaries/programs & anything I write pretty much LOL. Some like `ssh` allow you to specify the log verbosity level by the number of `v`'s specified, e.g., `-v` is level 1 (or "verbose"), `-vv` is level 2 (or "very verbose") & `-vvv` is level 3 (for "very very verbose"). Most shell bins today aren't designed to respond this way anymore & simply use `-v` or `--verbose` to specify that you're all about that verbosity. ...*wow what a nerd HAHAHA*

### Fallbacks

**English** ([`en`](./en)) is used as the fallback whenever the locale doesn't supply a specific translation string.

For instance, if the language doesn't provide a [`settings.json`](./en/settings.json) or the specific setting like `calcdex.openAs.options.battleOverlay.label` isn't translated, the English version will be used instead.

* This means you technically don't need to translate *everything*.
* You could simply translate [`common.json`](./en/common.json) & [`pokedex.json`](./en/pokedex.json) to achieve a decently translated Calcdex.

> **Note**  
> One caveat about [`common.json`](./en/common.json) is that you still need to duplicate the corresponding JSON [`en`](./en) file, e.g., [`calcdex.json`](./en/calcdex.json), otherwise, the fallback [`en/calcdex.json`](./en/calcdex.json) will use [`en/common.json`](./en/common.json), not those of your locale!
> * (This caveat exists cause of a schema design decision I thought might be sick af, but turned out to be an absolute throw omg lol ...but I'll fix it later hahah)

## Instructions

> Just follow this simple easy-to-follow 13 step process & you'll be translating in no time!
> <sub>/s</sub>

1. Check [this list of locales](https://docs.mojolicious.org/I18N/LangTags/List) for the language you wish to translate.
  - Just like Pokémon formes, there's no rhyme or reason to any of them in terms of syntax or format, just ask [*Charizard-Mega-X*](https://smogon.com/dex/sm/pokemon/charizard) or the crowd favorite [*Ogerpon-Wellspring-Tera*](https://smogon.com/dex/sv/pokemon/ogerpon).
  - Also like Pokémon formes, the only thing that's thankfully *somewhat* consistent is the base species.
  - Oh & the use of dashes (i.e., `-`) as the delimiter/separator.
  - Generally you should use the "base species" two letter locales (e.g., `en` for English, `ja` for Japanese), unless you're translating specifically for a specific region/dialect/etc., which then it'll have an additional "forme" attached to its base (e.g., `zh-Hans` for the Simplified Chinese "forme", where `zh` is the "base forme" for Chinese).
  - Appears convention is to lowercase the "base forme" (e.g., `en`), uppercase 2 letter "formes" (e.g., `en-US`) & capitalize 3 or more letter "formes" (e.g., `zh-Yue`, `zh-Hant`, `cel-Gaulish`).
2. Choose your `<locale>`.
3. `cd` into your favorite directory.
4. `git clone git@github.com:doshidak/showdex.git`
5. `cd showdex`
6. `yarn`
7. `cd src/assets/i18n`
8. `mkdir <locale>`
9. `cp en/common.json fr/pokedex.json <locale>`
  - Make sure to copy the **French** [`fr/pokedex.json`](./fr/pokedex.json) as the English one doesn't contain all of the abilities, items, moves, etc. (no need since everything is already in English)!
10. Feel free to modify the (currently) unused `--meta` objects with your `<locale>`.
  - These aren't used nor its values enforced at the moment.
  - They're more meant to "tag" or "label" the file in case it gets lost somewhere o_O
  - Please keep the `version` intact, as I plan on using this to track major/minor schema changes.
  - (Unfortunately, as you've probably seen, the JSON files are messy af, but this is the first implementation of it, so just like the Calcdex then vs. now... I guess it'll only get messier?? LOL jk. ...*I hope* (ಥ﹏ಥ) ...)
11. Modify [`@showdex/consts/app/locales.ts`](../../consts/app/locales.ts) & add an additional entry.
  - Just copy what exists & modify values as you see fit.
  - Only important ones are the `id` & `ext` as they correspond to the file that will be fetched at runtime.
  - Set `id` to `'i18n.<locale>'` & leave `ext` as-is (should be `'json'`).
12. [Run your development build](/README.md#development) & open the Hellodex settings.
13. Select your locale under "Language" in the Showdex section.
  - It should load **immediately**, but you may not notice anything right away if you haven't translated [`settings.json`](./en/settings/json) yet (since you're still in the settings at this point).
  - Otherwise, you should check the DevTools console for any potential `i18n` errors.
  - Alternatively, you can enable the `debug` flag in [`loadI18nextLocales()`](../../utils/app/loadI18nextLocales.ts), but be forewarned, you may be bombarded with missing translation key warnings, especially when in the Calcdex!

### Some Tips

* You can use *nesting* to access values of other stored keys in the format, like variables: `$t(<namespace>:<some>.<key>.<array>.0)`.
  - e.g., `"Pendant 5 tours (8 avec $t(pokedex:items.icyrock)), ..."`
  - But nothing wrong with `"Pendant 5 tours (8 avec Roche Glace), ..."` either!
  - As long as the key exists, `i18next` will first look for that key in the current locale, otherwise, it'll fallback to the corresponding key in the default `en` locale.
* Particularly for UI labels, opt for brevity as much as possible, as to not have text bleeding all over (especially on smaller viewports like mobile!).
  - This includes the abbreviated labels in the the `pokedex:types`, `pokedex:stats` & `pokedex:nonvolatiles` (i.e., status conditions).
  - If there's no short way of translating a specific term, I'd recommend using the English "forme" instead.
  - Some components like Pokémon types are designed with a max character limit, so abbreviations may be necessary.
  - (But I shall defer to your better judgment!)
* Try resizing your browser from time to time by using the responsive mode in the DevTools element inspector to make sure everything's fitting nice & snug!
  - Especially in the Hellodex settings, where text overflow can look kinda bad, particularly between responsive breakpoints.
* Make sure to preserve any inline variables like `{{count}}` or `{{ability}}` (e.g., don't translate "ability" in the curly braces itself), as they'll be replaced with real-time values on-the-fly.
* Unfortunately it's not clear what keys allow HTML & what don't.
  - Check the corresponding `en` string to see if it uses any HTML tags.
  - Most, if not all, aria & label keys are shown as-is, so they don't render any HTML.
  - Most tooltip keys should allow HTML.
  - As for what kind of HTML, you can safely use `<strong>`, `<em>` & `<br />`, as well as *some* entities like `&amp;` & `&lt;`.
* Some keys may have some special tags like `<spectate>` in the [`hellodex.json`](./en/hellodex.json), which you should preserve as they render components with functionality.
  - Text between the tags should be translated:<br />`"...or <spectate>spectate</spectate> a battle."`<br />**&rarr;** `"...하거나 <spectate>관전</spectate>하면..."`
  - Self-closing tags can be repositioned, but should be left alone:<br />`"created with <love /> by"` **&rarr;** `"<love />으로 만든..."`
* Any other tag must be custom defined directly in the React component itself, so you may have to get your hands a little dirty. (Although, you should be fine with what's available for the most part.)
* Definitely a lot of work, so I recommend translating in parts, as anything not translated will safely fallback to English.
  - I'd say in terms of amount to actually translate, from least to greatest: [`honkdex.json`](./en/honkdex.json) &rarr; [`common.json`](./en/common.json) &rarr; [`hellodex.json`](./en/hellodex.json) &rarr; [`calcdex.json`](./en/calcdex.json) &rarr; [`pokedex.json`](fr/pokedex.json) &rarr; & the mack daddy: [`settings.json`](./en/settings.json).
  - In terms of what would offer the most value is undoubtedly [`pokedex.json`](./fr/pokedex.json), as that contains all the abilities, moves, items, stats, types & species!

## Submitting

1. [Fork me on GitHub](https://github.com/doshidak/showdex/fork).
2. `git commit` your local changes & `git push` them to your fork.
3. Create a PR from your fork.
4. Mention something funny or interesting about your language in your PR (if you want!).
5. ???
6. Profit!

<h4 align="center">
  (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧　ありがとうございます！&hearts;　✧･: *ヽ(◕ヮ◕ヽ) 
</h4>
