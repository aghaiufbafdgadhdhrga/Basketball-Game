// ============================================================
// CAREER.JS - Player Career Mode Engine
// HS -> College -> NBA pipeline
// ============================================================

const CareerEngine = {
    // Career state
    career: null,

    // Create a new career
    createCareer(playerData) {
        const attributes = {};
        for (const attr of ATTRIBUTES) {
            attributes[attr] = playerData.attributes[attr] || 50;
        }

        const ovr = PlayerEngine.calculateOvr(attributes, playerData.position);

        this.career = {
            mode: 'career',
            phase: 'highschool', // highschool, college, nba, retired
            player: {
                id: Utils.generateId(),
                firstName: playerData.firstName,
                lastName: playerData.lastName,
                position: playerData.position,
                height: playerData.height || "6'4",
                weight: playerData.weight || 195,
                attributes: attributes,
                ovr: ovr,
                potential: Utils.clamp(ovr + Utils.randInt(10, 25), 60, 99),
                age: 14,
                seasonStats: PlayerEngine.emptySeasonStats(),
                careerStats: [],
                gameLog: [],
                injury: null,
                morale: 80,
                accolades: [],
                rings: 0,
            },
            // High School
            hs: {
                school: null,
                year: 1, // Freshman=1, Senior=4
                seasonResults: [],
                recruitingRank: null,
                stars: 0, // 1-5 star recruit
                offers: [],
            },
            // College
            college: {
                team: null,
                conference: null,
                year: 0,
                yearLabel: 'Freshman',
                seasonResults: [],
                conferenceStandings: [],
                marchMadness: null,
                nationalChampionships: 0,
                transferAvailable: false,
                allCollegeTeams: [],
                collegePlayerRankings: [],
            },
            // NBA
            nba: {
                teamId: null,
                draftYear: null,
                draftPick: null,
                year: 0,
                contract: null,
                championships: 0,
                mvps: 0,
                allStarSelections: 0,
                allNBASelections: 0,
                mockDraft: [],
                seasonLog: [],
            },
            // Shared
            currentYear: CONFIG.STARTING_YEAR,
            messageLog: [],
            settings: { ...DEFAULT_GAME_SETTINGS },
        };

        // Assign HS school
        this.career.hs.school = Utils.pickRandom(HS_NAMES);
        this.addCareerMessage(`Welcome to ${this.career.hs.school}! You're a Freshman.`);

        return this.career;
    },

    // ==================== HIGH SCHOOL ====================

    simHSSeason() {
        const c = this.career;
        if (c.phase !== 'highschool') return;

        const yearLabels = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
        const yearLabel = yearLabels[c.hs.year - 1] || 'Senior';

        // Sim games - player grows each HS year
        const games = CAREER_CONFIG.HS_GAMES_PER_SEASON;
        let wins = 0;
        let losses = 0;
        const stats = PlayerEngine.emptySeasonStats();

        // Generate HS teammates (rough quality based on school)
        const schoolIdx = HS_NAMES.indexOf(c.hs.school);
        const schoolQuality = schoolIdx < 5 ? 75 : schoolIdx < 10 ? 65 : schoolIdx < 15 ? 55 : 45;

        for (let g = 0; g < games; g++) {
            const gameStats = this.simCareerGame(c.player, schoolQuality, 'hs');
            // Accumulate stats
            for (const key in gameStats) {
                if (typeof stats[key] === 'number') stats[key] += gameStats[key];
            }
            stats.gamesPlayed++;
            if (gameStats.teamWon) wins++;
            else losses++;
        }

        c.player.seasonStats = stats;
        const avg = PlayerEngine.getAverages(stats);

        // Store season result
        c.hs.seasonResults.push({
            year: c.hs.year,
            yearLabel,
            wins,
            losses,
            stats: { ...stats },
            avgPPG: avg.ppg,
            avgAPG: avg.apg,
            avgRPG: avg.rpg,
        });

        // Player development during HS
        this.developCareerPlayer(c.player, 'hs');

        // Update recruiting rank after each season
        this.updateHSRecruitingRank();

        this.addCareerMessage(`${yearLabel} Year Complete: ${wins}-${losses} record. ${avg.ppg.toFixed(1)} PPG, ${avg.rpg.toFixed(1)} RPG, ${avg.apg.toFixed(1)} APG`);

        c.player.age++;
        c.currentYear++;

        if (c.hs.year >= CAREER_CONFIG.HS_SEASONS) {
            // Generate college offers
            this.generateCollegeOffers();
            this.addCareerMessage('Your high school career is over! Time to choose a college.');
            c.phase = 'college_recruiting';
        } else {
            c.hs.year++;
        }

        // Archive stats
        c.player.careerStats.push({
            ...stats,
            year: c.currentYear - 1,
            level: 'HS',
            team: c.hs.school,
        });
        c.player.seasonStats = PlayerEngine.emptySeasonStats();
    },

    updateHSRecruitingRank() {
        const c = this.career;
        const latestSeason = c.hs.seasonResults[c.hs.seasonResults.length - 1];
        if (!latestSeason) return;

        // Calculate recruit ranking based on stats + OVR
        const score = c.player.ovr * 2 + latestSeason.avgPPG * 3 + latestSeason.avgRPG * 2 + latestSeason.avgAPG * 2;

        // Convert to rank (1-100) and stars (1-5)
        if (score >= 250) { c.hs.recruitingRank = Utils.randInt(1, 5); c.hs.stars = 5; }
        else if (score >= 210) { c.hs.recruitingRank = Utils.randInt(5, 20); c.hs.stars = 5; }
        else if (score >= 180) { c.hs.recruitingRank = Utils.randInt(15, 50); c.hs.stars = 4; }
        else if (score >= 150) { c.hs.recruitingRank = Utils.randInt(40, 100); c.hs.stars = 4; }
        else if (score >= 120) { c.hs.recruitingRank = Utils.randInt(80, 200); c.hs.stars = 3; }
        else if (score >= 90) { c.hs.recruitingRank = Utils.randInt(150, 350); c.hs.stars = 3; }
        else { c.hs.recruitingRank = Utils.randInt(300, 500); c.hs.stars = 2; }
    },

    generateCollegeOffers() {
        const c = this.career;
        const stars = c.hs.stars;
        const offers = [];

        // Higher-ranked recruits get more and better offers
        const allTeams = [...COLLEGE_TEAMS_DATA];
        allTeams.sort((a, b) => b.prestige - a.prestige);

        let numOffers, maxPrestige;
        if (stars >= 5) { numOffers = Utils.randInt(12, 20); maxPrestige = 100; }
        else if (stars >= 4) { numOffers = Utils.randInt(8, 15); maxPrestige = 90; }
        else if (stars >= 3) { numOffers = Utils.randInt(5, 10); maxPrestige = 75; }
        else { numOffers = Utils.randInt(2, 6); maxPrestige = 60; }

        const eligible = allTeams.filter(t => t.prestige <= maxPrestige + 10);
        const shuffled = Utils.shuffle(eligible);

        for (let i = 0; i < Math.min(numOffers, shuffled.length); i++) {
            offers.push({
                team: shuffled[i],
                scholarship: true,
                interest: Utils.randInt(70, 100),
            });
        }

        // Always include at least some mid/low tier schools
        if (stars >= 4) {
            // Top recruits also get offers from elite programs
            const eliteTeams = allTeams.filter(t => t.prestige >= 90);
            for (const t of eliteTeams.slice(0, 5)) {
                if (!offers.find(o => o.team.abbr === t.abbr)) {
                    offers.push({ team: t, scholarship: true, interest: Utils.randInt(80, 100) });
                }
            }
        }

        offers.sort((a, b) => b.team.prestige - a.team.prestige);
        c.hs.offers = offers.slice(0, 20);
    },

    commitToCollege(teamAbbr) {
        const c = this.career;
        const offer = c.hs.offers.find(o => o.team.abbr === teamAbbr);
        if (!offer) return false;

        c.college.team = offer.team;
        c.college.conference = offer.team.conference;
        c.college.year = 1;
        c.college.yearLabel = 'Freshman';
        c.phase = 'college';

        // Initialize all college teams
        this.initCollegeTeams();

        this.addCareerMessage(`Committed to ${offer.team.name} ${offer.team.mascot}! Let's go!`);
        return true;
    },

    // ==================== COLLEGE ====================

    initCollegeTeams() {
        const c = this.career;
        c.college.allCollegeTeams = COLLEGE_TEAMS_DATA.map(td => ({
            ...td,
            id: 'col_' + td.abbr,
            wins: 0,
            losses: 0,
            confWins: 0,
            confLosses: 0,
            teamOvr: td.prestige + Utils.randInt(-10, 10),
            players: this.generateCollegeRoster(td),
        }));
    },

    generateCollegeRoster(teamData) {
        const roster = [];
        const rosterSize = 12;
        const qualityBase = teamData.prestige * 0.6 + Utils.randInt(10, 30);

        for (let i = 0; i < rosterSize; i++) {
            const targetOvr = Utils.clamp(qualityBase + Utils.randInt(-15, 10) - (i * 2), 35, 90);
            roster.push({
                id: Utils.generateId(),
                name: Utils.pickRandom(FIRST_NAMES) + ' ' + Utils.pickRandom(LAST_NAMES),
                position: POSITIONS[i % 5],
                ovr: Math.round(targetOvr),
                year: Utils.randInt(1, 4),
            });
        }
        return roster;
    },

    simCollegeSeason() {
        const c = this.career;
        if (c.phase !== 'college') return;

        const yearLabels = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
        c.college.yearLabel = yearLabels[c.college.year - 1] || 'Senior';

        // Reset standings
        for (const team of c.college.allCollegeTeams) {
            team.wins = 0;
            team.losses = 0;
            team.confWins = 0;
            team.confLosses = 0;
        }

        // Sim all college games
        const myTeam = c.college.allCollegeTeams.find(t => t.abbr === c.college.team.abbr);
        const confTeams = c.college.allCollegeTeams.filter(t => t.conference === c.college.conference);
        const stats = PlayerEngine.emptySeasonStats();
        let myWins = 0, myLosses = 0;

        // Conference games (play each conf opponent twice)
        for (const opp of confTeams) {
            if (opp.abbr === myTeam.abbr) continue;
            for (let g = 0; g < 2; g++) {
                const gameStats = this.simCareerGame(c.player, myTeam.teamOvr, 'college', opp.teamOvr);
                for (const key in gameStats) {
                    if (typeof stats[key] === 'number') stats[key] += gameStats[key];
                }
                stats.gamesPlayed++;
                if (gameStats.teamWon) {
                    myWins++; myTeam.wins++; myTeam.confWins++;
                    opp.losses++; opp.confLosses++;
                } else {
                    myLosses++; myTeam.losses++; myTeam.confLosses++;
                    opp.wins++; opp.confWins++;
                }
            }
        }

        // Non-conference games
        const nonConfTeams = c.college.allCollegeTeams.filter(t => t.conference !== c.college.conference);
        const nonConfOpponents = Utils.shuffle(nonConfTeams).slice(0, Math.max(0, CAREER_CONFIG.COLLEGE_GAMES_PER_SEASON - (confTeams.length - 1) * 2));
        for (const opp of nonConfOpponents) {
            const gameStats = this.simCareerGame(c.player, myTeam.teamOvr, 'college', opp.teamOvr);
            for (const key in gameStats) {
                if (typeof stats[key] === 'number') stats[key] += gameStats[key];
            }
            stats.gamesPlayed++;
            if (gameStats.teamWon) { myWins++; myTeam.wins++; opp.losses++; }
            else { myLosses++; myTeam.losses++; opp.wins++; }
        }

        // Simulate other conference games
        this.simOtherCollegeGames(c.college.allCollegeTeams, myTeam.abbr);

        c.player.seasonStats = stats;
        const avg = PlayerEngine.getAverages(stats);

        // Conference standings
        const confStandings = confTeams
            .map(t => ({ ...t }))
            .sort((a, b) => {
                const aPct = a.confWins / (a.confWins + a.confLosses || 1);
                const bPct = b.confWins / (b.confWins + b.confLosses || 1);
                return bPct - aPct;
            });
        c.college.conferenceStandings = confStandings;

        // Season result
        c.college.seasonResults.push({
            year: c.college.year,
            yearLabel: c.college.yearLabel,
            team: c.college.team.name,
            wins: myWins,
            losses: myLosses,
            stats: { ...stats },
            avgPPG: avg.ppg,
            avgAPG: avg.apg,
            avgRPG: avg.rpg,
        });

        this.addCareerMessage(`${c.college.yearLabel} Year at ${c.college.team.name}: ${myWins}-${myLosses}. ${avg.ppg.toFixed(1)} PPG, ${avg.rpg.toFixed(1)} RPG, ${avg.apg.toFixed(1)} APG`);

        // Generate college player rankings
        this.generateCollegePlayerRankings();

        // March Madness selection
        this.selectMarchMadnessField();

        // Player development
        this.developCareerPlayer(c.player, 'college');

        // Archive
        c.player.careerStats.push({
            ...stats,
            year: c.currentYear,
            level: 'College',
            team: c.college.team.name,
        });
        c.player.seasonStats = PlayerEngine.emptySeasonStats();
    },

    simOtherCollegeGames(allTeams, skipAbbr) {
        // Simulate rest of college games for standings purposes
        for (const conf of COLLEGE_CONFERENCES) {
            const confTeams = allTeams.filter(t => t.conference === conf.name);
            for (let i = 0; i < confTeams.length; i++) {
                for (let j = i + 1; j < confTeams.length; j++) {
                    if (confTeams[i].abbr === skipAbbr || confTeams[j].abbr === skipAbbr) continue;
                    // Sim 2 games
                    for (let g = 0; g < 2; g++) {
                        const diff = confTeams[i].teamOvr - confTeams[j].teamOvr;
                        const winChance = 0.5 + diff * 0.008 + (g === 0 ? 0.03 : -0.03);
                        if (Math.random() < winChance) {
                            confTeams[i].wins++; confTeams[i].confWins++;
                            confTeams[j].losses++; confTeams[j].confLosses++;
                        } else {
                            confTeams[j].wins++; confTeams[j].confWins++;
                            confTeams[i].losses++; confTeams[i].confLosses++;
                        }
                    }
                }
            }
            // Non-conf games for AI teams
            for (const team of confTeams) {
                if (team.abbr === skipAbbr) continue;
                const extraGames = Utils.randInt(5, 10);
                for (let g = 0; g < extraGames; g++) {
                    if (Math.random() < 0.5 + team.teamOvr * 0.003) {
                        team.wins++;
                    } else {
                        team.losses++;
                    }
                }
            }
        }
    },

    generateCollegePlayerRankings() {
        const c = this.career;
        const rankings = [];

        // Add the user's player
        const avg = PlayerEngine.getAverages(c.player.seasonStats);
        rankings.push({
            name: `${c.player.firstName} ${c.player.lastName}`,
            team: c.college.team.name,
            conference: c.college.conference,
            position: c.player.position,
            ovr: c.player.ovr,
            year: c.college.yearLabel,
            ppg: avg.ppg,
            rpg: avg.rpg,
            apg: avg.apg,
            isUser: true,
        });

        // Generate AI top players
        for (const team of c.college.allCollegeTeams) {
            if (team.abbr === c.college.team.abbr) continue;
            const bestPlayer = team.players[0];
            if (!bestPlayer) continue;
            const fakePPG = bestPlayer.ovr * 0.25 + Utils.randFloat(-3, 5);
            const fakeRPG = bestPlayer.position === 'C' || bestPlayer.position === 'PF' ? Utils.randFloat(5, 12) : Utils.randFloat(2, 6);
            const fakeAPG = bestPlayer.position === 'PG' ? Utils.randFloat(4, 9) : Utils.randFloat(1, 4);

            rankings.push({
                name: bestPlayer.name,
                team: team.name,
                conference: team.conference,
                position: bestPlayer.position,
                ovr: bestPlayer.ovr,
                year: ['Freshman', 'Sophomore', 'Junior', 'Senior'][bestPlayer.year - 1],
                ppg: fakePPG,
                rpg: fakeRPG,
                apg: fakeAPG,
                isUser: false,
            });
        }

        rankings.sort((a, b) => b.ovr - a.ovr);
        rankings.forEach((r, i) => r.rank = i + 1);
        c.college.collegePlayerRankings = rankings;
    },

    selectMarchMadnessField() {
        const c = this.career;
        const field = [];

        // Auto-bids: best team in each conference by conf record
        for (const conf of COLLEGE_CONFERENCES) {
            const confTeams = c.college.allCollegeTeams
                .filter(t => t.conference === conf.name)
                .sort((a, b) => {
                    const aPct = a.confWins / (a.confWins + a.confLosses || 1);
                    const bPct = b.confWins / (b.confWins + b.confLosses || 1);
                    if (bPct !== aPct) return bPct - aPct;
                    return b.wins - a.wins;
                });
            if (confTeams.length > 0) {
                field.push({ ...confTeams[0], seed: 0, autoBid: true });
            }
        }

        // At-large bids: best remaining teams by overall record
        const inField = new Set(field.map(t => t.abbr));
        const remaining = c.college.allCollegeTeams
            .filter(t => !inField.has(t.abbr))
            .sort((a, b) => {
                const aPct = a.wins / (a.wins + a.losses || 1);
                const bPct = b.wins / (b.wins + b.losses || 1);
                if (bPct !== aPct) return bPct - aPct;
                return b.teamOvr - a.teamOvr;
            });

        const needed = CAREER_CONFIG.MARCH_MADNESS_TEAMS - field.length;
        for (let i = 0; i < Math.min(needed, remaining.length); i++) {
            field.push({ ...remaining[i], seed: 0, autoBid: false });
        }

        // Seed the field 1-16 in 4 regions
        field.sort((a, b) => {
            const aPct = a.wins / (a.wins + a.losses || 1);
            const bPct = b.wins / (b.wins + b.losses || 1);
            if (bPct !== aPct) return bPct - aPct;
            return b.teamOvr - a.teamOvr;
        });

        const regions = ['East', 'West', 'South', 'Midwest'];
        const bracket = { regions: {}, finalFour: [], champion: null };

        for (const region of regions) {
            bracket.regions[region] = { name: region, matchups: [] };
        }

        // Assign seeds S-curve style
        for (let i = 0; i < Math.min(field.length, 64); i++) {
            const seedLine = Math.floor(i / 4) + 1;
            const regionIdx = i % 4;
            field[i].seed = seedLine;
            field[i].region = regions[regionIdx];
        }

        // Create round of 64 matchups (1v16, 2v15, etc.)
        for (const region of regions) {
            const regionTeams = field.filter(t => t.region === region).sort((a, b) => a.seed - b.seed);
            const matchups = [];
            for (let i = 0; i < 8; i++) {
                const top = regionTeams[i];
                const bottom = regionTeams[15 - i];
                if (top && bottom) {
                    matchups.push({
                        id: Utils.generateId(),
                        team1: top,
                        team2: bottom,
                        winner: null,
                        score1: 0,
                        score2: 0,
                    });
                }
            }
            bracket.regions[region].matchups = matchups;
        }

        bracket.currentRound = 'Round of 64';
        bracket.userInTournament = field.some(t => t.abbr === c.college.team.abbr);
        bracket.userEliminated = false;

        c.college.marchMadness = bracket;

        if (bracket.userInTournament) {
            const userEntry = field.find(t => t.abbr === c.college.team.abbr);
            this.addCareerMessage(`March Madness! ${c.college.team.name} earned a #${userEntry.seed} seed in the ${userEntry.region} region!`);
        } else {
            this.addCareerMessage(`${c.college.team.name} did not make the NCAA Tournament this year.`);
        }
    },

    simMarchMadnessRound() {
        const c = this.career;
        const bracket = c.college.marchMadness;
        if (!bracket || bracket.champion) return;

        const roundNames = ['Round of 64', 'Round of 32', 'Sweet 16', 'Elite 8', 'Final Four', 'Championship'];
        const roundIdx = roundNames.indexOf(bracket.currentRound);

        if (bracket.currentRound === 'Final Four' || bracket.currentRound === 'Championship') {
            // Final Four / Championship
            return this.simFinalFourRound();
        }

        // Sim current round in all regions
        for (const regionName of Object.keys(bracket.regions)) {
            const region = bracket.regions[regionName];
            const nextMatchups = [];

            for (const matchup of region.matchups) {
                if (matchup.winner) continue;

                const isUserGame = matchup.team1.abbr === c.college.team.abbr || matchup.team2.abbr === c.college.team.abbr;
                let winner, score1, score2;

                if (isUserGame && !bracket.userEliminated) {
                    // Sim with player stats
                    const oppTeam = matchup.team1.abbr === c.college.team.abbr ? matchup.team2 : matchup.team1;
                    const myTeam = c.college.allCollegeTeams.find(t => t.abbr === c.college.team.abbr);
                    const gameStats = this.simCareerGame(c.player, myTeam ? myTeam.teamOvr : 70, 'college', oppTeam.teamOvr);

                    if (gameStats.teamWon) {
                        winner = matchup.team1.abbr === c.college.team.abbr ? matchup.team1 : matchup.team2;
                        score1 = matchup.team1.abbr === c.college.team.abbr ? Utils.randInt(65, 95) : Utils.randInt(50, 80);
                        score2 = matchup.team1.abbr === c.college.team.abbr ? Utils.randInt(50, 80) : Utils.randInt(65, 95);
                    } else {
                        winner = matchup.team1.abbr === c.college.team.abbr ? matchup.team2 : matchup.team1;
                        score1 = matchup.team1.abbr === c.college.team.abbr ? Utils.randInt(50, 75) : Utils.randInt(65, 90);
                        score2 = matchup.team1.abbr === c.college.team.abbr ? Utils.randInt(65, 90) : Utils.randInt(50, 75);
                        bracket.userEliminated = true;
                        this.addCareerMessage(`Eliminated in ${bracket.currentRound}! Lost to ${winner.name}.`);
                    }
                } else {
                    // AI vs AI
                    const diff = (matchup.team1.teamOvr || matchup.team1.prestige) - (matchup.team2.teamOvr || matchup.team2.prestige);
                    const seedDiff = (matchup.team2.seed || 8) - (matchup.team1.seed || 8);
                    const winChance = 0.5 + diff * 0.006 + seedDiff * 0.02;
                    if (Math.random() < winChance) {
                        winner = matchup.team1;
                        score1 = Utils.randInt(60, 90);
                        score2 = Utils.randInt(50, score1 - 1);
                    } else {
                        winner = matchup.team2;
                        score2 = Utils.randInt(60, 90);
                        score1 = Utils.randInt(50, score2 - 1);
                    }
                }

                matchup.winner = winner;
                matchup.score1 = score1;
                matchup.score2 = score2;
            }

            // Create next round matchups
            const winners = region.matchups.map(m => m.winner).filter(Boolean);
            for (let i = 0; i < winners.length; i += 2) {
                if (winners[i] && winners[i + 1]) {
                    nextMatchups.push({
                        id: Utils.generateId(),
                        team1: winners[i],
                        team2: winners[i + 1],
                        winner: null,
                        score1: 0,
                        score2: 0,
                    });
                }
            }

            if (nextMatchups.length > 0) {
                region.matchups = nextMatchups;
            }
        }

        // Advance to next round
        if (roundIdx + 1 < roundNames.length) {
            bracket.currentRound = roundNames[roundIdx + 1];
        }

        // Check if we should set up Final Four
        if (bracket.currentRound === 'Final Four') {
            bracket.finalFour = [];
            for (const regionName of Object.keys(bracket.regions)) {
                const region = bracket.regions[regionName];
                const winner = region.matchups[region.matchups.length - 1]?.winner;
                if (winner) {
                    bracket.finalFour.push({ ...winner, regionWon: regionName });
                }
            }
        }

        if (!bracket.userEliminated && bracket.userInTournament) {
            this.addCareerMessage(`Advanced through ${roundNames[roundIdx]}!`);
        }
    },

    simFinalFourRound() {
        const c = this.career;
        const bracket = c.college.marchMadness;

        if (bracket.currentRound === 'Final Four' && bracket.finalFour.length >= 4) {
            // Semi-finals
            bracket.semiFinals = [
                this.simTournamentGame(bracket.finalFour[0], bracket.finalFour[1]),
                this.simTournamentGame(bracket.finalFour[2], bracket.finalFour[3]),
            ];
            bracket.currentRound = 'Championship';
        } else if (bracket.currentRound === 'Championship' && bracket.semiFinals) {
            // Championship game
            const finalist1 = bracket.semiFinals[0].winner;
            const finalist2 = bracket.semiFinals[1].winner;
            bracket.championship = this.simTournamentGame(finalist1, finalist2);
            bracket.champion = bracket.championship.winner;

            if (bracket.champion.abbr === c.college.team.abbr) {
                c.college.nationalChampionships++;
                c.player.accolades.push({ type: 'National Champion', year: c.currentYear, level: 'College' });
                this.addCareerMessage('NATIONAL CHAMPIONS! You won the NCAA Tournament!');
            } else {
                this.addCareerMessage(`${bracket.champion.name} won the National Championship.`);
            }
        }
    },

    simTournamentGame(team1, team2) {
        const c = this.career;
        const isUserGame = team1.abbr === c.college.team.abbr || team2.abbr === c.college.team.abbr;

        let winner, score1, score2;
        if (isUserGame && !c.college.marchMadness.userEliminated) {
            const oppTeam = team1.abbr === c.college.team.abbr ? team2 : team1;
            const myTeam = c.college.allCollegeTeams.find(t => t.abbr === c.college.team.abbr);
            const gameStats = this.simCareerGame(c.player, myTeam ? myTeam.teamOvr : 70, 'college', oppTeam.teamOvr || oppTeam.prestige);

            if (gameStats.teamWon) {
                winner = team1.abbr === c.college.team.abbr ? team1 : team2;
            } else {
                winner = team1.abbr === c.college.team.abbr ? team2 : team1;
                c.college.marchMadness.userEliminated = true;
            }
        } else {
            const t1Str = team1.teamOvr || team1.prestige || 50;
            const t2Str = team2.teamOvr || team2.prestige || 50;
            winner = Math.random() < 0.5 + (t1Str - t2Str) * 0.006 ? team1 : team2;
        }

        score1 = Utils.randInt(55, 90);
        score2 = Utils.randInt(50, 85);
        if (winner === team2) { const tmp = score1; score1 = score2; score2 = tmp; }
        if (score1 <= score2) score1 = score2 + Utils.randInt(1, 5);

        return { team1, team2, winner, score1, score2 };
    },

    finishCollegeSeason() {
        const c = this.career;

        c.player.age++;
        c.currentYear++;

        if (c.college.year >= CAREER_CONFIG.COLLEGE_MAX_YEARS) {
            // Must declare for NBA draft
            this.prepareForNBADraft();
        } else {
            c.college.year++;
            c.college.transferAvailable = true;
            // Can declare for draft or continue
            c.phase = 'college_offseason';
        }
    },

    declareForDraft() {
        this.prepareForNBADraft();
    },

    stayInCollege() {
        const c = this.career;
        c.phase = 'college';
        c.college.transferAvailable = true;
        this.addCareerMessage(`Returning to ${c.college.team.name} for your ${['', 'Freshman', 'Sophomore', 'Junior', 'Senior'][c.college.year]} year.`);
    },

    transferCollege(newTeamAbbr) {
        const c = this.career;
        const newTeam = COLLEGE_TEAMS_DATA.find(t => t.abbr === newTeamAbbr);
        if (!newTeam) return false;

        c.college.team = newTeam;
        c.college.conference = newTeam.conference;
        c.college.transferAvailable = false;
        c.phase = 'college';

        this.addCareerMessage(`Transferred to ${newTeam.name} ${newTeam.mascot}!`);
        return true;
    },

    // ==================== NBA DRAFT ====================

    prepareForNBADraft() {
        const c = this.career;
        c.phase = 'nba_draft';

        // Generate mock draft
        this.generateMockDraft();
        this.addCareerMessage('You have declared for the NBA Draft!');
    },

    generateMockDraft() {
        const c = this.career;
        const prospects = [];

        // Add user player
        const userAvg = c.player.careerStats.length > 0
            ? PlayerEngine.getAverages(c.player.careerStats[c.player.careerStats.length - 1])
            : { ppg: 0, rpg: 0, apg: 0 };

        prospects.push({
            name: `${c.player.firstName} ${c.player.lastName}`,
            position: c.player.position,
            ovr: c.player.ovr,
            potential: c.player.potential,
            age: c.player.age,
            college: c.college.team.name,
            ppg: userAvg.ppg,
            rpg: userAvg.rpg,
            apg: userAvg.apg,
            strengths: this.getPlayerStrengths(c.player),
            weaknesses: this.getPlayerWeaknesses(c.player),
            isUser: true,
        });

        // Generate other prospects
        for (let i = 0; i < 59; i++) {
            const age = Utils.randInt(19, 22);
            const ovr = Utils.clamp(Utils.randGauss(68 - i * 0.5, 8), 40, 92);
            const pot = Utils.clamp(ovr + Utils.randInt(5, 20), 50, 99);
            const pos = Utils.pickRandom(POSITIONS);
            const collegeName = Utils.pickRandom(COLLEGE_TEAMS_DATA).name;

            prospects.push({
                name: Utils.pickRandom(FIRST_NAMES) + ' ' + Utils.pickRandom(LAST_NAMES),
                position: pos,
                ovr: Math.round(ovr),
                potential: Math.round(pot),
                age,
                college: collegeName,
                ppg: Utils.randFloat(8, 25),
                rpg: Utils.randFloat(2, 12),
                apg: Utils.randFloat(1, 8),
                strengths: this.generateRandomStrengths(pos),
                weaknesses: this.generateRandomWeaknesses(pos),
                isUser: false,
            });
        }

        prospects.sort((a, b) => {
            const aScore = a.ovr * 0.4 + a.potential * 0.6;
            const bScore = b.ovr * 0.4 + b.potential * 0.6;
            return bScore - aScore;
        });

        prospects.forEach((p, i) => p.projectedPick = i + 1);
        c.nba.mockDraft = prospects;
    },

    getPlayerStrengths(player) {
        const strengths = [];
        for (const attr of ATTRIBUTES) {
            if (player.attributes[attr] >= 75) strengths.push(ATTRIBUTE_LABELS[attr]);
        }
        return strengths.slice(0, 4);
    },

    getPlayerWeaknesses(player) {
        const weaknesses = [];
        for (const attr of ATTRIBUTES) {
            if (player.attributes[attr] <= 50) weaknesses.push(ATTRIBUTE_LABELS[attr]);
        }
        return weaknesses.slice(0, 4);
    },

    generateRandomStrengths(position) {
        const weights = POSITION_WEIGHTS[position];
        const topAttrs = Object.entries(weights).sort((a, b) => b[1] - a[1]).slice(0, 4);
        return topAttrs.map(([attr]) => ATTRIBUTE_LABELS[attr]);
    },

    generateRandomWeaknesses(position) {
        const weights = POSITION_WEIGHTS[position];
        const bottomAttrs = Object.entries(weights).sort((a, b) => a[1] - b[1]).slice(0, 3);
        return bottomAttrs.map(([attr]) => ATTRIBUTE_LABELS[attr]);
    },

    simNBADraft() {
        const c = this.career;
        if (c.phase !== 'nba_draft') return;

        const userProspect = c.nba.mockDraft.find(p => p.isUser);
        const projPick = userProspect ? userProspect.projectedPick : 30;

        // Add some variance to actual draft position
        const actualPick = Utils.clamp(projPick + Utils.randInt(-5, 5), 1, 60);

        // Pick an NBA team
        const shuffledTeams = Utils.shuffle([...TEAMS_DATA]);
        const draftTeam = shuffledTeams[actualPick % shuffledTeams.length];

        c.nba.draftPick = actualPick;
        c.nba.draftYear = c.currentYear;
        c.nba.teamId = 'team_' + draftTeam.abbr;

        // Create rookie contract
        const salary = CONFIG.ROOKIE_SCALE[Math.min(actualPick - 1, 29)] || CONFIG.MIN_SALARY;
        c.nba.contract = ContractEngine.createContract(salary, 4, false, true);

        c.player.accolades.push({ type: `Draft Pick #${actualPick}`, year: c.currentYear, level: 'NBA' });

        this.addCareerMessage(`Selected #${actualPick} overall by the ${draftTeam.city} ${draftTeam.name}!`);

        c.phase = 'nba';
        c.nba.year = 1;

        // Now we need to initialize the NBA game world
        this.initNBAWorld();
    },

    // ==================== NBA CAREER ====================

    initNBAWorld() {
        const c = this.career;

        // Initialize a minimal game instance for NBA career
        // We use the existing game object but in career context
        game.teams = [];
        game.players = [];

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
                isUser: td.abbr === c.nba.teamId.replace('team_', ''),
                prestige: Utils.randInt(30, 80),
                championships: 0,
            };
            game.teams.push(team);
        }

        game.userTeamId = c.nba.teamId;

        // Generate rosters for all teams
        for (const team of game.teams) {
            game.generateTeamRoster(team);
        }

        // Replace the worst player on user's team with the career player
        const userPlayers = game.getTeamPlayers(c.nba.teamId);
        if (userPlayers.length > 0) {
            const worst = userPlayers[userPlayers.length - 1];
            const idx = game.players.indexOf(worst);
            if (idx !== -1) game.players.splice(idx, 1);
        }

        // Add career player to the game
        const nbaPlayer = PlayerEngine.generatePlayer({
            firstName: c.player.firstName,
            lastName: c.player.lastName,
            position: c.player.position,
            age: c.player.age,
            targetOvr: c.player.ovr,
            potential: c.player.potential,
            teamId: c.nba.teamId,
        });
        // Override with actual career attributes
        nbaPlayer.attributes = { ...c.player.attributes };
        nbaPlayer.ovr = c.player.ovr;
        nbaPlayer.potential = c.player.potential;
        nbaPlayer.id = c.player.id;
        nbaPlayer.contract = c.nba.contract;
        nbaPlayer.draftYear = c.nba.draftYear;
        nbaPlayer.draftPick = c.nba.draftPick;

        game.players.push(nbaPlayer);
        c.nba.nbaPlayerId = nbaPlayer.id;

        game.currentYear = c.currentYear;
        game.gameSettings = c.settings;
        game.phase = 'preseason';
        game.messageLog = [];
        game.awards = [];
        game.tradeHistory = [];
        game.trainingSchedule = TrainingEngine.createDefaultSchedule();
    },

    simNBASeason() {
        const c = this.career;
        if (c.phase !== 'nba') return;

        // Use the existing game engine to sim a season
        game.startSeason();
        game.simToEndOfSeason();

        // Get career player stats
        const nbaPlayer = game.players.find(p => p.id === c.nba.nbaPlayerId || p.id === c.player.id);
        if (nbaPlayer) {
            c.player.seasonStats = { ...nbaPlayer.seasonStats };
            c.player.ovr = nbaPlayer.ovr;
            c.player.attributes = { ...nbaPlayer.attributes };

            const avg = PlayerEngine.getAverages(nbaPlayer.seasonStats);
            const standing = game.standings[c.nba.teamId];
            const record = standing ? `${standing.wins}-${standing.losses}` : '0-0';

            c.nba.seasonLog.push({
                year: c.currentYear,
                team: game.getTeam(c.nba.teamId)?.fullName || 'Unknown',
                record,
                stats: { ...nbaPlayer.seasonStats },
                avgPPG: avg.ppg,
                avgAPG: avg.apg,
                avgRPG: avg.rpg,
            });

            this.addCareerMessage(`NBA Season ${c.nba.year}: ${record}. ${avg.ppg.toFixed(1)} PPG, ${avg.rpg.toFixed(1)} RPG, ${avg.apg.toFixed(1)} APG`);
        }
    },

    simNBAPlayoffs() {
        const c = this.career;
        game.simAllPlayoffs();

        if (game.playoffs && game.playoffs.champion === c.nba.teamId) {
            c.nba.championships++;
            c.player.rings++;
            c.player.accolades.push({ type: 'NBA Champion', year: c.currentYear, level: 'NBA' });
            this.addCareerMessage('NBA CHAMPIONS! You won a ring!');
        }
    },

    advanceNBAYear() {
        const c = this.career;

        // Check awards
        if (game.awards.length > 0) {
            const latestAwards = game.awards[game.awards.length - 1];
            if (latestAwards) {
                const nbaPlayer = game.players.find(p => p.id === c.nba.nbaPlayerId || p.id === c.player.id);
                if (nbaPlayer) {
                    if (latestAwards.mvp && latestAwards.mvp.playerId === nbaPlayer.id) {
                        c.nba.mvps++;
                        c.player.accolades.push({ type: 'MVP', year: c.currentYear, level: 'NBA' });
                        this.addCareerMessage('You won the MVP award!');
                    }
                }
            }
        }

        // Archive stats
        c.player.careerStats.push({
            ...c.player.seasonStats,
            year: c.currentYear,
            level: 'NBA',
            team: game.getTeam(c.nba.teamId)?.fullName || 'Unknown',
        });

        // Advance
        game.startOffseason();
        game.startDraft();
        game.endDraft();
        game.aiHandleFreeAgency();
        game.advanceToNextYear();

        c.currentYear++;
        c.nba.year++;
        c.player.age++;
        c.player.seasonStats = PlayerEngine.emptySeasonStats();

        // Update career player from game state
        const nbaPlayer = game.players.find(p => p.id === c.nba.nbaPlayerId || p.id === c.player.id);
        if (nbaPlayer) {
            c.player.ovr = nbaPlayer.ovr;
            c.player.attributes = { ...nbaPlayer.attributes };
            c.nba.contract = nbaPlayer.contract;
            c.nba.teamId = nbaPlayer.teamId;
        }

        // Check retirement
        if (c.player.age > 40 || (c.player.age > 35 && c.player.ovr < 55)) {
            c.phase = 'retired';
            this.addCareerMessage('You have retired from the NBA. What a career!');
        }

        // Contract expired?
        if (!c.nba.contract) {
            c.phase = 'nba_free_agency';
            this.addCareerMessage('You are a free agent! Choose your next team.');
        }
    },

    signNBAFreeAgent(teamId, salary, years) {
        const c = this.career;
        c.nba.teamId = teamId;
        c.nba.contract = ContractEngine.createContract(salary, years);

        // Update in game
        const nbaPlayer = game.players.find(p => p.id === c.nba.nbaPlayerId || p.id === c.player.id);
        if (nbaPlayer) {
            nbaPlayer.teamId = teamId;
            nbaPlayer.contract = c.nba.contract;
        }

        game.userTeamId = teamId;
        for (const team of game.teams) {
            team.isUser = team.id === teamId;
        }

        const team = game.getTeam(teamId);
        this.addCareerMessage(`Signed with the ${team ? team.fullName : 'Unknown'}!`);
        c.phase = 'nba';
    },

    // ==================== SHARED HELPERS ====================

    simCareerGame(player, teamQuality, level, oppQuality) {
        const stats = {
            minutes: 0, points: 0, assists: 0, rebounds: 0,
            steals: 0, blocks: 0, turnovers: 0,
            fgMade: 0, fgAttempted: 0,
            threeMade: 0, threeAttempted: 0,
            ftMade: 0, ftAttempted: 0,
            teamWon: false,
        };

        oppQuality = oppQuality || (level === 'hs' ? Utils.randInt(40, 75) : Utils.randInt(50, 85));

        // Minutes based on player quality relative to team
        const minuteBase = level === 'hs' ? 28 : level === 'college' ? 32 : 34;
        stats.minutes = Utils.clamp(minuteBase + (player.ovr - teamQuality) * 0.3 + Utils.randInt(-4, 4), 15, 40);

        const minutesFactor = stats.minutes / 36;

        // Possessions
        const possessions = Math.round(70 * minutesFactor);
        const defRating = oppQuality * 0.01;

        for (let i = 0; i < possessions; i++) {
            // Usage rate - higher OVR = more touches
            const usageChance = 0.20 + (player.ovr - 50) * 0.003;
            if (Math.random() > usageChance) continue;

            // Turnover
            const toChance = (100 - player.attributes.ballHandling) * 0.002;
            if (Math.random() < toChance) {
                stats.turnovers++;
                continue;
            }

            // Shot type
            const r = Math.random();
            if (r < 0.35) {
                // Three pointer
                stats.threeAttempted++;
                stats.fgAttempted++;
                const pct = 0.20 + (player.attributes.threePoint / 99) * 0.22 - defRating * 0.05;
                if (Math.random() < pct) {
                    stats.threeMade++;
                    stats.fgMade++;
                    stats.points += 3;
                }
            } else if (r < 0.60) {
                // Mid-range
                stats.fgAttempted++;
                const pct = 0.30 + (player.attributes.midRange / 99) * 0.22 - defRating * 0.04;
                if (Math.random() < pct) {
                    stats.fgMade++;
                    stats.points += 2;
                } else if (Math.random() < 0.15) {
                    // Free throws
                    const fts = 2;
                    for (let f = 0; f < fts; f++) {
                        stats.ftAttempted++;
                        if (Math.random() < 0.5 + player.attributes.freeThrow / 200) {
                            stats.ftMade++;
                            stats.points++;
                        }
                    }
                }
            } else {
                // Inside
                stats.fgAttempted++;
                const pct = 0.38 + (player.attributes.insideScoring / 99) * 0.27 - defRating * 0.05;
                if (Math.random() < pct) {
                    stats.fgMade++;
                    stats.points += 2;
                    // And-one
                    if (Math.random() < 0.1) {
                        stats.ftAttempted++;
                        if (Math.random() < 0.5 + player.attributes.freeThrow / 200) {
                            stats.ftMade++;
                            stats.points++;
                        }
                    }
                } else if (Math.random() < 0.18) {
                    const fts = 2;
                    for (let f = 0; f < fts; f++) {
                        stats.ftAttempted++;
                        if (Math.random() < 0.5 + player.attributes.freeThrow / 200) {
                            stats.ftMade++;
                            stats.points++;
                        }
                    }
                }
            }

            // Assist chance
            if (Math.random() < player.attributes.passing * 0.003) stats.assists++;
        }

        // Rebounds
        const rebChance = (player.attributes.rebounding + player.attributes.strength * 0.3) / 150;
        for (let i = 0; i < Math.round(40 * minutesFactor); i++) {
            if (Math.random() < rebChance) stats.rebounds++;
        }

        // Steals/blocks
        for (let i = 0; i < Math.round(30 * minutesFactor); i++) {
            if (Math.random() < player.attributes.steal * 0.001) stats.steals++;
            if (Math.random() < player.attributes.block * 0.0008) stats.blocks++;
        }

        // Did the team win?
        const teamStrength = teamQuality + player.ovr * 0.3;
        const oppStrength = oppQuality + Utils.randInt(-5, 5);
        const simDiff = this.career.settings ? DIFFICULTY_SETTINGS.sim[this.career.settings.simDifficulty] || DIFFICULTY_SETTINGS.sim.normal : DIFFICULTY_SETTINGS.sim.normal;
        const winChance = 0.5 + (teamStrength - oppStrength) * 0.008 * simDiff.userBoost;
        stats.teamWon = Math.random() < Utils.clamp(winChance, 0.1, 0.95);

        return stats;
    },

    developCareerPlayer(player, level) {
        const growthMult = level === 'hs' ? 2.5 : level === 'college' ? 1.8 : 1.0;
        const devSpeed = this.career.settings ? this.career.settings.developerSpeed : 'normal';
        const settingsMult = (DIFFICULTY_SETTINGS.development[devSpeed] || DIFFICULTY_SETTINGS.development.normal).growthMultiplier;

        for (const attr of ATTRIBUTES) {
            let change = Utils.randFloat(0.5, 2.0) * growthMult * settingsMult;
            // Physical attrs grow more in HS
            if (level === 'hs' && ['speed', 'athleticism', 'strength', 'stamina'].includes(attr)) {
                change *= 1.5;
            }
            // Skill attrs grow more in college
            if (level === 'college' && ['threePoint', 'midRange', 'passing', 'ballHandling'].includes(attr)) {
                change *= 1.3;
            }
            // Cap growth near potential
            if (player.ovr >= player.potential - 3) {
                change *= 0.3;
            }

            player.attributes[attr] = Utils.clamp(
                Math.round(player.attributes[attr] + change),
                25, 99
            );
        }

        player.ovr = PlayerEngine.calculateOvr(player.attributes, player.position);
        // Slight potential adjustment
        player.potential = Math.max(player.ovr, player.potential);
    },

    addCareerMessage(text) {
        if (!this.career) return;
        this.career.messageLog.unshift({
            text,
            timestamp: Date.now(),
            year: this.career.currentYear,
        });
        if (this.career.messageLog.length > 200) {
            this.career.messageLog = this.career.messageLog.slice(0, 200);
        }
    },

    // Save/Load
    getCareerState() {
        return this.career;
    },

    restoreCareerState(state) {
        this.career = state;
    },
};
