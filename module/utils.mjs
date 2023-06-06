
/**
 * 
 * @param {object} consume               Effect's resource consumption.
 * @param {string} consume.type          Type of resource to consume
 * @param {string} consume.target        Item ID or resource key path of resource to consume.
 * @param {number} consume.amount        Quantity of the resource to consume per use.
 * @returns {boolean}     Returns true if it spends psi points as a resource
 */

export function usesPP(consume) {
    return consume.type === "flags" && consume.target === "pp";
}

/**
 * 
 * @param {int} pp      Psi points a power uses
 * @returns {string}    Returns the properly format psi point label 
 */

export function ppText(pp) {
    return `${pp} ${
        pp === 1
          ? game.i18n.localize("PrimePsionics.1PP")
          : game.i18n.localize("PrimePsionics.PP")
    }`;
}