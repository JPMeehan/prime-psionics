import PSIONICS from "./module/config.mjs";
import PowerData from "./module/powerData.mjs";
import PowerSheet from "./module/PowerSheet.mjs";

Hooks.once("init", () => {

  CONFIG.PSIONICS = PSIONICS;

  CONFIG.DND5E.specialTimePeriods.foc = "PrimePsionics.Focus"
  
  Object.assign(CONFIG.Item.dataModels, {
    "prime-psionics.power": PowerData
  });

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
    const powers = context.items.filter(i => i.type === "prime-psionics.power")
    const spellbook = context.spellbook;
    const useLabels = {"-20": "-", "-10": "-", 0: "&infin;"};
    const sections = {atwill: -20, innate: -10, pact: 0.5 };

    const registerSection = (sl, i, label, {prepMode="prepared", value, max, override}={}) => {
      const aeOverride = foundry.utils.hasProperty(this.actor.overrides, `system.spells.spell${i}.override`);
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
      const mode = power.system.preparation.mode || "prepared";
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

      // Add the spell to the relevant heading
      spellbook[p].spells.push(power);
    });
    // const tab = context.isCharacter ? 3 : 2;
    // let spellList = html[0].children[1].children[0].children[2].children[tab]
    let spellList = html.find('.spellbook')[0]
    const partial = Handlebars.partials["dnd5e.actor-spellbook"]
    spellList.innerHTML = partial(context)
    app.activateListeners(html.find('.spellbook'))
  }
  else return true;
})