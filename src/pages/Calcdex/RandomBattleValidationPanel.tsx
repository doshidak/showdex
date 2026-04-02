import * as React from 'react';
import cx from 'classnames';
import { PokeType } from '@showdex/components/app';
import { useRandomBattlesValidation } from '@showdex/utils/hooks';
import styles from './Calcdex.module.scss';

const parseTypeFromCheckId = (checkId: string): Showdown.TypeName | null => {
  const typeMatch = checkId.match(/(?:type-count|type-weak|type-double-weak)-(.+)$/);
  if (!typeMatch) return null;

  const typeId = typeMatch[1];
  // Map the type names directly since they're already normalized
  const typeNameMap: Record<string, Showdown.TypeName> = {
    normal: 'Normal',
    fighting: 'Fighting',
    flying: 'Flying',
    poison: 'Poison',
    ground: 'Ground',
    rock: 'Rock',
    bug: 'Bug',
    ghost: 'Ghost',
    steel: 'Steel',
    fire: 'Fire',
    water: 'Water',
    grass: 'Grass',
    electric: 'Electric',
    psychic: 'Psychic',
    ice: 'Ice',
    dragon: 'Dragon',
    dark: 'Dark',
    fairy: 'Fairy',
  };

  return typeNameMap[typeId] || null;
};

export const RandomBattleValidationPanel = (): JSX.Element => {
  const validation = useRandomBattlesValidation();

  if (!validation?.active || !validation?.checks?.length) {
    return null;
  }

  const typeChecks = validation.checks.filter((c) => c.group === 'type-count');
  const weakChecks = validation.checks.filter((c) => c.group === 'type-weakness');
  const doubleWeakChecks = validation.checks.filter((c) => c.group === 'type-double-weakness');
  const freezeDryCheck = validation.checks.find((c) => c.id === 'freeze-dry-weakness');

  return (
    <section className={styles.validationPanel} aria-label="Random Battles validation">
      <header className={styles.validationHeader}>
        <div className={styles.validationTitle}>Random Battles</div>
      </header>

      {typeChecks.length > 0 && (
        <div className={styles.validationTypeWindow}>
          <div className={styles.validationTypeWindowLabel}>Types</div>
          <div className={styles.validationTypeGrid}>
            {typeChecks.map((check) => {
              const typeName = parseTypeFromCheckId(check.id);

              return (
                <div
                  key={check.id}
                  className={cx(
                    styles.validationTypeIcon,
                    check.ok ? styles.validationPass : styles.validationFail,
                  )}
                  title={`${check.label}: ${check.count}/${check.limit}`}
                >
                  {typeName && <PokeType type={typeName} containerSize="xs" highlight={false} />}
                  <span className={styles.validationTypeCount}>{check.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(weakChecks.length > 0 || doubleWeakChecks.length > 0) && (
        <div className={styles.validationTypeWindow}>
          <div className={styles.validationTypeWindowLabel}>Weaknesses</div>
          <div className={styles.validationTypeGrid}>
            {doubleWeakChecks.map((check) => {
              const typeName = parseTypeFromCheckId(check.id);

              return (
                <div
                  key={check.id}
                  className={cx(
                    styles.validationTypeIcon,
                    check.ok ? styles.validationPass : styles.validationFail,
                    styles.validationDouble,
                  )}
                  title={`2x ${check.label}: ${check.count}/${check.limit}`}
                >
                  {typeName && <PokeType type={typeName} containerSize="xs" highlight={false} />}
                  <span className={styles.validationTypeCount}>{check.count}</span>
                  <span className={styles.validationDoubleMarker}>2×</span>
                </div>
              );
            })}
            {weakChecks.map((check) => {
              const typeName = parseTypeFromCheckId(check.id);

              return (
                <div
                  key={check.id}
                  className={cx(
                    styles.validationTypeIcon,
                    check.ok ? styles.validationPass : styles.validationFail,
                  )}
                  title={`${check.label}: ${check.count}/${check.limit}`}
                >
                  {typeName && <PokeType type={typeName} containerSize="xs" highlight={false} />}
                  <span className={styles.validationTypeCount}>{check.count}</span>
                </div>
              );
            })}
            {freezeDryCheck && freezeDryCheck.count > 0 && (
              <div
                className={cx(
                  styles.validationTypeIcon,
                  freezeDryCheck.ok ? styles.validationPass : styles.validationFail,
                )}
                title={`${freezeDryCheck.label}: ${freezeDryCheck.count}/${freezeDryCheck.limit}`}
              >
                <PokeType type="Ice" containerSize="xs" highlight={false} />
                <span className={styles.validationTypeCount}>{freezeDryCheck.count}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
