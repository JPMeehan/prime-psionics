import PSIONICS from "./config.mjs";
import PowerData from "./powerData.mjs";
import PowerSheet from "./PowerSheet.mjs";

Hooks.on("init", () => {
    CONFIG.PSIONICS = PSIONICS;
    
    Object.assign(CONFIG.Item.dataModels, {
      "prime-psionics.power": PowerData
    });

    Items.registerSheet("power", PowerSheet, {
      types: ["prime-psionics.power"],
      makeDefault: true
    });
});