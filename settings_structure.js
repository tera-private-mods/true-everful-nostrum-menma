module.exports = [
    {
        "key": "enabled",
        "name": "Enable module",
        "type": "bool"
    },
    {
        "key": "nostrum_item",
        "name": "Nostrum item for use (Asura/Agaia/Starscape Online only)",
        "type": "select",
        "options": [
            { "name": "Multi-Nostrum: Power (Asura)", "key": 89067 },
            { "name": "Multi-Nostrum: Crit (Asura)", "key": 207546 },
            { "name": "Strong Bravery Multi-Nostrum (Starscape)", "key": 207548 },
            { "name": "Strong Canephora Multi-Nostrum (Starscape)", "key": 207549 },
            { "name": "Brave Multi-Nostrum (Agaia Online)", "key": 280060 },
            { "name": "Strong Multi-Nostrum (Agaia Online)", "key": 280061 }
        ]
    },
    {
        "key": "use_savage",
        "name": "Use Tempestuous Savage Draught",
        "type": "bool"
    },
    {
        "key": "hide_duration",
        "name": "Hide duration of nostrum buff",
        "type": "bool"
    },
    {
        "key": "keep_resurrection_invincibility",
        "name": "Do not overwrite phoenix and other resurrection buffs",
        "type": "bool"
    },
    {
        "key": "dungeon_only",
        "name": "Active only in dungeons",
        "type": "bool"
    },
    {
        "key": "civil_unrest",
        "name": "Active in Civil Unrest",
        "type": "bool"
    },
    {
        "key": "interval",
        "name": "Active nostrum check interval",
        "type": "range",
        "min": 500,
        "max": 5000
    }
];
