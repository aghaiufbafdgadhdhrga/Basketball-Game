// ============================================================
// SAVE.JS - Local save/load system
// ============================================================

const SaveEngine = {
    SAVE_KEY: 'basketball_manager_save',
    AUTOSAVE_KEY: 'basketball_manager_autosave',

    // Save game state
    save(gameState, slot = 'manual') {
        try {
            const saveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                slot,
                state: gameState,
            };
            const key = slot === 'auto' ? this.AUTOSAVE_KEY : this.SAVE_KEY;
            const json = JSON.stringify(saveData);
            try {
                localStorage.setItem(key, json);
            } catch (quotaErr) {
                // If quota exceeded, clear old saves and try again
                console.warn('Save quota exceeded, clearing old data...');
                localStorage.removeItem(this.AUTOSAVE_KEY);
                localStorage.removeItem(this.SAVE_KEY);
                localStorage.setItem(key, json);
            }
            return { success: true, message: 'Game saved successfully!' };
        } catch (e) {
            console.error('Save failed:', e);
            return { success: false, message: 'Save failed: ' + e.message };
        }
    },

    // Load game state
    load(slot = 'manual') {
        try {
            const key = slot === 'auto' ? this.AUTOSAVE_KEY : this.SAVE_KEY;
            const data = localStorage.getItem(key);
            if (!data) return { success: false, message: 'No save data found.' };

            const saveData = JSON.parse(data);
            return { success: true, state: saveData.state, timestamp: saveData.timestamp };
        } catch (e) {
            console.error('Load failed:', e);
            return { success: false, message: 'Load failed: ' + e.message };
        }
    },

    // Check if save exists
    hasSave(slot = 'manual') {
        const key = slot === 'auto' ? this.AUTOSAVE_KEY : this.SAVE_KEY;
        return localStorage.getItem(key) !== null;
    },

    // Delete save
    deleteSave(slot = 'manual') {
        const key = slot === 'auto' ? this.AUTOSAVE_KEY : this.SAVE_KEY;
        localStorage.removeItem(key);
    },

    // Get save info
    getSaveInfo(slot = 'manual') {
        const key = slot === 'auto' ? this.AUTOSAVE_KEY : this.SAVE_KEY;
        const data = localStorage.getItem(key);
        if (!data) return null;

        try {
            const saveData = JSON.parse(data);
            return {
                timestamp: saveData.timestamp,
                date: new Date(saveData.timestamp).toLocaleString(),
                version: saveData.version,
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
        
        return {
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
