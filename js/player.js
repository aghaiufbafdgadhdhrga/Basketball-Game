// ============================================================
// PLAYER.JS - Player generation, stats, OVR calculation
// ============================================================

const PlayerEngine = {
    // Generate a random player
    generatePlayer(options = {}) {
        const id = Utils.generateId();
        const age = options.age || Utils.randInt(19, 38);
        const position = options.position || Utils.pickRandom(POSITIONS);
        const firstName = options.firstName || Utils.pickRandom(FIRST_NAMES);
        const lastName = options.lastName || Utils.pickRandom(LAST_NAMES);
        const potential = options.potential || this.generatePotential(age);
        const targetOvr = options.targetOvr || this.generateTargetOvr(age, potential);

        const attributes = this.generateAttributes(position, targetOvr, age);
        const ovr = this.calculateOvr(attributes, position);

        const player = {
            id,
            firstName,
            lastName,
            age,
            position,
            attributes,
            potential,
            ovr,
            teamId: options.teamId || null,
            contract: options.contract || null,
            seasonStats: this.emptySeasonStats(),
            careerStats: [],
            gameLog: [],
            injury: null,
            morale: Utils.randInt(60, 90),
            experience: Math.max(0, age - 19),
            draftYear: options.draftYear || null,
            draftPick: options.draftPick || null,
            trainingFocus: 'balanced',
            minutesPerGame: 0,
            gamesPlayed: 0,
        };

        return player;
    },

    generatePotential(age) {
        if (age <= 22) return Utils.clamp(Utils.randGauss(72, 15), 40, 99);
        if (age <= 27) return Utils.clamp(Utils.randGauss(65, 12), 35, 95);
        if (age <= 31) return Utils.clamp(Utils.randGauss(55, 10), 30, 85);
        return Utils.clamp(Utils.randGauss(45, 8), 25, 70);
    },

    generateTargetOvr(age, potential) {
        let base;
        if (age <= 20) base = potential - Utils.randInt(15, 30);
        else if (age <= 23) base = potential - Utils.randInt(8, 20);
        else if (age <= 27) base = potential - Utils.randInt(0, 10);
        else if (age <= 31) base = potential - Utils.randInt(0, 5);
        else base = potential - Utils.randInt(5, 15 + (age - 31) * 2);

        return Utils.clamp(base, 35, 99);
    },

    // Generate attributes based on position archetype and target OVR
    generateAttributes(position, targetOvr, age) {
        const attrs = {};
        const weights = POSITION_WEIGHTS[position];

        // Generate raw attributes - primary attributes for position are higher
        for (const attr of ATTRIBUTES) {
            const weight = weights[attr];
            let base;
            if (weight >= 0.14) {
                base = targetOvr + Utils.randInt(-5, 10);
            } else if (weight >= 0.08) {
                base = targetOvr + Utils.randInt(-10, 5);
            } else if (weight >= 0.04) {
                base = targetOvr + Utils.randInt(-15, 0);
            } else {
                base = targetOvr + Utils.randInt(-25, -5);
            }

            // Add some variance
            base += Utils.randGauss(0, 5);

            // Age adjustments for physical stats
            if (['speed', 'athleticism', 'stamina'].includes(attr)) {
                if (age > 30) base -= (age - 30) * 2;
                if (age < 24) base += Utils.randInt(0, 3);
            }

            // Experience bonus for skill stats
            if (['midRange', 'freeThrow', 'passing', 'perimeterDefense', 'interiorDefense'].includes(attr)) {
                if (age > 25 && age < 33) base += Utils.randInt(0, 5);
            }

            attrs[attr] = Utils.clamp(Math.round(base), 25, 99);
        }

        return attrs;
    },

    // Calculate OVR based on position weights
    calculateOvr(attributes, position) {
        const weights = POSITION_WEIGHTS[position];
        let ovr = 0;
        for (const attr of ATTRIBUTES) {
            ovr += attributes[attr] * (weights[attr] || 0);
        }
        return Utils.clamp(Math.round(ovr), 25, 99);
    },

    // Get player full name
    getFullName(player) {
        return `${player.firstName} ${player.lastName}`;
    },

    // Get player display rating with badge
    getRatingBadge(ovr) {
        if (ovr >= 90) return 'Elite';
        if (ovr >= 80) return 'Star';
        if (ovr >= 70) return 'Starter';
        if (ovr >= 60) return 'Rotation';
        if (ovr >= 50) return 'Bench';
        return 'Developmental';
    },

    // Empty season stats
    emptySeasonStats() {
        return {
            gamesPlayed: 0,
            minutes: 0,
            points: 0,
            assists: 0,
            rebounds: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            fgMade: 0,
            fgAttempted: 0,
            threeMade: 0,
            threeAttempted: 0,
            ftMade: 0,
            ftAttempted: 0,
        };
    },

    // Calculate per-game averages
    getAverages(stats) {
        const gp = stats.gamesPlayed || 1;
        return {
            ppg: stats.points / gp,
            apg: stats.assists / gp,
            rpg: stats.rebounds / gp,
            spg: stats.steals / gp,
            bpg: stats.blocks / gp,
            tpg: stats.turnovers / gp,
            mpg: stats.minutes / gp,
            fgPct: stats.fgAttempted > 0 ? stats.fgMade / stats.fgAttempted : 0,
            threePct: stats.threeAttempted > 0 ? stats.threeMade / stats.threeAttempted : 0,
            ftPct: stats.ftAttempted > 0 ? stats.ftMade / stats.ftAttempted : 0,
        };
    },

    // Generate draft prospect
    generateDraftProspect(draftYear, rank) {
        const age = Utils.weightedRandom(
            [19, 20, 21, 22, 23],
            [30, 30, 20, 15, 5]
        );

        let potential, targetOvr;
        if (rank <= 5) {
            potential = Utils.clamp(Utils.randGauss(85, 8), 70, 99);
            targetOvr = Utils.clamp(Utils.randGauss(68, 8), 55, 80);
        } else if (rank <= 14) {
            potential = Utils.clamp(Utils.randGauss(75, 8), 60, 95);
            targetOvr = Utils.clamp(Utils.randGauss(62, 7), 50, 75);
        } else if (rank <= 30) {
            potential = Utils.clamp(Utils.randGauss(65, 8), 50, 88);
            targetOvr = Utils.clamp(Utils.randGauss(55, 7), 42, 70);
        } else if (rank <= 60) {
            potential = Utils.clamp(Utils.randGauss(58, 8), 40, 82);
            targetOvr = Utils.clamp(Utils.randGauss(48, 7), 35, 65);
        } else {
            potential = Utils.clamp(Utils.randGauss(50, 10), 35, 78);
            targetOvr = Utils.clamp(Utils.randGauss(42, 8), 30, 60);
        }

        const position = Utils.pickRandom(POSITIONS);
        const player = this.generatePlayer({
            age,
            position,
            potential,
            targetOvr,
            draftYear,
        });

        player.scoutingReport = this.generateScoutingReport(player);
        return player;
    },

    generateScoutingReport(player) {
        const strengths = [];
        const weaknesses = [];

        for (const attr of ATTRIBUTES) {
            if (player.attributes[attr] >= 80) strengths.push(ATTRIBUTE_LABELS[attr]);
            else if (player.attributes[attr] <= 50) weaknesses.push(ATTRIBUTE_LABELS[attr]);
        }

        const projections = ['Franchise Player', 'All-Star', 'Quality Starter', 'Solid Rotation Player', 'Bench Player', 'Project'];
        let projIdx;
        if (player.potential >= 88) projIdx = 0;
        else if (player.potential >= 78) projIdx = 1;
        else if (player.potential >= 68) projIdx = 2;
        else if (player.potential >= 58) projIdx = 3;
        else if (player.potential >= 48) projIdx = 4;
        else projIdx = 5;

        return {
            strengths: strengths.slice(0, 3),
            weaknesses: weaknesses.slice(0, 3),
            projection: projections[projIdx],
            comparison: '', // Could add player comparisons
        };
    },

    // Grow/regress player during offseason
    developPlayer(player) {
        const age = player.age;
        const pot = player.potential;
        const ovr = player.ovr;
        const trainingFocus = player.trainingFocus || 'balanced';
        const minutesPlayed = player.seasonStats.minutes || 0;
        const gamesPlayed = player.seasonStats.gamesPlayed || 0;
        const mpg = gamesPlayed > 0 ? minutesPlayed / gamesPlayed : 0;

        // Base growth/decline based on age
        let growthRate;
        if (age <= 22) {
            growthRate = Utils.randFloat(1.5, 4.0);
        } else if (age <= 25) {
            growthRate = Utils.randFloat(0.5, 2.5);
        } else if (age <= CONFIG.GROWTH_PEAK_AGE) {
            growthRate = Utils.randFloat(-0.5, 1.5);
        } else if (age <= CONFIG.DECLINE_START_AGE) {
            growthRate = Utils.randFloat(-1.5, 0.5);
        } else {
            growthRate = Utils.randFloat(-4.0, -1.0);
        }

        // Potential factor - higher potential = more growth
        if (ovr < pot && age <= 28) {
            growthRate += (pot - ovr) * 0.05;
        }

        // Playing time bonus
        if (mpg > 30) growthRate += 0.5;
        else if (mpg > 20) growthRate += 0.3;
        else if (mpg > 10) growthRate += 0.1;
        else if (mpg < 5) growthRate -= 0.3;

        // Apply growth to attributes
        const focusAttrs = TRAINING_FOCUSES[trainingFocus]?.attrs || ATTRIBUTES;

        for (const attr of ATTRIBUTES) {
            let change = growthRate + Utils.randFloat(-1.5, 1.5);

            // Training focus bonus
            if (focusAttrs.includes(attr)) {
                change += Utils.randFloat(0.3, 1.0);
            }

            // Position importance bonus
            const posWeight = POSITION_WEIGHTS[player.position][attr];
            if (posWeight >= 0.12) change += Utils.randFloat(0, 0.5);

            // Physical decline for older players
            if (['speed', 'athleticism', 'stamina'].includes(attr) && age > 30) {
                change -= (age - 30) * 0.3;
            }

            player.attributes[attr] = Utils.clamp(
                Math.round(player.attributes[attr] + change),
                25, 99
            );
        }

        // Update OVR
        player.ovr = this.calculateOvr(player.attributes, player.position);

        // Age the player
        player.age += 1;
        player.experience += 1;

        // Slight potential decay
        if (age > 25) {
            player.potential = Math.max(player.ovr, player.potential - Utils.randInt(0, 2));
        }

        // Archive season stats to career
        if (player.seasonStats.gamesPlayed > 0) {
            player.careerStats.push({
                ...player.seasonStats,
                year: game ? game.currentYear : CONFIG.STARTING_YEAR,
                teamId: player.teamId,
            });
        }

        // Reset season stats
        player.seasonStats = this.emptySeasonStats();
        player.gameLog = [];
        player.gamesPlayed = 0;

        return player;
    },

    // Estimate market value for free agency/contract
    estimateMarketValue(player) {
        const ovr = player.ovr;
        const age = player.age;
        const pot = player.potential;

        let baseValue;
        if (ovr >= 90) baseValue = Utils.randFloat(40, 50) * 1000000;
        else if (ovr >= 85) baseValue = Utils.randFloat(30, 42) * 1000000;
        else if (ovr >= 80) baseValue = Utils.randFloat(22, 32) * 1000000;
        else if (ovr >= 75) baseValue = Utils.randFloat(15, 25) * 1000000;
        else if (ovr >= 70) baseValue = Utils.randFloat(8, 18) * 1000000;
        else if (ovr >= 65) baseValue = Utils.randFloat(4, 10) * 1000000;
        else if (ovr >= 60) baseValue = Utils.randFloat(2, 6) * 1000000;
        else baseValue = Utils.randFloat(1.1, 3) * 1000000;

        // Age adjustment
        if (age <= 25) baseValue *= 1.15;
        else if (age >= 33) baseValue *= 0.75;
        else if (age >= 35) baseValue *= 0.55;

        // Potential bonus for young players
        if (age <= 25 && pot >= 80) baseValue *= 1.2;

        return Math.round(Utils.clamp(baseValue, CONFIG.MIN_SALARY, CONFIG.MAX_SALARY));
    },

    estimateContractYears(player) {
        const age = player.age;
        const ovr = player.ovr;
        if (age >= 35) return Utils.randInt(1, 1);
        if (age >= 32) return Utils.randInt(1, 2);
        if (age >= 28) return Utils.randInt(2, 3);
        if (ovr >= 80) return Utils.randInt(3, 5);
        if (ovr >= 70) return Utils.randInt(2, 4);
        return Utils.randInt(1, 3);
    },
};
