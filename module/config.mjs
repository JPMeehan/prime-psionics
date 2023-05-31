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
    }
}

export default PPCONFIG;