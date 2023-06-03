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

    const registerSection = (sl, i, label, {prepMode="always", value, max, override}={}) => {
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
  actor.setFlag("prime-psionics", "manifestLimit", limit)

  const ppProgression = [0,4,6,16,20,32,38,46,54,72,82,94,94,108,108,124,124,142,152,164,178]
  actor.setFlag("prime-psionics", "ppMax", ppProgression[progression.psionics])

  if (actor.getFlag("prime-psionics", "pp") === undefined) actor.setFlag("prime-psionics", "pp", ppProgression[progression.psionics])
})

Hooks.on("dnd5e.preUseItem", (item, config, options) => {
  const consumption = item.system.consume;
  if (consumption.type !== "flags") return true;
  if (consumption.target !== "pp") return true;

  config.needsConfiguration = false;
  config.consumeResource = false;
  options.configureDialog = false;

  return activatePower(item, config, options)
})

async function activatePower(item, config, options) {

  const content = game.i18n.format("PrimePsionics.PPManifest", {
    limit: item.parent.getFlag("prime-psionics", "manifestLimit")
  })
  const input = `<input type=number class="psi-points" value="${item.system.consume.amount}" min=0>`

  const dialogResult = await Dialog.wait({
    title: "Manifest Power",
    content: content + input,
    buttons: {
     manifest: {
      icon: '<i class="fas fa-check"></i>',
      label: game.i18n.localize("PrimePsionics.Manifest"),
      callback: (html) => new Object({
        manifest: true,
        spend: html.find(".psi-points").val()
      })
     },
     cancel: {
         icon: '<i class="fas fa-times"></i>',
         label: game.i18n.localize("Cancel"),
         callback: () => new Object({
          manifest: false,
          spend: 0
         })
     }
    },
    default: "cancel",
   });

   const currentPP = item.parent.getFlag("prime-psionics", "pp")

   const newPP = currentPP - dialogResult.spend

   if (newPP >= 0) item.parent.setFlag("prime-psionics", "pp", newPP )
   else {
    dialogResult.manifest = false;
    ui.notifications.warn(game.i18n.localize("PrimePsionics.TooManyPP"));
   }
   
   return dialogResult.manifest;


}

Hooks.on("dnd5e.preRestCompleted", (actor, result) => {
  if (!result.longRest) return true;
  result.updateData["flags.prime-psionics.pp"] = actor.getFlag("prime-psionics", "ppMax")
})