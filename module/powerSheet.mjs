
export default class PowerSheet extends ItemSheet {
    get template() {
        return `/modules/prime-psionics/templates/power-sheet.hbs`;
    }

    async getData(options={}) {
        const context = await super.getData(options);
        return context;
    }
}