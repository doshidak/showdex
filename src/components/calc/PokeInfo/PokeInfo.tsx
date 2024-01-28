import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
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
import {
  createAliasFilter,
  Dropdown,
  PokeStatField,
  PokeTypeField,
  ValueField,
} from '@showdex/components/form';
import { useSandwich } from '@showdex/components/layout';
import {
  type BadgeInstance,
  Badge,
  BaseButton,
  Button,
  ToggleButton,
} from '@showdex/components/ui';
import {
  PokemonBoosterAbilities,
  PokemonCommonNatures,
  PokemonNatureBoosts,
  PokemonRuinAbilities,
} from '@showdex/consts/dex';
import { type CalcdexPlayerSide } from '@showdex/interfaces/calc';
import { useColorScheme, useHonkdexSettings } from '@showdex/redux/store';
import { calcPokemonHpPercentage, populateStatsTable } from '@showdex/utils/calc';
import { formatId, readClipboardText, writeClipboardText } from '@showdex/utils/core';
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
  importMultiPokePastes,
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
  const { t } = useTranslation('calcdex');

  const {
    state,
    settings,
    player,
    playerPokemon: pokemon,
    presetsLoading,
    presets,
    usages,
    usage,
    abilityUsageFinder,
    abilityUsageSorter,
    itemUsageFinder,
    itemUsageSorter,
    formatLabelMap,
    formeUsages,
    formeUsageFinder,
    formeUsageSorter,
    addPokemon,
    updatePokemon,
    removePokemon,
    applyPreset,
  } = useCalcdexPokeContext();

  const {
    operatingMode,
    containerSize,
    containerWidth,
    gen,
    format,
    subFormats,
    legacy,
    gameType,
    defaultLevel,
  } = state;

  const honkdexSettings = useHonkdexSettings();
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
    {
      usageAlts: usage?.altAbilities,
      usageFinder: abilityUsageFinder,
      usageSorter: abilityUsageSorter,
      showAll: settings?.showAllOptions,
      translate: (v) => t(`pokedex:abilities.${formatId(v)}`, v),
      translateHeader: (v) => t(`pokedex:headers.${formatId(v)}`, v),
    },
  ), [
    abilityUsageFinder,
    abilityUsageSorter,
    format,
    pokemon,
    settings?.showAllOptions,
    t,
    usage?.altAbilities,
  ]);

  const abilityOptionsFilter = React.useMemo(
    () => createAliasFilter(t('pokedex:abilityAliases', { returnObjects: true })),
    [t],
  );

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

  const showBoostedStat = !!pokemon?.speciesForme
    && PokemonBoosterAbilities.includes(pokemon.dirtyAbility || pokemon.ability);

  const showResetAbility = !!pokemon?.speciesForme
    && !!pokemon.dirtyAbility
    && !pokemon.transformedForme
    && !!pokemon.ability
    && pokemon.ability !== pokemon.dirtyAbility;

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
    label: t(`pokedex:natures.${formatId(name)}`, name),
    rightLabel: PokemonNatureBoosts[name]?.length ? [
      !!PokemonNatureBoosts[name][0] && `+${t(`pokedex:stats.${formatId(PokemonNatureBoosts[name][0])}.1`)}`,
      !!PokemonNatureBoosts[name][1] && `-${t(`pokedex:stats.${formatId(PokemonNatureBoosts[name][1])}.1`)}`,
    ].filter(Boolean).join(' ') : t('pokedex:headers.neutral'),
    value: name,
  })), [
    t,
  ]);

  const spreadOptions = React.useMemo(() => (pokemon?.speciesForme ? buildSpreadOptions(
    appliedPreset,
    {
      format,
      usage: format?.includes('random') ? null : usage,
      translateNature: (v) => t(`pokedex:natures.${formatId(v)}`, v),
      translateStat: (v) => t(`pokedex:stats.${formatId(v)}.1`, v?.toUpperCase()),
      translateHeader: (v) => t(`pokedex:headers.${formatId(v)}`, v),
    },
  ) : []), [
    appliedPreset,
    format,
    pokemon?.speciesForme,
    t,
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
    {
      usageAlts: usage?.altItems,
      usageFinder: itemUsageFinder,
      usageSorter: itemUsageSorter,
      translate: (v) => t(`pokedex:items.${formatId(v)}`, v),
      translateHeader: (v) => t(`pokedex:headers.${formatId(v)}`, v),
    },
  ), [
    format,
    itemUsageFinder,
    itemUsageSorter,
    pokemon,
    t,
    usage?.altItems,
  ]);

  const itemOptionsFilter = React.useMemo(
    () => createAliasFilter(t('pokedex:itemAliases', { returnObjects: true })),
    [t],
  );

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
    <Trans
      t={t}
      i18nKey="poke.info.forme.smogonTooltip"
      parent="div"
      className={styles.tooltipContent}
      shouldUnescape
      values={{ pokemon: pokemon?.speciesForme || '$t(pokedex:species.missingno)' }}
    />
  );

  const formeOptions = React.useMemo(() => (operatingMode === 'standalone' && buildFormeOptions(
    format,
    {
      speciesForme: pokemon?.speciesForme,
      altFormes: pokemon?.altFormes,
      transformedForme: pokemon?.transformedForme,
      usageAlts: formeUsages,
      usageFinder: formeUsageFinder,
      usageSorter: formeUsageSorter,
      translate: (v) => t(`pokedex:species.${formatId(v)}`, v),
      translateHeader: (v) => t(`pokedex:headers.${formatId(v)}`, v),
    },
  )) || [], [
    format,
    formeUsageFinder,
    formeUsages,
    formeUsageSorter,
    operatingMode,
    pokemon?.altFormes,
    pokemon?.speciesForme,
    pokemon?.transformedForme,
    t,
  ]);

  const formeOptionsFilter = React.useMemo(() => (
    operatingMode === 'standalone'
      && createAliasFilter(t('pokedex:speciesAliases', { returnObjects: true }))
  ) || null, [
    operatingMode,
    t,
  ]);

  // update (2024/01/10): if there's only 1, chances are it's its current forme
  // e.g., speciesForme = 'Kyogre', altFormes = ['Kyogre']
  const formeDisabled = (pokemon?.altFormes?.length || 0) < 2;

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

  const editableTypes = (operatingMode === 'standalone' && honkdexSettings?.alwaysEditTypes)
    || settings?.editPokemonTypes === 'always'
    || (settings?.editPokemonTypes === 'meta' && !legalLockedFormat(format));

  const presetOptions = React.useMemo(() => buildPresetOptions(
    format,
    pokemon,
    presets,
    {
      usages,
      formatLabelMap,
    },
  ), [
    format,
    formatLabelMap,
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

      if (operatingMode === 'standalone') {
        const importedPresets = importMultiPokePastes(data, format);
        const importedPokemon = importedPresets.map((preset) => ({
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
        }));

        if (!importedPokemon.length) {
          setImportFailedReason(t('poke.info.preset.malformedBadge', 'Bad Syntax'));
          importFailedBadgeRef.current?.show();

          return;
        }

        addPokemon(importedPokemon, `${l.scope}:handlePokePasteImport()`);

        return void importBadgeRef.current?.show();
      }

      const preset = importPokePaste(data, format);

      const speciesMismatch = ![
        pokemon?.speciesForme,
        ...(pokemon?.altFormes || []),
      ].filter(Boolean).includes(preset?.speciesForme);

      const importFailed = !preset?.calcdexId || (operatingMode === 'battle' && speciesMismatch);

      if (importFailed) {
        setImportFailedReason(t(
          `poke.info.preset.${preset?.calcdexId ? 'mismatched' : 'malformed'}Badge`,
          preset?.calcdexId ? 'Mismatch' : 'Bad Syntax',
        ));
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

      setImportFailedReason(t('poke.info.preset.failedBadge'));
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
                aria-label={t('poke.info.forme.aria') as React.ReactNode}
                hint={t('pokedex:species.missingno', 'MissingNo.') as React.ReactNode}
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
                      return void removePokemon(pokemon.calcdexId, false, s);
                    }

                    updatePokemon({ speciesForme: value }, s);
                  },
                }}
                options={formeOptions}
                noOptionsMessage={t('poke.info.forme.empty', 'No Pokémon') as React.ReactNode}
                filterOption={formeOptionsFilter}
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
                  label={(
                    nickname
                      || t(`pokedex:species.${formatId(pokemon?.speciesForme)}`, '')
                      || pokemon?.speciesForme
                      || t('pokedex:species.missingno', 'MissingNo.')
                  )}
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
                  {t('poke.info.level.label', 'L')}{pokemon.level}
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
                  {t('poke.info.level.label', 'L')}
                </div>
                <ValueField
                  className={cx(
                    styles.levelField,
                    styles.absoluteHover,
                    !pokemon?.speciesForme && styles.disabled,
                  )}
                  inputClassName={styles.levelInputField}
                  label={t('poke.info.level.aria', { pokemon: friendlyPokemonName }) as React.ReactNode}
                  hideLabel
                  hint={(
                    pokemon?.speciesForme
                      ? (pokemon.level?.toString() || defaultLevel)
                      : t('poke.info.level.hint') as React.ReactNode
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
                    value: (!!pokemon?.speciesForme && (pokemon.level || defaultLevel)) || null,
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
              label={t('poke.info.types.aria', { pokemon: friendlyPokemonName }) as React.ReactNode}
              multi
              input={{
                name: `${l.scope}:${pokemonKey}:Types`,
                value: [...(pokemon?.dirtyTypes || [])],
                onChange: (types: Showdown.TypeName[]) => updatePokemon({
                  dirtyTypes: [...(types || [])],
                }, `${l.scope}:PokeTypeField:input.onChange()`),
              }}
              tooltipPlacement="bottom-start"
              containerSize={(
                (gen > 8 && (pokemon?.dirtyTypes?.length || pokemon?.types?.length || 0) !== 1)
                  || containerWidth < 360
                  ? containerSize
                  : null
              )}
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
                label={t('poke.info.teraType.aria', { pokemon: friendlyPokemonName }) as React.ReactNode}
                title={t('poke.info.teraType.label', 'Tera Type') as React.ReactNode}
                input={{
                  name: `${l.scope}:${pokemonKey}:TeraType`,
                  value: pokemon?.dirtyTeraType || pokemon?.teraType || '???',
                  onChange: (type: Showdown.TypeName) => updatePokemon({
                    dirtyTeraType: type,
                    terastallized: !!type && type !== '???' && pokemon?.terastallized,
                  }, `${l.scope}:PokeTypeField~Tera:input.onChange()`),
                }}
                tooltipPlacement="bottom-start"
                defaultTypeLabel={t('poke.info.teraType.emptyLabel', 'TERA') as React.ReactNode}
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
                aria-label={t('poke.info.status.aria', { pokemon: friendlyPokemonName }) as unknown as string}
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
                      override={currentStatus === 'ok' ? currentStatus : undefined}
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
                {t('poke.info.preset.label', 'Set')}

                {
                  operatingMode === 'battle' &&
                  <ToggleButton
                    className={styles.toggleButton}
                    label={t('poke.info.preset.autoLabel', 'Auto')}
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
                  className={cx(styles.toggleButton, styles.importButton)}
                  label={t('poke.info.preset.importLabel', 'Import')}
                  tooltip={t('poke.info.preset.importTooltip')}
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
                    label={t('poke.info.preset.importedBadge', 'Imported')}
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
                  label={t('poke.info.preset.exportLabel', 'Export')}
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
                    label={t('poke.info.preset.exportedBadge', 'Exported')}
                    color="green"
                  />

                  <Badge
                    ref={exportFailedBadgeRef}
                    className={styles.importBadge}
                    label={t('poke.info.preset.failedBadge', 'Failed')}
                    color="red"
                  />
                </ToggleButton>
              </div>
            </div>
          </div>

          <Dropdown
            aria-label={t('poke.info.preset.aria', { pokemon: friendlyPokemonName }) as React.ReactNode}
            hint={(
              presetsLoading
                ? t('common:labels.loading', 'Loading')
                : t(
                  `poke.info.preset.${pokemon?.speciesForme ? 'none' : 'hint'}`,
                  pokemon?.speciesForme ? 'None' : '???',
                )
            ) as React.ReactNode}
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
            noOptionsMessage={t('poke.info.preset.empty', 'No Sets') as React.ReactNode}
            clearable={false}
            loading={presetsLoading}
            loadingMessage={t('poke.info.preset.loading', 'Loading') as React.ReactNode}
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
              {t('poke.info.ability.label')}

              {
                showAbilityToggle &&
                <ToggleButton
                  className={styles.toggleButton}
                  label={t('poke.info.ability.activeLabel', 'Active')}
                  tooltip={(
                    <Trans
                      t={t}
                      i18nKey={`poke.info.ability.${pokemon.abilityToggled ? '' : 'in'}activeTooltip`}
                      parent="div"
                      className={styles.tooltipContent}
                      shouldUnescape
                      values={{ ability: abilityName || t('pokedex:headers.ability_one') }}
                    />
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
                showBoostedStat &&
                <PokeStatField
                  className={styles.toggleButton}
                  label={t(`poke.info.ability.${pokemon.dirtyBoostedStat || pokemon.boostedStat ? 'b' : 'autoB'}oostedStatLabel`) as React.ReactNode}
                  override={pokemon.dirtyBoostedStat || pokemon.boostedStat ? undefined : t('poke.info.ability.autoBoostedStat') as React.ReactNode}
                  headerSuffix={((
                    pokemon.boostedStat
                      && pokemon.dirtyBoostedStat
                      && pokemon.boostedStat !== pokemon.dirtyBoostedStat
                  )
                    ? (
                      <ToggleButton
                        className={styles.toggleButton}
                        label={t('poke.info.ability.resetLabel', 'Reset')}
                        absoluteHover
                        active
                        onPress={() => updatePokemon({
                          dirtyBoostedStat: null,
                        }, `${l.scope}:ToggleButton~DirtyBoostedStat:onPress()`)}
                      />
                    )
                    : null
                  )}
                  input={{
                    name: `${l.scope}:${pokemonKey}:BoostedStat`,
                    value: pokemon.dirtyBoostedStat || pokemon.boostedStat,
                    onChange: (value: Showdown.StatNameNoHp) => updatePokemon({
                      dirtyBoostedStat: value,
                    }, `${l.scope}:PokeStatField~DirtyBoostedStat:input.onChange()`),
                  }}
                  format={format}
                  omitHpStat
                  clearable
                  highlightLabel={!pokemon.dirtyBoostedStat && !pokemon.boostedStat}
                  toggleActive={!pokemon.dirtyBoostedStat && !pokemon.boostedStat}
                  absoluteHover
                />
              }

              {
                showResetAbility &&
                <ToggleButton
                  className={styles.toggleButton}
                  label={t('poke.info.ability.resetLabel', 'Reset')}
                  tooltip={(
                    <Trans
                      t={t}
                      i18nKey="poke.info.ability.resetTooltip"
                      parent="div"
                      className={styles.tooltipContent}
                      shouldUnescape
                      values={{ ability: pokemon?.ability || t('pokedex:headers.ability_one') }}
                    />
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
              aria-label={t('poke.info.ability.aria', { pokemon: friendlyPokemonName }) as React.ReactNode}
              hint={t(`poke.info.ability.${legacy ? 'legacyH' : 'h'}int`) as React.ReactNode}
              optionTooltip={PokeAbilityOptionTooltip}
              optionTooltipProps={{
                format,
                hidden: !settings?.showAbilityTooltip,
              }}
              input={{
                name: `${l.scope}:${pokemonKey}:Ability`,
                value: legacy ? null : abilityName,
                onChange: (value: AbilityName) => updatePokemon({
                  dirtyAbility: value,
                }, `${l.scope}:Dropdown~DirtyAbility:input.onChange()`),
              }}
              options={abilityOptions}
              noOptionsMessage={t('poke.info.ability.empty', 'No Abilities') as React.ReactNode}
              filterOption={abilityOptionsFilter}
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
              {t(
                `poke.info.nature.${showPresetSpreads ? 'spreadL' : 'l'}abel`,
                showPresetSpreads ? 'Spread' : 'Nature',
              )}

              {
                showSpreadsToggle &&
                <ToggleButton
                  className={styles.toggleButton}
                  label={t(
                    `poke.info.nature.${showPresetSpreads ? 'l' : 'spreadL'}abel`,
                    showPresetSpreads ? 'Nature' : 'Spread',
                  )}
                  tooltip={(
                    <Trans
                      t={t}
                      i18nKey={`poke.info.nature.${showPresetSpreads ? 'spread' : 'nature'}ToggleTooltip`}
                      parent="div"
                      className={styles.tooltipContent}
                      shouldUnescape
                    />
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
              aria-label={t(`poke.info.nature.${showPresetSpreads ? 'spreadA' : 'a'}ria`, {
                pokemon: friendlyPokemonName,
              }) as React.ReactNode}
              // hint={legacy ? 'N/A' : (showPresetSpreads ? (currentSpread || 'Custom') : '???')}
              hint={(
                (legacy && t('poke.info.nature.legacyHint'))
                  || (showPresetSpreads && (currentSpread || t('poke.info.nature.customHint')))
                  || t('poke.info.nature.hint')
              ) as React.ReactNode}
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
              noOptionsMessage={t(
                `poke.info.nature.${showPresetSpreads ? 'spreadE' : 'e'}mpty`,
                `No ${showPresetSpreads ? 'Spreads' : 'Natures'}`,
              ) as React.ReactNode}
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
              {t('poke.info.item.label', 'Item')}

              {
                showResetItem &&
                <ToggleButton
                  className={styles.toggleButton}
                  label={t('poke.info.item.resetLabel', 'Reset')}
                  tooltip={(
                    <Trans
                      t={t}
                      i18nKey="poke.info.item.resetTooltip"
                      parent="div"
                      className={styles.tooltipContent}
                      shouldUnescape
                      values={{
                        effect: (
                          t(`pokedex:effects.${formatId(pokemon?.prevItemEffect || pokemon?.itemEffect)}`, '')
                            || (pokemon?.prevItemEffect || pokemon?.itemEffect)
                              ?.split(' ')
                              .map((w) => capitalize(w))
                              .join('-')
                            || t('poke.info.item.defaultPrevEffect')
                        ),
                        item: pokemon?.prevItem || pokemon?.item || t('pokedex:headers.item_one'),
                      }}
                    />
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
              aria-label={t('poke.info.item.aria', { pokemon: friendlyPokemonName }) as React.ReactNode}
              hint={t(`poke.info.item.${gen === 1 ? 'legacyH' : 'h'}int`) as React.ReactNode}
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
                      {t(`pokedex:effects.${formatId(pokemon.itemEffect)}`, pokemon.itemEffect)}
                    </div>
                  }
                  {
                    !!pokemon?.prevItem &&
                    <>
                      <div className={styles.itemEffect}>
                        {t(
                          `pokedex:effects.${formatId(pokemon.prevItemEffect)}`,
                          pokemon.prevItemEffect || t('poke.info.item.defaultPrevEffect'),
                        )}
                      </div>
                      <div className={styles.itemName}>
                        {t(`pokedex:items.${formatId(pokemon.prevItem)}`, pokemon.prevItem)}
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
              noOptionsMessage={t('poke.info.item.empty', 'No Items') as React.ReactNode}
              filterOption={itemOptionsFilter}
              disabled={gen === 1 || !pokemon?.speciesForme}
            />
          </div>
        </div>
      }
    </div>
  );
};
