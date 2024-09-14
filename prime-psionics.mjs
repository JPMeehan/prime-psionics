import PP_CONFIG from "./module/config.mjs";
import PowerData from "./module/powerData.mjs";
import PowerSheet from "./module/powerSheet.mjs";
import {typePower, moduleID, modulePath, ppText} from "./module/utils.mjs";

Hooks.once("init", () => {
  foundry.utils.mergeObject(CONFIG, PP_CONFIG);

  Object.assign(CONFIG.Item.dataModels, {
    [typePower]: PowerData
  });

  dnd5e.utils.preLocalize("spellcastingTypes.psionics.progression", {
    key: "label"
  });

  Items.registerSheet(moduleID, PowerSheet, {
    types: [typePower],
    label: "PrimePsionics.Sheets.Power"
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

Hooks.on("renderActorSheet5e", (app, html, context) => {
  const actor = app.actor;

  if (!game.user.isGM && actor.limited) return true;
  const newCharacterSheet = ["ActorSheet5eCharacter2", "ActorSheet5eNPC2"].includes(app.constructor.name);
  if (context.isCharacter || context.isNPC) {
    let powers = context.items.filter((i) => i.type === typePower);
    powers = app._filterItems(powers, app._filters.spellbook.properties);
    if (!powers.length && !hasPowerPoints(actor)) return true;
    const spellbook = context.spellbook;

    const specialPowerPrepModes = {
      innate: -5
    };
    const specialPowerPrep = {};

    const sections = {
      atwill: -20,
      innate: -10,
      pact: 0.5
    };
    const cantripOffset =
      !!spellbook.find((s) => s?.order === sections.atwill) +
      !!spellbook.find((s) => s?.order === sections.innate);
    const levelOffset =
      cantripOffset + !!spellbook.find((s) => s?.order === sections.pact);
    const emptyTen = Array.from({length: 10});
    if (spellbook.length) {
      // Resolving #5 - bad order for mixed psionics + spellcasting if have spells > spell level.
      const manifestLevels = emptyTen.map((e, i) =>
        spellbook.findIndex((s) => s?.order === i)
      );
      let inserted = 0;
      for (const index in manifestLevels) {
        const i = Number(index);
        if ((i === 0) && (manifestLevels[i] === -1)) {
          inserted += 1;
          // Cantrip special case
          spellbook.splice(cantripOffset, 0, undefined);
        } else if (manifestLevels[i] + inserted !== i + levelOffset) {
          inserted += 1;
          spellbook.splice(i + levelOffset, 0, undefined);
        }
      }
    }

    const registerSection = (
      sl,
      p,
      label,
      {preparationMode = "always", override} = {}
    ) => {
      const aeOverride = foundry.utils.hasProperty(
        context.actor.overrides,
        `system.spells.spell${p}.override`
      );
      const sectionData = {
        order: p,
        label: label,
        usesSlots: false,
        canCreate: actor.isOwner,
        canPrepare: false,
        spells: [],
        uses: "-",
        slots: "-",
        override: override || 0,
        dataset: {
          type: typePower,
          level: preparationMode in sections ? 1 : p,
          preparationMode
        },
        prop: sl,
        editable: context.editable && !aeOverride
      };

      let i = p;
      if (p >= 0) {
        i = p ? p + levelOffset : p + cantripOffset;
        spellbook[i] = sectionData;
      } else {
        specialPowerPrep[i] = sectionData;
      }
    };

    powers.forEach((power) => {
      if (power.system.usesPP)
        power.system.labels.pp = ppText(power.system.consume.amount);
      foundry.utils.mergeObject(power, {
        labels: power.system.labels
      });

      // Activation
      const cost = power.system.activation?.cost;
      const abbr = {
        action: "DND5E.ActionAbbr",
        bonus: "DND5E.BonusActionAbbr",
        reaction: "DND5E.ReactionAbbr",
        minute: "DND5E.TimeMinuteAbbr",
        hour: "DND5E.TimeHourAbbr",
        day: "DND5E.TimeDayAbbr"
      }[power.system.activation.type];

      const itemContext = newCharacterSheet
        ? {
          activation:
              cost && abbr
                ? `${cost}${game.i18n.localize(abbr)}`
                : power.labels.activation,
          preparation: {applicable: false}
        }
        : {
          toggleTitle: CONFIG.DND5E.spellPreparationModes.always,
          toggleClass: "fixed"
        };

      if (newCharacterSheet) {
        // Range
        const units = power.system.range?.units;
        if (units && (units !== "none")) {
          if (units in CONFIG.DND5E.movementUnits) {
            itemContext.range = {
              distance: true,
              value: power.system.range.value,
              unit: game.i18n.localize(`DND5E.Dist${units.capitalize()}Abbr`)
            };
          } else itemContext.range = {distance: false};
        }

        // To Hit
        const toHit = parseInt(power.labels.modifier);
        if (power.hasAttack && !isNaN(toHit)) {
          itemContext.toHit = {
            sign: Math.sign(toHit) < 0 ? "-" : "+",
            abs: Math.abs(toHit)
          };
        }
      }

      foundry.utils.mergeObject(context.itemContext[power.id], itemContext);

      const mode = power.system.preparation.mode;
      const p = power.system.level || 0;
      const pl = `spell${p}`;
      let index = p ? p + levelOffset : p + cantripOffset;

      if (mode in specialPowerPrepModes) {
        index = specialPowerPrepModes[mode];
        if (!specialPowerPrep[index]) {
          registerSection(
            mode,
            index,
            CONFIG.PSIONICS.powerPreparationModes[mode],
            {preparationMode: mode}
          );
        }
        specialPowerPrep[index].spells.push(power);
      } else {
        if (!spellbook[index]) {
          registerSection(pl, p, CONFIG.PSIONICS.powerLevels[p], {
            preparationMode: power.system.preparation.mode
          });
        }
        // Add the power to the relevant heading
        spellbook[index].spells.push(power);
      }
    });
    for (const i in spellbook) {
      if (spellbook[i] === undefined) delete spellbook[i];
    }
    spellbook.push(...Object.values(specialPowerPrep));

    spellbook.sort((a, b) => a.order - b.order);
    const spellList = newCharacterSheet
      ? html.find(".spells")
      : html.find(".spellbook");
    const spellListTemplate = newCharacterSheet
      ? "systems/dnd5e/templates/actors/tabs/creature-spells.hbs"
      : "systems/dnd5e/templates/actors/parts/actor-spellbook.hbs";
    renderTemplate(spellListTemplate, context).then((partial) => {
      spellList.html(partial);

      if (newCharacterSheet) {
        const schoolSlots = spellList.find(".item-detail.item-school");
        /** @type {Array<string>} */
        const disciplines = Object.values(CONFIG.PSIONICS.disciplines).map(
          (d) => d.label
        );
        for (const div of schoolSlots) {
          if (disciplines.includes(div.dataset.tooltip)) {
            div.innerHTML = `<dnd5e-icon src="modules/prime-psionics/assets/icons/${div.dataset.tooltip.toLowerCase()}.svg"></dnd5e-icon>`;
          }
        }
      }

      let pp = app.actor.getFlag(moduleID, "pp");
      if (pp) {
        const ppContext = {
          pp: pp.value,
          ppMax: pp.max,
          limit: app.actor.getFlag(moduleID, "manifestLimit")
        };
        const ppTemplate = newCharacterSheet
          ? "/modules/prime-psionics/templates/pp-partial-2.hbs"
          : "/modules/prime-psionics/templates/pp-partial.hbs";
        renderTemplate(ppTemplate, ppContext).then((powerHeader) => {
          const ppTarget = newCharacterSheet
            ? "dnd5e-inventory"
            : ".inventory-list";
          spellList.find(ppTarget).prepend(powerHeader);
        });
      }
      app.activateListeners(spellList);
    });

    if (app.constructor.name === "ActorSheet5eNPC") {
      const features = html.find("dnd5e-inventory").first();
      const inventory = features.find("ol").last();
      for (const i of inventory.find("li")) {
        const item = actor.items.get(i.dataset.itemId);
        if (item.type === typePower) i.remove();
      }
    }
  } else return true;
});

/**
 * Determines if an actor has exertion points
 * @param {object} actor  The character
 * @returns {boolean}     Whether or not the character has an exertion pool
 */
function hasPowerPoints(actor) {
  for (const cls of Object.values(actor.classes)) {
    if (cls.spellcasting.type === "psionics") return true;
  }
  return false;
}

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
  const level = foundry.utils.getProperty(actor, "system.details.spellLevel");
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
 * Activity Defaults
 * 
 */

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
