const PP_CONFIG = {
  DND5E: {},
  PSIONICS: {},
};

/**
 * Types of components that can be required when manifesting a power.
 * @enum {object}
 */
PP_CONFIG.PSIONICS.powerComponents = {
  auditory: {
    label: 'PrimePsionics.ComponentAuditory',
    abbr: 'PrimePsionics.ComponentAuditoryAbbr',
  },
  observable: {
    label: 'PrimePsionics.ComponentObservable',
    abbr: 'PrimePsionics.ComponentObservableAbbr',
  },
};

/**
 * Disciplines to which a power can belong.
 * @enum {string}
 */
PP_CONFIG.PSIONICS.disciplines = {
  cla: 'PrimePsionics.DiscClair',
  mtc: 'PrimePsionics.DiscMTC',
  psk: 'PrimePsionics.DiscKinesis',
  psm: 'PrimePsionics.DiscMetabolism',
  pst: 'PrimePsionics.DiscPort',
  tlp: 'PrimePsionics.DiscTelepathy',
};

/**
 * The available choices for how spell damage scaling may be computed.
 * @enum {string}
 */
PP_CONFIG.PSIONICS.powerScalingModes = {
  none: 'PrimePsionics.PowerNone',
  talent: 'PrimePsionics.Talent',
  intensify: 'PrimePsionics.Intensify',
  intensify2: 'PrimePsionics.Intensify2',
  intensify3: 'PrimePsionics.Intensify3',
};

/**
 * Intensify Ratios
 * @enum {number}
 */
PP_CONFIG.PSIONICS.scaling = {
  intensify: 1,
  intensify2: 2,
  intensify3: 3,
};

/**
 * Power Point Progression Array
 * a[x] returns max power points at effective manifester level x
 */

PP_CONFIG.PSIONICS.ppProgression = [
  0, 4, 6, 16, 20, 32, 38, 46, 54, 72, 82, 94, 94, 108, 108, 124, 124, 142, 152,
  164, 178,
];

PP_CONFIG.DND5E = {
  specialTimePeriods: {
    foc: 'PrimePsionics.Focus',
  },
  spellProgression: {
    fullp: 'PrimePsionics.FullP',
    halfp: 'PrimePsionics.HalfP',
    thirdp: 'PrimePsionics.ThirdP',
  },
  spellcastingTypes: {
    psionics: {
      label: 'PrimePsionics.Psionics',
      progression: {
        fullp: {
          label: 'PrimePsionics.FullP',
          divisor: 1,
        },
        halfp: {
          label: 'PrimePsionics.HalfP',
          divisor: 2,
        },
        thirdp: {
          label: 'PrimePsionics.ThirdP',
          divisor: 3,
        },
      },
    },
  },
  abilityConsumptionTypes: {
    flags: 'PrimePsionics.Flags',
  },
};

export default PP_CONFIG;
