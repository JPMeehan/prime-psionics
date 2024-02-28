export const typePower = 'prime-psionics.power';
export const moduleID = 'prime-psionics';

/**
 *
 * @param {int} pp            Psi points a power uses
 * @param {boolean} lowercase Force tooltip to lowercase?
 * @returns {string}          Returns the properly format psi point label
 */

export function ppText(pp, lowercase = false) {
  let text = `${pp} ${
    pp === 1
      ? game.i18n.localize('PrimePsionics.1PP')
      : game.i18n.localize('PrimePsionics.PP')
  }`;
  return lowercase ? text.toLocaleLowerCase() : text;
}
