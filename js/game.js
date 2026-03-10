// ============================================================
// GAME.JS - Main game controller
// ============================================================

const game = {
    teams: [],
    players: [],
    schedule: [],
    standings: {},
    currentYear: CONFIG.STARTING_YEAR,
    currentDay: 1,
    phase: 'setup', // setup, preseason, season, playoffs, offseason, draft, freeAgency
    userTeamId: null,
    gameSettings: null,
    trainingSchedule: null,
    draftClass: [],
    draftOrder: [],
    draftResults: [],
    draftCurrentPick: 0,
    playoffs: null,
    freeAgents: [],
    tradeHistory: [],
    awards: [],
    messageLog: [],

    // Initialize new game
    initNewGame(userTeamIndex) {
        this.teams = [];
        this.players = [];

        // Create all 30 teams
        for (let i = 0; i < TEAMS_DATA.length; i++) {
            const td = TEAMS_DATA[i];
            const team = {
                id: 'team_' + td.abbr,
                city: td.city,
                name: td.name,
                abbr: td.abbr,
                fullName: `${td.city} ${td.name}`,
                conference: td.conference,
                color: td.color,
                isUser: i === userTeamIndex,
                prestige: Utils.randInt(30, 80),
                championships: 0,
            };
            this.teams.push(team);

            if (team.isUser) {
                this.userTeamId = team.id;
            }
        }

        // Generate players for each team
        for (const team of this.teams) {
            this.generateTeamRoster(team);
        }

        // Initialize user team systems
        this.gameSettings = { ...DEFAULT_GAME_SETTINGS };
        this.trainingSchedule = TrainingEngine.createDefaultSchedule();
        this.messageLog = [];

        // Start preseason
        this.phase = 'preseason';
        this.addMessage('Welcome! You are the new GM of the ' + this.getUserTeam().fullName + '!');
        this.addMessage('The ' + this.currentYear + '-' + (this.currentYear + 1) + ' season is about to begin.');

        // Auto-save
        this.autoSave();
    },

    generateTeamRoster(team) {
        // Generate 13-15 players per team with balanced positions
        const rosterSize = Utils.randInt(13, 15);
        const positionsNeeded = ['PG', 'PG', 'SG', 'SG', 'SF', 'SF', 'PF', 'PF', 'C', 'C'];

        // Determine team strength tier
        const tier = Utils.randInt(1, 5); // 1=elite, 5=rebuilding
        let ovrRange;
        switch (tier) {
            case 1: ovrRange = { star: [85, 95], starter: [72, 82], bench: [60, 72] }; break;
            case 2: ovrRange = { star: [80, 90], starter: [68, 78], bench: [55, 68] }; break;
            case 3: ovrRange = { star: [75, 85], starter: [65, 75], bench: [50, 65] }; break;
            case 4: ovrRange = { star: [70, 80], starter: [60, 72], bench: [45, 62] }; break;
            case 5: ovrRange = { star: [65, 78], starter: [55, 68], bench: [40, 58] }; break;
        }

        for (let i = 0; i < rosterSize; i++) {
            const pos = i < positionsNeeded.length
                ? positionsNeeded[i]
                : Utils.pickRandom(POSITIONS);

            let targetOvr;
            if (i < 2) targetOvr = Utils.randInt(ovrRange.star[0], ovrRange.star[1]);
            else if (i < 7) targetOvr = Utils.randInt(ovrRange.starter[0], ovrRange.starter[1]);
            else targetOvr = Utils.randInt(ovrRange.bench[0], ovrRange.bench[1]);

            const age = Utils.weightedRandom(
                [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
                [3, 5, 7, 9, 10, 10, 10, 10, 9, 8, 6, 5, 3, 2, 1, 1, 1]
            );

            const player = PlayerEngine.generatePlayer({
                position: pos,
                age,
                targetOvr,
                teamId: team.id,
            });

            // Give contract - stagger years so they don't all expire at once
            const salary = PlayerEngine.estimateMarketValue(player);
            let years;
            if (i < 3) {
                // Stars get longer deals
                years = Utils.randInt(3, 5);
            } else if (i < 7) {
                // Starters get medium deals
                years = Utils.randInt(2, 4);
            } else {
                // Bench gets varied deals
                years = Utils.randInt(1, 3);
            }
            player.contract = ContractEngine.createContract(salary, years);
            // Stagger yearsSigned so contracts expire in different years
            player.contract.yearsSigned = Utils.randInt(0, Math.max(0, years - 2));

            this.players.push(player);
        }
    },

    // Get user's team
    getUserTeam() {
        return this.teams.find(t => t.id === this.userTeamId);
    },

    // Get team by ID
    getTeam(teamId) {
        return this.teams.find(t => t.id === teamId);
    },

    // Get team players
    getTeamPlayers(teamId) {
        return this.players.filter(p => p.teamId === teamId).sort((a, b) => b.ovr - a.ovr);
    },

    // Get user's players
    getUserPlayers() {
        return this.getTeamPlayers(this.userTeamId);
    },

    // Start regular season
    startSeason() {
        this.schedule = SeasonEngine.generateSchedule(this.teams);
        this.currentDay = 1;
        this.phase = 'season';
        this.standings = {};

        // Reset all player season stats
        for (const p of this.players) {
            p.seasonStats = PlayerEngine.emptySeasonStats();
            p.gameLog = [];
            p.gamesPlayed = 0;
        }

        this.addMessage(`The ${this.currentYear}-${this.currentYear + 1} regular season has begun!`);
        this.autoSave();
    },

    // Simulate next day
    simNextDay() {
        if (this.phase !== 'season') return;

        const day = SeasonEngine.getCurrentDay(this.schedule);
        if (day === -1) {
            this.endRegularSeason();
            return;
        }

        const results = SeasonEngine.simulateDay(this.schedule, day, this.teams, this.players);
        this.currentDay = day + 1;
        this.standings = SeasonEngine.calculateStandings(this.teams, this.schedule);

        // Process injuries from game results
        for (const result of results) {
            if (result.result && result.result.injuries) {
                for (const inj of result.result.injuries) {
                    if (inj.teamId === this.userTeamId) {
                        this.addMessage(`INJURY: ${inj.player} suffered a ${inj.injury} and will miss ${inj.gamesOut} games.`);
                    }
                }
            }
        }

        // Tick down injury counters for all players
        for (const p of this.players) {
            if (p.injury && p.injury.gamesRemaining > 0) {
                p.injury.gamesRemaining--;
                if (p.injury.gamesRemaining <= 0) {
                    if (p.teamId === this.userTeamId) {
                        this.addMessage(`${PlayerEngine.getFullName(p)} has recovered from their ${p.injury.type}.`);
                    }
                    p.injury = null;
                }
            }
        }

        // Apply training every 7 days
        if (day % 7 === 0) {
            const userPlayers = this.getUserPlayers();
            TrainingEngine.applyWeeklyTraining(userPlayers, this.trainingSchedule, this.gameSettings);
        }

        // Auto-save every 10 days
        if (day % 10 === 0) this.autoSave();

        return results;
    },

    // Simulate multiple days
    simDays(count) {
        const allResults = [];
        for (let i = 0; i < count; i++) {
            if (this.phase !== 'season') break;
            const results = this.simNextDay();
            if (results) allResults.push(...results);
        }
        return allResults;
    },

    // Simulate to end of season
    simToEndOfSeason() {
        while (this.phase === 'season') {
            this.simNextDay();
        }
    },

    // End regular season
    endRegularSeason() {
        this.standings = SeasonEngine.calculateStandings(this.teams, this.schedule);
        this.phase = 'playoffs';
        this.playoffs = SeasonEngine.generatePlayoffs(this.standings, this.teams);

        const userStanding = this.standings[this.userTeamId];
        const userInPlayoffs = this.isUserInPlayoffs();

        this.addMessage(`Regular season complete! Your record: ${userStanding.wins}-${userStanding.losses}`);
        if (userInPlayoffs) {
            this.addMessage('Congratulations! You made the playoffs!');
        } else {
            this.addMessage('Unfortunately, you missed the playoffs this year.');
        }

        this.autoSave();
    },

    // Check if user team is in playoffs
    isUserInPlayoffs() {
        if (!this.playoffs) return false;
        const check = (bracket) => {
            if (!bracket) return false;
            for (const series of bracket.round1) {
                if (series.higherSeed === this.userTeamId || series.lowerSeed === this.userTeamId) return true;
            }
            return false;
        };
        return check(this.playoffs.east) || check(this.playoffs.west);
    },

    // Advance playoffs
    advancePlayoffs() {
        if (this.phase !== 'playoffs' || !this.playoffs) return null;

        const result = SeasonEngine.advancePlayoffs(this.playoffs, this.teams, this.players);

        if (SeasonEngine.isPlayoffsComplete(this.playoffs)) {
            const champion = this.getTeam(this.playoffs.champion);
            if (champion) {
                champion.championships++;
                this.addMessage(`${champion.fullName} are the ${this.currentYear} champions!`);
            }
            this.startOffseason();
        }

        return result;
    },

    // Sim all playoffs
    simAllPlayoffs() {
        while (this.phase === 'playoffs' && this.playoffs && !SeasonEngine.isPlayoffsComplete(this.playoffs)) {
            this.advancePlayoffs();
        }
    },

    // Start offseason
    startOffseason() {
        this.phase = 'offseason';

        // Generate awards before contracts expire
        this.generateAwards();

        // Age contracts and find free agents
        const expiredPlayers = ContractEngine.ageContracts(this.players);
        this.freeAgents = expiredPlayers.map(p => {
            p.teamId = null;
            return p;
        });

        // AI teams immediately re-sign some of their expiring players
        // to prevent all rosters from emptying out
        for (const team of this.teams) {
            if (team.id === this.userTeamId) continue;
            const teamPlayers = this.getTeamPlayers(team.id);
            if (teamPlayers.length < CONFIG.ROSTER_MIN) {
                // Re-sign available free agents for this team
                ContractEngine.aiSignFreeAgents(team, this.freeAgents, this.players);
                // Update free agents list
                this.freeAgents = this.freeAgents.filter(p => !p.teamId);
            }
        }

        // Develop all players
        for (const p of this.players) {
            if (p.teamId) PlayerEngine.developPlayer(p);
        }

        // Also develop free agents slightly
        for (const p of this.freeAgents) {
            p.age++;
        }

        this.addMessage('The offseason has begun. Handle free agency, the draft, and training.');
        this.autoSave();
    },

    // Generate end-of-season awards
    generateAwards() {
        const activePlayers = this.players.filter(p => p.seasonStats && p.seasonStats.gamesPlayed > 40);
        if (activePlayers.length === 0) return;

        const getAvg = (p, stat) => p.seasonStats[stat] / (p.seasonStats.gamesPlayed || 1);

        // MVP
        const mvpCandidates = [...activePlayers].sort((a, b) => {
            const aScore = getAvg(a, 'points') * 1.0 + getAvg(a, 'assists') * 1.5 + getAvg(a, 'rebounds') * 1.2 + a.ovr * 0.3;
            const bScore = getAvg(b, 'points') * 1.0 + getAvg(b, 'assists') * 1.5 + getAvg(b, 'rebounds') * 1.2 + b.ovr * 0.3;
            return bScore - aScore;
        });

        // DPOY
        const dpoyCandidates = [...activePlayers].sort((a, b) => {
            const aScore = getAvg(a, 'steals') * 2 + getAvg(a, 'blocks') * 2.5 +
                a.attributes.perimeterDefense * 0.1 + a.attributes.interiorDefense * 0.1;
            const bScore = getAvg(b, 'steals') * 2 + getAvg(b, 'blocks') * 2.5 +
                b.attributes.perimeterDefense * 0.1 + b.attributes.interiorDefense * 0.1;
            return bScore - aScore;
        });

        // Scoring leader
        const scoringLeader = [...activePlayers].sort((a, b) => getAvg(b, 'points') - getAvg(a, 'points'));

        const yearAwards = {
            year: this.currentYear,
            mvp: mvpCandidates[0] ? { playerId: mvpCandidates[0].id, name: PlayerEngine.getFullName(mvpCandidates[0]) } : null,
            dpoy: dpoyCandidates[0] ? { playerId: dpoyCandidates[0].id, name: PlayerEngine.getFullName(dpoyCandidates[0]) } : null,
            scoringChamp: scoringLeader[0] ? { playerId: scoringLeader[0].id, name: PlayerEngine.getFullName(scoringLeader[0]) } : null,
        };

        this.awards.push(yearAwards);
    },

    // Start draft phase
    startDraft() {
        this.phase = 'draft';
        this.draftClass = DraftEngine.generateDraftClass(this.currentYear);
        this.draftOrder = DraftEngine.getDraftOrder(this.standings, this.teams);
        this.draftResults = [];
        this.draftCurrentPick = 0;

        this.addMessage(`The ${this.currentYear} Draft is about to begin! ${this.draftClass.length} prospects available.`);
        this.autoSave();
    },

    // Execute next draft pick
    executeDraftPick(prospectIndex) {
        if (this.draftCurrentPick >= this.draftOrder.length) return null;
        if (this.draftClass.length === 0) return null;

        const pick = this.draftOrder[this.draftCurrentPick];
        const team = this.getTeam(pick.teamId);
        const isUserPick = pick.teamId === this.userTeamId;

        let selectedIdx;
        if (isUserPick && prospectIndex !== undefined) {
            selectedIdx = prospectIndex;
        } else {
            selectedIdx = DraftEngine.aiDraftPick(team, this.draftClass, this.players);
        }

        const prospect = this.draftClass[selectedIdx];
        DraftEngine.executePick(prospect, team, pick.pick, this.currentYear);
        this.players.push(prospect);

        const result = {
            pick: pick.pick,
            round: pick.round,
            team: team,
            player: prospect,
        };

        this.draftResults.push(result);
        this.draftClass.splice(selectedIdx, 1);
        this.draftCurrentPick++;

        return result;
    },

    // Auto-execute AI draft picks until user's next pick
    simDraftToUserPick() {
        const results = [];
        while (this.draftCurrentPick < this.draftOrder.length) {
            const pick = this.draftOrder[this.draftCurrentPick];
            if (pick.teamId === this.userTeamId) break;
            if (this.draftClass.length === 0) break;

            const result = this.executeDraftPick();
            if (result) results.push(result);
        }
        return results;
    },

    // End draft
    endDraft() {
        // Execute remaining picks
        while (this.draftCurrentPick < this.draftOrder.length && this.draftClass.length > 0) {
            this.executeDraftPick();
        }

        this.phase = 'freeAgency';
        this.addMessage('The draft is complete! Free agency is now open.');
        this.autoSave();
    },

    // Sign free agent - with cap enforcement
    signFreeAgent(playerId, salary, years) {
        const player = this.freeAgents.find(p => p.id === playerId);
        if (!player) return { success: false, message: 'Player not found.' };

        const userPlayers = this.getUserPlayers();
        if (userPlayers.length >= CONFIG.ROSTER_MAX) {
            return { success: false, message: 'Roster is full.' };
        }

        // Check cap space
        if (!ContractEngine.canSignPlayer(userPlayers, salary, this.gameSettings)) {
            const capSpace = ContractEngine.getCapSpace(userPlayers);
            return { success: false, message: `Cannot sign - exceeds salary cap. You have ${Utils.formatMoney(capSpace)} in cap space.` };
        }

        const result = ContractEngine.negotiate(player, salary, years, this.getUserTeam().prestige, this.gameSettings);
        if (result.accepted) {
            player.contract = result.contract;
            player.teamId = this.userTeamId;
            player.morale = Utils.clamp(player.morale + 10, 0, 100);
            this.freeAgents = this.freeAgents.filter(p => p.id !== playerId);
        }

        return result;
    },

    // AI teams sign free agents
    aiHandleFreeAgency() {
        for (const team of this.teams) {
            if (team.id === this.userTeamId) continue;
            ContractEngine.aiSignFreeAgents(team, this.freeAgents, this.players);
        }
        this.freeAgents = this.players.filter(p => !p.teamId);
    },

    // Release player
    releasePlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || player.teamId !== this.userTeamId) return false;

        player.teamId = null;
        player.contract = null;
        this.freeAgents.push(player);
        return true;
    },

    // Calculate trade value for a player (more sophisticated than just OVR)
    calculateTradeValue(player, settings) {
        const diffSettings = DIFFICULTY_SETTINGS.trade[settings ? settings.tradeDifficulty : 'normal'];
        let value = 0;

        // Base value from OVR (exponential - elite players are worth much more)
        if (player.ovr >= 90) value += player.ovr * 4.0;
        else if (player.ovr >= 85) value += player.ovr * 2.8;
        else if (player.ovr >= 80) value += player.ovr * 2.2;
        else if (player.ovr >= 75) value += player.ovr * 1.6;
        else if (player.ovr >= 70) value += player.ovr * 1.2;
        else value += player.ovr * 0.8;

        // Potential value (especially for young players)
        const potentialGap = player.potential - player.ovr;
        if (player.age <= 25 && potentialGap > 0) {
            value += potentialGap * 1.5;
        }

        // Age factor: young players are more valuable
        if (player.age <= 23) value *= 1.25;
        else if (player.age <= 27) value *= 1.10;
        else if (player.age >= 33) value *= 0.70;
        else if (player.age >= 35) value *= 0.50;

        // Contract value: cheap good players are worth more
        if (player.contract) {
            const yearsLeft = player.contract.years - player.contract.yearsSigned;
            const salaryPct = player.contract.salary / CONFIG.MAX_SALARY;
            if (player.ovr >= 80 && salaryPct < 0.4) value *= 1.15; // Good player on cheap deal
            if (yearsLeft >= 3 && player.ovr >= 75) value *= 1.10;  // Locked up long term
        }

        // Stars get extra value from AI's perspective (harder to pry away)
        if (player.ovr >= 85) {
            value *= diffSettings.starValueMultiplier;
        }

        return value;
    },

    // Trade proposal - with cap enforcement and better balance
    executeTrade(myPlayerIds, theirPlayerIds, otherTeamId) {
        const myPlayers = myPlayerIds.map(id => this.players.find(p => p.id === id)).filter(Boolean);
        const theirPlayers = theirPlayerIds.map(id => this.players.find(p => p.id === id)).filter(Boolean);

        if (myPlayers.length === 0 || theirPlayers.length === 0) {
            return { success: false, message: 'Invalid trade.' };
        }

        const settings = this.gameSettings || DEFAULT_GAME_SETTINGS;
        const diffSettings = DIFFICULTY_SETTINGS.trade[settings.tradeDifficulty] || DIFFICULTY_SETTINGS.trade.normal;

        // 1. Check cap space for the user's team
        const userPlayers = this.getUserPlayers();
        if (!ContractEngine.canExecuteTrade(userPlayers, theirPlayers, myPlayers, settings)) {
            return { success: false, message: 'Trade rejected - incoming salaries would exceed your salary cap. You need to match salaries more closely.' };
        }

        // 2. Check elite player limit - prevent stacking
        const currentElite = userPlayers.filter(p => p.ovr >= 90 && !myPlayerIds.includes(p.id)).length;
        const incomingElite = theirPlayers.filter(p => p.ovr >= 90).length;
        if (currentElite + incomingElite > diffSettings.elitePlayerMax) {
            return { success: false, message: `Trade rejected - you would have too many elite players (max ${diffSettings.elitePlayerMax} players rated 90+). The league office blocked this trade for competitive balance.` };
        }

        // 3. AI trade evaluation (much more sophisticated)
        const myValue = myPlayers.reduce((sum, p) => sum + this.calculateTradeValue(p, settings), 0);
        const theirValue = theirPlayers.reduce((sum, p) => sum + this.calculateTradeValue(p, settings), 0);

        const fairness = myValue / theirValue;
        if (fairness < diffSettings.fairnessThreshold) {
            // Provide helpful feedback about why
            const deficit = Math.round((1 - fairness) * 100);
            let message = 'The other team rejected the trade.';
            if (deficit > 30) {
                message += ' They want significantly more value in return.';
            } else if (deficit > 15) {
                message += ' They want more value - try adding another player or pick.';
            } else {
                message += ' The trade is close but they want slightly more value.';
            }
            return { success: false, message };
        }

        // 4. AI also checks if they would be gutting their team
        const otherTeamPlayers = this.getTeamPlayers(otherTeamId);
        const otherTeamRemainingStars = otherTeamPlayers.filter(
            p => p.ovr >= 80 && !theirPlayerIds.includes(p.id)
        ).length;
        const tradingStars = theirPlayers.filter(p => p.ovr >= 80).length;
        if (tradingStars > 0 && otherTeamRemainingStars === 0 && fairness < 1.3) {
            return { success: false, message: 'The other team rejected the trade - they don\'t want to give up all their star players without getting a star back.' };
        }

        // Execute trade
        for (const p of myPlayers) p.teamId = otherTeamId;
        for (const p of theirPlayers) p.teamId = this.userTeamId;

        this.tradeHistory.push({
            year: this.currentYear,
            team1: this.userTeamId,
            team2: otherTeamId,
            team1Players: myPlayers.map(p => ({ id: p.id, name: PlayerEngine.getFullName(p) })),
            team2Players: theirPlayers.map(p => ({ id: p.id, name: PlayerEngine.getFullName(p) })),
        });

        return { success: true, message: 'Trade completed!' };
    },

    // Advance to next year
    advanceToNextYear() {
        this.currentYear++;
        this.phase = 'preseason';

        // Remove retired players (age > 40 or very low OVR old players)
        this.players = this.players.filter(p => {
            if (p.age > 40) return false;
            if (p.age > 36 && p.ovr < 55) return false;
            return true;
        });

        // Ensure all teams have minimum roster
        for (const team of this.teams) {
            const teamPlayers = this.getTeamPlayers(team.id);
            while (teamPlayers.length < CONFIG.ROSTER_MIN) {
                const player = PlayerEngine.generatePlayer({
                    teamId: team.id,
                    age: Utils.randInt(20, 25),
                    targetOvr: Utils.randInt(40, 60),
                });
                player.contract = ContractEngine.createContract(CONFIG.MIN_SALARY, Utils.randInt(1, 3));
                this.players.push(player);
                teamPlayers.push(player);
            }
        }

        this.addMessage(`Welcome to the ${this.currentYear}-${this.currentYear + 1} season!`);
        this.autoSave();
    },

    // Add message to log
    addMessage(text) {
        this.messageLog.unshift({
            text,
            timestamp: Date.now(),
            year: this.currentYear,
        });
        if (this.messageLog.length > 100) {
            this.messageLog = this.messageLog.slice(0, 100);
        }
    },

    // Auto-save
    autoSave() {
        SaveEngine.save(SaveEngine.getGameState(), 'auto');
    },

    // Manual save
    manualSave() {
        return SaveEngine.save(SaveEngine.getGameState(), 'manual');
    },

    // Save to a named slot
    saveToSlot(slotId, name) {
        if (slotId) {
            return SaveEngine.save(SaveEngine.getGameState(), slotId, name);
        } else {
            return SaveEngine.createNewSlot(SaveEngine.getGameState(), name);
        }
    },

    // Load game
    loadGame(slot = 'manual') {
        const result = SaveEngine.load(slot);
        if (result.success) {
            SaveEngine.restoreGameState(result.state);
        }
        return result;
    },
};
