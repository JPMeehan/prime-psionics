export default class PowerSheet extends dnd5e.applications.item.ItemSheet5e {
    get template() {
        return `/modules/prime-psionics/templates/power-sheet.hbs`;
    }

    async getData(options={}) {
        const context = await super.getData(options);
        context.psionics = CONFIG.PSIONICS;
        context.powerComponents = {
            ...CONFIG.PSIONICS.powerComponents,
            ...CONFIG.DND5E.spellTags
        }
        if (context.system.actionType === "msak") context.itemProperties[0] = game.i18n.localize("PrimePsionics.ActionMPAK")
        if (context.system.actionType === "rsak") context.itemProperties[0] = game.i18n.localize("PrimePsionics.ActionRPAK")

        const consume = context.system.consume.type === "psionics" ? {pp: game.i18n.localize("PrimePsionics.PP")} : {}

        foundry.utils.mergeObject(context, {
            labels: context.system.labels,
            abilityConsumptionTargets: consume
        })

        return context;
    }
}