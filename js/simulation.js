// ============================================================
// SIMULATION.JS - Game simulation engine
// ============================================================

const SimEngine = {
    // Simulate a full game between two teams
    simulateGame(homeTeam, awayTeam, allPlayers, gameSettings = null) {
        const homePlayers = this.getTeamPlayers(homeTeam, allPlayers);
        const awayPlayers = this.getTeamPlayers(awayTeam, allPlayers);

        // Store difficulty settings for use in possession simulation
        const settings = gameSettings || (typeof game !== 'undefined' && game.gameSettings) || null;
        const simDiff = settings ? (DIFFICULTY_SETTINGS.sim[settings.simDifficulty] || DIFFICULTY_SETTINGS.sim.normal) : DIFFICULTY_SETTINGS.sim.normal;
        const userTeamId = (typeof game !== 'undefined' && game.userTeamId) || null;
        this._currentSimBoost = {
            home: homeTeam.id === userTeamId ? simDiff.userBoost : simDiff.aiBoost,
            away: awayTeam.id === userTeamId ? simDiff.userBoost : simDiff.aiBoost,
        };

        if (homePlayers.length < 5 || awayPlayers.length < 5) {
            return this.createForfeitResult(homeTeam, awayTeam, homePlayers.length >= 5);
        }

        const homeLineup = this.setLineup(homePlayers);
        const awayLineup = this.setLineup(awayPlayers);

        const boxScore = {
            homeTeam: homeTeam.id,
            awayTeam: awayTeam.id,
            homeScore: 0,
            awayScore: 0,
            quarters: [
                { home: 0, away: 0 },
                { home: 0, away: 0 },
                { home: 0, away: 0 },
                { home: 0, away: 0 },
            ],
            overtime: [],
            homePlayerStats: {},
            awayPlayerStats: {},
        };

        // Init player game stats
        for (const p of homePlayers) {
            boxScore.homePlayerStats[p.id] = this.emptyGameStats();
        }
        for (const p of awayPlayers) {
            boxScore.awayPlayerStats[p.id] = this.emptyGameStats();
        }

        // Simulate 4 quarters
        for (let q = 0; q < 4; q++) {
            this.simulateQuarter(homeLineup, awayLineup, boxScore, q, homePlayers, awayPlayers);
        }

        boxScore.homeScore = boxScore.quarters.reduce((s, q) => s + q.home, 0);
        boxScore.awayScore = boxScore.quarters.reduce((s, q) => s + q.away, 0);

        // Overtime if tied
        let otCount = 0;
        while (boxScore.homeScore === boxScore.awayScore && otCount < 5) {
            const otQ = { home: 0, away: 0 };
            boxScore.overtime.push(otQ);
            this.simulateOT(homeLineup, awayLineup, boxScore, otQ, homePlayers, awayPlayers);
            boxScore.homeScore += otQ.home;
            boxScore.awayScore += otQ.away;
            otCount++;
        }

        // If still tied after 5 OT, random winner
        if (boxScore.homeScore === boxScore.awayScore) {
            if (Math.random() > 0.5) boxScore.homeScore += 2;
            else boxScore.awayScore += 2;
        }

        // Update season stats for all players
        this.updateSeasonStats(homePlayers, boxScore.homePlayerStats);
        this.updateSeasonStats(awayPlayers, boxScore.awayPlayerStats);

        // Check for injuries based on injury frequency setting
        const injurySettings = settings ? settings.injuryFrequency : 'normal';
        const injuryChance = (DIFFICULTY_SETTINGS.injury[injurySettings] || DIFFICULTY_SETTINGS.injury.normal).chance;
        if (injuryChance > 0) {
            boxScore.injuries = this.checkInjuries([...homePlayers, ...awayPlayers], injuryChance);
        }

        return boxScore;
    },

    getTeamPlayers(team, allPlayers) {
        return allPlayers
            .filter(p => p.teamId === team.id && !(p.injury && p.injury.gamesRemaining > 0))
            .sort((a, b) => b.ovr - a.ovr);
    },

    setLineup(players) {
        // Set starting 5 by position priority
        const starters = [];
        const bench = [];
        const posNeeded = ['PG', 'SG', 'SF', 'PF', 'C'];
        const used = new Set();

        // First pass: fill each position with best available at that position
        for (const pos of posNeeded) {
            const best = players.find(p => p.position === pos && !used.has(p.id));
            if (best) {
                starters.push(best);
                used.add(best.id);
            }
        }

        // Fill remaining starter spots with best available
        for (const p of players) {
            if (starters.length >= 5) break;
            if (!used.has(p.id)) {
                starters.push(p);
                used.add(p.id);
            }
        }

        // Bench
        for (const p of players) {
            if (!used.has(p.id)) {
                bench.push(p);
            }
        }

        return { starters: starters.slice(0, 5), bench: bench.slice(0, 8) };
    },

    emptyGameStats() {
        return {
            minutes: 0, points: 0, assists: 0, rebounds: 0,
            steals: 0, blocks: 0, turnovers: 0,
            fgMade: 0, fgAttempted: 0,
            threeMade: 0, threeAttempted: 0,
            ftMade: 0, ftAttempted: 0,
        };
    },

    simulateQuarter(homeLineup, awayLineup, boxScore, quarterIdx, homePlayers, awayPlayers) {
        const possessions = Utils.randInt(24, 28); // per team per quarter
        let homeQ = 0, awayQ = 0;
        const boost = this._currentSimBoost || { home: 1.0, away: 1.0 };

        for (let i = 0; i < possessions; i++) {
            // Home possession
            homeQ += this.simulatePossession(
                homeLineup, awayLineup, boxScore.homePlayerStats, boxScore.awayPlayerStats, homePlayers, boost.home
            );

            // Away possession
            awayQ += this.simulatePossession(
                awayLineup, homeLineup, boxScore.awayPlayerStats, boxScore.homePlayerStats, awayPlayers, boost.away
            );
        }

        boxScore.quarters[quarterIdx].home = homeQ;
        boxScore.quarters[quarterIdx].away = awayQ;

        // Rotate players (sub management)
        if (quarterIdx === 1 || quarterIdx === 3) {
            this.rotatePlayers(homeLineup);
            this.rotatePlayers(awayLineup);
        }

        // Add minutes
        const minutesPerQuarter = 12;
        this.addMinutes(homeLineup, minutesPerQuarter, boxScore.homePlayerStats);
        this.addMinutes(awayLineup, minutesPerQuarter, boxScore.awayPlayerStats);
    },

    simulateOT(homeLineup, awayLineup, boxScore, otQ, homePlayers, awayPlayers) {
        const possessions = Utils.randInt(10, 13);
        for (let i = 0; i < possessions; i++) {
            otQ.home += this.simulatePossession(
                homeLineup, awayLineup, boxScore.homePlayerStats, boxScore.awayPlayerStats, homePlayers
            );
            otQ.away += this.simulatePossession(
                awayLineup, homeLineup, boxScore.awayPlayerStats, boxScore.homePlayerStats, awayPlayers
            );
        }
        this.addMinutes(homeLineup, 5, boxScore.homePlayerStats);
        this.addMinutes(awayLineup, 5, boxScore.awayPlayerStats);
    },

    addMinutes(lineup, minutes, playerStats) {
        const starterMins = minutes * 0.75;
        const benchMins = minutes * 0.25;
        for (const p of lineup.starters) {
            playerStats[p.id].minutes += starterMins;
        }
        const benchCount = Math.min(lineup.bench.length, 3);
        for (let i = 0; i < benchCount; i++) {
            playerStats[lineup.bench[i].id].minutes += benchMins;
        }
    },

    rotatePlayers(lineup) {
        // Sub in best bench players
        if (lineup.bench.length >= 2) {
            // Swap worst starter with best bench
            const worstIdx = lineup.starters.length - 1;
            const temp = lineup.starters[worstIdx];
            lineup.starters[worstIdx] = lineup.bench[0];
            lineup.bench[0] = temp;
        }
    },

    simulatePossession(offLineup, defLineup, offStats, defStats, allOffPlayers, difficultyBoost = 1.0) {
        // Pick ball handler (weighted by ball handling + passing)
        const onCourt = offLineup.starters;
        const handler = this.pickBallHandler(onCourt);
        const defender = Utils.pickRandom(defLineup.starters);

        // Turnover check
        const toChance = (100 - handler.attributes.ballHandling) * 0.003 +
                          defender.attributes.steal * 0.002;
        if (Math.random() < toChance) {
            offStats[handler.id].turnovers++;
            // Possible steal
            if (Math.random() < 0.6) {
                const stealer = this.pickDefender(defLineup.starters, 'steal');
                defStats[stealer.id].steals++;
            }
            return 0;
        }

        // Determine shot type
        const shotType = this.determineShotType(handler, onCourt);
        const shooter = shotType.shooter;
        const shotResult = this.attemptShot(shotType, shooter, defLineup.starters, offStats, defStats, difficultyBoost);

        // Assist tracking
        if (shotResult.made && shooter.id !== handler.id && Math.random() < 0.6) {
            offStats[handler.id].assists++;
        } else if (shotResult.made && Math.random() < 0.35) {
            // Random assist from another player
            const assister = onCourt.find(p => p.id !== shooter.id);
            if (assister) offStats[assister.id].assists++;
        }

        return shotResult.points;
    },

    pickBallHandler(players) {
        const weights = players.map(p =>
            p.attributes.ballHandling * 2 + p.attributes.passing + p.attributes.speed
        );
        return Utils.weightedRandom(players, weights);
    },

    pickDefender(players, type) {
        const attr = type === 'block' ? 'block' : 'steal';
        const weights = players.map(p => p.attributes[attr] + 10);
        return Utils.weightedRandom(players, weights);
    },

    determineShotType(handler, onCourt) {
        // Decide between 3pt, midrange, inside, pass to another player
        const r = Math.random();
        let shooter = handler;

        // Sometimes pass to better scorer
        if (r < 0.4) {
            const scorers = onCourt.filter(p => p.id !== handler.id);
            if (scorers.length > 0) {
                const weights = scorers.map(p =>
                    p.attributes.threePoint + p.attributes.midRange + p.attributes.insideScoring
                );
                shooter = Utils.weightedRandom(scorers, weights);
            }
        }

        // Determine shot type based on player attributes
        const three = shooter.attributes.threePoint;
        const mid = shooter.attributes.midRange;
        const inside = shooter.attributes.insideScoring;
        const total = three + mid + inside;

        const threeWeight = three / total * 1.1; // Slight modern NBA 3pt bias
        const midWeight = mid / total * 0.7;
        const insideWeight = inside / total * 1.2;
        const totalWeight = threeWeight + midWeight + insideWeight;

        const shotRoll = Math.random() * totalWeight;

        let type;
        if (shotRoll < threeWeight) type = 'three';
        else if (shotRoll < threeWeight + midWeight) type = 'midRange';
        else type = 'inside';

        return { type, shooter };
    },

    attemptShot(shotType, shooter, defenders, offStats, defStats, difficultyBoost = 1.0) {
        const { type } = shotType;
        let basePct, attr, points;

        switch (type) {
            case 'three':
                attr = shooter.attributes.threePoint;
                basePct = 0.20 + (attr / 99) * 0.25; // 20% to 45%
                points = 3;
                offStats[shooter.id].threeAttempted++;
                break;
            case 'midRange':
                attr = shooter.attributes.midRange;
                basePct = 0.28 + (attr / 99) * 0.24; // 28% to 52%
                points = 2;
                break;
            case 'inside':
                attr = shooter.attributes.insideScoring;
                basePct = 0.35 + (attr / 99) * 0.30; // 35% to 65%
                points = 2;
                break;
        }

        // Defensive impact
        const closestDefender = Utils.pickRandom(defenders);
        const defAttr = type === 'inside'
            ? closestDefender.attributes.interiorDefense
            : closestDefender.attributes.perimeterDefense;
        basePct -= (defAttr / 99) * 0.08;

        // Block chance for inside shots
        if (type === 'inside') {
            const blocker = this.pickDefender(defenders, 'block');
            const blockChance = blocker.attributes.block * 0.002;
            if (Math.random() < blockChance) {
                defStats[blocker.id].blocks++;
                offStats[shooter.id].fgAttempted++;
                // Rebound
                this.handleRebound(offStats, defStats, defenders, [shooter]);
                return { made: false, points: 0 };
            }
        }

        // Apply difficulty boost to shot percentage
        basePct *= difficultyBoost;

        offStats[shooter.id].fgAttempted++;
        const made = Math.random() < basePct;

        if (made) {
            offStats[shooter.id].fgMade++;
            offStats[shooter.id].points += points;
            if (type === 'three') {
                offStats[shooter.id].threeMade++;
            }

            // And-one chance for inside shots
            if (type === 'inside' && Math.random() < 0.08) {
                const ftResult = this.shootFreeThrows(shooter, 1, offStats);
                return { made: true, points: points + ftResult };
            }

            return { made: true, points };
        } else {
            // Miss - rebound
            this.handleRebound(offStats, defStats, defenders, [shooter]);

            // Foul chance on miss
            if (Math.random() < 0.12) {
                const ftCount = type === 'three' ? 3 : 2;
                const ftResult = this.shootFreeThrows(shooter, ftCount, offStats);
                return { made: false, points: ftResult };
            }

            return { made: false, points: 0 };
        }
    },

    shootFreeThrows(shooter, count, stats) {
        let points = 0;
        const ftPct = 0.45 + (shooter.attributes.freeThrow / 99) * 0.45;
        for (let i = 0; i < count; i++) {
            stats[shooter.id].ftAttempted++;
            if (Math.random() < ftPct) {
                stats[shooter.id].ftMade++;
                stats[shooter.id].points++;
                points++;
            }
        }
        return points;
    },

    handleRebound(offStats, defStats, defPlayers, offPlayers) {
        // 70% chance defensive rebound
        if (Math.random() < 0.70) {
            const weights = defPlayers.map(p => p.attributes.rebounding + p.attributes.strength * 0.3 + 10);
            const rebounder = Utils.weightedRandom(defPlayers, weights);
            defStats[rebounder.id].rebounds++;
        } else {
            // Offensive rebound
            if (offPlayers.length > 0) {
                const weights = offPlayers.map(p => p.attributes.rebounding + p.attributes.athleticism * 0.2 + 5);
                const rebounder = Utils.weightedRandom(offPlayers, weights);
                offStats[rebounder.id].rebounds++;
            }
        }
    },

    updateSeasonStats(players, gameStats) {
        for (const p of players) {
            const gs = gameStats[p.id];
            if (!gs || gs.minutes === 0) continue;

            p.seasonStats.gamesPlayed++;
            p.seasonStats.minutes += Math.round(gs.minutes);
            p.seasonStats.points += gs.points;
            p.seasonStats.assists += gs.assists;
            p.seasonStats.rebounds += gs.rebounds;
            p.seasonStats.steals += gs.steals;
            p.seasonStats.blocks += gs.blocks;
            p.seasonStats.turnovers += gs.turnovers;
            p.seasonStats.fgMade += gs.fgMade;
            p.seasonStats.fgAttempted += gs.fgAttempted;
            p.seasonStats.threeMade += gs.threeMade;
            p.seasonStats.threeAttempted += gs.threeAttempted;
            p.seasonStats.ftMade += gs.ftMade;
            p.seasonStats.ftAttempted += gs.ftAttempted;
            p.gamesPlayed = p.seasonStats.gamesPlayed;
        }
    },

    // Check for injuries after a game
    checkInjuries(players, injuryChance) {
        const injuries = [];
        const injuryTypes = [
            { name: 'Sprained Ankle', gamesOut: Utils.randInt(3, 10) },
            { name: 'Knee Soreness', gamesOut: Utils.randInt(2, 7) },
            { name: 'Hamstring Strain', gamesOut: Utils.randInt(5, 15) },
            { name: 'Back Spasms', gamesOut: Utils.randInt(2, 8) },
            { name: 'Shoulder Injury', gamesOut: Utils.randInt(5, 20) },
            { name: 'Groin Strain', gamesOut: Utils.randInt(4, 12) },
            { name: 'Calf Strain', gamesOut: Utils.randInt(3, 10) },
            { name: 'Concussion Protocol', gamesOut: Utils.randInt(1, 5) },
            { name: 'Torn ACL', gamesOut: Utils.randInt(40, 82) },
            { name: 'Fractured Hand', gamesOut: Utils.randInt(10, 30) },
        ];

        for (const player of players) {
            // Skip already injured players
            if (player.injury && player.injury.gamesRemaining > 0) continue;

            // Injury chance per player per game, modified by stamina
            const staminaMod = 1.0 - (player.attributes.stamina / 99) * 0.4; // high stamina = less injury
            const ageMod = player.age > 32 ? 1.5 : player.age > 28 ? 1.2 : 1.0;
            const roll = Math.random();

            if (roll < injuryChance * staminaMod * ageMod) {
                // Severe injuries are rare
                const severityRoll = Math.random();
                let injury;
                if (severityRoll < 0.02) {
                    injury = injuryTypes[8]; // ACL - very rare
                } else if (severityRoll < 0.08) {
                    injury = injuryTypes[9]; // Fracture - rare
                } else {
                    // Pick from minor/moderate injuries
                    injury = injuryTypes[Utils.randInt(0, 7)];
                }

                player.injury = {
                    type: injury.name,
                    gamesRemaining: injury.gamesOut,
                };

                injuries.push({
                    player: PlayerEngine.getFullName(player),
                    playerId: player.id,
                    teamId: player.teamId,
                    injury: injury.name,
                    gamesOut: injury.gamesOut,
                });
            }
        }

        return injuries;
    },

    createForfeitResult(homeTeam, awayTeam, homeWins) {
        return {
            homeTeam: homeTeam.id,
            awayTeam: awayTeam.id,
            homeScore: homeWins ? 20 : 0,
            awayScore: homeWins ? 0 : 20,
            quarters: [
                { home: homeWins ? 5 : 0, away: homeWins ? 0 : 5 },
                { home: homeWins ? 5 : 0, away: homeWins ? 0 : 5 },
                { home: homeWins ? 5 : 0, away: homeWins ? 0 : 5 },
                { home: homeWins ? 5 : 0, away: homeWins ? 0 : 5 },
            ],
            overtime: [],
            homePlayerStats: {},
            awayPlayerStats: {},
            forfeit: true,
        };
    }
};
