# Changelog

## 3.1.0

- Updated logic for dnd5e system 5.1

## 3.0.0

- Major rewrite for dnd5e system 5.0
- Revised source book addition to `PsiPri: "Korranberg Chronicle: Psion's Primer"`

## 2.0.0

- Major Rewrite for dnd5e system 4.0.0
- Powers now use activities
- Powers now just use the normal Item sheet
- New custom Consumption type available for *all* item types: Power Points!
  - New activities on a Power with a level of 1 or more will default to having a Power Point consumption type
  - These also have a default consumption max of `"1 + @flags.prime-psionics.manifestLimit - @activity.consumption.targets.0.value"`
- Added compatibility with the Compendium Browser

## 1.2.1

- Added the `mgc` property to all powers
- Fixed an issue with the display of the Power tooltips
- Powers now correctly inherit their parent's proficiency bonus
- Added max compatibility of `dnd5e` 3.3.9 because of upcoming breaks in 4.0.

## 1.2.0

- Updated minimum compatibility to D&D 3.3
- Fixed bug preventing display on the revised NPC & Character sheets

## 1.1.3

- Removed duplicate display of powers from NPC "inventory"

## 1.1.2

- Added early return to render hook to prevent clobbering other modules if possible
- Added support for innate psionics as a preparation mode
- Improved support for NPC manifesters - if an NPC has powers, their spellcasting level will double as a manifester level

## 1.1.1

- Added missing .svg assets to release build
- Fixed minor display bugs in chat cards and item sheet
- Updated package images to new sheet and chat cards

## 1.1.0

- [BREAKING] Updated compatibility to dnd5e 3.0
  - Updated `components` to the new generic `properties` field to match base system spells. There is an automatic migration included as well as a getter for compatibility.
  - Powers display correctly on both the new and legacy character sheets
- Added new Source field handling to the Power sheet.
  - Added "Psion's Primer" as a default fill in for the `book` field
- Added new icons to match the new dnd5e aesthetic, courtesy of game-icons.net
- Adjusted power sheet namespace to use the module's name

## 1.0.3

- Added proper label to the power item sheet (#24)
- Fixed a display bug from having both powers and spells higher than a character's spellcasting level. (#5)

## 1.0.2

- Refactored number of functions.
- Fixed powers not showing how many points had been spent on them rather than their base value.
- Added "Intensify (2)" and "Intensify (3)" option for powers that scale per 2 or 3 pp spent on them. (#17)

## 1.0.1

- Fixed a bug blocking the display of power points on new character sheets.

## 1.0.0

- Fixed routeprefix bug.
- Migrated actor power points from pp/ppMax to pp.value and pp.max.
- Added manifest link so the project is not strictly dependent on the Foundry linkage.

## 0.9.1

- Added class table handling. (#8)
- Fixed build process so script file is properly added. (#4)

## 0.9.0

Initial release.
