// ============================================================
// SAVE.JS - Local save/load system
// ============================================================

const SaveEngine = {
    SAVE_KEY: 'basketball_manager_save',
    AUTOSAVE_KEY: 'basketball_manager_autosave',
    SLOT_INDEX_KEY: 'basketball_manager_slots',

    // Get the storage key for a given slot
    getSlotKey(slot) {
        if (slot === 'auto') return this.AUTOSAVE_KEY;
        if (slot === 'manual') return this.SAVE_KEY;
        return `basketball_manager_slot_${slot}`;
    },

    // Get all save slot IDs
    getAllSlotIds() {
        try {
            const data = localStorage.getItem(this.SLOT_INDEX_KEY);
            if (!data) return [];
            return JSON.parse(data);
        } catch {
            return [];
        }
    },

    // Register a new slot ID
    registerSlot(slotId) {
        const slots = this.getAllSlotIds();
        if (!slots.includes(slotId)) {
            slots.push(slotId);
            localStorage.setItem(this.SLOT_INDEX_KEY, JSON.stringify(slots));
        }
    },

    // Unregister a slot ID
    unregisterSlot(slotId) {
        const slots = this.getAllSlotIds().filter(s => s !== slotId);
        localStorage.setItem(this.SLOT_INDEX_KEY, JSON.stringify(slots));
    },

    // Get all saves with info
    getAllSaves() {
        const saves = [];

        // Check legacy manual/auto saves
        const manualInfo = this.getSaveInfo('manual');
        if (manualInfo) saves.push({ slotId: 'manual', ...manualInfo });
        const autoInfo = this.getSaveInfo('auto');
        if (autoInfo) saves.push({ slotId: 'auto', ...autoInfo });

        // Check all named slots
        for (const slotId of this.getAllSlotIds()) {
            const info = this.getSaveInfo(slotId);
            if (info) saves.push({ slotId, ...info });
        }

        return saves;
    },

    // Create a new named save slot and save to it
    createNewSlot(gameState, name) {
        const slotId = 'slot_' + Date.now();
        this.registerSlot(slotId);
        return this.save(gameState, slotId, name);
    },

    // Save game state
    save(gameState, slot = 'manual', name = '') {
        try {
            const saveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                slot,
                name: name || (slot === 'auto' ? 'Auto Save' : slot === 'manual' ? 'Quick Save' : name || slot),
                state: gameState,
            };
            const key = this.getSlotKey(slot);
            const json = JSON.stringify(saveData);
            try {
                localStorage.setItem(key, json);
            } catch (quotaErr) {
                // If quota exceeded, try removing oldest non-auto save
                console.warn('Save quota exceeded, trying to free space...');
                const allSaves = this.getAllSaves().filter(s => s.slotId !== 'auto');
                if (allSaves.length > 0) {
                    allSaves.sort((a, b) => a.timestamp - b.timestamp);
                    this.deleteSave(allSaves[0].slotId);
                    localStorage.setItem(key, json);
                } else {
                    localStorage.removeItem(this.AUTOSAVE_KEY);
                    localStorage.setItem(key, json);
                }
            }
            if (slot !== 'auto' && slot !== 'manual') this.registerSlot(slot);
            return { success: true, message: 'Game saved successfully!' };
        } catch (e) {
            console.error('Save failed:', e);
            return { success: false, message: 'Save failed: ' + e.message };
        }
    },

    // Load game state
    load(slot = 'manual') {
        try {
            const key = this.getSlotKey(slot);
            const data = localStorage.getItem(key);
            if (!data) return { success: false, message: 'No save data found.' };

            const saveData = JSON.parse(data);
            return { success: true, state: saveData.state, timestamp: saveData.timestamp, name: saveData.name };
        } catch (e) {
            console.error('Load failed:', e);
            return { success: false, message: 'Load failed: ' + e.message };
        }
    },

    // Check if save exists
    hasSave(slot = 'manual') {
        const key = this.getSlotKey(slot);
        return localStorage.getItem(key) !== null;
    },

    // Delete save
    deleteSave(slot = 'manual') {
        const key = this.getSlotKey(slot);
        localStorage.removeItem(key);
        if (slot !== 'auto' && slot !== 'manual') this.unregisterSlot(slot);
    },

    // Rename a save slot
    renameSave(slot, newName) {
        try {
            const key = this.getSlotKey(slot);
            const data = localStorage.getItem(key);
            if (!data) return false;
            const saveData = JSON.parse(data);
            saveData.name = newName;
            localStorage.setItem(key, JSON.stringify(saveData));
            return true;
        } catch {
            return false;
        }
    },

    // Get save info
    getSaveInfo(slot = 'manual') {
        const key = this.getSlotKey(slot);
        const data = localStorage.getItem(key);
        if (!data) return null;

        try {
            const saveData = JSON.parse(data);
            return {
                timestamp: saveData.timestamp,
                date: new Date(saveData.timestamp).toLocaleString(),
                version: saveData.version,
                name: saveData.name || slot,
                mode: saveData.state && saveData.state.careerState ? 'career' : 'gm',
            };
        } catch {
            return null;
        }
    },

    // Export save as JSON file
    exportSave() {
        const data = localStorage.getItem(this.SAVE_KEY);
        if (!data) return;

        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `basketball_manager_save_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    // Import save from JSON file
    importSave(fileContent) {
        try {
            const saveData = JSON.parse(fileContent);
            if (!saveData.state) throw new Error('Invalid save file');
            localStorage.setItem(this.SAVE_KEY, fileContent);
            return { success: true, message: 'Save imported successfully!' };
        } catch (e) {
            return { success: false, message: 'Import failed: ' + e.message };
        }
    },

    // Get serializable game state (optimized to reduce size)
    getGameState() {
        // Only save completed schedule games to reduce size
        const completedSchedule = (game.schedule || []).filter(g => g.played);
        
        const state = {
            teams: game.teams,
            players: game.players,
            schedule: completedSchedule,
            standings: game.standings,
            currentYear: game.currentYear,
            currentDay: game.currentDay,
            phase: game.phase,
            userTeamId: game.userTeamId,
            gameSettings: game.gameSettings,
            trainingSchedule: game.trainingSchedule,
            draftClass: game.draftClass,
            draftOrder: game.draftOrder,
            draftResults: game.draftResults,
            playoffs: game.playoffs,
            freeAgents: game.freeAgents,
            tradeHistory: game.tradeHistory,
            awards: game.awards,
            messageLog: game.messageLog,
        };

        // Include career state if in career mode
        if (CareerEngine.career) {
            state.careerState = CareerEngine.getCareerState();
        }

        return state;
    },

    // Restore game state
    restoreGameState(state) {
        game.teams = state.teams;
        game.players = state.players;
        game.schedule = state.schedule || [];
        game.standings = state.standings || {};
        game.currentYear = state.currentYear;
        game.currentDay = state.currentDay;
        game.phase = state.phase;
        game.userTeamId = state.userTeamId;
        game.gameSettings = state.gameSettings || { ...DEFAULT_GAME_SETTINGS };
        game.trainingSchedule = state.trainingSchedule || TrainingEngine.createDefaultSchedule();
        game.draftClass = state.draftClass || [];
        game.draftOrder = state.draftOrder || [];
        game.draftResults = state.draftResults || [];
        game.playoffs = state.playoffs || null;
        game.freeAgents = state.freeAgents || [];
        game.tradeHistory = state.tradeHistory || [];
        game.awards = state.awards || [];
        game.messageLog = state.messageLog || [];

        // Restore career state if present
        if (state.careerState) {
            CareerEngine.restoreCareerState(state.careerState);
        } else {
            CareerEngine.career = null;
        }

        // If loading during season, regenerate remaining schedule
        if (game.phase === 'season' && game.schedule.length < CONFIG.SEASON_GAMES * 15) {
            const playedGames = game.schedule.filter(g => g.played);
            const fullSchedule = SeasonEngine.generateSchedule(game.teams);
            // Mark days already played
            const maxPlayedDay = playedGames.length > 0 
                ? Math.max(...playedGames.map(g => g.day)) 
                : 0;
            game.schedule = [...playedGames, ...fullSchedule.filter(g => g.day > maxPlayedDay)];
        }
    },
};
