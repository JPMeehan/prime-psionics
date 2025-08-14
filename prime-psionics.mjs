import PP_CONFIG from "./module/config.mjs";
import ManifestationModel from "./module/manifester.mjs";
import PowerData from "./module/powerData.mjs";
import { addPowerTab, prepareSheetContext, renderBaseActorSheet } from "./module/powersTab.mjs";
import { typePower, moduleID, modulePath, ppText } from "./module/utils.mjs";

Hooks.once("init", () => {
  addPowerTab();

  foundry.utils.mergeObject(CONFIG, PP_CONFIG);

  CONFIG.DND5E.attackClassifications[typePower] = { label: "PrimePsionics.PowerClassification" };

  Object.assign(CONFIG.Item.dataModels, {
    [typePower]: PowerData,
  });

  dnd5e.utils.preLocalize("spellcasting.psionics.progression", {
    key: "label",
  });

  foundry.applications.handlebars.loadTemplates([modulePath("templates/details-power.hbs")]);

  dnd5e.applications.CompendiumBrowser.TABS.splice(7, 0, {
    tab: "primePowers",
    label: "TYPES.Item.prime-psionics.powerPl",
    svg: modulePath("assets/icons/power.svg"),
    documentClass: "Item",
    types: [typePower],
  });

  dnd5e.dataModels.spellcasting.SpellcastingModel.TYPES["manifester"] = ManifestationModel;
});

/**
 *
 * LOCALIZING THE CONFIG OBJECT.
 *
 */

Hooks.once("i18nInit", () => {
  _localizeHelper(CONFIG.PSIONICS);
});

/**
 * Simple helper function for localizing the CONFIG.PSIONICS object.
 * @param {object} object
 */
function _localizeHelper(object) {
  for (const [key, value] of Object.entries(object)) {
    switch (typeof value) {
      case "string":
        if (value.startsWith("PrimePsionics") || value.startsWith("DND5E"))
          object[key] = game.i18n.localize(value);
        break;
      case "object":
        _localizeHelper(object[key]);
        break;
    }
  }
}
/**
 *
 * INLINE POWER DISPLAY.
 *
 */

Hooks.on("renderBaseActorSheet", renderBaseActorSheet);
Hooks.on("dnd5e.prepareSheetContext", prepareSheetContext);

/**
 *
 * POWER POINT RESET ON LR.
 *
 */

Hooks.on("dnd5e.preRestCompleted", (actor, result) => {
  if (!result.longRest) return true;
  const ppMax = actor.getFlag(moduleID, "pp.max");
  if (!ppMax) return;
  result.updateData["flags.prime-psionics.pp.value"] = ppMax;
});

/**
 *
 * SPELLCASTING TABLE.
 *
 */

Hooks.on(
  "dnd5e.buildPsionicsSpellcastingTable",
  (table, item, spellcasting) => {
    table.headers = [
      [
        { content: game.i18n.localize("PrimePsionics.PP") },
        { content: game.i18n.localize("PrimePsionics.PsiLimit") },
      ],
    ];

    table.cols = [{ class: "spellcasting", span: 2 }];

    for (const level of Array.fromRange(CONFIG.DND5E.maxLevel, 1)) {
      const progression = { psionics: 0 };
      spellcasting.levels = level;
      globalThis.dnd5e.documents.Actor5e.computeClassProgression(progression, item, { spellcasting });

      const pp = CONFIG.PSIONICS.ppProgression[progression.psionics] || "—";
      const limit = Math.ceil(Math.min(progression.psionics, 10) / 2) * 2 || "—";

      table.rows.push([
        { class: "spell-slots", content: `${pp}` },
        { class: "spell-slots", content: `${limit}` },
      ]);
    }
  },
);
