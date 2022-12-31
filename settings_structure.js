module.exports = [
    {
        "key": "enabled",
        "name": "Enable module",
        "type": "bool"
    },
    {
        "key": "nostrum_item",
        "name": "Nostrum item for use",
        "type": "select",
        "options": [
            { "name": "Menma's Brave Multi-Nostrum", "key": 280060 },
            { "name": "Menma's Strong Multi-Nostrum", "key": 280061 }
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
