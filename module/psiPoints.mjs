import {moduleID} from "./utils.mjs";

/**
 * Class implementing the new ActivityConsumptionTargetConfig using static members
 */
export default class PsiPoints {
  /**
   * Localized label for the target type.
   */
  static get label() {
    return "PrimePsionics.PP";
  }
  
  /**
   * Function used to consume according to this type.
   * @this {InstanceType<dnd5e["dataModels"]["activity"]["ConsumptionTargetData"]>}
   * @param {ActivityUseConfiguration} config  Configuration data for the activity usage.
   * @param {ActivityUsageUpdates} updates     Updates to be performed.
   */
  static async consume(config, updates) {
    console.log(this, config, updates);
    const pp = this.actor.getFlag(moduleID, "pp");
    const expenditure = Number(this.value) + Number(config.scaling);
    updates.actor[`flags.${moduleID}.pp.value`] = pp.value - expenditure;
  }

  /**
   * Function used to generate a hint of consumption amount.
   * @this {InstanceType<dnd5e["dataModels"]["activity"]["ConsumptionTargetData"]>}
   * @param {ActivityUseConfiguration} config    Configuration data for the activity usage.
   * @returns {{ label: string, hint: string }}  Label and hint text.
   */
  static consumptionLabels(config) {
    const limit = this.actor.getFlag(moduleID, "manifestLimit");
    const points = Number(this.value ?? 0) + Number(config.scaling ?? 0);
    return {
      label: game.i18n.localize("PrimePsionics.Intensify"),
      hint: game.i18n.format("PrimePsionics.ConsumptionHint", {points, limit})
    };
  }
}

/**
 * Configuration data for an activity usage being prepared.
 *
 * @typedef {object} ActivityUseConfiguration
 * @property {object|false} create
 * @property {boolean} create.measuredTemplate     Should this item create a template?
 * @property {object} concentration
 * @property {boolean} concentration.begin         Should this usage initiate concentration?
 * @property {string|null} concentration.end       ID of an active effect to end concentration on.
 * @property {object|false} consume
 * @property {boolean|number[]} consume.resources  Set to `true` or `false` to enable or disable all resource
 *                                                 consumption or provide a list of consumption target indexes
 *                                                 to only enable those targets.
 * @property {boolean} consume.spellSlot           Should this spell consume a spell slot?
 * @property {Event} event                         The browser event which triggered the item usage, if any.
 * @property {boolean|number} scaling              Number of steps above baseline to scale this usage, or `false` if
 *                                                 scaling is not allowed.
 * @property {object} spell
 * @property {number} spell.slot                   The spell slot to consume.
 */

/**
 * Update data produced by activity usage.
 *
 * @typedef {object} ActivityUsageUpdates
 * @property {object} activity  Updates applied to activity that performed the activation.
 * @property {object} actor     Updates applied to the actor that performed the activation.
 * @property {string[]} delete  IDs of items to be deleted from the actor.
 * @property {object[]} item    Updates applied to items on the actor that performed the activation.
 * @property {Roll[]} rolls     Any rolls performed as part of the activation.
 */
