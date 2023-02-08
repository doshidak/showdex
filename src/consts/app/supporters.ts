/**
 * Supporter tier.
 *
 * @since 1.1.3
 */
export interface ShowdexSupporterTier {
  title: string;
  names: (string | [name: string, active: boolean])[];
}

/**
 * List of PayPal donors.
 *
 * @since 1.1.3
 */
export const ShowdexDonorTiers: ShowdexSupporterTier[] = [{
  title: 'Monthly Pals',
  names: [],
}, {
  title: 'One-Time Pals',
  names: [
    'Angie L',
    'Fubwubs',
    'Michael L',
    'Jonathan M',
    'Leman T',
    'Sunny B',
    'Peter T',
    'Connor M',
    'Nate M',
    'Tanuj C',
  ],
}];

/**
 * List of Patreon patrons.
 *
 * @since 1.1.3
 */
export const ShowdexPatronTiers: ShowdexSupporterTier[] = [{
  title: 'T.3 Supreme Overlords',
  names: [],
}, {
  title: 'T.2 Pop Bombers',
  names: [],
}, {
  title: 'T.1 Blazikens',
  names: [],
}];
