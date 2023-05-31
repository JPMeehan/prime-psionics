export default class PowerSheet extends dnd5e.applications.item.ItemSheet5e {
    get template() {
        return `/modules/prime-psionics/templates/power-sheet.hbs`;
    }

    async getData(options={}) {
        const context = await super.getData(options);
        console.warn(context)
        context.psionics = CONFIG.PSIONICS;
        context.powerComponents = {
            // ...CONFIG.DND5E.spellComponents, 
            ...CONFIG.PSIONICS.powerComponents,
            ...CONFIG.DND5E.spellTags
        }

        foundry.utils.mergeObject(context, {
            labels: context.system.labels
        })

        return context;
    }
}