const PPCONFIG = {
    DND5E: {},
    PSIONICS: {}
}

/**
 * Types of components that can be required when manifesting a power.
 * @enum {object}
 */
PPCONFIG.PSIONICS.powerComponents = {
    auditory: {
        label: "PrimePsionics.ComponentAuditory",
        abbr: "PrimePsionics.ComponentAuditoryAbbr"
    },
    observable: {
        label: "PrimePsionics.ComponentObservable",
        abbr: "PrimePsionics.ComponentObservableAbbr"
    }
};

/**
 * Disciplines to which a power can belong.
 * @enum {string}
 */
PPCONFIG.PSIONICS.disciplines = {
    cla: "PrimePsionics.DiscClair",
    mtc: "PrimePsionics.DiscMTC",
    psk: "PrimePsionics.DiscKinesis",
    psm: "PrimePsionics.DiscMetabolism",
    pst: "PrimePsionics.DiscPort",
    tlp: "PrimePsionics.DiscTelepathy",
  };

PPCONFIG.DND5E = {
    specialTimePeriods: {
        foc: "PrimePsionics.Focus"
    },
    spellProgression: {
        fullp: "PrimePsionics.FullP",
        halfp: "PrimePsionics.HalfP",
        thirdp: "PrimePsionics.ThirdP"
    },
    spellcastingTypes: {
        psionics: {
            label: "PrimePsionics.Psionics",
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
    abilityConsumptionTypes: {
        flags: "PrimePsionics.Flags"
    }
}

export default PPCONFIG;