import PSIONICS from "./module/config.mjs";
import PowerData from "./module/powerData.mjs";
import PowerSheet from "./module/PowerSheet.mjs";

Hooks.once("init", () => {

  CONFIG.PSIONICS = PSIONICS;

  CONFIG.DND5E.specialTimePeriods.foc = "PrimePsionics.Focus"
  
  Object.assign(CONFIG.Item.dataModels, {
    "prime-psionics.power": PowerData
  });

  Items.registerSheet("power", PowerSheet, {
    types: ["prime-psionics.power"],
    makeDefault: true
  });
});

Hooks.once("i18nInit", () => {
    _localizeHelper(CONFIG.PSIONICS);
})

function _localizeHelper(object) {

    for (const [key, value] of Object.entries(object)) {
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