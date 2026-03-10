// ============================================================
// SEASON.JS - Season schedule, standings, playoffs
// ============================================================

const SeasonEngine = {
    // Generate a full season schedule
    generateSchedule(teams) {
        const schedule = [];
        const teamIds = teams.map(t => t.id);
        const totalGames = CONFIG.SEASON_GAMES;

        // Each team plays ~82 games
        // Within conference: play each of 14 teams ~4-5 times = ~60 games
        // Cross conference: play each of 15 teams ~1-2 times = ~22 games

        const eastTeams = teams.filter(t => t.conference === 'East').map(t => t.id);
        const westTeams = teams.filter(t => t.conference === 'West').map(t => t.id);

        const matchups = [];

        // Conference games (4 times each)
        for (const conf of [eastTeams, westTeams]) {
            for (let i = 0; i < conf.length; i++) {
                for (let j = i + 1; j < conf.length; j++) {
                    // 4 games: 2 home, 2 away
                    matchups.push({ home: conf[i], away: conf[j] });
                    matchups.push({ home: conf[j], away: conf[i] });
                    matchups.push({ home: conf[i], away: conf[j] });
                    matchups.push({ home: conf[j], away: conf[i] });
                }
            }
        }

        // Cross-conference games (2 times each)
        for (const east of eastTeams) {
            for (const west of westTeams) {
                matchups.push({ home: east, away: west });
                matchups.push({ home: west, away: east });
            }
        }

        // Shuffle and assign to game days
        const shuffled = Utils.shuffle(matchups);

        // Distribute across ~180 game days (roughly Oct-Apr)
        const gamesPerDay = Math.ceil(shuffled.length / 180);
        let gameDay = 1;

        for (let i = 0; i < shuffled.length; i++) {
            if (i > 0 && i % gamesPerDay === 0) gameDay++;
            schedule.push({
                id: Utils.generateId(),
                day: gameDay,
                homeTeamId: shuffled[i].home,
                awayTeamId: shuffled[i].away,
                played: false,
                result: null,
            });
        }

        return schedule;
    },

    // Get standings from results
    calculateStandings(teams, schedule) {
        const standings = {};

        for (const team of teams) {
            standings[team.id] = {
                teamId: team.id,
                wins: 0,
                losses: 0,
                confWins: 0,
                confLosses: 0,
                pointsFor: 0,
                pointsAgainst: 0,
                streak: 0,
                last10: [],
                conference: team.conference,
            };
        }

        const playedGames = schedule.filter(g => g.played && g.result);
        for (const game of playedGames) {
            const r = game.result;
            const homeStanding = standings[game.homeTeamId];
            const awayStanding = standings[game.awayTeamId];

            if (!homeStanding || !awayStanding) continue;

            const homeTeam = teams.find(t => t.id === game.homeTeamId);
            const awayTeam = teams.find(t => t.id === game.awayTeamId);

            if (r.homeScore > r.awayScore) {
                homeStanding.wins++;
                awayStanding.losses++;
                homeStanding.last10.push('W');
                awayStanding.last10.push('L');
                if (homeTeam && awayTeam && homeTeam.conference === awayTeam.conference) {
                    homeStanding.confWins++;
                    awayStanding.confLosses++;
                }
            } else {
                awayStanding.wins++;
                homeStanding.losses++;
                awayStanding.last10.push('W');
                homeStanding.last10.push('L');
                if (homeTeam && awayTeam && homeTeam.conference === awayTeam.conference) {
                    awayStanding.confWins++;
                    homeStanding.confLosses++;
                }
            }

            homeStanding.pointsFor += r.homeScore;
            homeStanding.pointsAgainst += r.awayScore;
            awayStanding.pointsFor += r.awayScore;
            awayStanding.pointsAgainst += r.homeScore;
        }

        // Trim last10 to 10
        for (const id in standings) {
            const s = standings[id];
            s.last10 = s.last10.slice(-10);
            // Calculate streak
            let streak = 0;
            const recent = s.last10.slice().reverse();
            if (recent.length > 0) {
                const type = recent[0];
                for (const r of recent) {
                    if (r === type) streak++;
                    else break;
                }
                s.streak = type === 'W' ? streak : -streak;
            }
        }

        return standings;
    },

    // Sort standings for display
    getSortedStandings(standings, conference) {
        return Object.values(standings)
            .filter(s => s.conference === conference)
            .sort((a, b) => {
                const aPct = a.wins / (a.wins + a.losses || 1);
                const bPct = b.wins / (b.wins + b.losses || 1);
                if (bPct !== aPct) return bPct - aPct;
                return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
            });
    },

    // Get current game day
    getCurrentDay(schedule) {
        const unplayed = schedule.filter(g => !g.played);
        if (unplayed.length === 0) return -1;
        return Math.min(...unplayed.map(g => g.day));
    },

    // Get games for a specific day
    getGamesForDay(schedule, day) {
        return schedule.filter(g => g.day === day);
    },

    // Simulate a day of games
    simulateDay(schedule, day, teams, allPlayers) {
        const games = this.getGamesForDay(schedule, day);
        const results = [];

        for (const game of games) {
            if (game.played) continue;

            const homeTeam = teams.find(t => t.id === game.homeTeamId);
            const awayTeam = teams.find(t => t.id === game.awayTeamId);

            if (!homeTeam || !awayTeam) continue;

            const result = SimEngine.simulateGame(homeTeam, awayTeam, allPlayers);
            game.played = true;
            game.result = result;
            results.push({ game, result });
        }

        return results;
    },

    // Generate playoff bracket
    generatePlayoffs(standings, teams) {
        const eastStandings = this.getSortedStandings(standings, 'East').slice(0, CONFIG.PLAYOFF_TEAMS);
        const westStandings = this.getSortedStandings(standings, 'West').slice(0, CONFIG.PLAYOFF_TEAMS);

        const bracket = {
            east: this.createConferenceBracket(eastStandings),
            west: this.createConferenceBracket(westStandings),
            finals: null,
            champion: null,
        };

        return bracket;
    },

    createConferenceBracket(seeds) {
        // 1v8, 2v7, 3v6, 4v5
        return {
            round1: [
                this.createSeries(seeds[0], seeds[7], 1),
                this.createSeries(seeds[3], seeds[4], 2),
                this.createSeries(seeds[2], seeds[5], 3),
                this.createSeries(seeds[1], seeds[6], 4),
            ],
            round2: [],
            confFinals: null,
        };
    },

    createSeries(higher, lower, seriesNum) {
        return {
            id: Utils.generateId(),
            higherSeed: higher.teamId,
            lowerSeed: lower.teamId,
            higherWins: 0,
            lowerWins: 0,
            games: [],
            winner: null,
            seriesNum,
        };
    },

    // Simulate one playoff game
    simulatePlayoffGame(series, teams, allPlayers) {
        const homeTeamId = (series.games.length % 2 < 2 || series.games.length === 4 || series.games.length === 6)
            ? series.higherSeed : series.lowerSeed;
        const awayTeamId = homeTeamId === series.higherSeed ? series.lowerSeed : series.higherSeed;

        // Home court: games 1,2,5,7 for higher seed
        const gameNum = series.games.length;
        const isHigherHome = [0, 1, 4, 6].includes(gameNum);
        const actualHome = isHigherHome ? series.higherSeed : series.lowerSeed;
        const actualAway = isHigherHome ? series.lowerSeed : series.higherSeed;

        const homeTeam = teams.find(t => t.id === actualHome);
        const awayTeam = teams.find(t => t.id === actualAway);

        const result = SimEngine.simulateGame(homeTeam, awayTeam, allPlayers);
        series.games.push(result);

        if ((result.homeScore > result.awayScore && actualHome === series.higherSeed) ||
            (result.awayScore > result.homeScore && actualAway === series.higherSeed)) {
            series.higherWins++;
        } else {
            series.lowerWins++;
        }

        if (series.higherWins >= CONFIG.PLAYOFF_SERIES_WINS) {
            series.winner = series.higherSeed;
        } else if (series.lowerWins >= CONFIG.PLAYOFF_SERIES_WINS) {
            series.winner = series.lowerSeed;
        }

        return result;
    },

    // Advance playoff bracket
    advancePlayoffs(bracket, teams, allPlayers) {
        for (const conf of ['east', 'west']) {
            const confBracket = bracket[conf];

            // Round 1
            for (const series of confBracket.round1) {
                if (!series.winner) {
                    this.simulatePlayoffGame(series, teams, allPlayers);
                    return { series, conference: conf, round: 1 };
                }
            }

            // Check if round 2 needs setup
            if (confBracket.round2.length === 0 && confBracket.round1.every(s => s.winner)) {
                confBracket.round2 = [
                    this.createSeries(
                        { teamId: confBracket.round1[0].winner },
                        { teamId: confBracket.round1[1].winner },
                        1
                    ),
                    this.createSeries(
                        { teamId: confBracket.round1[2].winner },
                        { teamId: confBracket.round1[3].winner },
                        2
                    ),
                ];
            }

            // Round 2
            for (const series of confBracket.round2) {
                if (!series.winner) {
                    this.simulatePlayoffGame(series, teams, allPlayers);
                    return { series, conference: conf, round: 2 };
                }
            }

            // Conference Finals
            if (!confBracket.confFinals && confBracket.round2.length === 2 && confBracket.round2.every(s => s.winner)) {
                confBracket.confFinals = this.createSeries(
                    { teamId: confBracket.round2[0].winner },
                    { teamId: confBracket.round2[1].winner },
                    1
                );
            }

            if (confBracket.confFinals && !confBracket.confFinals.winner) {
                this.simulatePlayoffGame(confBracket.confFinals, teams, allPlayers);
                return { series: confBracket.confFinals, conference: conf, round: 3 };
            }
        }

        // Finals
        if (!bracket.finals && bracket.east.confFinals?.winner && bracket.west.confFinals?.winner) {
            bracket.finals = this.createSeries(
                { teamId: bracket.east.confFinals.winner },
                { teamId: bracket.west.confFinals.winner },
                1
            );
        }

        if (bracket.finals && !bracket.finals.winner) {
            this.simulatePlayoffGame(bracket.finals, teams, allPlayers);
            if (bracket.finals.winner) {
                bracket.champion = bracket.finals.winner;
            }
            return { series: bracket.finals, conference: 'finals', round: 4 };
        }

        return null; // Playoffs complete
    },

    isPlayoffsComplete(bracket) {
        return bracket.champion !== null;
    },
};
