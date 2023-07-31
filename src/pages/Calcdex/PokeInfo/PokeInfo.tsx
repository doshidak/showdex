import * as React from 'react';
import cx from 'classnames';
import { type AbilityName, type ItemName } from '@smogon/calc';
import {
  PiconButton,
  PokeFormeTooltip,
  PokeHpBar,
  PokeStatus,
  PokeStatusTooltip,
} from '@showdex/components/app';
import { Dropdown, PokeTypeField } from '@showdex/components/form';
import { useSandwich } from '@showdex/components/layout';
import {
  type BadgeInstance,
  Badge,
  BaseButton,
  Button,
  ToggleButton,
} from '@showdex/components/ui';
import { eacute } from '@showdex/consts/core';
import { PokemonCommonNatures, PokemonNatureBoosts } from '@showdex/consts/dex';
import { type CalcdexPlayerSide, useColorScheme } from '@showdex/redux/store';
import { openSmogonUniversity } from '@showdex/utils/app';
import { detectToggledAbility } from '@showdex/utils/battle';
import { calcPokemonHpPercentage } from '@showdex/utils/calc';
import { formatId, readClipboardText, writeClipboardText } from '@showdex/utils/core';
import { hasNickname, legalLockedFormat } from '@showdex/utils/dex';
import { type ElementSizeLabel, useRandomUuid } from '@showdex/utils/hooks';
import { capitalize } from '@showdex/utils/humanize';
import {
  detectUsageAlt,
  exportPokePaste,
  flattenAlts,
  importPokePaste,
} from '@showdex/utils/presets';
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
  const randomUuid = useRandomUuid();

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || randomUuid || '???';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

  const nickname = hasNickname(pokemon) && settings?.showNicknames
    ? pokemon.name
    : null;

  const hpPercentage = calcPokemonHpPercentage(pokemon);
  const abilityName = pokemon?.dirtyAbility ?? pokemon?.ability;
  const itemName = pokemon?.dirtyItem ?? pokemon?.item;

  // for Ruin abilities (gen 9), only show the ability toggle in Doubles
  const showAbilityToggle = pokemon?.abilityToggleable && (
    !formatId(abilityName)?.endsWith('ofruin')
      || field?.gameType === 'Doubles'
  );

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

  const {
    active: formesVisible,
    requestOpen: openFormesTooltip,
    notifyClose: closeFormesTooltip,
  } = useSandwich();

  const toggleFormesTooltip = formesVisible ? closeFormesTooltip : openFormesTooltip;

  const {
    active: statusVisible,
    requestOpen: requestStatusOpen,
    notifyClose: notifyStatusClose,
  } = useSandwich();

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

  const showNonVolatileStatus = !!pokemon?.speciesForme && (
    settings?.forceNonVolatile
      || !!pokemon.dirtyStatus
      || !!pokemon.status
      || !pokemon.hp // 'fnt' pseudo-status
  );

  const currentStatus = showNonVolatileStatus
    ? (pokemon.dirtyStatus ?? (pokemon.status || 'ok')) // status is typically `''` if none
    : null;

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
            tooltip={smogonPageTooltip}
            tooltipDelay={[1000, 50]}
            tooltipDisabled={!settings?.showUiTooltips}
            shadow
            disabled={smogonDisabled}
            onPress={openSmogonPage}
          />
        </div>

        <div className={styles.infoContainer}>
          <div className={styles.firstLine}>
            <PokeFormeTooltip
              pokemon={pokemon}
              visible={formesVisible}
              onPokemonChange={(p) => updatePokemon(p, `${baseScope}:PokeFormeTooltip:onPokemonChange()`)}
              onRequestClose={closeFormesTooltip}
            >
              <Button
                className={cx(
                  styles.nameButton,
                  !pokemon?.speciesForme && styles.missingForme,
                  !formeDisabled && styles.withFormes,
                  formeDisabled && styles.disabled,
                )}
                labelClassName={styles.nameLabel}
                label={nickname || pokemon?.speciesForme || 'MissingNo.'}
                suffix={!formeDisabled && (
                  <i
                    className={cx(
                      'fa',
                      'fa-chevron-down',
                      styles.formeChevron,
                      formesVisible && styles.open,
                    )}
                  />
                )}
                hoverScale={1}
                disabled={formeDisabled}
                onPress={toggleFormesTooltip}
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
                value: [...(pokemon?.dirtyTypes || [])],
                onChange: (types: Showdown.TypeName[]) => updatePokemon({
                  dirtyTypes: [...(types || [])],
                }, `${baseScope}:PokeTypeField:input.onChange()`),
              }}
              tooltipPlacement="bottom-start"
              containerSize={gen > 8 ? containerSize : null}
              highlight={gen < 9 || !pokemon?.terastallized}
              highlightTypes={pokemon?.types}
              revealedTypes={pokemon?.types}
              readOnly={!editableTypes}
              disabled={!pokemon?.speciesForme}
            />

            {
              (!!pokemon?.speciesForme && gen > 8) &&
              <PokeTypeField
                className={cx(styles.typesField, styles.teraTypeField)}
                label={`Tera Type for Pok${eacute}mon ${friendlyPokemonName}`}
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
                revealedTypes={pokemon?.revealedTeraType ? [
                  pokemon.revealedTeraType,
                ] : undefined}
                typeUsages={pokemon?.altTeraTypes?.filter(detectUsageAlt)}
                disabled={!pokemon?.speciesForme}
              />
            }
          </div>

          <div className={styles.secondLine}>
            <PokeHpBar
              hp={hpPercentage}
              width={100}
            />

            <PokeStatusTooltip
              pokemon={pokemon}
              visible={statusVisible}
              disabled={!pokemon?.speciesForme}
              onPokemonChange={(p) => updatePokemon(p, `${baseScope}:PokeStatusTooltip:onPokemonChange()`)}
              onRequestClose={notifyStatusClose}
            >
              <BaseButton
                className={styles.statusButton}
                display="block"
                aria-label={`Hit Points & Non-Volatile Status Condition for Pok${eacute}mon ${friendlyPokemonName}`}
                hoverScale={1}
                onPress={requestStatusOpen}
                disabled={!pokemon?.speciesForme}
              >
                {
                  hpPercentage > 0 &&
                  <div className={styles.hpPercentage}>
                    {Math.round(hpPercentage * 100)}%
                  </div>
                }

                {
                  showNonVolatileStatus &&
                  <div className={styles.statuses}>
                    <PokeStatus
                      status={currentStatus === 'ok' ? undefined : currentStatus}
                      override={currentStatus === 'ok' ? currentStatus : undefined}
                      fainted={!hpPercentage}
                      highlight
                      containerSize={containerSize}
                    />
                  </div>
                }
              </BaseButton>
            </PokeStatusTooltip>
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
            aria-label={`Available Sets for Pok${eacute}mon ${friendlyPokemonName}`}
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
              aria-label={`Available Abilities for Pok${eacute}mon ${friendlyPokemonName}`}
              hint={legacy ? 'N/A' : '???'}
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
              aria-label={`Available Natures for Pok${eacute}mon ${friendlyPokemonName}`}
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
              aria-label={`Available Items for Pok${eacute}mon ${friendlyPokemonName}`}
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
