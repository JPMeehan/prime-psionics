import {modulePath, ppText, typePower} from "./utils.mjs";

const {ItemDescriptionTemplate, ActivitiesTemplate} = dnd5e.dataModels.item;
const {ActivationField, DurationField, RangeField, TargetField} = dnd5e.dataModels.shared;

/**
 * Data definition for Power items.
 * @mixes ItemDescriptionTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {number} level                      Base level of the power.
 * @property {string} discipline                 Psionic discipline to which this power belongs.
 * @property {string} augmenting                 The base talent this power improves
 * @property {Set<string>} properties            General components and tags for this power.
 * @property {string} preparation                The preparation mode as found in `CONFIG.PSIONICS.powerPreparationModes`
 */
export default class PowerData extends dnd5e.dataModels.ItemDataModel.mixin(
  ItemDescriptionTemplate,
  ActivitiesTemplate
) {
  static LOCALIZATION_PREFIXES = [
    "DND5E.ACTIVATION", "DND5E.DURATION", "DND5E.RANGE", "DND5E.SOURCE", "DND5E.TARGET"
  ];

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    return this.mergeSchema(super.defineSchema(), {
      ability: new fields.StringField({label: "DND5E.SpellAbility"}),
      activation: new ActivationField(),
      duration: new DurationField(),
      range: new RangeField(),
      target: new TargetField(),
      level: new fields.NumberField({
        required: true,
        integer: true,
        initial: 1,
        min: 0,
        label: "PrimePsionics.PowerLevel"
      }),
      discipline: new fields.StringField({
        required: true,
        label: "PrimePsionics.PowerDiscipline"
      }),
      augmenting: new fields.StringField({
        required: true,
        label: "PrimePsionics.Augmenting"
      }),
      properties: new fields.SetField(
        new fields.StringField(),
        {label: "DND5E.Properties"}
      ),
      preparation: new fields.SchemaField(
        {
          mode: new fields.StringField({
            required: true,
            initial: "always",
            label: "PrimePsionics.PowerPreparationMode"
          })
        },
        {label: "PrimePsionics.PowerPreparation"}
      ),
      sourceClass: new fields.StringField({label: "DND5E.SpellSourceClass"})
    });
  }

  /** @inheritDoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
    hasEffects: true
  }, {inplace: false}));

  /** @override */
  static get compendiumBrowserFilters() {
    return new Map([
      ["level", {
        label: "PrimePsionics.PowerLevel",
        type: "range",
        config: {
          keyPath: "system.level",
          min: 0,
          max: Object.keys(CONFIG.DND5E.spellLevels).length - 1
        }
      }],
      ["discipline", {
        label: "PrimePsionics.PowerDiscipline",
        type: "set",
        config: {
          choices: CONFIG.PSIONICS.disciplines,
          keyPath: "system.discipline"
        }
      }],
      ["properties", this.compendiumBrowserPropertiesFilter(typePower)]
    ]);
  }

  /* -------------------------------------------- */
  /*  Data Migrations                             */
  /* -------------------------------------------- */

  /** @inheritDoc */
  static _migrateData(source) {
    super._migrateData(source);
    ActivitiesTemplate.migrateActivities(source);
    PowerData.#migrateActivation(source);
    PowerData.#migrateTarget(source);
  }
  /**
   * Migrate activation data.
   * Added in DnD5e 4.0.0.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateActivation(source) {
    if (source.activation?.cost) source.activation.value = source.activation.cost;
  }

  /* -------------------------------------------- */

  /**
   * Migrate target data.
   * Added in DnD5e 4.0.0.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateTarget(source) {
    if (!("target" in source)) return;
    source.target.affects ??= {};
    source.target.template ??= {};

    if ("units" in source.target) source.target.template.units = source.target.units;
    if ("width" in source.target) source.target.template.width = source.target.width;

    const type = source.target.type ?? source.target.template.type ?? source.target.affects.type;
    if (type in CONFIG.DND5E.areaTargetTypes) {
      if ("type" in source.target) source.target.template.type = type;
      if ("value" in source.target) source.target.template.size = source.target.value;
    } else if (type in CONFIG.DND5E.individualTargetTypes) {
      if ("type" in source.target) source.target.affects.type = type;
      if ("value" in source.target) source.target.affects.count = source.target.value;
    }
  }

  /* -------------------------------------------- */
  /*  Tooltips                                    */
  /* -------------------------------------------- */

  /**
   * The handlebars template for rendering item tooltips.
   * @type {string}
   */
  static ITEM_TOOLTIP_TEMPLATE = modulePath("templates/power-tooltip.hbs");

  async getCardData(enrichmentOptions = {}) {
    const context = await super.getCardData(enrichmentOptions);
    context.psionics = CONFIG.PSIONICS;
    context.discipline = this.discipline;
    context.isSpell = true;
    context.tags = this.labels.components.tags;
    context.subtitle = [
      this.labels.level,
      CONFIG.PSIONICS.disciplines[this.discipline].label
    ].filterJoin(" &bull; ");
    if (this.usesPP) {
      context.pp = ppText(this.ppValue, true);
      context.tags = [...context.tags, ppText(this.ppValue)];
    }
    context.augments = this.augmenting;
    return context;
  }

  /* -------------------------------------------- */

  async getFavoriteData() {
    return foundry.utils.mergeObject(await super.getFavoriteData(), {
      subtitle: [
        this.parent.labels.components.ao,
        this.parent.labels.activation
      ],
      modifier: this.parent.labels.modifier,
      range: this.range,
      save: this.save
    });
  }

  /** @inheritDoc */
  async getSheetData(context) {
    context.subtitles = [
      {label: context.labels.level},
      {label: context.labels.discipline}
    ];
    context.psionics = CONFIG.PSIONICS;
    context.properties.active = this.parent.labels?.components?.tags;
    context.parts = [modulePath("templates/details-power.hbs"), "dnd5e.field-uses"];
  }

  /* -------------------------------------------- */
  /*  Derived Data                                */
  /* -------------------------------------------- */

  prepareDerivedData() {
    super.prepareDerivedData();
    this.prepareDescriptionData();

    this.duration.concentration = this.properties.has("concentration");

    this.labels = this.parent.labels ??= {};

    const tags = {
      concentration: CONFIG.DND5E.itemProperties.concentration,
      ritual: CONFIG.DND5E.itemProperties.ritual
    };
    const attributes = {...CONFIG.PSIONICS.powerComponents, ...tags};
    this.labels.level =
      this.level != 0
        ? CONFIG.DND5E.spellLevels[this.level]
        : game.i18n.localize("PrimePsionics.Talent");
    this.labels.discipline = CONFIG.PSIONICS.disciplines[this.discipline]?.label;
    this.labels.school = CONFIG.PSIONICS.disciplines[this.discipline]?.label;
    this.labels.pp = this.usesPP ? "PrimePsionics.PP" : "";
    this.labels.aug = this.augmenting
      ? game.i18n.format("PrimePsionics.AugmentPower", {
        power: this.augmenting
      })
      : "";
    this.labels.components = this.properties.reduce(
      (obj, c) => {
        const config = attributes[c];
        if (!config) return obj;
        const {abbreviation, label, icon} = config;
        obj.all.push({abbreviation, label, icon, tag: config.tag});
        if (config.isTag) obj.tags.push(config.label);
        else obj.ao.push(config.abbreviation);
        return obj;
      },
      {all: [], ao: [], tags: []}
    );
    this.labels.components.ao = new Intl.ListFormat(game.i18n.lang, {
      style: "narrow",
      type: "conjunction"
    }).format(this.labels.components.ao);

    this.properties.add("mgc");
  }

  /** @inheritDoc */
  prepareFinalData() {
    const rollData = this.parent.getRollData({deterministic: true});
    const labels = this.parent.labels ??= {};
    this.prepareFinalActivityData();
    ActivationField.prepareData.call(this, rollData, labels);
    DurationField.prepareData.call(this, rollData, labels);
    RangeField.prepareData.call(this, rollData, labels);
    TargetField.prepareData.call(this, rollData, labels);

    // Necessary because excluded from valid types in Item5e#_prepareProficiency
    if (!this.parent.actor?.system.attributes?.prof) {
      this.prof = new dnd5e.documents.Proficiency(0, 0);
      return;
    }

    this.prof = new dnd5e.documents.Proficiency(this.parent.actor.system.attributes.prof, this.proficiencyMultiplier ?? 0);
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Attack classification of this spell.
   * @type {"spell"}
   */
  get attackClassification() {
    return "spell";
  }

  /** @override */
  get availableAbilities() {
    if (this.ability) return new Set([this.ability]);
    const spellcasting = this.parent?.actor?.spellcastingClasses[this.sourceClass]?.spellcasting.ability
      ?? this.parent?.actor?.system.attributes?.spellcasting;
    return new Set(spellcasting ? [spellcasting] : []);
  }

  /**
   * Properties displayed in chat.
   * @type {string[]}
   */
  get chatProperties() {
    let properties = [this.labels.level];
    if (this.labels.pp) properties.push(this.labels.pp);
    if (this.labels.aug) properties.push(this.labels.aug);

    return [
      ...properties,
      this.labels.components.ao,
      ...this.labels.components.tags
    ];
  }

  /**
   * @returns {boolean}   Whether this power is configured to use power points or not
   */
  get usesPP() {
    return (this.preparation.mode === "always") && this.activities.some(a => a.consumption.targets.some(c => c.type === "psiPoints"));
  }

  get ppValue() {
    const [consumptionData] = this.activities.map(a => a.consumption.targets.find(c => c.type === "psiPoints"));
    if (!consumptionData) return null;
    return consumptionData.value;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeAbilityMod() {
    return this.parent?.actor?.system.attributes.spellcasting || "int";
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeCriticalThreshold() {
    return this.parent?.actor?.flags.dnd5e?.spellCriticalThreshold ?? Infinity;
  }

  /**
   * The proficiency multiplier for this item.
   * @returns {number}
   */
  get proficiencyMultiplier() {
    return 1;
  }

  /** @inheritDoc */
  get scalingIncrease() {
    if (this.level !== 0) return null;
    return Math.floor(((this.parent.actor?.system.cantripLevel?.({system: {preparation: {mode: "prepared"}}}) ?? 0) + 1) / 6);
  }

  /** @inheritDoc */
  getRollData(...options) {
    const data = super.getRollData(...options);
    // data.item.level = data.item.level + (this.parent.getFlag("dnd5e", "scaling") ?? 0);
    return data;
  }
}
