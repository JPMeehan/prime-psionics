import { ppText } from './utils.mjs';

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
 * @property {object} scaling                    Details on how casting at higher levels affects this power.
 * @property {string} scaling.mode               Spell scaling mode as defined in `DND5E.spellScalingModes`.
 * @property {string} scaling.formula            Dice formula used for scaling.
 */
export default class PowerData extends dnd5e.dataModels.ItemDataModel.mixin(
  dnd5e.dataModels.item.ItemDescriptionTemplate,
  dnd5e.dataModels.item.ActivatedEffectTemplate,
  dnd5e.dataModels.item.ActionTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      level: new foundry.data.fields.NumberField({
        required: true,
        integer: true,
        initial: 1,
        min: 0,
        label: 'DND5E.SpellLevel',
      }),
      discipline: new foundry.data.fields.StringField({
        required: true,
        label: 'PrimePsionics.PowerDiscipline',
      }),
      augmenting: new foundry.data.fields.StringField({
        required: true,
        label: 'PrimePsionics.Augmenting',
      }),
      properties: new foundry.data.fields.SetField(
        new foundry.data.fields.StringField(),
        { label: 'PrimePsionics.PowerComponents' }
      ),
      scaling: new foundry.data.fields.SchemaField(
        {
          mode: new foundry.data.fields.StringField({
            required: true,
            initial: 'none',
            label: 'DND5E.ScalingMode',
          }),
          formula: new dnd5e.dataModels.fields.FormulaField({
            required: true,
            nullable: true,
            initial: null,
            label: 'DND5E.ScalingFormula',
          }),
        },
        { label: 'DND5E.LevelScaling' }
      ),
    });
  }

  /**
   * The handlebars template for rendering item tooltips.
   * @type {string}
   */
  static ITEM_TOOLTIP_TEMPLATE =
    'modules/prime-psionics/templates/power-tooltip.hbs';

  async getCardData(enrichmentOptions = {}) {
    const context = await super.getCardData(enrichmentOptions);
    context.psionics = CONFIG.PSIONICS;
    context.discipline = this.discipline;
    context.isSpell = true;
    context.tags = this.labels.components.tags;
    context.subtitle = [
      this.labels.level,
      CONFIG.PSIONICS.disciplines[this.discipline].label,
    ].filterJoin(' &bull; ');
    if (this.usesPP) {
      context.pp = ppText(this.consume.amount, true);
      context.tags = [...context.tags, ppText(this.consume.amount)];
    }
    context.augments = this.augmenting;
    return context;
  }

  /* -------------------------------------------- */

  async getFavoriteData() {
    return foundry.utils.mergeObject(await super.getFavoriteData(), {
      subtitle: [
        this.parent.labels.components.ao,
        this.parent.labels.activation,
      ],
      modifier: this.parent.labels.modifier,
      range: this.range,
      save: this.save,
    });
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    super.migrateData(source);
  }

  static _migrateComponentData(source) {
    const components = filteredKeys(source.system?.components ?? {});
    if (components.length) {
      foundry.utils.setProperty(
        source,
        'flags.dnd5e.migratedProperties',
        components
      );
    }
  }

  /* -------------------------------------------- */
  /*  Derived Data                                */
  /* -------------------------------------------- */

  prepareDerivedData() {
    this.labels = {};

    const tags = Object.fromEntries(
      Object.entries(CONFIG.DND5E.spellTags).map(([k, v]) => {
        v.tag = true;
        return [k, v];
      })
    );
    const attributes = { ...CONFIG.PSIONICS.powerComponents, ...tags };
    this.labels.level =
      this.level != 0
        ? CONFIG.DND5E.spellLevels[this.level]
        : game.i18n.localize('PrimePsionics.Talent');
    this.labels.school = CONFIG.PSIONICS.disciplines[this.discipline]?.label;
    this.labels.pp = this.usesPP ? 'PrimePsionics.PP' : '';
    this.labels.aug = this.augmenting
      ? game.i18n.format('PrimePsionics.AugmentPower', {
          power: this.augmenting,
        })
      : '';
    this.labels.components = this.properties.reduce(
      (obj, c) => {
        const config = attributes[c];
        if (!config) return obj;
        const { abbr, label, icon } = config;
        obj.all.push({ abbr, label, icon, tag: config.tag });
        if (config.tag) obj.tags.push(config.label);
        else obj.ao.push(config.abbr);
        return obj;
      },
      { all: [], ao: [], tags: [] }
    );
    this.labels.components.ao = new Intl.ListFormat(game.i18n.lang, {
      style: 'narrow',
      type: 'conjunction',
    }).format(this.labels.components.ao);
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

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
      ...this.labels.components.tags,
    ];
  }

  /**
   * @returns {boolean}   Whether this power is configured to use power points or not
   */
  get usesPP() {
    return this.consume.type === 'flags' && this.consume.target === 'pp';
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeAbilityMod() {
    return this.parent?.actor?.system.attributes.spellcasting || 'int';
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

  /**
   * Provide a backwards compatible getter for accessing `components`.
   * @deprecated since v1.1.
   * @type {object}
   */
  get components() {
    foundry.utils.logCompatibilityWarning(
      'The `system.components` property has been deprecated in favor of a standardized `system.properties` property.',
      { since: 'DnD5e 3.0', until: 'DnD5e 3.2', once: true }
    );
    return this.properties.reduce((acc, p) => {
      acc[p] = true;
      return acc;
    }, {});
  }
}
