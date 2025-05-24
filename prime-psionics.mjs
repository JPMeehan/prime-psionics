import PP_CONFIG from "./module/config.mjs";
import PowerData from "./module/powerData.mjs";
import {addPowerTab, renderBaseActorSheet} from "./module/powersTab.mjs";
import {typePower, moduleID, modulePath, ppText} from "./module/utils.mjs";

Hooks.once("init", () => {
  addPowerTab();

  foundry.utils.mergeObject(CONFIG, PP_CONFIG);

  Object.assign(CONFIG.Item.dataModels, {
    [typePower]: PowerData
  });

  dnd5e.utils.preLocalize("spellcastingTypes.psionics.progression", {
    key: "label"
  });
  
  loadTemplates([modulePath("templates/details-power.hbs")]);

  dnd5e.applications.CompendiumBrowser.TABS.splice(7, 0, {
    tab: "primePowers",
    label: "TYPES.Item.prime-psionics.powerPl",
    svg: modulePath("assets/icons/power.svg"),
    documentClass: "Item",
    types: [typePower]
  });
});

/**
 *
 * LOCALIZING THE CONFIG OBJECT
 *
 */

Hooks.once("i18nInit", () => {
  _localizeHelper(CONFIG.PSIONICS);
});

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
 * INLINE POWER DISPLAY
 *
 */

Hooks.on("renderBaseActorSheet", renderBaseActorSheet);

/**
 *
 * CALCULATE MAX PSI POINTS
 *
 */

Hooks.on(
  "dnd5e.computePsionicsProgression",
  (progression, actor, cls, spellcasting, count) => {
    if (!("psionics" in progression)) progression.psionics = 0;
    const prog =
      CONFIG.DND5E.spellcastingTypes.psionics.progression[
        spellcasting.progression
      ];
    if (!prog) return;

    progression.psionics += Math.floor(spellcasting.levels / (prog.divisor ?? 1));
    // Single-classed, non-full progression rounds up, rather than down, except at first level for half manifesters.
    if ((count === 1) && (prog.divisor > 1) && progression.psionics) {
      progression.psionics = Math.ceil(spellcasting.levels / prog.divisor);
    }

    updateManifester(actor, progression.psionics);
  }
);

Hooks.on("dnd5e.preparePsionicsSlots", (spells, actor, progression) => {
  if ((actor.type !== "npc") || !actor.items.some((i) => i.type === typePower))
    return;
  const level = foundry.utils.getProperty(actor, "system.details.spell.level");
  updateManifester(actor, level);
});

/**
 * In-memory update to the manifester
 * @param {Actor} actor
 * @param {number} manifesterLevel
 * @returns
 */
function updateManifester(actor, manifesterLevel) {
  const limit = Math.ceil(Math.min(manifesterLevel, 10) / 2) * 2;
  const updates = {
    manifestLimit: limit,
    pp: {
      max: CONFIG.PSIONICS.ppProgression[manifesterLevel]
    }
  };
  if (actor === undefined) return;
  const pp = actor.getFlag(moduleID, "pp");
  if (pp === undefined)
    updates.pp.value = CONFIG.PSIONICS.ppProgression[manifesterLevel];
  else if (typeof pp === "number") updates.pp.value = pp; // migration
  foundry.utils.mergeObject(actor.flags, {
    [moduleID]: updates
  });
}

/**
 *
 * POWER POINT RESET ON LR
 *
 */

Hooks.on("dnd5e.preRestCompleted", (actor, result) => {
  if (!result.longRest) return true;
  const pp = actor.getFlag(moduleID, "pp");
  if (!pp) return;
  result.updateData["flags.prime-psionics.pp.value"] = pp.max;
});

/**
 *
 * SPELLCASTING TABLE
 *
 */

Hooks.on(
  "dnd5e.buildPsionicsSpellcastingTable",
  (table, item, spellcasting) => {
    table.headers = [
      [
        {content: game.i18n.localize("PrimePsionics.PP")},
        {content: game.i18n.localize("PrimePsionics.PsiLimit")}
      ]
    ];

    table.cols = [{class: "spellcasting", span: 2}];

    for (const level of Array.fromRange(CONFIG.DND5E.maxLevel, 1)) {
      const progression = {psionics: 0};
      spellcasting.levels = level;
      globalThis.dnd5e.documents.Actor5e.computeClassProgression(
        progression,
        item,
        {spellcasting}
      );

      const pp = CONFIG.PSIONICS.ppProgression[progression.psionics] || "—";
      const limit =
        Math.ceil(Math.min(progression.psionics, 10) / 2) * 2 || "—";

      table.rows.push([
        {class: "spell-slots", content: `${pp}`},
        {class: "spell-slots", content: `${limit}`}
      ]);
    }
  }
);

/**
 * 
 * Useful Defaults
 * 
 */

Hooks.on("preCreateItem", (item, data, context, userId) => {
  if (item.type !== typePower) return;
  const bookSource = foundry.utils.getProperty(data, "system.source.book");
  if (!bookSource) item.updateSource({"system.source": {
    book: "PsiPri",
    license: "DMsGuild CCA"
  }});
});

Hooks.on("preUpdateItem", (item, changes, context, userId) => {
  if (item.type !== typePower) return;
  const activityChanges = foundry.utils.getProperty(changes, "system.activities");
  if (!activityChanges) return;
  const activities = foundry.utils.getProperty(item, "system.activities");
  for (const [key, activityData] of Object.entries(activityChanges)) {
    if (!activities.get(key) && !key.startsWith("-=")) {
      // make changes to activity
      if (item.system.level > 0) {
        activityData.consumption.targets.push({
          type: "psiPoints",
          value: "1",
          scaling: {
            mode: "amount"
          }
        });
        activityData.consumption.scaling.allowed = true;
        activityData.consumption.scaling.max = "1 + @flags.prime-psionics.manifestLimit - @activity.consumption.targets.0.value";
      }
      else {
        // Talents
      }
    }
  }
});
