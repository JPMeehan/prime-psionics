import { ppText } from "./utils.mjs";

export default class PowerSheet extends dnd5e.applications.item.ItemSheet5e {
  get template() {
    return `modules/prime-psionics/templates/power-sheet.hbs`;
  }

  async getData(options = {}) {
    const context = await super.getData(options);
    context.psionics = CONFIG.PSIONICS;
    context.powerComponents = {
      ...CONFIG.PSIONICS.powerComponents,
      ...CONFIG.DND5E.spellTags,
    };
    if (context.system.actionType === "msak")
      context.itemProperties[0] = game.i18n.localize(
        "PrimePsionics.ActionMPAK"
      );
    if (context.system.actionType === "rsak")
      context.itemProperties[0] = game.i18n.localize(
        "PrimePsionics.ActionRPAK"
      );

    const consume =
      context.system.consume.type === "flags"
        ? { pp: game.i18n.localize("PrimePsionics.PP") }
        : {};

    context.powerScalingModes = CONFIG.PSIONICS.powerScalingModes;

    const consumption = context.system.consume;
    if (context.system.usesPP) {
      if (context.system.labels.pp) {
        const ppLabel = ppText(consumption.amount);
        context.system.labels.pp = ppLabel;
        context.itemStatus = ppLabel;
      }
    } else delete context.system.labels.pp;
    foundry.utils.mergeObject(context, {
      labels: context.system.labels,
      abilityConsumptionTargets: consume,
    });

    return context;
  }
}
