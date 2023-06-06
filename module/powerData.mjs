/**
 * Data definition for Power items.
 * @mixes ItemDescriptionTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {number} level                      Base level of the power.
 * @property {string} school                     Psionic discipline to which this power belongs.
 * @property {object} components                 General components and tags for this power.
 * @property {boolean} components.auditory       Does this power manifest auditory components?
 * @property {boolean} components.observable     Does this power manifest observable components?
 * @property {boolean} components.ritual         Can this power be cast as a ritual?
 * @property {boolean} components.concentration  Does this power require concentration?
 * @property {object} scaling                    Details on how casting at higher levels affects this power.
 * @property {string} scaling.mode               Spell scaling mode as defined in `DND5E.spellScalingModes`.
 * @property {string} scaling.formula            Dice formula used for scaling.
 */
export default class PowerData extends dnd5e.dataModels.SystemDataModel.mixin(
  dnd5e.dataModels.item.ItemDescriptionTemplate, dnd5e.dataModels.item.ActivatedEffectTemplate, dnd5e.dataModels.item.ActionTemplate
  ) {
    /** @inheritdoc */
    static defineSchema() {
      return this.mergeSchema(super.defineSchema(), {
        level: new foundry.data.fields.NumberField({
          required: true, integer: true, initial: 1, min: 0, label: "DND5E.SpellLevel"
        }),
        discipline: new foundry.data.fields.StringField({required: true, label: "PrimePsionics.PowerDiscipline"}),
        augmenting: new foundry.data.fields.StringField({required: true, label: "PrimePsionics.Augmenting"}),
        components: new dnd5e.dataModels.fields.MappingField(new foundry.data.fields.BooleanField(), {
          required: true, label: "PrimePsionics.PowerComponents",
          initialKeys: [
            ...Object.keys(CONFIG.PSIONICS.powerComponents), 
            ...Object.keys(CONFIG.DND5E.spellTags)
          ]
        }),
        scaling: new foundry.data.fields.SchemaField({
          mode: new foundry.data.fields.StringField({required: true, initial: "none", label: "DND5E.ScalingMode"}),
          formula: new dnd5e.dataModels.fields.FormulaField({required: true, nullable: true, initial: null, label: "DND5E.ScalingFormula"})
        }, {label: "DND5E.LevelScaling"})
      });
    }
  
    /* -------------------------------------------- */
    /*  Migrations                                  */
    /* -------------------------------------------- */
  
    /** @inheritdoc */
    static migrateData(source) {
      super.migrateData(source);
    }
  

    /* -------------------------------------------- */
    /*  Derived Data                                */
    /* -------------------------------------------- */

    prepareDerivedData() {
      this.labels = {}
      this._preparePower()
    }

    _preparePower() {
      const tags = Object.fromEntries(Object.entries(CONFIG.DND5E.spellTags).map(([k, v]) => {
        v.tag = true;
        return [k, v];
      }));
      const attributes = {...CONFIG.PSIONICS.powerComponents, ...tags};
      this.labels.level = this.level != 0 ? CONFIG.DND5E.spellLevels[this.level] : game.i18n.localize("PrimePsionics.Talent");
      this.labels.school = CONFIG.PSIONICS.disciplines[this.discipline];
      this.labels.pp = (this.consume.target === 'pp' & this.consume.type === 'flags') ? "PrimePsionics.PP" : "";
      this.labels.components = Object.entries(this.components).reduce((obj, [c, active]) => {
        const config = attributes[c];
        if ( !config || (active !== true) ) return obj;
        obj.all.push({abbr: config.abbr, tag: config.tag});
        if ( config.tag ) obj.tags.push(config.label);
        else obj.ao.push(config.abbr);
        return obj;
      }, {all: [], ao: [], tags: []});
    }

    /* -------------------------------------------- */
    /*  Getters                                     */
    /* -------------------------------------------- */
  
    /**
     * Properties displayed in chat.
     * @type {string[]}
     */
    get chatProperties() {
      let properties = [this.labels.level]
      if (this.labels.pp) properties.push(this.labels.pp)
      
      return [
        ...properties,
        this.labels.components.ao,
        ...this.labels.components.tags
      ];
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
  
  }
  