const PPCONFIG = {
    DND5E: {},
    PSIONICS: {},
    Actor: {}
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


/**
 * The available choices for how spell damage scaling may be computed.
 * @enum {string}
 */
PPCONFIG.PSIONICS.powerScalingModes = {
    none: "PrimePsionics.PowerNone",
    talent: "PrimePsionics.Talent",
    intensify: "PrimePsionics.Intensify"
};

/**
 * Power Point Progression Array
 * a[x] returns max power points at effective manifester level x
 */

PPCONFIG.PSIONICS.ppProgression = [0,4,6,16,20,32,38,46,54,72,82,94,94,108,108,124,124,142,152,164,178]

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

Actor.trackableAttributes = {
    character: {
        bar: ["flags.prime-psionics.pp"]
    }
}

export default PPCONFIG;