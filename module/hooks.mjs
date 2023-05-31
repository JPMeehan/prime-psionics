import PSIONICS from "./config.mjs";
import PowerData from "./powerData.mjs";
import PowerSheet from "./PowerSheet.mjs";

Hooks.once("init", () => {
    CONFIG.PSIONICS = PSIONICS;
    
    Object.assign(CONFIG.Item.dataModels, {
      "prime-psionics.power": PowerData
    });

    Items.registerSheet("power", PowerSheet, {
      types: ["prime-psionics.power"],
      makeDefault: true
    });
});

Hooks.once("i18nInit", () => {
    console.warn("Internationalization Initiation");
    _localizeHelper(CONFIG.PSIONICS);
})

function _localizeHelper(object) {

    for (const [key, value] of Object.entries(object)) {
        console.log(key)
        console.log(value)
        console.log(typeof(value))
        switch (typeof(value)) {
            case "string":
                if (value.includes("PrimePsionics")) object[key] = game.i18n.localize(value)
                break;
            case "object":
                _localizeHelper(object[key])
                break;
        }
    }
}