import PPCONFIG from "./module/config.mjs";
import PowerData from "./module/powerData.mjs";
import PowerSheet from "./module/powerSheet.mjs";

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

Hooks.on("dnd5e.computePsionicsProgression", (progression, actor, cls, spellcasting, count) => {
  if (!progression.hasOwnProperty("psionics")) progression.psionics = 0;
  const prog = CONFIG.DND5E.spellcastingTypes.psionics.progression[spellcasting.progression];
  if ( !prog ) return;

  progression.psionics += Math.floor(spellcasting.levels / prog.divisor ?? 1);
  // Single-classed, non-full progression rounds up, rather than down.
  if ( (count === 1) && (prog.divisor > 1) && progression.psionics ) {
    progression.psionics = Math.ceil(spellcasting.levels / prog.divisor);
  }

  const limit = Math.ceil( Math.min(progression.psionics, 10) / 2) * 2
  const updates = {
    manifestLimit: limit,
    ppMax: CONFIG.PSIONICS.ppProgression[progression.psionics]
  }
  if (actor.getFlag("prime-psionics", "pp") === undefined) updates.pp = CONFIG.PSIONICS.ppProgression[progression.psionics]
  const flags = actor.flags["prime-psionics"]
  foundry.utils.mergeObject(flags, updates)
})

function usesPP(item) {
  const consumption = item.system.consume
  return consumption.type === "flags" && consumption.target === "pp";
}

Hooks.on("renderAbilityUseDialog", (dialog, html, data) => {
  if (!usesPP(dialog.item)) return true;

  const content = game.i18n.format("PrimePsionics.PPManifest", {
    limit: dialog.item.parent.getFlag("prime-psionics", "manifestLimit")
  })
  const input = `<input type=number class="psi-points" name="ppSpend" value="${dialog.item.system.consume.amount}" min=0>`

  // html.find('.window-title').html(game.i18n.localize("PrimePsionics.Manifest"))
  html.find("#ability-use-form").append("<div>" + content + input + "</div>")
  html.height(html.height()+10)
  html.find("input[name='consumeResource']").parents(".form-group").remove()

})

Hooks.on("dnd5e.preItemUsageConsumption", (item, config, options) => {
  if (!usesPP(item)) return true;
  config.consumeResource = false;
})

Hooks.on("dnd5e.itemUsageConsumption", (item, config, options, usage) => {
  if (!usesPP(item)) return;
  const currentPP = item.parent.getFlag("prime-psionics", "pp")

  const newPP = currentPP - config.ppSpend
  if (newPP >= 0) usage.actorUpdates["flags.prime-psionics.pp"] = newPP // item.parent.setFlag("prime-psionics", "pp", newPP )
  else {
    ui.notifications.warn(game.i18n.localize("PrimePsionics.TooManyPP"))
    return false;
  };
})

Hooks.on("dnd5e.preRestCompleted", (actor, result) => {
  if (!result.longRest) return true;
  result.updateData["flags.prime-psionics.pp"] = actor.getFlag("prime-psionics", "ppMax")
})