import * as React from 'react';
import cx from 'classnames';
import { type AbilityName, type ItemName } from '@smogon/calc';
import {
  PiconButton,
  PokeAbilityOptionTooltip,
  PokeFormeTooltip,
  PokeGlanceOptionTooltip,
  PokeHpBar,
  PokeItemOptionTooltip,
  PokeStatus,
  PokeStatusTooltip,
} from '@showdex/components/app';
import { Dropdown, PokeTypeField, ValueField } from '@showdex/components/form';
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
import { calcPokemonHpPercentage, populateStatsTable } from '@showdex/utils/calc';
import { readClipboardText, writeClipboardText } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { hasNickname, legalLockedFormat, toggleableAbility } from '@showdex/utils/dex';
import { useRandomUuid } from '@showdex/utils/hooks';
import { openSmogonDex } from '@showdex/utils/host';
import { capitalize } from '@showdex/utils/humanize';
import { dehydrateSpread, hydrateSpread } from '@showdex/utils/hydro';
import {
  detectUsageAlt,
  exportPokePaste,
  flattenAlt,
  flattenAlts,
  importPokePaste,
} from '@showdex/utils/presets';
import {
  buildAbilityOptions,
  buildFormeOptions,
  buildItemOptions,
  buildPresetOptions,
  buildSpreadOptions,
} from '@showdex/utils/ui';
import { useCalcdexPokeContext } from '../CalcdexPokeContext';
import styles from './PokeInfo.module.scss';

export interface PokeInfoProps {
  className?: string;
  style?: React.CSSProperties;
}

const l = logger('@showdex/components/calc/PokeInfo');

export const PokeInfo = ({
  className,
  style,
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
    addPokemon,
    updatePokemon,
    removePokemon,
    applyPreset,
  } = useCalcdexPokeContext();

  const {
    operatingMode,
    containerSize,
    gen,
    format,
    subFormats,
    legacy,
    gameType,
    defaultLevel,
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

  const abilityOptions = React.useMemo(() => buildAbilityOptions(
    format,
    pokemon,
    usage,
    settings?.showAllOptions,
  ), [
    format,
    pokemon,
    settings?.showAllOptions,
    usage,
  ]);

  const showAbilityToggle = toggleableAbility(pokemon, gameType);

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

  const showResetAbility = !!pokemon?.speciesForme && (
    pokemon.dirtyAbility
      && !pokemon.transformedForme
      && !!pokemon.ability
      && pokemon.ability !== pokemon.dirtyAbility
  );

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

  const showSpreadsToggle = (
    !!pokemon?.speciesForme
      && !legacy
      && !!spreadOptions.length
      && (
        spreadOptions.length > 1
          || !currentSpread
          || (spreadOptions[0]?.options?.[0] || spreadOptions[0])?.value !== currentSpread
      )
  );

  const showPresetSpreads = showSpreadsToggle && pokemon.showPresetSpreads;

  const itemOptions = React.useMemo(() => buildItemOptions(
    format,
    pokemon,
    usage,
  ), [
    format,
    pokemon,
    usage,
  ]);

  const showResetItem = (
    !!pokemon?.dirtyItem
      && (!!pokemon.item || !!pokemon.prevItem)
      && ((pokemon.item !== pokemon.dirtyItem) || !!pokemon.prevItem)
  );

  const {
    active: formesVisible,
    requestOpen: openFormesTooltip,
    notifyClose: closeFormesTooltip,
  } = useSandwich();

  const toggleFormesTooltip = formesVisible ? closeFormesTooltip : openFormesTooltip;

  const {
    active: statusVisible,
    requestOpen: openStatusTooltip,
    notifyClose: closeStatusTooltip,
  } = useSandwich();

  const toggleStatusTooltip = statusVisible ? closeStatusTooltip : openStatusTooltip;

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

  const showFormeDropdown = operatingMode === 'standalone';

  const formeOptions = React.useMemo(() => buildFormeOptions(
    showFormeDropdown ? format : null,
    pokemon,
  ), [
    format,
    pokemon,
    showFormeDropdown,
  ]);

  const formeDisabled = !pokemon?.altFormes?.length;

  const showNonVolatileStatus = (
    operatingMode === 'standalone'
      || !!pokemon?.speciesForme
  ) && (
    settings?.forceNonVolatile
      || !!pokemon?.dirtyStatus
      || !!pokemon.status
      || !pokemon.hp // 'fnt' pseudo-status
  );

  const currentStatus = pokemon?.speciesForme && showNonVolatileStatus
    ? (pokemon.dirtyStatus ?? (pokemon.status || 'ok')) // status is typically `''` if none
    : null;

  const editableTypes = settings?.editPokemonTypes === 'always'
    || (settings?.editPokemonTypes === 'meta' && !legalLockedFormat(format));

  const presetOptions = React.useMemo(() => buildPresetOptions(
    format,
    pokemon,
    presets,
    usages,
  ), [
    format,
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

      const speciesMismatch = ![
        pokemon?.speciesForme,
        ...(pokemon?.altFormes || []),
      ].filter(Boolean).includes(preset?.speciesForme);

      const importFailed = !preset?.calcdexId || (operatingMode === 'battle' && speciesMismatch);

      if (importFailed) {
        setImportFailedReason(!preset?.calcdexId ? 'Bad Syntax' : 'Mismatch');
        importFailedBadgeRef.current?.show();

        return;
      }

      if (operatingMode === 'standalone' && speciesMismatch) {
        addPokemon({
          speciesForme: preset.speciesForme,
          level: preset.level,
          dirtyTeraType: flattenAlt(preset.teraTypes?.[0]),
          dirtyAbility: preset.ability,
          dirtyItem: preset.item,
          nature: preset.nature,
          ivs: populateStatsTable(preset.ivs, { spread: 'iv', format }),
          evs: populateStatsTable(preset.evs, { spread: 'ev', format }),
          moves: preset.moves,
          presetId: preset.calcdexId,
          presets: [preset],
        }, `${l.scope}:handlePokePasteImport()`);

        return void importBadgeRef.current?.show();
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
      }, `${l.scope}:handlePokePasteImport()`);

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
        ['md', 'lg', 'xl'].includes(containerSize) && styles.thicc,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <div className={styles.row}>
        <div className={styles.piconContainer}>
          <PiconButton
            piconStyle={{
              ...(!!pokemon?.name && { transform: 'scaleX(-1)' }),
              ...(!pokemon?.speciesForme && { opacity: 0.32 }),
            }}
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
            onPress={() => openSmogonDex(
              gen,
              'pokemon',
              pokemon?.speciesForme,
              [format, ...(subFormats || [])].filter(Boolean).join(''),
            )}
          />
        </div>

        <div className={styles.infoContainer}>
          <div
            className={cx(
              styles.firstLine,
              operatingMode === 'standalone' && styles.standalone,
            )}
          >
            {operatingMode === 'standalone' ? (
              <Dropdown
                className={styles.formeDropdown}
                aria-label={`Pok${eacute}mon Selector`}
                hint="MissingNo."
                optionTooltip={PokeGlanceOptionTooltip}
                optionTooltipProps={{ format }}
                input={{
                  name: `${l.scope}:${pokemonKey}:SpeciesForme`,
                  value: pokemon?.speciesForme,
                  onChange: (value: string) => {
                    const s = `${l.scope}:Dropdown~SpeciesForme:input.onChange()`;

                    if (!pokemon?.speciesForme) {
                      return void addPokemon({ speciesForme: value }, s);
                    }

                    if (!value) {
                      return void removePokemon(pokemon.calcdexId, s);
                    }

                    updatePokemon({ speciesForme: value }, s);
                  },
                }}
                options={formeOptions}
                noOptionsMessage={`No Pok${eacute}mon`}
                clearable
                highlight={!pokemon?.speciesForme}
              />
            ) : (
              <PokeFormeTooltip
                pokemon={pokemon}
                visible={formesVisible}
                onPokemonChange={(p) => updatePokemon(p, `${l.scope}:PokeFormeTooltip:onPokemonChange()`)}
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
            )}

            {
              (operatingMode === 'battle' && !!pokemon?.level && pokemon.level !== 100) &&
              <div className={styles.level}>
                <div className={styles.dim}>
                  L{pokemon.level}
                </div>
              </div>
            }

            {
              operatingMode === 'standalone' &&
              <div className={cx(styles.level, styles.standalone)}>
                <div
                  className={cx(
                    styles.dim,
                    !pokemon?.speciesForme && styles.disabled,
                  )}
                >
                  L
                </div>
                <ValueField
                  className={cx(
                    styles.levelField,
                    styles.absoluteHover,
                    !pokemon?.speciesForme && styles.disabled,
                  )}
                  inputClassName={styles.levelInputField}
                  label={`Level for ${friendlyPokemonName}`}
                  hideLabel
                  hint={(
                    pokemon?.speciesForme
                      ? (pokemon.level?.toString() || defaultLevel)
                      : '???'
                  )}
                  fallbackValue={pokemon?.speciesForme ? defaultLevel : null}
                  min={1}
                  max={100}
                  step={1}
                  shiftStep={10}
                  clearOnFocus
                  absoluteHover
                  input={{
                    name: `${l.scope}:${pokemonKey}:Level`,
                    value: pokemon?.speciesForme ? (pokemon.level || defaultLevel) : null,
                    onChange: (value: number) => updatePokemon({
                      level: value,
                    }, `${l.scope}:ValueField~Level:input.onChange()`),
                  }}
                  disabled={!pokemon?.speciesForme}
                />
              </div>
            }

            <PokeTypeField
              className={styles.typesField}
              label={`Types for ${friendlyPokemonName}`}
              multi
              input={{
                name: `${l.scope}:${pokemonKey}:Types`,
                value: [...(pokemon?.dirtyTypes || [])],
                onChange: (types: Showdown.TypeName[]) => updatePokemon({
                  dirtyTypes: [...(types || [])],
                }, `${l.scope}:PokeTypeField:input.onChange()`),
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
                label={`Tera Type for ${friendlyPokemonName}`}
                title="Tera Type"
                input={{
                  name: `${l.scope}:${pokemonKey}:TeraType`,
                  value: pokemon?.dirtyTeraType || pokemon?.teraType || '???',
                  onChange: (type: Showdown.TypeName) => updatePokemon({
                    dirtyTeraType: type,
                    terastallized: !!type && type !== '???' && pokemon?.terastallized,
                  }, `${l.scope}:PokeTypeField~Tera:input.onChange()`),
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
                  pokemon?.teraType,
                ])).filter(Boolean)}
                revealedTypes={[pokemon?.teraType].filter(Boolean)}
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
              onPokemonChange={(p) => updatePokemon(p, `${l.scope}:PokeStatusTooltip:onPokemonChange()`)}
              onRequestClose={closeStatusTooltip}
            >
              <BaseButton
                className={styles.statusButton}
                display="block"
                aria-label={`Hit Points & Non-Volatile Status Condition for ${friendlyPokemonName}`}
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
                      className={cx(
                        styles.status,
                        !pokemon?.speciesForme && styles.disabled,
                      )}
                      status={!pokemon?.speciesForme || currentStatus === 'ok' ? undefined : currentStatus}
                      override={(
                        !pokemon?.speciesForme
                          ? '???'
                          : currentStatus === 'ok'
                            ? currentStatus
                            : undefined
                      )}
                      fainted={!!pokemon?.speciesForme && !hpPercentage}
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

                {
                  operatingMode === 'battle' &&
                  <ToggleButton
                    className={styles.toggleButton}
                    label="Auto"
                    absoluteHover
                    // active={pokemon?.autoPreset}
                    disabled /** @todo remove after implementing auto-presets */
                    onPress={() => updatePokemon({
                      autoPreset: !pokemon?.autoPreset,
                    }, `${l.scope}:ToggleButton~AutoPreset:onPress()`)}
                  />
                }
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
                  disabled={(
                    (operatingMode === 'battle' && !pokemon?.speciesForme)
                      || typeof updatePokemon !== 'function'
                  )}
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
            aria-label={`Available Sets for ${friendlyPokemonName}`}
            hint={pokemon?.speciesForme ? 'None' : '???'}
            input={{
              name: `${l.scope}:${pokemonKey}:${pokemonKey}:Preset`,
              value: pokemon?.presetId,
              onChange: (id: string) => applyPreset(
                id,
                null,
                `${l.scope}:Dropdown~Preset:input.onChange()`,
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
        <div className={styles.row}>
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
                  }, `${l.scope}:ToggleButton~AbilityToggled:onPress()`)}
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
                  }, `${l.scope}:ToggleButton~DirtyAbility:onPress()`)}
                />
              }
            </div>

            <Dropdown
              aria-label={`Available Abilities for ${friendlyPokemonName}`}
              hint={legacy ? 'N/A' : '???'}
              optionTooltip={PokeAbilityOptionTooltip}
              optionTooltipProps={{
                format,
                hidden: !settings?.showAbilityTooltip,
              }}
              input={{
                name: `${l.scope}:${pokemonKey}:${pokemonKey}:Ability`,
                value: legacy ? null : abilityName,
                onChange: (value: AbilityName) => updatePokemon({
                  dirtyAbility: value,
                }, `${l.scope}:Dropdown~DirtyAbility:input.onChange()`),
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
              {showPresetSpreads ? 'Spread' : 'Nature'}

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
                  }, `${l.scope}:ToggleButton~Spread:onPress()`)}
                />
              }
            </div>

            <Dropdown
              aria-label={`Available ${showPresetSpreads ? 'Spreads' : 'Natures'} for ${friendlyPokemonName}`}
              hint={legacy ? 'N/A' : (showPresetSpreads ? (currentSpread || 'Custom') : '???')}
              input={{
                name: `${l.scope}:${pokemonKey}:${pokemonKey}:${showPresetSpreads ? 'Spreads' : 'Natures'}`,
                value: legacy ? null : (showPresetSpreads ? currentSpread : pokemon?.nature),
                onChange: (name: string) => updatePokemon(
                  showPresetSpreads
                    ? hydrateSpread(name, { format })
                    : { nature: name as Showdown.NatureName },
                  `${l.scope}:Dropdown~${showPresetSpreads ? 'Spread' : 'Nature'}:input.onChange()`,
                ),
              }}
              options={showPresetSpreads ? spreadOptions : natureOptions}
              noOptionsMessage={`No ${showPresetSpreads ? 'Spreads' : 'Natures'}`}
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
                  }, `${l.scope}:ToggleButton~DirtyItem:onPress()`)}
                />
              }
            </div>

            <Dropdown
              aria-label={`Available Items for ${friendlyPokemonName}`}
              hint={gen === 1 ? 'N/A' : (pokemon?.speciesForme ? 'None' : '???')}
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
                name: `${l.scope}:${pokemonKey}:${pokemonKey}:Item`,
                value: gen === 1 ? null : itemName,
                onChange: (name: ItemName) => updatePokemon({
                  dirtyItem: name ?? ('' as ItemName),
                }, `${l.scope}:Dropdown~DirtyItem:input.onChange()`),
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
