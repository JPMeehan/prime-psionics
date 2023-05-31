const PSIONICS = {};

/**
 * Types of components that can be required when manifesting a power.
 * @enum {object}
 */
PSIONICS.powerComponents = {
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
PSIONICS.disciplines = {
    cla: "PrimePsionics.DiscClair",
    mtc: "PrimePsionics.DiscMTC",
    psk: "PrimePsionics.DiscKinesis",
    psm: "PrimePsionics.DiscMetabolism",
    pst: "PrimePsionics.DiscPort",
    tlp: "PrimePsionics.DiscTelepathy",
  };

export default PSIONICS;