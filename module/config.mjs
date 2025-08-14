import {typePower} from "./utils.mjs";
import PsiPoints from "./psiPoints.mjs";

const PP_CONFIG = {
  DND5E: {},
  PSIONICS: {}
};

/**
 *
 */
PP_CONFIG.PSIONICS.powerPreparationModes = {
  always: "PrimePsionics.PowerPrepKnown",
  innate: "PrimePsionics.PowerPrepInnate"
};

/**
 * Types of components that can be required when manifesting a power.
 * @enum {object}
 */
PP_CONFIG.PSIONICS.powerComponents = {
  auditory: {
    label: "PrimePsionics.ComponentAuditory",
    abbreviation: "PrimePsionics.ComponentAuditoryAbbr"
  },
  observable: {
    label: "PrimePsionics.ComponentObservable",
    abbreviation: "PrimePsionics.ComponentObservableAbbr"
  }
};

/**
 * Disciplines to which a power can belong.
 * @typedef {object} PowerDisciplineConfiguration
 * @property {string} label        Localized label.
 * @property {string} icon         Spell school icon.
 * @property {string} fullKey      Fully written key used as alternate for enrichers.
 * @property {string} [reference]  Reference to a rule page describing this school.
 */
PP_CONFIG.PSIONICS.disciplines = {
  cla: {
    label: "PrimePsionics.DiscClair",
    icon: "modules/prime-psionics/assets/icons/clairsentience.svg",
    fullKey: "clairsentience"
  },
  mtc: {
    label: "PrimePsionics.DiscMTC",
    icon: "modules/prime-psionics/assets/icons/metacreativity.svg",
    fullKey: "metacreativity"
  },
  psk: {
    label: "PrimePsionics.DiscKinesis",
    icon: "modules/prime-psionics/assets/icons/psychokinesis.svg",
    fullKey: "psychokinesis"
  },
  psm: {
    label: "PrimePsionics.DiscMetabolism",
    icon: "modules/prime-psionics/assets/icons/psychometabolism.svg",
    fullKey: "psychometabolism"
  },
  pst: {
    label: "PrimePsionics.DiscPort",
    icon: "modules/prime-psionics/assets/icons/psychoportation.svg",
    fullKey: "psychoportation"
  },
  tlp: {
    label: "PrimePsionics.DiscTelepathy",
    icon: "modules/prime-psionics/assets/icons/telepathy.svg",
    fullKey: "telepathy"
  }
};

/**
 * The available choices for how spell damage scaling may be computed.
 * @enum {string}
 */
PP_CONFIG.PSIONICS.powerScalingModes = {
  none: "PrimePsionics.PowerNone",
  talent: "PrimePsionics.Talent",
  intensify: "PrimePsionics.Intensify",
  intensify2: "PrimePsionics.Intensify2",
  intensify3: "PrimePsionics.Intensify3"
};

/**
 * Intensify Ratios
 * @enum {number}
 */
PP_CONFIG.PSIONICS.scaling = {
  intensify: 1,
  intensify2: 2,
  intensify3: 3
};

/**
 * Power Point Progression Array
 * a[x] returns max power points at effective manifester level x
 */

PP_CONFIG.PSIONICS.ppProgression = [
  0, 4, 6, 16, 20, 32, 38, 46, 54, 72, 82, 94, 94, 108, 108, 124, 124, 142, 152,
  164, 178
];

/**
 * Valid spell levels.
 * @enum {string}
 */
PP_CONFIG.PSIONICS.powerLevels = {
  0: "PrimePsionics.Talent",
  1: "DND5E.SpellLevel1",
  2: "DND5E.SpellLevel2",
  3: "DND5E.SpellLevel3",
  4: "DND5E.SpellLevel4",
  5: "DND5E.SpellLevel5",
  6: "DND5E.SpellLevel6",
  7: "DND5E.SpellLevel7",
  8: "DND5E.SpellLevel8",
  9: "DND5E.SpellLevel9"
};

PP_CONFIG.DND5E = {
  itemProperties: {
    auditory: {
      label: "PrimePsionics.ComponentAuditory",
      abbr: "PrimePsionics.ComponentAuditoryAbbr"
    },
    observable: {
      label: "PrimePsionics.ComponentObservable",
      abbr: "PrimePsionics.ComponentObservableAbbr"
    }
  },
  validProperties: {
    [typePower]: new Set(["auditory", "observable", "concentration", "ritual"])
  },
  specialTimePeriods: {
    foc: "PrimePsionics.Focus"
  },
  spellcasting: {
    psionics: {
      img: "",
      label: "PrimePsionics.Psionics",
      type: "manifester",
      order: 30,
      progression: {
        fullp: {
          label: "PrimePsionics.FullP",
          divisor: 1
        },
        halfp: {
          label: "PrimePsionics.HalfP",
          divisor: 2
        },
        thirdp: {
          label: "PrimePsionics.ThirdP",
          divisor: 3
        }
      }
    }
  },
  activityConsumptionTypes: {
    psiPoints: {
      label: PsiPoints.label,
      consume: PsiPoints.consume,
      consumptionLabels: PsiPoints.consumptionLabels
    }
  },
  defaultArtwork: {
    Item: {
      [typePower]: "modules/prime-psionics/assets/icons/power.svg"
    }
  },
  sourceBooks: {
    PsiPri: "Korranberg Chronicle: Psion's Primer"
  }
};

export default PP_CONFIG;
