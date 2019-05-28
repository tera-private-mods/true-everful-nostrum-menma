const ITEMS_NOSTRUM = [152898, 184659, 201005, 201022, 855604, 201006, 201007, 201008], // EU, NA, RU, JP, TH, TW, ??, ??
      ITEMS_NOCTENIUM = [100451], // JP
      BUFFS_NOSTRUM = [4030, 4031, 4032, 4033],
      BUFFS_NOCTENIUM = [5010009],
      BUFFS_NOCTENIUM_STRONGER = [920, 921, 922],
      BUFF_RES_INVINCIBLE = 1134,
      BUFF_PHOENIX = 6007;

const SettingsUI = require('tera-mod-ui').Settings;

module.exports = function TrueEverfulNostrum(mod) {
    mod.game.initialize(['me', 'me.abnormalities', 'contract']);

    // Load item data
    let items_nostrum = [];
    ITEMS_NOSTRUM.forEach(async item => {
        const itemdata = await mod.queryData('/ItemData/Item@id=?/', [item], false, false, ['id', 'requiredLevel']);
        if (itemdata)
            items_nostrum.push(itemdata.attributes);
    });

    let items_noctenium = [];
    ITEMS_NOCTENIUM.forEach(async item => {
        const itemdata = await mod.queryData('/ItemData/Item@id=?/', [item], false, false, ['id', 'requiredLevel']);
        if (itemdata)
            items_noctenium.push(itemdata.attributes);
    });

    // Abnormality tracking
    function abnormalityDuration(id) {
        const abnormality = mod.game.me.abnormalities[id];
        return abnormality ? abnormality.remaining : 0;
    }

    // Nostrum/noctenium usage
    let inventory = null; // TODO: remove when removing < 82 support
    let nostrum_item = null;
    let noctenium_item = null;

    if (mod.majorPatchVersion >= 82) {
        inventory = 'premium'; // TODO: remove when removing < 82 support
        mod.hook('S_PREMIUM_SLOT_DATALIST', 2, event => {
            event.sets.forEach(set => {
                set.inventory.filter(entry => entry.type === 1).forEach(entry => {
                    const nostrum_match = items_nostrum.find(item => item.id === entry.id);
                    if (nostrum_match) {
                        nostrum_item = {
                            data: nostrum_match,
                            packet: {
                                set: set.id,
                                slot: entry.slot,
                                type: entry.type,
                                id: entry.id
                            }
                        };
                    } else {
                        const noctenium_match = items_noctenium.find(item => item.id === entry.id);
                        if (noctenium_match) {
                            noctenium_item = {
                                data: noctenium_match,
                                packet: {
                                    set: set.id,
                                    slot: entry.slot,
                                    type: entry.type,
                                    id: entry.id
                                }
                            };
                        }
                    }
                });
            });
        });

        mod.hook('S_PREMIUM_SLOT_OFF', 'raw', () => {
            nostrum_item = null;
            noctenium_item = null;
        });
    } else {
        mod.hook('S_PCBANGINVENTORY_DATALIST', 1, event => {
            event.inventory.filter(entry => entry.type === 1).forEach(entry => {
                const nostrum_match = items_nostrum.find(item => item.id === entry.item);
                if (nostrum_match) {
                    inventory = 'pcbang';
                    nostrum_item = {
                        data: nostrum_match,
                        packet: { slot: entry.slot }
                    };
                } else {
                    const noctenium_match = items_noctenium.find(item => item.id === entry.item);
                    if (noctenium_match) {
                        inventory = 'pcbang';
                        noctenium_item = {
                            data: noctenium_match,
                            packet: { slot: entry.slot }
                        };
                    }
                }
            });
        });

        mod.hook('S_PREMIUM_SLOT_DATALIST', 1, event => {
            event.inventory.filter(entry => entry.type === 1).forEach(entry => {
                const nostrum_match = items_nostrum.find(item => item.id === entry.item);
                if (nostrum_match) {
                    inventory = 'premium';
                    nostrum_item = {
                        data: nostrum_match,
                        packet: {
                            set: event.set,
                            slot: entry.slot,
                            type: entry.type,
                            skill: entry.skill,
                            item: entry.item
                        }
                    };
                } else {
                    const noctenium_match = items_noctenium.find(item => item.id === entry.item);
                    if (noctenium_match) {
                        inventory = 'premium';
                        noctenium_item = {
                            data: noctenium_match,
                            packet: {
                                set: event.set,
                                slot: entry.slot,
                                type: entry.type,
                                skill: entry.skill,
                                item: entry.item
                            }
                        };
                    }
                }
            });
        });

        mod.hook('S_PREMIUM_SLOT_OFF', 'raw', () => {
            if (inventory === 'premium') {
                inventory = null;
                nostrum_item = null;
                noctenium_item = null;
            }
        });
    }

    function useItem(item) {
        if (!item || mod.game.me.level < item.data.requiredLevel)
            return;

        if (mod.majorPatchVersion >= 82) {
            mod.send('C_USE_PREMIUM_SLOT', 1, item.packet);
        } else {
            switch (inventory) {
                case 'pcbang': mod.send('C_PCBANGINVENTORY_USE_SLOT', 1, item.packet); break;
                case 'premium': mod.send('C_PREMIUM_SLOT_USE_SLOT', 1, item.packet); break;
            }
        }
    }

    function useNostrum() {
        // Check if we need to use everful nostrum
        if (BUFFS_NOSTRUM.some(buff => abnormalityDuration(buff) > 60 * 1000))
            return;

        // Check if we want to use everful nostrum
        if ((mod.settings.keep_resurrection_invincibility && abnormalityDuration(BUFF_RES_INVINCIBLE) > 0) || abnormalityDuration(BUFF_PHOENIX) > 0)
            return;

        // Use it!
        useItem(nostrum_item);
    }

    function useNoctenium() {
        // Check if a stronger buff is present
        if (BUFFS_NOCTENIUM_STRONGER.some(buff => abnormalityDuration(buff) > 0))
            return;

        // Check if we need to use noctenium
        if (BUFFS_NOCTENIUM.some(buff => abnormalityDuration(buff) > 60 * 1000))
            return;

        // Use it!
        useItem(noctenium_item);
    }

    function usePremiumItems() {
        // Check if enabled and premium items available
        if (!mod.settings.enabled || !inventory)
            return;

        // Check if we can use premium items right now
        if (!mod.game.isIngame || mod.game.isInLoadingScreen || !mod.game.me.alive || mod.game.me.mounted || mod.game.me.inBattleground)
            return;

        useNostrum();
        useNoctenium();
    }

    // Hook that hides the 'item used' message
    let hide_message_hook = null;

    function hookHideMessage() {
        if (hide_message_hook) {
            mod.unhook(hide_message_hook);
            hide_message_hook = null;
        }

        if (mod.settings.hide_message) {
            hide_message_hook = mod.hook('S_SYSTEM_MESSAGE', 1, event => {
                const msg = mod.parseSystemMessage(event.message);
                if (msg && (msg.id === 'SMT_ITEM_USED' || msg.id === 'SMT_CANT_USE_ITEM_COOLTIME')) {
                    if (items_nostrum.some(item => msg.tokens.ItemName === `@item:${item.id}`) || items_noctenium.some(item => msg.tokens.ItemName === `@item:${item.id}`))
                        return false;
                }
            });
        }
    }

    hookHideMessage();

    // Main
    let interval = null;
    function start() {
        stop();
        interval = mod.setInterval(usePremiumItems, mod.settings.interval);
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
        inventory = null;
        nostrum_item = null;
        noctenium_item = null;
    });

    mod.game.me.on('resurrect', () => {
        // Reset interval to wait a bit until on-resurrection abnormalities (e.g. phoenix buffs) are applied to make sure we don't overwrite them
        start();
    });

    // User interaction & settings UI
    mod.command.add('ten', () => {
        if (ui) {
            ui.show();
        } else {
            mod.settings.enabled = !mod.settings.enabled;
            mod.command.message(mod.settings.enabled ? 'enabled' : 'disabled');
        }
    });

    let ui = null;
    if (global.TeraProxy.GUIMode) {
        ui = new SettingsUI(mod, require('./settings_structure'), mod.settings, { height: 232 });
        ui.on('update', settings => {
            mod.settings = settings;
            hookHideMessage();

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
