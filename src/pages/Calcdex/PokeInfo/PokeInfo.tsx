import * as React from 'react';
import cx from 'classnames';
import {
  PiconButton,
  PokeFormeTooltip,
  PokeHpBar,
  PokeStatus,
} from '@showdex/components/app';
import { Dropdown, PokeTypeField } from '@showdex/components/form';
import {
  Badge,
  Button,
  ToggleButton,
  Tooltip,
} from '@showdex/components/ui';
import { PokemonCommonNatures, PokemonNatureBoosts } from '@showdex/consts/pokemon';
import { useColorScheme } from '@showdex/redux/store';
import { formatId, openSmogonUniversity } from '@showdex/utils/app';
import { detectToggledAbility, legalLockedFormat } from '@showdex/utils/battle';
import { calcPokemonHp } from '@showdex/utils/calc';
import { readClipboardText, writeClipboardText } from '@showdex/utils/core';
import { hasNickname } from '@showdex/utils/dex';
import { capitalize } from '@showdex/utils/humanize';
import {
  detectUsageAlt,
  exportPokePaste,
  flattenAlts,
  importPokePaste,
} from '@showdex/utils/presets';
import type { AbilityName, ItemName } from '@smogon/calc/dist/data/interface';
import type { BadgeInstance } from '@showdex/components/ui';
import type { CalcdexPlayerSide } from '@showdex/redux/store';
import type { ElementSizeLabel } from '@showdex/utils/hooks';
import { useCalcdexPokeContext } from '../CalcdexPokeContext';
import { PokeAbilityOptionTooltip } from './PokeAbilityOptionTooltip';
import { PokeItemOptionTooltip } from './PokeItemOptionTooltip';
import styles from './PokeInfo.module.scss';

export interface PokeInfoProps {
  className?: string;
  style?: React.CSSProperties;
  containerSize?: ElementSizeLabel;
}

const baseScope = '@showdex/pages/Calcdex/PokeInfo';

export const PokeInfo = ({
  className,
  style,
  containerSize,
}: PokeInfoProps): JSX.Element => {
  const {
    state,
    settings,
    // playerKey,
    player,
    playerPokemon: pokemon,
    field, // don't use the one from state btw
    presetsLoading,
    abilityOptions,
    itemOptions,
    presetOptions,
    applyPreset,
    updatePokemon,
  } = useCalcdexPokeContext();

  const {
    gen,
    format,
    legacy,
  } = state;

  const colorScheme = useColorScheme();

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || '?';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

  const nickname = hasNickname(pokemon) && settings?.showNicknames
    ? pokemon.name
    : null;

  const hpPercentage = calcPokemonHp(pokemon);

  // whether we should multiply the current & max HPs by 2 if useMax is enabled
  // and is NOT from the server or isn't currently Dynamaxed
  // (server HP will be doubled when Dynamaxed, but not beforehand; client HP will never be doubled,
  // since it's a percentage)
  /**
   * @todo Make this into `calcPokemonHp()` (and rename `calcPokemonHp()` to `calcPokemonHpPercentage()`).
   *   Also check if the HP Percentage mod is enabled, via the `CalcdexBattleRules`, since we wouldn't
   *   want to double the client HP if the mod is disabled (as it wouldn't be a percentage, duh).
   */
  const shouldDmaxHp = pokemon?.useMax
    && (!pokemon.serverSourced || !('dynamax' in pokemon.volatiles));

  const currentHp = (
    pokemon?.serverSourced
      ? pokemon.hp
      : Math.floor((pokemon?.spreadStats?.hp ?? 0) * hpPercentage)
  ) * (shouldDmaxHp ? 2 : 1);

  const maxHp = (
    (pokemon?.serverSourced && pokemon.maxhp)
      || pokemon?.spreadStats?.hp
      || 0
  ) * (shouldDmaxHp ? 2 : 1);

  const abilityName = pokemon?.dirtyAbility ?? pokemon?.ability;
  const itemName = pokemon?.dirtyItem ?? pokemon?.item;

  // for Ruin abilities (gen 9), only show the ability toggle in Doubles
  const showAbilityToggle = pokemon?.abilityToggleable && (
    !formatId(abilityName)?.endsWith('ofruin')
      || field?.gameType === 'Doubles'
  );

  // const fieldKey: keyof CalcdexBattleField = playerKey === 'p2'
  //   ? 'defenderSide'
  //   : 'attackerSide';

  // ability toggle would only be disabled for inactive Pokemon w/ Ruin abilities (gen 9) in Doubles
  const disableAbilityToggle = pokemon?.abilityToggleable
    && formatId(abilityName)?.endsWith('ofruin')
    && field?.gameType === 'Doubles'
    && !pokemon.abilityToggled
    && ([
      'ruinBeadsCount',
      'ruinSwordCount',
      'ruinTabletsCount',
      'ruinVesselCount',
    ] as (keyof CalcdexPlayerSide)[])
      .reduce((sum, key) => sum + ((player?.side?.[key] as number) || 0), 0) >= 2;

  const showResetAbility = !!pokemon?.dirtyAbility
    && !pokemon.transformedForme
    && !!pokemon.ability
    && pokemon.ability !== pokemon.dirtyAbility;

  const handleAbilityChange = (name: AbilityName) => updatePokemon({
    dirtyAbility: name,
    abilityToggled: detectToggledAbility({
      ...pokemon,
      ability: name,
    }),
  }, `${baseScope}:handleAbilityChange()`);

  const handleAbilityReset = () => updatePokemon({
    dirtyAbility: null,
    abilityToggled: detectToggledAbility({
      ...pokemon,
      dirtyAbility: null,
    }),
  }, `${baseScope}:handleAbilityReset()`);

  const showResetItem = !!pokemon?.dirtyItem
    && (!!pokemon?.item || !!pokemon?.prevItem)
    && (pokemon?.item || pokemon?.prevItem) !== pokemon?.dirtyItem;

  const [formesVisible, setFormesVisible] = React.useState(false);
  const toggleFormesTooltip = () => setFormesVisible(!formesVisible);
  const closeFormesTooltip = () => setFormesVisible(false);

  const smogonPageTooltip = (
    <div className={styles.tooltipContent}>
      Open Smogon Page
      {
        !!pokemon?.speciesForme &&
        <>
          {' '}for
          <br />
          <strong>{pokemon.speciesForme}</strong>
        </>
      }
    </div>
  );

  const openSmogonPage = () => openSmogonUniversity(
    gen,
    'pokemon',
    pokemon?.speciesForme,
    format,
  );

  const formeDisabled = !pokemon?.altFormes?.length;
  const smogonDisabled = !settings?.openSmogonPage || !pokemon?.speciesForme;
  const piconDisabled = settings?.reverseIconName ? formeDisabled : smogonDisabled;
  const nameDisabled = settings?.reverseIconName ? smogonDisabled : formeDisabled;

  const editableTypes = settings?.editPokemonTypes === 'always'
    || (settings?.editPokemonTypes === 'meta' && !legalLockedFormat(format));

  const importBadgeRef = React.useRef<BadgeInstance>(null);
  const importFailedBadgeRef = React.useRef<BadgeInstance>(null);
  const [importFailedReason, setImportFailedReason] = React.useState('Failed');

  const handlePokePasteImport = () => void (async () => {
    if (typeof updatePokemon !== 'function') {
      return;
    }

    try {
      const data = await readClipboardText();
      const preset = importPokePaste(data, format);

      const importFailed = !preset?.calcdexId || ![
        pokemon?.speciesForme,
        ...(pokemon?.altFormes || []),
      ].filter(Boolean).includes(preset.speciesForme);

      if (importFailed) {
        setImportFailedReason(!preset?.calcdexId ? 'Bad Syntax' : 'Mismatch');
        importFailedBadgeRef.current?.show();

        return;
      }

      const currentPresets = [...pokemon.presets];
      const existingImportIndex = currentPresets.findIndex((p) => p.source === 'import');

      if (existingImportIndex > -1) {
        currentPresets.splice(existingImportIndex, 1, preset);
      } else {
        currentPresets.push(preset);
      }

      applyPreset(preset, {
        presets: currentPresets,
      }, `${baseScope}:handlePokePasteImport()`);

      importBadgeRef.current?.show();
    } catch (error) {
      // if (__DEV__) {
      //   l.error(
      //     'Failed to import the set for', pokemon.speciesForme, 'from clipboard:',
      //     '\n', error,
      //     '\n', '(You will only see this error on development.)',
      //   );
      // }

      setImportFailedReason('Failed');
      importFailedBadgeRef.current?.show();
    }
  })();

  const exportBadgeRef = React.useRef<BadgeInstance>(null);
  const exportFailedBadgeRef = React.useRef<BadgeInstance>(null);

  const pokePaste = React.useMemo(
    () => exportPokePaste(pokemon, format),
    [format, pokemon],
  );

  const handlePokePasteExport = () => void (async () => {
    if (!pokePaste) {
      return;
    }

    try {
      await writeClipboardText(pokePaste);

      exportBadgeRef.current?.show();
    } catch (error) {
      // if (__DEV__) {
      //   l.error(
      //     'Failed to export the set for', pokemon.speciesForme, 'to clipboard:',
      //     '\n', error,
      //     '\n', '(You will only see this error on development.)',
      //   );
      // }

      exportFailedBadgeRef.current?.show();
    }
  })();

  return (
    <div
      className={cx(
        styles.container,
        containerSize === 'xs' && styles.verySmol,
        // ['xs', 'sm'].includes(containerSize) && styles.smol,
        ['md', 'lg', 'xl'].includes(containerSize) && styles.veryThicc,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <div className={styles.row}>
        <div className={styles.piconContainer}>
          <PokeFormeTooltip
            pokemon={pokemon}
            visible={formesVisible}
            disabled={!settings?.reverseIconName}
            onPokemonChange={(p) => updatePokemon(p, `${baseScope}:PokeFormeTooltip~Picon:onPokemonChange()`)}
            onRequestClose={closeFormesTooltip}
          >
            <PiconButton
              piconStyle={pokemon?.name ? { transform: 'scaleX(-1)' } : undefined}
              pokemon={{
                ...pokemon,
                speciesForme: (
                  pokemon?.transformedForme
                    || pokemon?.speciesForme
                )?.replace(pokemon?.useMax ? '' : '-Gmax', ''), // replace('', '') does nothing btw
                item: itemName,
              }}
              // tooltip={settings?.reverseIconName ? nextFormeTooltip : smogonPageTooltip}
              tooltip={settings?.reverseIconName ? undefined : smogonPageTooltip}
              // tooltipDelay={[settings?.reverseIconName ? 500 : 1000, 50]}
              tooltipDelay={[1000, 50]}
              // tooltipDisabled={settings?.reverseIconName ? !nextForme : !settings?.showUiTooltips}
              tooltipDisabled={settings?.reverseIconName || !settings?.showUiTooltips}
              shadow
              disabled={piconDisabled}
              // onPress={settings?.reverseIconName ? switchToNextForme : openSmogonPage}
              onPress={settings?.reverseIconName ? toggleFormesTooltip : openSmogonPage}
            />
          </PokeFormeTooltip>
        </div>

        <div className={styles.infoContainer}>
          <div className={styles.firstLine}>
            <PokeFormeTooltip
              pokemon={pokemon}
              visible={formesVisible}
              disabled={settings?.reverseIconName}
              onPokemonChange={(p) => updatePokemon(p, `${baseScope}:PokeFormeTooltip~Name:onPokemonChange()`)}
              onRequestClose={closeFormesTooltip}
            >
              <Button
                className={cx(
                  styles.nameButton,
                  !pokemon?.speciesForme && styles.missingForme,
                  nameDisabled && styles.disabled,
                )}
                labelClassName={styles.nameLabel}
                label={nickname || pokemon?.speciesForme || 'MissingNo.'}
                // tooltip={settings?.reverseIconName ? smogonPageTooltip : nextFormeTooltip}
                tooltip={settings?.reverseIconName ? smogonPageTooltip : undefined}
                // tooltipDelay={[settings?.reverseIconName ? 1000 : 500, 50]}
                tooltipDelay={[1000, 50]}
                // tooltipDisabled={settings?.reverseIconName ? !settings?.showUiTooltips : !nextForme}
                tooltipDisabled={settings?.reverseIconName && !settings?.showUiTooltips}
                hoverScale={1}
                // absoluteHover
                disabled={nameDisabled}
                // onPress={settings?.reverseIconName ? openSmogonPage : switchToNextForme}
                onPress={settings?.reverseIconName ? openSmogonPage : toggleFormesTooltip}
              />
            </PokeFormeTooltip>

            {
              (typeof pokemon?.level === 'number' && pokemon.level !== 100) &&
              <div className={styles.level}>
                L{pokemon.level}
              </div>
            }

            <PokeTypeField
              className={styles.typesField}
              label={`Types for Pokemon ${friendlyPokemonName}`}
              multi
              input={{
                name: `PokeInfo:Types:${pokemonKey}`,
                value: [...(pokemon?.types || [])],
                onChange: (types: Showdown.TypeName[]) => updatePokemon({
                  types: [...(types || [])],
                }, `${baseScope}:PokeTypeField:input.onChange()`),
              }}
              tooltipPlacement="bottom-start"
              containerSize={gen > 8 ? containerSize : null}
              highlight={gen < 9 || !pokemon?.terastallized}
              readOnly={!editableTypes}
              disabled={!pokemon?.speciesForme}
            />

            {
              (!!pokemon?.speciesForme && gen > 8) &&
              <PokeTypeField
                className={cx(styles.typesField, styles.teraTypeField)}
                label={`Tera Type for Pokemon ${friendlyPokemonName}`}
                title="Tera Type"
                input={{
                  name: `PokeInfo:TeraType:${pokemonKey}`,
                  value: pokemon?.teraType || '???',
                  onChange: (type: Showdown.TypeName) => updatePokemon({
                    teraType: type,
                    terastallized: !!type && type !== '???' && pokemon?.terastallized,
                  }, `${baseScope}:PokeTypeField~Tera:input.onChange()`),
                }}
                tooltipPlacement="bottom-start"
                defaultTypeLabel="Tera"
                teraTyping
                containerSize={containerSize}
                highlight={pokemon?.terastallized}
                highlightTypes={Array.from(new Set([
                  ...flattenAlts(pokemon?.altTeraTypes),
                  pokemon?.revealedTeraType,
                ])).filter(Boolean)}
                typeUsages={pokemon?.altTeraTypes?.filter(detectUsageAlt)}
                disabled={!pokemon?.speciesForme}
              />
            }
          </div>

          <div className={styles.secondLine}>
            <PokeHpBar
              // className={styles.hpBar}
              hp={hpPercentage}
              width={100}
            />

            {
              !!hpPercentage &&
              <Tooltip
                content={(
                  <div className={styles.tooltipContent}>
                    {
                      (!pokemon.serverSourced && hpPercentage !== 1) &&
                      <>
                        <em>approx.</em>
                        <br />
                      </>
                    }

                    {currentHp} / {maxHp}
                  </div>
                )}
                offset={[0, 10]}
                delay={[250, 50]}
                trigger="mouseenter"
                touch={['hold', 500]}
                disabled={!maxHp}
              >
                <div className={styles.hpPercentage}>
                  {`${(hpPercentage * 100).toFixed(0)}%`}
                </div>
              </Tooltip>
            }

            {
              (!!pokemon?.speciesForme && (!!pokemon.status || !hpPercentage)) &&
              <div className={styles.statuses}>
                <PokeStatus
                  className={styles.status}
                  status={pokemon.status}
                  fainted={!hpPercentage}
                />
              </div>
            }
          </div>
        </div>

        <div className={styles.presetContainer}>
          <div className={cx(styles.label, styles.dropdownLabel)}>
            <div className={styles.presetHeader}>
              <div className={styles.presetHeaderPart}>
                Set

                <ToggleButton
                  className={styles.toggleButton}
                  label="Auto"
                  absoluteHover
                  // active={pokemon?.autoPreset}
                  disabled /** @todo remove after implementing auto-presets */
                  onPress={() => updatePokemon({
                    autoPreset: !pokemon?.autoPreset,
                  }, `${baseScope}:ToggleButton~AutoPreset:onPress()`)}
                />
              </div>

              <div className={cx(styles.presetHeaderPart, styles.presetHeaderRight)}>
                <ToggleButton
                  className={cx(
                    styles.toggleButton,
                    styles.importButton,
                  )}
                  label="Import"
                  tooltip={(
                    <div className={styles.tooltipContent}>
                      Import Pok&eacute;Paste from Clipboard
                    </div>
                  )}
                  tooltipPlacement="bottom"
                  tooltipDisabled={!settings?.showUiTooltips}
                  absoluteHover
                  disabled={!pokemon?.speciesForme || typeof updatePokemon !== 'function'}
                  onPress={handlePokePasteImport}
                >
                  <Badge
                    ref={importBadgeRef}
                    className={cx(styles.importBadge, styles.floating)}
                    label="Imported"
                    color="blue"
                  />

                  <Badge
                    ref={importFailedBadgeRef}
                    className={cx(styles.importBadge, styles.floating)}
                    label={importFailedReason}
                    color="red"
                  />
                </ToggleButton>

                <ToggleButton
                  className={cx(styles.toggleButton, styles.importButton)}
                  label="Export"
                  tooltip={pokePaste ? (
                    <div className={styles.pokePasteTooltip}>
                      {pokePaste}
                    </div>
                  ) : null}
                  tooltipPlacement="bottom"
                  absoluteHover
                  disabled={!pokePaste}
                  onPress={handlePokePasteExport}
                >
                  <Badge
                    ref={exportBadgeRef}
                    className={styles.importBadge}
                    label="Copied!"
                    color="green"
                  />

                  <Badge
                    ref={exportFailedBadgeRef}
                    className={styles.importBadge}
                    label="Failed"
                    color="red"
                  />
                </ToggleButton>
              </div>
            </div>
          </div>

          <Dropdown
            aria-label={`Available Sets for Pokemon ${friendlyPokemonName}`}
            hint="None"
            input={{
              name: `PokeInfo:Preset:${pokemonKey}:Dropdown`,
              value: pokemon?.presetId,
              onChange: (id: string) => applyPreset(id, null, `${baseScope}:Dropdown~Preset:input.onChange()`),
            }}
            options={presetOptions}
            noOptionsMessage="No Sets"
            clearable={false}
            loading={presetsLoading}
            loadingMessage="Downloading..."
            disabled={!pokemon?.speciesForme || presetsLoading || !presetOptions.length}
          />
        </div>
      </div>

      {
        gen > 1 &&
        <div
          className={styles.row}
          style={{ alignItems: 'flex-start' }}
        >
          <div className={styles.rowItem}>
            <div className={cx(styles.label, styles.dropdownLabel)}>
              Ability

              {
                showAbilityToggle &&
                <ToggleButton
                  className={styles.toggleButton}
                  label="Active"
                  tooltip={(
                    <div className={styles.tooltipContent}>
                      {pokemon.abilityToggled ? 'Deactivate' : 'Activate'}{' '}
                      {abilityName ? (
                        <strong>{abilityName}</strong>
                      ) : 'Ability'}
                    </div>
                  )}
                  tooltipDisabled={!settings?.showUiTooltips}
                  absoluteHover
                  active={pokemon.abilityToggled}
                  disabled={disableAbilityToggle}
                  onPress={() => updatePokemon({
                    abilityToggled: !pokemon.abilityToggled,
                  }, `${baseScope}:ToggleButton~AbilityToggled:onPress()`)}
                />
              }

              {
                showResetAbility &&
                <ToggleButton
                  className={styles.toggleButton}
                  label="Reset"
                  tooltip={(
                    <div className={styles.tooltipContent}>
                      Reset to Revealed
                      {' '}
                      {pokemon?.ability ? (
                        <strong>{pokemon.ability}</strong>
                      ) : 'Ability'}
                    </div>
                  )}
                  tooltipDisabled={!settings?.showUiTooltips}
                  absoluteHover
                  active
                  onPress={handleAbilityReset}
                />
              }
            </div>

            <Dropdown
              aria-label={`Available Abilities for Pokemon ${friendlyPokemonName}`}
              hint={legacy ? 'N/A' : '???'}
              // tooltip={abilityDescription ? (
              //   <div className={cx(styles.tooltipContent, styles.descTooltip)}>
              //     {abilityDescription}
              //   </div>
              // ) : null}
              // optionTooltip={abilityOptionTooltip}
              optionTooltip={PokeAbilityOptionTooltip}
              optionTooltipProps={{
                format,
                hidden: !settings?.showAbilityTooltip,
              }}
              input={{
                name: `PokeInfo:Ability:${pokemonKey}:Dropdown`,
                value: abilityName,
                onChange: handleAbilityChange,
              }}
              options={abilityOptions}
              noOptionsMessage="No Abilities"
              clearable={false}
              disabled={legacy || !pokemon?.speciesForme}
            />
          </div>

          <div className={styles.rowItem}>
            <div className={cx(styles.label, styles.dropdownLabel)}>
              Nature
            </div>

            <Dropdown
              aria-label={`Available Natures for Pokemon ${friendlyPokemonName}`}
              hint={legacy ? 'N/A' : '???'}
              input={{
                name: `PokeInfo:Nature:${pokemonKey}:Dropdown`,
                value: pokemon?.nature,
                onChange: (name: Showdown.PokemonNature) => updatePokemon({
                  nature: name,
                }, `${baseScope}:Dropdown~Nature:input.onChange()`),
              }}
              options={PokemonCommonNatures.map((name) => ({
                label: name,
                rightLabel: PokemonNatureBoosts[name]?.length ? [
                  !!PokemonNatureBoosts[name][0] && `+${PokemonNatureBoosts[name][0].toUpperCase()}`,
                  !!PokemonNatureBoosts[name][1] && `-${PokemonNatureBoosts[name][1].toUpperCase()}`,
                ].filter(Boolean).join(' ') : 'Neutral',
                value: name,
              }))}
              noOptionsMessage="No Natures"
              clearable={false}
              // hideSelections
              disabled={legacy || !pokemon?.speciesForme}
            />
          </div>

          <div className={styles.rowItem}>
            <div className={cx(styles.label, styles.dropdownLabel)}>
              Item

              {
                showResetItem &&
                <ToggleButton
                  className={styles.toggleButton}
                  label="Reset"
                  tooltip={(
                    <div className={styles.tooltipContent}>
                      Reset to
                      {' '}
                      {(
                        pokemon?.prevItemEffect
                          || pokemon?.itemEffect
                      )?.split(' ').map((w) => capitalize(w)).join('-') || 'Revealed'}
                      {' '}
                      {pokemon?.prevItem || pokemon?.item ? (
                        <>
                          <br />
                          <strong>{pokemon.prevItem || pokemon.item}</strong>
                        </>
                      ) : 'Item'}
                    </div>
                  )}
                  tooltipDisabled={!settings?.showUiTooltips}
                  absoluteHover
                  active
                  onPress={() => updatePokemon({
                    dirtyItem: null,
                  }, `${baseScope}:ToggleButton~DirtyItem:onPress()`)}
                />
              }
            </div>

            <Dropdown
              aria-label={`Available Items for Pokemon ${friendlyPokemonName}`}
              hint={gen === 1 ? 'N/A' : 'None'}
              tooltip={pokemon?.itemEffect || pokemon?.prevItem ? (
                <div
                  className={cx(
                    styles.tooltipContent,
                    styles.descTooltip,
                    styles.itemTooltip,
                  )}
                >
                  {
                    !!pokemon?.itemEffect &&
                    <div className={styles.itemEffect}>
                      {pokemon.itemEffect}
                    </div>
                  }
                  {
                    !!pokemon?.prevItem &&
                    <>
                      <div className={styles.itemEffect}>
                        {pokemon.prevItemEffect || 'Previous'}
                      </div>
                      <div className={styles.itemName}>
                        {pokemon.prevItem}
                      </div>
                    </>
                  }
                </div>
              ) : null}
              // optionTooltip={itemOptionTooltip}
              optionTooltip={PokeItemOptionTooltip}
              optionTooltipProps={{
                format,
                hidden: !settings?.showItemTooltip,
              }}
              input={{
                name: `PokeInfo:Item:${pokemonKey}:Dropdown`,
                value: itemName,
                onChange: (name: ItemName) => updatePokemon({
                  dirtyItem: name ?? ('' as ItemName),
                }, `${baseScope}:Dropdown~Item:input.onChange()`),
              }}
              options={itemOptions}
              noOptionsMessage="No Items"
              disabled={gen === 1 || !pokemon?.speciesForme}
            />
          </div>
        </div>
      }
    </div>
  );
};
