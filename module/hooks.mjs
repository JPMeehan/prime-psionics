import PPCONFIG from "./config.mjs";
import PowerData from "./powerData.mjs";
import PowerSheet from "./powerSheet.mjs";
import { ppText, usesPP } from "./utils.mjs";

Hooks.once("init", () => {


  foundry.utils.mergeObject(CONFIG, PPCONFIG)
  
  Object.assign(CONFIG.Item.dataModels, {
    "prime-psionics.power": PowerData
  });

  dnd5e.utils.preLocalize("spellcastingTypes.psionics.progression", {key: "label"});

  Items.registerSheet("power", PowerSheet, {
    types: ["prime-psionics.power"],
    makeDefault: true
  });
});

/**
 * 
 * LOCALIZING THE CONFIG OBJECT
 * 
 */

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

/**
 * 
 * INLINE POWER DISPLAY
 * 
 */

Hooks.on("renderActorSheet5e", (app, html, context) => {
  if ( !game.user.isGM && app.actor.limited ) return true;
  if (context.isCharacter || context.isNPC) {
    const owner = context.actor.isOwner;
    let powers = context.items.filter(i => i.type === "prime-psionics.power")
    powers = app._filterItems(powers, app._filters.spellbook)
    const levels = context.system.spells;
    const spellbook = context.spellbook;
    const useLabels = {"-20": "-", "-10": "-", 0: "&infin;"};
    const sections = {atwill: -20, innate: -10, pact: 0.5 };

    const registerSection = (sl, i, label, {prepMode="prepared", value, max, override}={}) => {
      const aeOverride = foundry.utils.hasProperty(context.actor.overrides, `system.spells.spell${i}.override`);
      spellbook[i] = {
        order: i,
        label: label,
        usesSlots: i > 0,
        canCreate: owner,
        canPrepare: (context.actor.type === "character") && (i >= 1),
        spells: [],
        uses: useLabels[i] || value || 0,
        slots: useLabels[i] || max || 0,
        override: override || 0,
        dataset: {type: "spell", level: prepMode in sections ? 1 : i, "preparation.mode": prepMode},
        prop: sl,
        editable: context.editable && !aeOverride
      };
    };

    powers.forEach(power => {
      if (usesPP(power.system.consume)) power.system.labels.pp = ppText(power.system.consume.amount);
      foundry.utils.mergeObject(power, {
        labels: power.system.labels
      })
      context.itemContext[power.id].toggleTitle = CONFIG.DND5E.spellPreparationModes.always
      context.itemContext[power.id].toggleClass = "fixed";

      const mode = "always";
      let p = power.system.level;
      const pl = `spell${p}`;

      if ( mode in sections ) {
        p = sections[mode];
        if ( !spellbook[p] ) {
          const l = levels[mode] || {};
          const config = CONFIG.DND5E.spellPreparationModes[mode];
          registerSection(mode, p, config, {
            prepMode: mode,
            value: l.value,
            max: l.max,
            override: l.override
          });
        }
      }

      // Known bug: This breaks if there's a mix of spells and powers WITHOUT spellcaster levels
      else if ( !spellbook[p] ) {
        registerSection(pl, p, CONFIG.DND5E.spellLevels[p], {levels: levels[pl]});
      }

      // Add the power to the relevant heading
      spellbook[p].spells.push(power);
    });
    const spellList = html.find('.spellbook')
    const template = 'systems/dnd5e/templates/actors/parts/actor-spellbook.hbs'
    renderTemplate(template, context).then((partial) => {
      spellList.html(partial);
      const maxPP = app.actor.getFlag("prime-psionics", "ppMax")
      if (maxPP) {
        const ppContext = {
          pp: app.actor.getFlag("prime-psionics", "pp"),
          ppMax: maxPP,
          limit: app.actor.getFlag("prime-psionics", "manifestLimit")
        }
        renderTemplate(`/modules/prime-psionics/templates/pp-partial.hbs`, ppContext).then((powerHeader) => {
          spellList.find('.inventory-list').prepend(powerHeader);
        })
      }
      app.activateListeners(spellList);
    })
  }
  else return true;
})

/**
 * 
 * CALCULATE MAX PSI POINTS
 * 
 */

Hooks.on("dnd5e.computePsionicsProgression", (progression, actor, cls, spellcasting, count) => {
  if (!progression.hasOwnProperty("psionics")) progression.psionics = 0;
  const prog = CONFIG.DND5E.spellcastingTypes.psionics.progression[spellcasting.progression];
  if ( !prog ) return;

  progression.psionics += Math.floor(spellcasting.levels / prog.divisor ?? 1);
  // Single-classed, non-full progression rounds up, rather than down, except at first level for half manifesters.
  if ( (count === 1) && (prog.divisor > 1) && progression.psionics ) {
    progression.psionics = Math.ceil(spellcasting.levels / prog.divisor);
  }

  const limit = Math.ceil( Math.min(progression.psionics, 10) / 2) * 2
  const updates = {
    manifestLimit: limit,
    ppMax: CONFIG.PSIONICS.ppProgression[progression.psionics]
  }
  if (actor === undefined) return
  if (actor.getFlag("prime-psionics", "pp") === undefined) updates.pp = CONFIG.PSIONICS.ppProgression[progression.psionics]
  const flags = actor.flags["prime-psionics"]
  foundry.utils.mergeObject(flags, updates)
})

/**
 * 
 * ITEM USAGE HANDLING
 * 
 */

Hooks.on("renderAbilityUseDialog", (dialog, html, data) => {
  if (!usesPP(dialog.item.system.consume)) return;

  const content = game.i18n.format("PrimePsionics.PPManifest", {
    limit: dialog.item.parent.getFlag("prime-psionics", "manifestLimit")
  })
  const input = `<input type=number class="psi-points" name="ppSpend" value="${dialog.item.system.consume.amount}" min="${dialog.item.system.consume.amount}">`

  html.find("#ability-use-form").append("<div>" + content + input + "</div>")
  html.height(html.height()+10)
  html.find("input[name='consumeResource']").parents(".form-group").remove()

})

Hooks.on("dnd5e.preItemUsageConsumption", (item, config, options) => {
  if (!usesPP(item.system.consume)) return;
  config.consumeResource = false;
})

Hooks.on("dnd5e.itemUsageConsumption", (item, config, options, usage) => {
  if (!usesPP(item.system.consume)) return
  options.ppSpend = config.ppSpend 
  const currentPP = item.parent.getFlag("prime-psionics", "pp")
  const newPP = currentPP - config.ppSpend
  if (newPP >= 0) usage.actorUpdates["flags.prime-psionics.pp"] = newPP
  else {
    ui.notifications.warn(game.i18n.localize("PrimePsionics.TooManyPP"))
    return false;
  };
})

Hooks.on("dnd5e.preDisplayCard", (item, chatData, options) => {
  if (!usesPP(item.system.consume)) return;
  chatData.content = chatData.content.replace("PrimePsionics.PP", ppText(options.ppSpend))
  chatData.flags["prime-psionics"] = {ppSpend: options.ppSpend};
})

Hooks.on("renderChatMessage", (app, html, context) => {
  const ppSpend = app.getFlag("prime-psionics", "ppSpend")
  if (ppSpend === undefined) return;
  html.find("button[data-action='damage']")[0].dataset["ppspend"] = ppSpend
})

/**
 * SCALING
 */

Hooks.on("dnd5e.preRollDamage", (item, rollConfig) => {
  if (item.type !== "prime-psionics.power") return;
  if ( item.system.scaling.mode === "talent" ) {
    let level;
    if ( rollConfig.actor.type === "character" ) level = rollConfig.actor.system.details.level;
    else if ( item.system.preparation.mode === "innate" ) level = Math.ceil(rollConfig.actor.system.details.cr);
    else level = rollConfig.actor.system.details.spellLevel;
    const add = Math.floor((level + 1) / 6);
    if (add === 0) return;
    scaleDamage(rollConfig.parts, item.system.scaling.mode.formula || rollConfig.parts.join(" + "), add, rollConfig.data);
  }
  else if (item.system.scaling.mode === "intensify" && 
    item.system.scaling.formula) {
    const ppSpend = Number(rollConfig.event.target.dataset["ppspend"])
    if (ppSpend === NaN) return;
    const minPP = item.system.consume.amount;
    const intensify = Math.max(0, ppSpend - minPP)
    if (intensify === 0) return;
    scaleDamage(rollConfig.parts, item.system.scaling.formula, intensify, rollConfig.data);
  }
})
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
  if ( times <= 0 ) return parts;
  const p0 = new Roll(parts[0], rollData);
  const s = new Roll(scaling, rollData).alter(times);

  // Attempt to simplify by combining like dice terms
  let simplified = false;
  if ( (s.terms[0] instanceof Die) && (s.terms.length === 1) ) {
    const d0 = p0.terms[0];
    const s0 = s.terms[0];
    if ( (d0 instanceof Die) && (d0.faces === s0.faces) && d0.modifiers.equals(s0.modifiers) ) {
      d0.number += s0.number;
      parts[0] = p0.formula;
      simplified = true;
    }
  }

  // Otherwise, add to the first part
  if ( !simplified ) parts[0] = `${parts[0]} + ${s.formula}`;
  return parts;
}
/**
 * 
 * POWER POINT RESET ON LR
 * 
 */

Hooks.on("dnd5e.preRestCompleted", (actor, result) => {
  if (!result.longRest) return true;
  result.updateData["flags.prime-psionics.pp"] = actor.getFlag("prime-psionics", "ppMax")
})

/**
 * 
 * SPELLCASTING TABLE
 * 
 */

Hooks.on("dnd5e.buildPsionicsSpellcastingTable", (table, item, spellcasting) => {

  table.headers = [[
    {content: game.i18n.localize("PrimePsionics.PP")},
    {content: game.i18n.localize("PrimePsionics.PsiLimit")}
  ]];

  table.cols = [{class: "spellcasting", span: 2}];

  for ( const level of Array.fromRange(CONFIG.DND5E.maxLevel, 1) ) {
    const progression = { psionics: 0 };
    spellcasting.levels = level;
    globalThis.dnd5e.documents.Actor5e.computeClassProgression(progression, item, { spellcasting });

    const pp = CONFIG.PSIONICS.ppProgression[progression.psionics] || "—"
    const limit = Math.ceil( Math.min(progression.psionics, 10) / 2) * 2 || "—";

    table.rows.push([
      { class: "spell-slots", content: `${pp}` },
      { class: "spell-slots", content: `${limit}` }
    ]);
  }
})