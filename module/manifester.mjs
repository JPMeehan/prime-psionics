import {moduleID, typePower} from "./utils.mjs";

const {TypedObjectField, SchemaField, NumberField, StringField, BooleanField} = foundry.data.fields;

/**
 * A spellcasting model for psionic manifestation
 */
export default class ManifestationModel extends dnd5e.dataModels.spellcasting.SpellcastingModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      progression: new TypedObjectField(new SchemaField({
        divisor: new NumberField({required: true, nullable: false, integer: true, positive: true, initial: 1}),
        label: new StringField({required: true, initial: () => game.i18n.localize("DND5E.SPELLCASTING.Unlabeled")})
      }))
    };
  }

  /* -------------------------------------------- */

  /**
   * Necessary to ensure the prep methods get called
   * @type {boolean}
   */
  get slots() {
    return true;
  }

  /* -------------------------------------------- */

  /**
   * Necessary for SpellSlotConfig
   * @param {number} [level]  The spell slot level.
   * @returns {string}
   */
  getSpellSlotKey(level) {
    return "";
  }

  /* -------------------------------------------- */

  /**
   * Contribute to the actor's spellcasting progression for a spellcasting method that provides slots.
   * @param {object} progression                      Spellcasting progression data. *Will be mutated.*
   * @param {Actor5e|void} actor                      Actor for whom the data is being prepared, if any.
   * @param {Item5e} [cls]                            Class for whom this progression is being computed.
   * @param {SpellcastingDescription} [spellcasting]  Spellcasting descriptive object.
   * @param {number} [count]                          Number of classes with this type of spellcasting.
   */
  computeProgression(progression, actor, cls, spellcasting, count) {
    progression.psionics ??= 0;
    const prog = CONFIG.DND5E.spellcasting.psionics.progression[spellcasting.progression];
    if (!prog) return;

    progression.psionics += Math.floor(spellcasting.levels / (prog.divisor ?? 1));
    // Single-classed, non-full progression rounds up, rather than down, except at first level for half manifesters.
    if ((count === 1) && (prog.divisor > 1) && progression.psionics) {
      progression.psionics = Math.ceil(spellcasting.levels / prog.divisor);
    }

    this.updateManifester(actor, progression.psionics);
  }

  /* -------------------------------------------- */

  /**
   * NPC psi point progression.
   * @param {object} spells        The `data.spells` object within actor's data. *Will be mutated.*
   * @param {Actor5e|null} actor   Actor for whom the data is being prepared, if any.
   * @param {object} progression   Spellcasting progression data.
   * @abstract
   */
  prepareSlots(spells, actor, progression) {
    if ((actor.type !== "npc") || !actor.itemTypes[typePower].length) return;
    const level = foundry.utils.getProperty(actor, "system.details.spell.level");
    this.updateManifester(actor, level);
  }

  /* -------------------------------------------- */

  /**
   * In-memory update to the manifester
   * @param {Actor} actor
   * @param {number} manifesterLevel
   * @returns
   */
  updateManifester(actor, manifesterLevel) {
    if (!actor) return;
    const limit = Math.ceil(Math.min(manifesterLevel, 10) / 2) * 2;
    const updates = {
      manifestLimit: limit,
      pp: {
        max: CONFIG.PSIONICS.ppProgression[manifesterLevel]
      }
    };
    const pp = actor.getFlag(moduleID, "pp");
    if (pp === undefined) updates.pp.value = CONFIG.PSIONICS.ppProgression[manifesterLevel];
    else if (typeof pp === "number") updates.pp.value = pp; // migration
    foundry.utils.mergeObject(actor.flags, {
      [moduleID]: updates
    });
  }
}
