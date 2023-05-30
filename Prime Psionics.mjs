import PSIONICS from "./module/config.mjs";
import PowerData from "./module/powerData.mjs";
import PowerSheet from "./module/PowerSheet.mjs";

Hooks.on("init", () => {
  console.warn("Validating Prime Psionics Initialization")
  console.log(PSIONICS)
  console.log(PowerData)
  console.log(PowerSheet)

  CONFIG.PSIONICS = PSIONICS;
  
  Object.assign(CONFIG.Item.dataModels, {
    "prime-psionics.power": PowerData
  });

  Items.registerSheet("power", PowerSheet, {
    types: ["prime-psionics.power"],
    makeDefault: true
  });
});