"use strict"

const DefaultSettings = {
    "enabled": true,
    "nostrum_item": 280060,
    "use_savage": false,
    "hide_duration": true,
    "keep_resurrection_invincibility": false,
    "dungeon_only": false,
    "civil_unrest": false,
    "interval": 1000,
}

module.exports = function MigrateSettings(from_ver, to_ver, settings) {
    if (from_ver === undefined) {
        // Migrate legacy config file
        return Object.assign(Object.assign({}, DefaultSettings), settings);
    } else if (from_ver === null) {
        // No config file exists, use default settings
        return DefaultSettings;
    } else {
        // Migrate from older version (using the new system) to latest one
        if (from_ver + 1 < to_ver) {
            // Recursively upgrade in one-version steps
            settings = MigrateSettings(from_ver, from_ver + 1, settings);
            return MigrateSettings(from_ver + 1, to_ver, settings);
        }

        // If we reach this point it's guaranteed that from_ver === to_ver - 1, so we can implement
        // a switch for each version step that upgrades to the next version. This enables us to
        // upgrade from any version to the latest version without additional effort!
        switch (to_ver) {
            case 2:
                settings.dungeon_only = false;
                break;
            case 3:
                settings.civil_unrest = false;
                break;
        }

        return settings;
    }
}
