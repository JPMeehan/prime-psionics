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
