import PPCONFIG from "./module/config.mjs";
import PowerData from "./module/powerData.mjs";
import PowerSheet from "./module/powerSheet.mjs";
import { ppText } from "./module/utils.mjs";

const typePower = "prime-psionics.power";
const moduleID = "prime-psionics";

Hooks.once("init", () => {
  foundry.utils.mergeObject(CONFIG, PPCONFIG);

  Object.assign(CONFIG.Item.dataModels, {
    [typePower]: PowerData,
  });

  dnd5e.utils.preLocalize("spellcastingTypes.psionics.progression", {
    key: "label",
  });

  Items.registerSheet("power", PowerSheet, {
    types: [typePower],
    makeDefault: true,
    label: "PrimePsionics.Sheets.Power",
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
        if (value.includes("PrimePsionics"))
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
  if (!game.user.isGM && app.actor.limited) return true;
  if (context.isCharacter || context.isNPC) {
    const owner = context.actor.isOwner;
    let powers = context.items.filter((i) => i.type === typePower);
    powers = app._filterItems(powers, app._filters.spellbook);
    const levels = context.system.spells;
    const spellbook = context.spellbook;
    const useLabels = { "-20": "-", "-10": "-", 0: "&infin;" };
    const sections = { atwill: -20, innate: -10, pact: 0.5 };
    const cantripOffset =
      !!spellbook.find((s) => s?.order === sections.atwill) +
      !!spellbook.find((s) => s?.order === sections.innate);
    const levelOffset =
      cantripOffset + !!spellbook.find((s) => s?.order === sections.pact);
    const emptyTen = Array.from({ length: 10 });
    if (!!spellbook.length) {
      // Resolving #5 - bad order for mixed psionics + spellcasting if have spells > spell level.
      const manifestLevels = emptyTen.map((e, i) =>
        spellbook.findIndex((s) => s?.order === i)
      );
      let inserted = 0;
      for (const index in manifestLevels) {
        const i = Number(index);
        if (i === 0 && manifestLevels[i] === -1) {
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
      { prepMode = "prepared", value, max, override } = {}
    ) => {
      const aeOverride = foundry.utils.hasProperty(
        context.actor.overrides,
        `system.spells.spell${p}.override`
      );
      const i = p ? p + levelOffset : p + cantripOffset;
      spellbook[i] = {
        order: p,
        label: label,
        usesSlots: p > 0,
        canCreate: owner,
        canPrepare: context.actor.type === "character" && p >= 1,
        spells: [],
        uses: useLabels[p] || value || 0,
        slots: useLabels[p] || max || 0,
        override: override || 0,
        dataset: {
          type: "spell",
          level: prepMode in sections ? 1 : p,
          "preparation.mode": prepMode,
        },
        prop: sl,
        editable: context.editable && !aeOverride,
      };
    };

    powers.forEach((power) => {
      console.log(spellbook);
      if (power.system.usesPP)
        power.system.labels.pp = ppText(power.system.consume.amount);
      foundry.utils.mergeObject(power, {
        labels: power.system.labels,
      });
      context.itemContext[power.id].toggleTitle =
        CONFIG.DND5E.spellPreparationModes.always;
      context.itemContext[power.id].toggleClass = "fixed";

      const p = power.system.level;
      const pl = `spell${p}`;
      const index = p ? p + levelOffset : p + cantripOffset;
      // Known bug: This breaks if there's a mix of spells and powers WITHOUT spellcaster levels
      if (!spellbook[index]) {
        registerSection(pl, p, CONFIG.DND5E.spellLevels[p], {
          levels: levels[pl],
        });
      }

      // Add the power to the relevant heading
      spellbook[index].spells.push(power);
    });
    for (const i in spellbook) {
      if (spellbook[i] === undefined) delete spellbook[i];
    }
    const spellList = html.find(".spellbook");
    const template = "systems/dnd5e/templates/actors/parts/actor-spellbook.hbs";
    renderTemplate(template, context).then((partial) => {
      spellList.html(partial);
      let pp = app.actor.getFlag(moduleID, "pp");
      if (pp) {
        const ppContext = {
          pp: pp.value,
          ppMax: pp.max,
          limit: app.actor.getFlag(moduleID, "manifestLimit"),
        };
        renderTemplate(
          `/modules/prime-psionics/templates/pp-partial.hbs`,
          ppContext
        ).then((powerHeader) => {
          spellList.find(".inventory-list").prepend(powerHeader);
        });
      }
      app.activateListeners(spellList);
    });
  } else return true;
});

/**
 *
 * CALCULATE MAX PSI POINTS
 *
 */

Hooks.on(
  "dnd5e.computePsionicsProgression",
  (progression, actor, cls, spellcasting, count) => {
    if (!progression.hasOwnProperty("psionics")) progression.psionics = 0;
    const prog =
      CONFIG.DND5E.spellcastingTypes.psionics.progression[
        spellcasting.progression
      ];
    if (!prog) return;

    progression.psionics += Math.floor(spellcasting.levels / prog.divisor ?? 1);
    // Single-classed, non-full progression rounds up, rather than down, except at first level for half manifesters.
    if (count === 1 && prog.divisor > 1 && progression.psionics) {
      progression.psionics = Math.ceil(spellcasting.levels / prog.divisor);
    }

    const limit = Math.ceil(Math.min(progression.psionics, 10) / 2) * 2;
    const updates = {
      manifestLimit: limit,
      pp: {
        max: CONFIG.PSIONICS.ppProgression[progression.psionics],
      },
    };
    if (actor === undefined) return;
    const pp = actor.getFlag(moduleID, "pp");
    if (pp === undefined)
      updates.pp.value = CONFIG.PSIONICS.ppProgression[progression.psionics];
    else if (typeof pp === "number") updates.pp.value = pp; // migration
    const flags = actor.flags[moduleID];
    if (flags) foundry.utils.mergeObject(flags, updates);
    else actor.flags[moduleID] = updates;
  }
);

/**
 *
 * ITEM USAGE HANDLING
 *
 */

Hooks.on("renderAbilityUseDialog", (dialog, html, data) => {
  if (!dialog.item.system.usesPP) return;

  const limit = game.i18n.format("PrimePsionics.ManifestLimit", {
    limit: dialog.item.parent.getFlag(moduleID, "manifestLimit"),
  });
  const input = `<input type=number class="psi-points" name="ppSpend" value="${dialog.item.system.consume.amount}" min="${dialog.item.system.consume.amount}">`;

  const notes = html.find(".notes");
  if (notes[0].innerHTML) {
    notes[0].innerHTML += `<br>${limit}`;
    html.height(html.height() + 10);
  } else notes.text(limit);

  html
    .find("#ability-use-form")
    .append(
      "<div>" +
        game.i18n.localize("PrimePsionics.PPManifest") +
        input +
        "</div>"
    );
  html.height(html.height() + 10);
  html.find("input[name='consumeResource']").parents(".form-group").remove();
});

Hooks.on("dnd5e.preItemUsageConsumption", (item, config, options) => {
  if (!item.system.usesPP) return;
  config.consumeResource = false;
});

Hooks.on("dnd5e.itemUsageConsumption", (item, config, options, usage) => {
  if (!item.system.usesPP) return;
  options.ppSpend = config.ppSpend;
  const currentPP = item.parent.getFlag(moduleID, "pp")["value"];
  const newPP = currentPP - config.ppSpend;
  if (newPP >= 0) usage.actorUpdates["flags.prime-psionics.pp.value"] = newPP;
  else {
    ui.notifications.warn(game.i18n.localize("PrimePsionics.TooManyPP"));
    return false;
  }
});

Hooks.on("dnd5e.preDisplayCard", (item, chatData, options) => {
  if (!item.system.usesPP) return;
  chatData.content = chatData.content.replace(
    item.system.labels.pp,
    ppText(options.ppSpend)
  );
  chatData.flags[moduleID] = { ppSpend: options.ppSpend };
});

Hooks.on("renderChatMessage", (app, html, context) => {
  const ppSpend = app.getFlag(moduleID, "ppSpend");
  if (ppSpend === undefined) return;
  const damage = html.find("button[data-action='damage']");
  if (damage.length) damage[0].dataset["ppspend"] = ppSpend;
});

/**
 * SCALING
 */

Hooks.on("dnd5e.preRollDamage", (item, rollConfig) => {
  if (item.type !== typePower) return;
  if (item.system.scaling.mode === "talent") {
    let level;
    if (rollConfig.actor.type === "character")
      level = rollConfig.actor.system.details.level;
    else if (item.system.preparation.mode === "innate")
      level = Math.ceil(rollConfig.actor.system.details.cr);
    else level = rollConfig.actor.system.details.spellLevel;
    const add = Math.floor((level + 1) / 6);
    if (add === 0) return;
    scaleDamage(
      rollConfig.parts,
      item.system.scaling.mode.formula || rollConfig.parts.join(" + "),
      add,
      rollConfig.data
    );
  } else if (
    Object.keys(CONFIG.PSIONICS.scaling).includes(item.system.scaling.mode) &&
    item.system.scaling.formula
  ) {
    const ppSpend = Number(rollConfig.event.target.dataset["ppspend"]);
    if (ppSpend === NaN) return;
    const minPP = item.system.consume.amount;
    const intensify = Math.floor(
      Math.max(0, ppSpend - minPP) /
        CONFIG.PSIONICS.scaling[item.system.scaling.mode]
    );
    if (intensify === 0) return;
    scaleDamage(
      rollConfig.parts,
      item.system.scaling.formula,
      intensify,
      rollConfig.data
    );
  }
});
/**
 * Scale an array of damage parts according to a provided scaling formula and scaling multiplier.
 * @param {string[]} parts    The original parts of the damage formula.
 * @param {string} scaling    The scaling formula.
 * @param {number} times      A number of times to apply the scaling formula.
 * @param {object} rollData   A data object that should be applied to the scaled damage roll
 * @returns {string[]}        The parts of the damage formula with the scaling applied.
 * @private
 */
function scaleDamage(parts, scaling, times, rollData) {
  if (times <= 0) return parts;
  const p0 = new Roll(parts[0], rollData);
  const s = new Roll(scaling, rollData).alter(times);

  // Attempt to simplify by combining like dice terms
  let simplified = false;
  if (s.terms[0] instanceof Die && s.terms.length === 1) {
    const d0 = p0.terms[0];
    const s0 = s.terms[0];
    if (
      d0 instanceof Die &&
      d0.faces === s0.faces &&
      d0.modifiers.equals(s0.modifiers)
    ) {
      d0.number += s0.number;
      parts[0] = p0.formula;
      simplified = true;
    }
  }

  // Otherwise, add to the first part
  if (!simplified) parts[0] = `${parts[0]} + ${s.formula}`;
  return parts;
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
        { content: game.i18n.localize("PrimePsionics.PP") },
        { content: game.i18n.localize("PrimePsionics.PsiLimit") },
      ],
    ];

    table.cols = [{ class: "spellcasting", span: 2 }];

    for (const level of Array.fromRange(CONFIG.DND5E.maxLevel, 1)) {
      const progression = { psionics: 0 };
      spellcasting.levels = level;
      globalThis.dnd5e.documents.Actor5e.computeClassProgression(
        progression,
        item,
        { spellcasting }
      );

      const pp = CONFIG.PSIONICS.ppProgression[progression.psionics] || "—";
      const limit =
        Math.ceil(Math.min(progression.psionics, 10) / 2) * 2 || "—";

      table.rows.push([
        { class: "spell-slots", content: `${pp}` },
        { class: "spell-slots", content: `${limit}` },
      ]);
    }
  }
);
