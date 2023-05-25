const Psionics = {};

/**
 * Types of components that can be required when manifesting a power.
 * @enum {object}
 */
Psionics.powerComponents = {
    auditory: {
        label: "ChaosOS.ComponentAuditory",
        abbr: "ChaosOS.ComponentAuditoryAbbr"
    },
    observable: {
        label: "ChaosOS.ComponentObservable",
        abbr: "ChaosOS.ComponentObservableAbbr"
    }
};
preLocalize("spellComponents", {keys: ["label", "abbr"]});

export default Psionics;