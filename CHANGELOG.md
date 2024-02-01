# Changelog

## 1.1.0

- [BREAKING] Updated compatibility to dnd5e 3.0
  - Updated `components` to the new generic `properties` field to match base system spells. There is an automatic migration included as well as a getter for compatibility.
  - Powers display correctly on both the new and legacy character sheets
- Added new Source field handling to the Power sheet.
  - Added "Psion's Primer" as a default fill in for the book field
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
