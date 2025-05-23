import {modulePath, typePower} from "./utils.mjs";

/**
 * Adjust the NPC and Character sheets to have a powers tab.
 */
export function addPowerTab() {
  const powerTab = {
    tab: "primePowers",
    label: "TYPES.Item.prime-psionics.powerPl",
    svg: modulePath("assets/icons/power.svg")
  };
  const powerPart = {
    container: {classes: ["tab-body"], id: "tabs"},
    template: modulePath("templates/power-tab-empty.hbs"),
    scrollable: [""]
  };

  const {NPCActorSheet, CharacterActorSheet} = dnd5e.applications.actor;

  // fail to find is -1, +1 makes 0 which is falsy.
  const npcSpells = NPCActorSheet.TABS.findIndex((t) => t.tab === "spells") + 1 || 3;
  NPCActorSheet.TABS.splice(npcSpells, 0, powerTab);
  NPCActorSheet.PARTS.primePowers = powerPart;

  const characterSpells = CharacterActorSheet.TABS.findIndex((t) => t.tab === "spells") + 1 || 4;
  CharacterActorSheet.TABS.splice(characterSpells, 0, powerTab);
  CharacterActorSheet.PARTS.primePowers = powerPart;

  customElements.get("dnd5e-inventory").COLUMNS.powerDiscipline = {
    id: "powerDiscipline",
    width: 40,
    order: 100,
    priority: 100,
    label: "PrimePsionics.DisciplineHeader",
    template: modulePath("templates/power-discipline.hbs")
  };
}

/* -------------------------------------------------- */

/**
 * Replace the blank power tab with a rendered one.
 * @param {CharacterActorSheet|NPCActorSheet} app   The Application instance being rendered.
 * @param {HTMLElement} html                        The inner HTML of the document that will be displayed and may be modified.
 * @param {ApplicationRenderContext} context        The application rendering context data.
 * @param {ApplicationRenderOptions} options        The application rendering options.
 */
export async function renderBaseActorSheet(app, html, context, options) {
  const actor = app.document;
  if (!["character", "npc"].includes(actor.type)) return;

  // Toggle hidden on all powers in the features tab.
  // There does not appear to be a way to do this via the filterItem hook due to lack of tab context
  // See https://github.com/foundryvtt/dnd5e/issues/5664
  const features = html.querySelectorAll("[data-application-part=\"features\"] li.item");
  for (const li of features) {
    const item = actor.items.get(li.dataset.itemId);
    if (item.type !== typePower) continue;
    li.classList.add("hidden");
  }

  // Power creation handling
  const button = html.querySelector("button.create-child[data-action=\"addDocument\"]");
  if (button && options.isFirstRender) {
    button.addEventListener("click", (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      const target = ev.target.closest("[data-action]");

      if (app.tabGroups.primary !== "primePowers") return app._addDocument(ev, target);

      const actor = app.document;

      Item.implementation.create(
        {
          type: typePower,
          name: Item.implementation.defaultName({type: typePower, parent: actor})
        },
        {parent: actor, renderSheet: true}
      );
    });
  }

  if (("parts" in options) && !options.parts.includes("powers")) return;

  app._filters.powers ??= {name: "", properties: new Set()};

  context.psionics = CONFIG.PSIONICS;

  const Inventory = customElements.get(app.options.elements.inventory);
  context.sections = Inventory.prepareSections(preparePowers(app, context));
  context.listControls = {
    label: "PrimePsionics.SearchPowers",
    list: "powers",
    filters: [
      {key: "action", label: "DND5E.Action"},
      {key: "bonus", label: "DND5E.BonusAction"},
      {key: "reaction", label: "DND5E.Reaction"},
      {key: "concentration", label: "DND5E.Concentration"},
      {key: "prepared", label: "DND5E.Prepared"},
      ...Object.entries(CONFIG.PSIONICS.disciplines).map(([key, {label}]) => ({key, label}))
    ],
    sorting: [
      {
        key: "a",
        label: "SIDEBAR.SortModeAlpha",
        dataset: {icon: "fa-solid fa-arrow-down-a-z"}
      },
      {
        key: "p",
        label: "SIDEBAR.SortModePriority",
        dataset: {icon: "fa-solid fa-arrow-down-1-9"}
      },
      {
        key: "m",
        label: "SIDEBAR.SortModeManual",
        dataset: {icon: "fa-solid fa-arrow-down-short-wide"}
      }
    ]
  };

  const powerTab = html.querySelector("section[data-application-part=\"powers\"]");

  const contents = await foundry.applications.handlebars.renderTemplate(
    modulePath("systems/dnd5e/templates/inventory/inventory.hb"),
    context
  );

  powerTab.insertAdjacentHTML("afterbegin", contents);

  // recreate drag drop handling
  if (app.isEditable) {
    powerTab.querySelectorAll(".draggable").forEach((e) => {
      e.setAttribute("draggable", true);
      e.ondragstart = (event) => {
        app._onDragStart(event);
        if (event.dataTransfer.items.length) event.stopPropagation();
      };
    });
  }
}

/* -------------------------------------------------- */

/**
 * Helper function to put together the inventory.
 * @param {object} app        The actor sheet.
 * @param {object} context    Rendering context.
 * @returns {object[]}        Power section data.
 */
function preparePowers(app, context) {
  const columns = customElements
    .get(app.options.elements.inventory)
    .mapColumns([
      "powerDiscipline",
      "time",
      "range",
      "target",
      "roll",
      {id: "uses", order: 650, priority: 300},
      {id: "formula", priority: 200},
      "controls"
    ]);

  const powerSections = Object.entries(CONFIG.PSIONICS.disciplines).map(([i, label]) => ({
    id: "level" + i,
    // section order not directly power order
    order: i,
    label,
    columns,
    dataset: {type: typePower, level: i},
    draggable: true,
    items: [],
    minWidth: 220
  }));

  for (const item of context.actor.itemTypes[typePower]) {
    powerSections[item.system.level].items.push(item);

    const ctx = context.itemContext[item.id];

    // Activation
    const cost = item.system.activation?.value ?? "";
    const abbr = {
      action: "DND5E.ActionAbbr",
      bonus: "DND5E.BonusActionAbbr",
      reaction: "DND5E.ReactionAbbr",
      minute: "DND5E.TimeMinuteAbbr",
      hour: "DND5E.TimeHourAbbr",
      day: "DND5E.TimeDayAbbr"
    }[item.system.activation.type];
    ctx.activation = abbr ? `${cost}${game.i18n.localize(abbr)}` : item.labels.activation;

    // Range
    const units = item.system.range?.units;
    if (units && (units !== "none")) {
      if (units in CONFIG.DND5E.movementUnits)
        ctx.range = {
          distance: true,
          value: item.system.range.value,
          unit: CONFIG.DND5E.movementUnits[units].abbreviation,
          parts: dnd5e.utils.formatLength(item.system.range.value, units, {parts: true})
        };
      else ctx.range = {distance: false};
    }
  }

  return powerSections;
}

/* -------------------------------------------------- */

/**
 * Handle filter logic for filtering items on the sheet.
 * @param {BaseActorSheet|ContainerSheet} sheet   The sheet the item is being rendered on.
 * @param {Item5e} item                           The item being filtered.
 * @param {Set<string>} filters                   Filters applied to the Item.
 * @returns {false|void}                          Return `false` to hide the item, otherwise
 *                                                other filters will continue to apply.
 */
export function filterItem(sheet, item, filters) {
  if (item.type !== typePower) return;
  const disciplines = new Set(Object.keys(CONFIG.PSIONICS.disciplines));
  const disciplineFilter = disciplines.intersection(filters);
  if (disciplineFilter.size && !disciplineFilter.has(item.system.discipline)) return false;
}
