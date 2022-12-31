// Nostrum
const ITEMS_NOSTRUM = [152898, 184659, 201005, 201006, 201007, 201008, 201022, 855604];
const BUFFS_NOSTRUM = [4020, 4021, 4022, 4023, 4030, 4031, 4032, 4044];

// Premium Nostrum (Menma)
const ITEMS_NOSTRUM_PREMIUM = [280060, 280061];
const BUFFS_NOSTRUM_PREMIUM = [70244];

// Tempestuous Savage Draught
const ITEM_SAVAGE = 150942;
const BUFFS_SAVAGE = [1251];

// Other buffs
const BUFF_RES_INVINCIBLE = 1134;
const BUFF_PHOENIX = 6007;

const SettingsUI = require('tera-mod-ui').Settings;
const Vec3 = require('tera-vec3');

function ClientMod(mod) {
    this.nostrum = [];

    mod.clientInterface.once('ready', async () => {
        this.nostrum = (await mod.queryData('/ItemData/Item@id=?/', [ITEMS_NOSTRUM_PREMIUM], true, false, ['id', 'requiredLevel'])).map(result => result.attributes);
    });
}

function NetworkMod(mod) {
    mod.game.initialize(['me', 'me.abnormalities', 'inventory', 'contract']);

    // Load item data
    const { nostrum } = mod.clientMod;

    // Abnormality tracking
    function abnormalityDuration(id) {
        const abnormality = mod.game.me.abnormalities[id];
        return abnormality ? abnormality.remaining : 0n;
    }

    // Nostrum usage
    let nostrum_items = new Map();

    mod.hook('S_PREMIUM_SLOT_DATALIST', 2, event => {
        event.sets.forEach(set => {
            set.inventory.filter(entry => entry.type === 1).forEach(entry => {
                const nostrum_match = nostrum.find(item => item.id === entry.id);
                if (nostrum_match) {
                    nostrum_items.set(entry.id, {
                        data: nostrum_match,
                        packet: {
                            set: set.id,
                            slot: entry.slot,
                            type: entry.type,
                            id: entry.id
                        }
                    });
                }
            });
        });
    });

    mod.hook('S_PREMIUM_SLOT_OFF', 'event', () => {
        nostrum_items.clear();
    });

    function usePremiumSlot(item) {
        if (!item || mod.game.me.level < item.data.requiredLevel)
            return;

        mod.send('C_USE_PREMIUM_SLOT', 1, item.packet);
    }

    function useItem(item) {
        mod.send('C_USE_ITEM', 3, {
            gameId: mod.game.me.gameId,
            id: item,
            dbid: 0,
            target: 0,
            amount: 1,
            dest: new Vec3(0, 0, 0),
            loc: new Vec3(0, 0, 0),
            w: 0, 
            unk1: 0,
            unk2: 0,
            unk3: 0,
            unk4: 1
        });
    }

    function useNostrum() {
        // Check if we want to use everful nostrum
        if ((mod.settings.keep_resurrection_invincibility && abnormalityDuration(BUFF_RES_INVINCIBLE) > 0n) || abnormalityDuration(BUFF_PHOENIX) > 0n)
            return;

        const nostrum_item = nostrum_items.get(parseInt(mod.settings.nostrum_item));

        // Use premium nostrum
        if (nostrum_item) {
            // Check if we need to use everful nostrum
            if (!BUFFS_NOSTRUM_PREMIUM.some(buff => abnormalityDuration(buff) > BigInt(60 * 1000)))
                usePremiumSlot(nostrum_item);

            return;
        }

        // Search in inventory and use nostrum item (no premium)
        for (const item of ITEMS_NOSTRUM) {
            if (mod.game.inventory.findAllInBagOrPockets(item).length !== 0) {
                // Check if we need to use everful nostrum
                if (!BUFFS_NOSTRUM.some(buff => abnormalityDuration(buff) > BigInt(60 * 1000)))
                    useItem(item);

                return;
            }
        }
    }

    function useSavage() {
        // Check if a stronger buff is present
        if (BUFFS_SAVAGE.some(buff => abnormalityDuration(buff) > 0n))
            return;

        // Use savage item
        if (mod.game.inventory.findAllInBagOrPockets(ITEM_SAVAGE).length !== 0)
            useItem(ITEM_SAVAGE);
    }

    function useItems() {
        // Check if enabled and premium items available
        if (!mod.settings.enabled || (mod.settings.dungeon_only && !mod.game.me.inDungeon) || (!mod.settings.civil_unrest && mod.game.me.inCivilUnrest))
            return;

        // Check if we can use premium items right now
        if (!mod.game.isIngame || mod.game.isInLoadingScreen || !mod.game.me.alive || mod.game.me.mounted || mod.game.me.inBattleground || mod.game.contract.active)
            return;

        useNostrum();

        if (mod.settings.use_savage && (mod.game.me.inDungeon || (mod.settings.civil_unrest && mod.game.me.inCivilUnrest)))
            useSavage();
    }

    // Main
    let interval = null;
    function start() {
        stop();
        interval = mod.setInterval(useItems, mod.settings.interval);
    }

    function stop() {
        if (interval) {
            mod.clearInterval(interval);
            interval = null;
        }
    }

    function isRunning() {
        return !!interval;
    }

    mod.game.on('enter_game', () => {
        start();
    });

    mod.game.on('leave_game', () => {
        stop();
        nostrum_items.clear();
    });

    mod.game.me.on('resurrect', () => {
        // Reset interval to wait a bit until on-resurrection abnormalities (e.g. phoenix buffs) are applied to make sure we don't overwrite them
        start();
    });

    // User interaction & settings UI
    mod.command.add('ten', {
        $default() {
            if (ui) {
                ui.show();
                if (ui.ui.window) {
                    ui.ui.window.webContents.on("did-finish-load", () => {
                        ui.ui.window.webContents.executeJavaScript(
                            "!function(){var e=document.getElementById('close-btn');e.style.cursor='default',e.onclick=function(){window.parent.close()}}();"
                        );
                    });
                }
            } else {
                mod.settings.enabled = !mod.settings.enabled;
                mod.command.message(mod.settings.enabled ? 'enabled' : 'disabled');
            }
        },
        on() {
            mod.settings.enabled = true;
            mod.command.message('enabled');
        },
        off() {
            mod.settings.enabled = false;
            mod.command.message('disabled');
        }
    });

    let ui = null;
    if (global.TeraProxy.GUIMode) {
        ui = new SettingsUI(mod, require('./settings_structure'), mod.settings, {
            width: 750,
            height: 280,
            resizable: false
        });
        ui.on('update', settings => {
            mod.settings = settings;

            if (isRunning()) {
                stop();
                start();
            }
        });

        this.destructor = () => {
            if (ui) {
                ui.close();
                ui = null;
            }
        };
    }
};

module.exports = { ClientMod, NetworkMod };