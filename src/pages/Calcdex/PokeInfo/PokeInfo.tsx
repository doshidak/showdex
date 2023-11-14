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
import { PokemonCommonNatures, PokemonNatureBoosts, PokemonRuinAbilities } from '@showdex/consts/dex';
import { type CalcdexPlayerSide } from '@showdex/interfaces/calc';
import { useColorScheme } from '@showdex/redux/store';
import { openSmogonUniversity } from '@showdex/utils/app';
import { calcPokemonHpPercentage } from '@showdex/utils/calc';
import { readClipboardText, writeClipboardText } from '@showdex/utils/core';
import { hasNickname, legalLockedFormat, toggleableAbility } from '@showdex/utils/dex';
import { type ElementSizeLabel, useRandomUuid } from '@showdex/utils/hooks';
import { capitalize } from '@showdex/utils/humanize';
import { dehydrateSpread, hydrateSpread } from '@showdex/utils/hydro';
import {
  detectUsageAlt,
  exportPokePaste,
  flattenAlts,
  importPokePaste,
} from '@showdex/utils/presets';
import {
  buildAbilityOptions,
  buildItemOptions,
  buildPresetOptions,
  buildSpreadOptions,
} from '@showdex/utils/ui';
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
    player,
    playerPokemon: pokemon,
    presetsLoading,
    presets,
    usages,
    usage,
    applyPreset,
    updatePokemon,
  } = useCalcdexPokeContext();

  const {
    gen,
    format,
    legacy,
    gameType,
  } = state;

  const colorScheme = useColorScheme();
  const randomUuid = useRandomUuid();

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || randomUuid || '???';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

  const nickname = (
    hasNickname(pokemon)
      && settings?.showNicknames
      && pokemon.name
  ) || null;

  const hpPercentage = calcPokemonHpPercentage(pokemon);
  const abilityName = pokemon?.dirtyAbility ?? pokemon?.ability;
  const itemName = pokemon?.dirtyItem ?? pokemon?.item;

  const abilityOptions = React.useMemo(() => (legacy ? [] : buildAbilityOptions(
    format,
    pokemon,
    usage,
    settings?.showAllOptions,
  )), [
    legacy,
    format,
    pokemon,
    settings?.showAllOptions,
    usage,
  ]);

  const showAbilityToggle = React.useMemo(() => toggleableAbility(
    pokemon,
    gameType,
  ), [
    gameType,
    pokemon,
  ]);

  // ability toggle would only be disabled for inactive Pokemon w/ Ruin abilities (gen 9) in Doubles
  const disableAbilityToggle = React.useMemo(() => (
    showAbilityToggle
      && PokemonRuinAbilities.includes(abilityName)
      && !pokemon.abilityToggled
      && ([
        'ruinBeadsCount',
        'ruinSwordCount',
        'ruinTabletsCount',
        'ruinVesselCount',
      ] as (keyof CalcdexPlayerSide)[])
        .reduce((sum, key) => sum + ((player?.side?.[key] as number) || 0), 0) >= 2
  ), [
    abilityName,
    player?.side,
    pokemon?.abilityToggled,
    showAbilityToggle,
  ]);

  const showResetAbility = React.useMemo(() => !!pokemon?.speciesForme && (
    pokemon.dirtyAbility
      && !pokemon.transformedForme
      && !!pokemon.ability
      && pokemon.ability !== pokemon.dirtyAbility
  ), [
    pokemon?.ability,
    pokemon?.dirtyAbility,
    pokemon?.speciesForme,
    pokemon?.transformedForme,
  ]);

  const appliedPreset = React.useMemo(() => (
    !!pokemon?.speciesForme
      && presets.find((p) => p?.calcdexId === pokemon.presetId)
  ) || null, [
    pokemon?.presetId,
    pokemon?.speciesForme,
    presets,
  ]);

  const currentSpread = React.useMemo(() => (pokemon?.speciesForme ? dehydrateSpread({
    nature: pokemon.nature,
    ivs: { ...pokemon.ivs },
    evs: { ...pokemon.evs },
  }, {
    format,
  }) : null), [
    format,
    pokemon?.evs,
    pokemon?.ivs,
    pokemon?.nature,
    pokemon?.speciesForme,
  ]);

  const natureOptions = React.useMemo(() => PokemonCommonNatures.map((name) => ({
    label: name,
    rightLabel: PokemonNatureBoosts[name]?.length ? [
      !!PokemonNatureBoosts[name][0] && `+${PokemonNatureBoosts[name][0].toUpperCase()}`,
      !!PokemonNatureBoosts[name][1] && `-${PokemonNatureBoosts[name][1].toUpperCase()}`,
    ].filter(Boolean).join(' ') : 'Neutral',
    value: name,
  })), []);

  const spreadOptions = React.useMemo(() => (pokemon?.speciesForme ? buildSpreadOptions(
    appliedPreset,
    {
      format,
      usage: format?.includes('random') ? null : usage,
    },
  ) : []), [
    appliedPreset,
    format,
    pokemon?.speciesForme,
    usage,
  ]);

  const showSpreadsToggle = React.useMemo(() => !!pokemon?.speciesForme && (
    !!spreadOptions.length
      && (spreadOptions.length > 1 || !currentSpread || spreadOptions[0].value !== currentSpread)
  ), [
    currentSpread,
    pokemon?.speciesForme,
    spreadOptions,
  ]);

  const itemOptions = React.useMemo(() => (gen === 1 ? [] : buildItemOptions(
    format,
    pokemon,
    usage,
    // settings?.showAllOptions,
    true, // fuck it w/e lol (instead of using settings.showAllOptions)
  )), [
    format,
    gen,
    pokemon,
    // settings?.showAllOptions,
    usage,
  ]);

  const showResetItem = React.useMemo(() => (
    !!pokemon?.dirtyItem
      && (!!pokemon.item || !!pokemon.prevItem)
      && ((pokemon.item !== pokemon.dirtyItem) || !!pokemon.prevItem)
  ), [
    pokemon?.dirtyItem,
    pokemon?.item,
    pokemon?.prevItem,
  ]);

  const {
    active: formesVisible,
    requestOpen: openFormesTooltip,
    notifyClose: closeFormesTooltip,
  } = useSandwich();

  const toggleFormesTooltip = React.useMemo(
    () => (formesVisible ? closeFormesTooltip : openFormesTooltip),
    [closeFormesTooltip, formesVisible, openFormesTooltip],
  );

  const {
    active: statusVisible,
    requestOpen: openStatusTooltip,
    notifyClose: closeStatusTooltip,
  } = useSandwich();

  const toggleStatusTooltip = React.useMemo(
    () => (statusVisible ? closeStatusTooltip : openStatusTooltip),
    [closeStatusTooltip, openStatusTooltip, statusVisible],
  );

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

  const formeDisabled = !pokemon?.altFormes?.length;

  const showNonVolatileStatus = React.useMemo(() => !!pokemon?.speciesForme && (
    settings?.forceNonVolatile
      || !!pokemon.dirtyStatus
      || !!pokemon.status
      || !pokemon.hp // 'fnt' pseudo-status
  ), [
    pokemon?.dirtyStatus,
    pokemon?.hp,
    pokemon?.speciesForme,
    pokemon?.status,
    settings?.forceNonVolatile,
  ]);

  const currentStatus = showNonVolatileStatus
    ? (pokemon.dirtyStatus ?? (pokemon.status || 'ok')) // status is typically `''` if none
    : null;

  const editableTypes = settings?.editPokemonTypes === 'always'
    || (settings?.editPokemonTypes === 'meta' && !legalLockedFormat(format));

  const presetOptions = React.useMemo(() => buildPresetOptions(
    presets,
    usages,
    pokemon,
  ), [
    pokemon,
    presets,
    usages,
  ]);

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
            disabled={!pokemon?.speciesForme || !settings?.openSmogonPage}
            onPress={() => openSmogonUniversity(
              gen,
              'pokemon',
              pokemon?.speciesForme,
              format,
            )}
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
              containerSize={gen > 8 && (
                pokemon?.dirtyTypes?.length
                  || pokemon?.types?.length
                  || 0
              ) !== 1 ? containerSize : null}
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
                containerSize={(
                  pokemon?.dirtyTypes?.length
                    || pokemon?.types?.length
                    || 0
                ) !== 1 ? containerSize : null}
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
              onRequestClose={closeStatusTooltip}
            >
              <BaseButton
                className={styles.statusButton}
                display="block"
                aria-label={`Hit Points & Non-Volatile Status Condition for Pok${eacute}mon ${friendlyPokemonName}`}
                hoverScale={1}
                onPress={toggleStatusTooltip}
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
              name: `PokeInfo:${pokemonKey}:Preset`,
              value: pokemon?.presetId,
              onChange: (id: string) => applyPreset(
                id,
                null,
                `${baseScope}:Dropdown~Preset:input.onChange()`,
              ),
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
            <div
              className={cx(
                styles.label,
                legacy && styles.legacy,
                styles.dropdownLabel,
              )}
            >
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
                  onPress={() => updatePokemon({
                    dirtyAbility: null,
                  }, `${baseScope}:ToggleButton~DirtyAbility:onPress()`)}
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
                name: `PokeInfo:${pokemonKey}:Ability`,
                value: legacy ? null : abilityName,
                onChange: (value: AbilityName) => updatePokemon({
                  dirtyAbility: value,
                }, `${baseScope}:Dropdown~DirtyAbility:input.onChange()`),
              }}
              options={abilityOptions}
              noOptionsMessage="No Abilities"
              clearable={false}
              highlight={pokemon?.abilityToggled}
              disabled={legacy || !pokemon?.speciesForme}
            />
          </div>

          <div className={styles.rowItem}>
            <div
              className={cx(
                styles.label,
                legacy && styles.legacy,
                styles.dropdownLabel,
              )}
            >
              {pokemon?.showPresetSpreads ? 'Spread' : 'Nature'}

              {
                showSpreadsToggle &&
                <ToggleButton
                  className={styles.toggleButton}
                  label={pokemon.showPresetSpreads ? 'Nature' : 'Spread'}
                  tooltip={(
                    <div className={styles.tooltipContent}>
                      Switch to{' '}
                      <strong>{pokemon.showPresetSpreads ? 'Natures' : 'Spreads'}</strong>
                    </div>
                  )}
                  tooltipDisabled={!settings?.showUiTooltips}
                  absoluteHover
                  onPress={() => updatePokemon({
                    showPresetSpreads: !pokemon.showPresetSpreads,
                  }, `${baseScope}:ToggleButton~Spread:onPress()`)}
                />
              }
            </div>

            <Dropdown
              aria-label={`Available ${pokemon?.showPresetSpreads ? 'Spreads' : 'Natures'} for Pok${eacute}mon ${friendlyPokemonName}`}
              hint={legacy ? 'N/A' : (pokemon?.showPresetSpreads ? (currentSpread || 'Custom') : '???')}
              input={{
                name: `PokeInfo:${pokemonKey}:${pokemon?.showPresetSpreads ? 'Spreads' : 'Natures'}`,
                value: pokemon?.showPresetSpreads ? currentSpread : pokemon?.nature,
                onChange: (name: string) => updatePokemon(
                  pokemon?.showPresetSpreads
                    ? hydrateSpread(name, { format })
                    : { nature: name as Showdown.NatureName },
                  `${baseScope}:Dropdown~${pokemon?.showPresetSpreads ? 'Spread' : 'Nature'}:input.onChange()`,
                ),
              }}
              options={pokemon?.showPresetSpreads ? spreadOptions : natureOptions}
              noOptionsMessage={`No ${pokemon?.showPresetSpreads ? 'Spreads' : 'Natures'}`}
              clearable={false}
              disabled={legacy || !pokemon?.speciesForme}
            />
          </div>

          <div className={styles.rowItem}>
            <div
              className={cx(
                styles.label,
                gen === 1 && styles.legacy,
                styles.dropdownLabel,
              )}
            >
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
                name: `PokeInfo:${pokemonKey}:Item`,
                value: gen === 1 ? null : itemName,
                onChange: (name: ItemName) => updatePokemon({
                  dirtyItem: name ?? ('' as ItemName),
                }, `${baseScope}:Dropdown~DirtyItem:input.onChange()`),
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
