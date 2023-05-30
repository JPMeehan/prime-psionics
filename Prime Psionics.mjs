import PSIONICS from "./module/config.mjs";
import PowerData from "/module/powerData.mjs";
import PowerSheet from "/module/PowerSheet.mjs";

Hooks.on("init", () => {
    CONFIG['PSIONICS'] = PSIONICS;
    
    Object.assign(CONFIG.Item.dataModels, {
      "prime-psionics.power": PowerData
    });

    Items.registerSheet("power", PowerSheet, {
      types: ["prime-psionics.power"],
      makeDefault: true
    });
});