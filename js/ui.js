// ============================================================
// UI.JS - All UI rendering and event handling
// ============================================================

const UI = {
    currentTab: 'dashboard',
    selectedPlayer: null,
    selectedTradeTeam: null,
    tradeMySelected: [],
    tradeTheirSelected: [],
    modalStack: [],

    init() {
        this.bindNavigation();
        this.showTab('dashboard');
    },

    bindNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                if (tab) this.showTab(tab);
            });
        });
    },

    showTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
        if (navItem) navItem.classList.add('active');

        const content = document.getElementById('main-content');
        switch (tab) {
            case 'dashboard': content.innerHTML = this.renderDashboard(); break;
            case 'roster': content.innerHTML = this.renderRoster(); break;
            case 'schedule': content.innerHTML = this.renderSchedule(); break;
            case 'standings': content.innerHTML = this.renderStandings(); break;
            case 'simulation': content.innerHTML = this.renderSimulation(); break;
            case 'draft': content.innerHTML = this.renderDraft(); break;
            case 'freeagency': content.innerHTML = this.renderFreeAgency(); break;
            case 'trade': content.innerHTML = this.renderTrade(); break;
            case 'training': content.innerHTML = this.renderTraining(); break;
            case 'finances': content.innerHTML = this.renderCapManagement(); break;
            case 'leaders': content.innerHTML = this.renderLeaders(); break;
            case 'settings': content.innerHTML = this.renderSettings(); break;
        }
        this.bindTabEvents(tab);
    },

    refresh() {
        this.showTab(this.currentTab);
    },

    // ==================== DASHBOARD ====================
    renderDashboard() {
        const team = game.getUserTeam();
        if (!team) return '<div class="empty-state">No team selected. Start a new game.</div>';
        const players = game.getUserPlayers();
        const standing = game.standings[game.userTeamId];
        const avgOvr = players.length > 0
            ? Math.round(players.reduce((s, p) => s + p.ovr, 0) / players.length)
            : 0;

        const phaseLabel = {
            preseason: 'Pre-Season',
            season: 'Regular Season',
            playoffs: 'Playoffs',
            offseason: 'Off-Season',
            draft: 'Draft',
            freeAgency: 'Free Agency',
        }[game.phase] || game.phase;

        let record = '0-0';
        if (standing) record = `${standing.wins}-${standing.losses}`;

        const salary = ContractEngine.getTeamSalary(players);
        const capSpace = ContractEngine.getCapSpace(players);

        return `
        <div class="dashboard">
            <div class="dashboard-header">
                <div class="team-identity">
                    <h1 style="color: ${team.color}">${team.fullName}</h1>
                    <div class="team-meta">${this.currentYear()} Season &bull; ${phaseLabel}</div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Record</div>
                    <div class="stat-value">${record}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Roster</div>
                    <div class="stat-value">${players.length} Players</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Team OVR</div>
                    <div class="stat-value">${avgOvr}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Payroll</div>
                    <div class="stat-value">${Utils.formatMoney(salary)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Cap Space</div>
                    <div class="stat-value" style="color: ${capSpace > 0 ? '#4ade80' : '#f87171'}">${Utils.formatMoney(capSpace)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Salary Cap</div>
                    <div class="stat-value">${Utils.formatMoney(CONFIG.SALARY_CAP)}</div>
                </div>
            </div>

            <div class="dashboard-columns">
                <div class="dashboard-col">
                    <div class="card">
                        <h3>Quick Actions</h3>
                        <div class="quick-actions">
                            ${game.phase === 'preseason' ? '<button class="btn btn-primary" onclick="UI.actionStartSeason()">Start Season</button>' : ''}
                            ${game.phase === 'season' ? '<button class="btn btn-primary" onclick="UI.actionSimDay()">Sim Next Day</button>' : ''}
                            ${game.phase === 'season' ? '<button class="btn btn-secondary" onclick="UI.actionSimWeek()">Sim Week</button>' : ''}
                            ${game.phase === 'season' ? '<button class="btn btn-warning" onclick="UI.actionSimSeason()">Sim to Playoffs</button>' : ''}
                            ${game.phase === 'playoffs' ? '<button class="btn btn-primary" onclick="UI.actionSimPlayoffGame()">Sim Playoff Game</button>' : ''}
                            ${game.phase === 'playoffs' ? '<button class="btn btn-warning" onclick="UI.actionSimAllPlayoffs()">Sim All Playoffs</button>' : ''}
                            ${game.phase === 'offseason' ? '<button class="btn btn-primary" onclick="UI.actionStartDraft()">Go to Draft</button>' : ''}
                            ${game.phase === 'draft' ? '<button class="btn btn-primary" onclick="UI.showTab(\'draft\')">Continue Draft</button>' : ''}
                            ${game.phase === 'freeAgency' ? '<button class="btn btn-primary" onclick="UI.showTab(\'freeagency\')">Free Agency</button>' : ''}
                            ${game.phase === 'freeAgency' ? '<button class="btn btn-warning" onclick="UI.actionAdvanceYear()">Advance to Next Year</button>' : ''}
                            <button class="btn btn-secondary" onclick="game.manualSave(); UI.showToast('Game saved!')">Save Game</button>
                        </div>
                    </div>

                    <div class="card">
                        <h3>Top Players</h3>
                        <table class="data-table compact">
                            <thead><tr><th>Name</th><th>Pos</th><th>OVR</th><th>Age</th></tr></thead>
                            <tbody>
                                ${players.slice(0, 8).map(p => `
                                    <tr class="clickable" onclick="UI.showPlayerModal('${p.id}')">
                                        <td>${PlayerEngine.getFullName(p)}</td>
                                        <td><span class="pos-badge pos-${p.position}">${p.position}</span></td>
                                        <td><span class="ovr-badge ${Utils.getOvrClass(p.ovr)}">${p.ovr}</span></td>
                                        <td>${p.age}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="dashboard-col">
                    <div class="card">
                        <h3>News & Updates</h3>
                        <div class="message-log">
                            ${game.messageLog.slice(0, 15).map(m => `
                                <div class="message-item">
                                    <span class="message-text">${m.text}</span>
                                </div>
                            `).join('')}
                            ${game.messageLog.length === 0 ? '<div class="empty-state">No messages yet.</div>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    currentYear() {
        return `${game.currentYear}-${(game.currentYear + 1).toString().slice(2)}`;
    },

    // ==================== ROSTER ====================
    renderRoster() {
        const players = game.getUserPlayers();
        const team = game.getUserTeam();
        const salary = ContractEngine.getTeamSalary(players);

        return `
        <div class="page-header">
            <h2>${team.fullName} Roster</h2>
            <div class="header-info">
                <span>Players: ${players.length}/${CONFIG.ROSTER_MAX}</span>
                <span>Payroll: ${Utils.formatMoney(salary)} / ${Utils.formatMoney(CONFIG.SALARY_CAP)}</span>
            </div>
        </div>
        <div class="card">
            <div class="table-controls">
                <select id="roster-team-select" onchange="UI.renderRosterForTeam(this.value)">
                    <option value="${game.userTeamId}">My Team</option>
                    ${game.teams.filter(t => t.id !== game.userTeamId).map(t =>
                        `<option value="${t.id}">${t.fullName}</option>`
                    ).join('')}
                </select>
            </div>
            <div id="roster-table-container">
                ${this.renderRosterTable(players, true)}
            </div>
        </div>`;
    },

    renderRosterTable(players, isUserTeam) {
        return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th><th>Pos</th><th>Age</th><th>OVR</th><th>POT</th>
                    <th>PPG</th><th>APG</th><th>RPG</th><th>FG%</th><th>3P%</th>
                    <th>Contract</th>
                    ${isUserTeam ? '<th>Actions</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${players.map(p => {
                    const avg = PlayerEngine.getAverages(p.seasonStats);
                    return `
                    <tr class="clickable" onclick="UI.showPlayerModal('${p.id}')">
                        <td class="player-name">${PlayerEngine.getFullName(p)}</td>
                        <td><span class="pos-badge pos-${p.position}">${p.position}</span></td>
                        <td>${p.age}</td>
                        <td><span class="ovr-badge ${Utils.getOvrClass(p.ovr)}">${p.ovr}</span></td>
                        <td><span class="pot-badge">${p.potential}</span></td>
                        <td>${Utils.formatStat(avg.ppg)}</td>
                        <td>${Utils.formatStat(avg.apg)}</td>
                        <td>${Utils.formatStat(avg.rpg)}</td>
                        <td>${Utils.formatPct(avg.fgPct)}</td>
                        <td>${Utils.formatPct(avg.threePct)}</td>
                        <td>${p.contract ? Utils.formatMoney(p.contract.salary) + '/' + (p.contract.years - p.contract.yearsSigned) + 'yr' : 'FA'}</td>
                        ${isUserTeam ? `<td><button class="btn btn-small btn-danger" onclick="event.stopPropagation(); UI.releasePlayerConfirm('${p.id}')">Release</button></td>` : ''}
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
    },

    renderRosterForTeam(teamId) {
        const players = game.getTeamPlayers(teamId);
        const isUser = teamId === game.userTeamId;
        document.getElementById('roster-table-container').innerHTML = this.renderRosterTable(players, isUser);
    },

    // ==================== SCHEDULE ====================
    renderSchedule() {
        const currentDay = SeasonEngine.getCurrentDay(game.schedule);
        const recentGames = game.schedule.filter(g => g.played).slice(-20).reverse();
        const upcomingGames = game.schedule.filter(g => !g.played).slice(0, 20);

        // Filter for user team games
        const userGames = game.schedule.filter(g =>
            g.homeTeamId === game.userTeamId || g.awayTeamId === game.userTeamId
        );
        const userPlayed = userGames.filter(g => g.played).slice(-10).reverse();
        const userUpcoming = userGames.filter(g => !g.played).slice(0, 10);

        return `
        <div class="page-header">
            <h2>Schedule</h2>
            <div class="header-info">Day ${currentDay > 0 ? currentDay : 'Season Over'}</div>
        </div>
        <div class="tabs-row">
            <button class="tab-btn active" onclick="UI.switchScheduleTab('my')">My Games</button>
            <button class="tab-btn" onclick="UI.switchScheduleTab('all')">All Games</button>
        </div>
        <div id="schedule-content">
            ${this.renderMySchedule(userPlayed, userUpcoming)}
        </div>`;
    },

    renderMySchedule(played, upcoming) {
        return `
        <div class="schedule-section">
            <h3>Upcoming</h3>
            ${upcoming.length === 0 ? '<div class="empty-state">No upcoming games</div>' : ''}
            <div class="game-list">
                ${upcoming.map(g => this.renderGameCard(g, false)).join('')}
            </div>
        </div>
        <div class="schedule-section">
            <h3>Recent Results</h3>
            ${played.length === 0 ? '<div class="empty-state">No games played yet</div>' : ''}
            <div class="game-list">
                ${played.map(g => this.renderGameCard(g, true)).join('')}
            </div>
        </div>`;
    },

    renderGameCard(g, showResult) {
        const home = game.getTeam(g.homeTeamId);
        const away = game.getTeam(g.awayTeamId);
        if (!home || !away) return '';

        const isHome = g.homeTeamId === game.userTeamId;
        const result = g.result;
        let resultText = '';
        let resultClass = '';

        if (showResult && result) {
            const userScore = isHome ? result.homeScore : result.awayScore;
            const oppScore = isHome ? result.awayScore : result.homeScore;
            const won = userScore > oppScore;
            resultText = `${result.homeScore} - ${result.awayScore}`;
            resultClass = (g.homeTeamId === game.userTeamId || g.awayTeamId === game.userTeamId)
                ? (won ? 'result-win' : 'result-loss') : '';
        }

        return `
        <div class="game-card ${resultClass}">
            <div class="game-teams">
                <span class="game-team ${g.homeTeamId === game.userTeamId ? 'user-team' : ''}" style="border-color: ${home.color}">
                    ${home.abbr}
                </span>
                <span class="game-vs">${showResult ? resultText : 'vs'}</span>
                <span class="game-team ${g.awayTeamId === game.userTeamId ? 'user-team' : ''}" style="border-color: ${away.color}">
                    ${away.abbr}
                </span>
            </div>
            <div class="game-day">Day ${g.day}</div>
        </div>`;
    },

    switchScheduleTab(tab) {
        document.querySelectorAll('.tabs-row .tab-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        const content = document.getElementById('schedule-content');
        if (tab === 'my') {
            const userGames = game.schedule.filter(g =>
                g.homeTeamId === game.userTeamId || g.awayTeamId === game.userTeamId
            );
            content.innerHTML = this.renderMySchedule(
                userGames.filter(g => g.played).slice(-10).reverse(),
                userGames.filter(g => !g.played).slice(0, 10)
            );
        } else {
            const recent = game.schedule.filter(g => g.played).slice(-30).reverse();
            content.innerHTML = `
                <div class="game-list">
                    ${recent.map(g => this.renderGameCard(g, true)).join('')}
                    ${recent.length === 0 ? '<div class="empty-state">No games played yet</div>' : ''}
                </div>`;
        }
    },

    // ==================== STANDINGS ====================
    renderStandings() {
        const eastStandings = SeasonEngine.getSortedStandings(game.standings, 'East');
        const westStandings = SeasonEngine.getSortedStandings(game.standings, 'West');

        return `
        <div class="page-header"><h2>Standings</h2></div>
        <div class="standings-container">
            <div class="card">
                <h3>Eastern Conference</h3>
                ${this.renderStandingsTable(eastStandings)}
            </div>
            <div class="card">
                <h3>Western Conference</h3>
                ${this.renderStandingsTable(westStandings)}
            </div>
        </div>`;
    },

    renderStandingsTable(standings) {
        if (standings.length === 0) return '<div class="empty-state">Season has not started yet.</div>';

        return `
        <table class="data-table">
            <thead>
                <tr><th>#</th><th>Team</th><th>W</th><th>L</th><th>PCT</th><th>PF</th><th>PA</th><th>Diff</th><th>Strk</th><th>L10</th></tr>
            </thead>
            <tbody>
                ${standings.map((s, i) => {
                    const team = game.getTeam(s.teamId);
                    if (!team) return '';
                    const pct = (s.wins + s.losses > 0) ? (s.wins / (s.wins + s.losses)).toFixed(3) : '.000';
                    const diff = s.pointsFor - s.pointsAgainst;
                    const streakStr = s.streak > 0 ? `W${s.streak}` : s.streak < 0 ? `L${Math.abs(s.streak)}` : '-';
                    const l10w = s.last10.filter(r => r === 'W').length;
                    const l10l = s.last10.filter(r => r === 'L').length;
                    const isUser = s.teamId === game.userTeamId;
                    const playoffLine = i === 7 ? 'playoff-line' : '';

                    return `
                    <tr class="${isUser ? 'user-row' : ''} ${playoffLine}">
                        <td>${i + 1}</td>
                        <td style="${isUser ? 'font-weight:700;' : ''}">${team.abbr} ${team.name}</td>
                        <td>${s.wins}</td>
                        <td>${s.losses}</td>
                        <td>${pct}</td>
                        <td>${(s.pointsFor / (s.wins + s.losses || 1)).toFixed(1)}</td>
                        <td>${(s.pointsAgainst / (s.wins + s.losses || 1)).toFixed(1)}</td>
                        <td class="${diff >= 0 ? 'text-green' : 'text-red'}">${diff >= 0 ? '+' : ''}${diff}</td>
                        <td class="${s.streak > 0 ? 'text-green' : 'text-red'}">${streakStr}</td>
                        <td>${l10w}-${l10l}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
    },

    // ==================== SIMULATION ====================
    renderSimulation() {
        if (game.phase === 'playoffs' && game.playoffs) {
            return this.renderPlayoffs();
        }

        return `
        <div class="page-header"><h2>Game Simulation</h2></div>
        <div class="sim-controls card">
            <h3>Season Progress</h3>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${this.getSeasonProgress()}%"></div>
                <span class="progress-text">${this.getSeasonProgress().toFixed(0)}%</span>
            </div>
            <div class="sim-buttons">
                ${game.phase === 'preseason' ? '<button class="btn btn-primary btn-lg" onclick="UI.actionStartSeason()">Start Season</button>' : ''}
                ${game.phase === 'season' ? `
                    <button class="btn btn-primary" onclick="UI.actionSimDay()">Sim 1 Day</button>
                    <button class="btn btn-secondary" onclick="UI.actionSimWeek()">Sim 1 Week</button>
                    <button class="btn btn-secondary" onclick="UI.actionSimMonth()">Sim 1 Month</button>
                    <button class="btn btn-warning" onclick="UI.actionSimSeason()">Sim to End</button>
                ` : ''}
            </div>
        </div>
        <div id="sim-results" class="card">
            <h3>Recent Results</h3>
            ${this.renderRecentResults()}
        </div>`;
    },

    renderRecentResults() {
        const userGames = game.schedule
            .filter(g => g.played && (g.homeTeamId === game.userTeamId || g.awayTeamId === game.userTeamId))
            .slice(-5).reverse();

        if (userGames.length === 0) return '<div class="empty-state">No games played yet.</div>';

        return userGames.map(g => {
            const r = g.result;
            if (!r) return '';
            const home = game.getTeam(g.homeTeamId);
            const away = game.getTeam(g.awayTeamId);
            const isHome = g.homeTeamId === game.userTeamId;
            const won = isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;

            return `
            <div class="result-card ${won ? 'result-win' : 'result-loss'}">
                <div class="result-badge">${won ? 'W' : 'L'}</div>
                <div class="result-info">
                    <div class="result-teams">${home.abbr} ${r.homeScore} - ${r.awayScore} ${away.abbr}</div>
                    <div class="result-quarters">Q: ${r.quarters.map(q => `${q.home}-${q.away}`).join(' | ')}${r.overtime.length > 0 ? ' | OT: ' + r.overtime.map(q => `${q.home}-${q.away}`).join(' | ') : ''}</div>
                </div>
            </div>`;
        }).join('');
    },

    renderPlayoffs() {
        const p = game.playoffs;
        if (!p) return '<div class="empty-state">No playoff data.</div>';

        return `
        <div class="page-header"><h2>Playoffs</h2></div>
        <div class="playoff-controls card">
            <button class="btn btn-primary" onclick="UI.actionSimPlayoffGame()">Sim Next Game</button>
            <button class="btn btn-warning" onclick="UI.actionSimAllPlayoffs()">Sim All Playoffs</button>
        </div>
        ${p.champion ? `<div class="champion-banner">Champion: ${game.getTeam(p.champion)?.fullName || 'Unknown'}</div>` : ''}
        <div class="playoff-bracket">
            <div class="bracket-conference">
                <h3>Eastern Conference</h3>
                ${this.renderConferenceBracket(p.east)}
            </div>
            <div class="bracket-finals">
                <h3>Finals</h3>
                ${p.finals ? this.renderSeries(p.finals) : '<div class="series-card empty">TBD</div>'}
            </div>
            <div class="bracket-conference">
                <h3>Western Conference</h3>
                ${this.renderConferenceBracket(p.west)}
            </div>
        </div>`;
    },

    renderConferenceBracket(conf) {
        if (!conf) return '';
        return `
        <div class="bracket-round">
            <h4>Round 1</h4>
            ${conf.round1.map(s => this.renderSeries(s)).join('')}
        </div>
        <div class="bracket-round">
            <h4>Semis</h4>
            ${conf.round2.length > 0 ? conf.round2.map(s => this.renderSeries(s)).join('') : '<div class="series-card empty">TBD</div>'}
        </div>
        <div class="bracket-round">
            <h4>Conf Finals</h4>
            ${conf.confFinals ? this.renderSeries(conf.confFinals) : '<div class="series-card empty">TBD</div>'}
        </div>`;
    },

    renderSeries(series) {
        const higher = game.getTeam(series.higherSeed);
        const lower = game.getTeam(series.lowerSeed);
        const isUserSeries = series.higherSeed === game.userTeamId || series.lowerSeed === game.userTeamId;

        return `
        <div class="series-card ${isUserSeries ? 'user-series' : ''} ${series.winner ? 'completed' : ''}">
            <div class="series-team ${series.winner === series.higherSeed ? 'winner' : ''}">
                <span style="color: ${higher?.color || '#fff'}">${higher?.abbr || '?'}</span>
                <span class="series-wins">${series.higherWins}</span>
            </div>
            <div class="series-team ${series.winner === series.lowerSeed ? 'winner' : ''}">
                <span style="color: ${lower?.color || '#fff'}">${lower?.abbr || '?'}</span>
                <span class="series-wins">${series.lowerWins}</span>
            </div>
        </div>`;
    },

    getSeasonProgress() {
        if (game.schedule.length === 0) return 0;
        const played = game.schedule.filter(g => g.played).length;
        return (played / game.schedule.length) * 100;
    },

    // ==================== DRAFT ====================
    renderDraft() {
        if (game.phase !== 'draft') {
            return `
            <div class="page-header"><h2>Draft</h2></div>
            <div class="card">
                <div class="empty-state">
                    ${game.phase === 'offseason' ? '<button class="btn btn-primary btn-lg" onclick="UI.actionStartDraft()">Start Draft</button>' : 'The draft is not available at this time.'}
                </div>
            </div>`;
        }

        const currentPick = game.draftOrder[game.draftCurrentPick];
        const isUserPick = currentPick && currentPick.teamId === game.userTeamId;

        return `
        <div class="page-header">
            <h2>${game.currentYear} Draft</h2>
            <div class="header-info">Pick ${game.draftCurrentPick + 1} of ${game.draftOrder.length}</div>
        </div>

        ${currentPick ? `
        <div class="card draft-current">
            <h3>Current Pick: #${currentPick.pick} - ${game.getTeam(currentPick.teamId)?.fullName || 'Unknown'}</h3>
            ${isUserPick ? '<p class="highlight-text">It\'s your pick! Select a prospect below.</p>' : `
                <button class="btn btn-primary" onclick="UI.actionSimDraftPick()">Sim This Pick</button>
                <button class="btn btn-secondary" onclick="UI.actionSimToMyPick()">Sim to My Pick</button>
            `}
        </div>
        ` : `
        <div class="card">
            <div class="empty-state">
                <p>Draft complete!</p>
                <button class="btn btn-primary" onclick="UI.actionEndDraft()">End Draft</button>
            </div>
        </div>
        `}

        <div class="draft-columns">
            <div class="draft-col-main">
                <div class="card">
                    <h3>Available Prospects (${game.draftClass.length})</h3>
                    <table class="data-table">
                        <thead>
                            <tr><th>Proj</th><th>Name</th><th>Pos</th><th>Age</th><th>OVR</th><th>POT</th><th>Projection</th>${isUserPick ? '<th>Pick</th>' : ''}</tr>
                        </thead>
                        <tbody>
                            ${game.draftClass.slice(0, 30).map((p, i) => `
                                <tr class="clickable" onclick="UI.showProspectModal(${i})">
                                    <td>#${p.projectedPick || i + 1}</td>
                                    <td>${PlayerEngine.getFullName(p)}</td>
                                    <td><span class="pos-badge pos-${p.position}">${p.position}</span></td>
                                    <td>${p.age}</td>
                                    <td><span class="ovr-badge ${Utils.getOvrClass(p.ovr)}">${p.ovr}</span></td>
                                    <td><span class="pot-badge">${p.potential}</span></td>
                                    <td>${p.scoutingReport ? p.scoutingReport.projection : '-'}</td>
                                    ${isUserPick ? `<td><button class="btn btn-small btn-primary" onclick="event.stopPropagation(); UI.actionDraftPlayer(${i})">Draft</button></td>` : ''}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="draft-col-side">
                <div class="card">
                    <h3>Draft Results</h3>
                    <div class="draft-results-list">
                        ${game.draftResults.slice(-20).reverse().map(r => `
                            <div class="draft-result-item ${r.team.id === game.userTeamId ? 'user-pick' : ''}">
                                <span class="pick-num">#${r.pick}</span>
                                <span class="pick-team" style="color: ${r.team.color}">${r.team.abbr}</span>
                                <span class="pick-player">${PlayerEngine.getFullName(r.player)} (${r.player.position})</span>
                                <span class="ovr-badge ${Utils.getOvrClass(r.player.ovr)}">${r.player.ovr}</span>
                            </div>
                        `).join('')}
                        ${game.draftResults.length === 0 ? '<div class="empty-state">No picks made yet.</div>' : ''}
                    </div>
                </div>
            </div>
        </div>`;
    },

    // ==================== FREE AGENCY ====================
    renderFreeAgency() {
        const freeAgents = game.freeAgents.sort((a, b) => b.ovr - a.ovr);

        return `
        <div class="page-header">
            <h2>Free Agency</h2>
            <div class="header-info">${freeAgents.length} Available Players</div>
        </div>
        ${game.phase === 'freeAgency' ? `
        <div class="card">
            <button class="btn btn-secondary" onclick="UI.actionAiFreeAgency()">AI Teams Sign Players</button>
            <button class="btn btn-warning" onclick="UI.actionAdvanceYear()">Advance to Next Year</button>
        </div>` : ''}
        <div class="card">
            <table class="data-table">
                <thead>
                    <tr><th>Name</th><th>Pos</th><th>Age</th><th>OVR</th><th>POT</th><th>Est. Value</th><th>Action</th></tr>
                </thead>
                <tbody>
                    ${freeAgents.slice(0, 50).map(p => `
                        <tr class="clickable" onclick="UI.showPlayerModal('${p.id}')">
                            <td>${PlayerEngine.getFullName(p)}</td>
                            <td><span class="pos-badge pos-${p.position}">${p.position}</span></td>
                            <td>${p.age}</td>
                            <td><span class="ovr-badge ${Utils.getOvrClass(p.ovr)}">${p.ovr}</span></td>
                            <td>${p.potential}</td>
                            <td>${Utils.formatMoney(PlayerEngine.estimateMarketValue(p))}</td>
                            <td><button class="btn btn-small btn-primary" onclick="event.stopPropagation(); UI.showSignModal('${p.id}')">Sign</button></td>
                        </tr>
                    `).join('')}
                    ${freeAgents.length === 0 ? '<tr><td colspan="7" class="empty-state">No free agents available.</td></tr>' : ''}
                </tbody>
            </table>
        </div>`;
    },

    // ==================== TRADE ====================
    renderTrade() {
        const otherTeams = game.teams.filter(t => t.id !== game.userTeamId);
        const selectedTeamId = this.selectedTradeTeam || otherTeams[0]?.id;
        const myPlayers = game.getUserPlayers();
        const theirPlayers = selectedTeamId ? game.getTeamPlayers(selectedTeamId) : [];

        return `
        <div class="page-header"><h2>Trade Center</h2></div>
        <div class="trade-container">
            <div class="trade-side card">
                <h3>Your Players</h3>
                <div class="trade-player-list">
                    ${myPlayers.map(p => `
                        <div class="trade-player-item ${this.tradeMySelected.includes(p.id) ? 'selected' : ''}"
                             onclick="UI.toggleTradePlayer('my', '${p.id}')">
                            <span>${PlayerEngine.getFullName(p)}</span>
                            <span class="ovr-badge ${Utils.getOvrClass(p.ovr)}">${p.ovr}</span>
                            <span class="trade-salary">${p.contract ? Utils.formatMoney(p.contract.salary) : 'FA'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="trade-center-col">
                <select id="trade-team-select" onchange="UI.selectTradeTeam(this.value)">
                    ${otherTeams.map(t => `
                        <option value="${t.id}" ${t.id === selectedTeamId ? 'selected' : ''}>${t.fullName}</option>
                    `).join('')}
                </select>
                <div class="trade-summary">
                    <div class="trade-arrow">&#8644;</div>
                    <button class="btn btn-primary btn-lg" onclick="UI.executeTrade()">Propose Trade</button>
                </div>
            </div>
            <div class="trade-side card">
                <h3>${game.getTeam(selectedTeamId)?.fullName || 'Select Team'}</h3>
                <div class="trade-player-list">
                    ${theirPlayers.map(p => `
                        <div class="trade-player-item ${this.tradeTheirSelected.includes(p.id) ? 'selected' : ''}"
                             onclick="UI.toggleTradePlayer('their', '${p.id}')">
                            <span>${PlayerEngine.getFullName(p)}</span>
                            <span class="ovr-badge ${Utils.getOvrClass(p.ovr)}">${p.ovr}</span>
                            <span class="trade-salary">${p.contract ? Utils.formatMoney(p.contract.salary) : 'FA'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        ${game.tradeHistory.length > 0 ? `
        <div class="card">
            <h3>Trade History</h3>
            ${game.tradeHistory.slice(-10).reverse().map(t => `
                <div class="trade-history-item">
                    <strong>${game.getTeam(t.team1)?.abbr || '?'}</strong> sent ${t.team1Players.map(p => p.name).join(', ')}
                    for ${t.team2Players.map(p => p.name).join(', ')} from
                    <strong>${game.getTeam(t.team2)?.abbr || '?'}</strong>
                </div>
            `).join('')}
        </div>` : ''}`;
    },

    toggleTradePlayer(side, playerId) {
        const arr = side === 'my' ? this.tradeMySelected : this.tradeTheirSelected;
        const idx = arr.indexOf(playerId);
        if (idx >= 0) arr.splice(idx, 1);
        else arr.push(playerId);
        this.refresh();
    },

    selectTradeTeam(teamId) {
        this.selectedTradeTeam = teamId;
        this.tradeTheirSelected = [];
        this.refresh();
    },

    executeTrade() {
        if (this.tradeMySelected.length === 0 || this.tradeTheirSelected.length === 0) {
            this.showToast('Select players from both sides!', 'error');
            return;
        }
        const result = game.executeTrade(this.tradeMySelected, this.tradeTheirSelected, this.selectedTradeTeam);
        this.showToast(result.message, result.success ? 'success' : 'error');
        if (result.success) {
            this.tradeMySelected = [];
            this.tradeTheirSelected = [];
        }
        this.refresh();
    },

    // ==================== TRAINING ====================
    renderTraining() {
        const schedule = game.trainingSchedule;
        const summary = TrainingEngine.getTrainingSummary(schedule);
        const players = game.getUserPlayers();

        return `
        <div class="page-header"><h2>Training</h2></div>
        <div class="training-container">
            <div class="card">
                <h3>Weekly Team Schedule</h3>
                <div class="training-grid">
                    ${summary.map(s => `
                        <div class="training-day">
                            <div class="training-day-name">${s.day}</div>
                            <select onchange="UI.updateTrainingDay('${s.day.toLowerCase()}', this.value)">
                                <option value="rest" ${s.focus === 'rest' ? 'selected' : ''}>Rest Day</option>
                                ${Object.entries(TRAINING_FOCUSES).map(([key, val]) =>
                                    `<option value="${key}" ${s.focus === key ? 'selected' : ''}>${val.label}</option>`
                                ).join('')}
                            </select>
                            <div class="training-label">${s.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card">
                <h3>Individual Player Training</h3>
                <table class="data-table">
                    <thead>
                        <tr><th>Player</th><th>OVR</th><th>POT</th><th>Focus</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        ${players.map(p => `
                            <tr>
                                <td class="clickable" onclick="UI.showPlayerModal('${p.id}')">${PlayerEngine.getFullName(p)}</td>
                                <td><span class="ovr-badge ${Utils.getOvrClass(p.ovr)}">${p.ovr}</span></td>
                                <td>${p.potential}</td>
                                <td>
                                    <select onchange="UI.setPlayerTraining('${p.id}', this.value)">
                                        ${Object.entries(TRAINING_FOCUSES).map(([key, val]) =>
                                            `<option value="${key}" ${p.trainingFocus === key ? 'selected' : ''}>${val.label}</option>`
                                        ).join('')}
                                    </select>
                                </td>
                                <td><button class="btn btn-small btn-secondary" onclick="UI.trainPlayerNow('${p.id}')">Train Now</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    },

    updateTrainingDay(day, focus) {
        game.trainingSchedule[day] = focus;
    },

    setPlayerTraining(playerId, focus) {
        const player = game.players.find(p => p.id === playerId);
        if (player) player.trainingFocus = focus;
    },

    trainPlayerNow(playerId) {
        const player = game.players.find(p => p.id === playerId);
        if (!player) return;
        const result = TrainingEngine.applyIndividualTraining(player, player.trainingFocus);
        if (result) {
            this.showToast(`${result.player} trained in ${result.focus}. OVR: ${result.newOvr}`);
        }
        this.refresh();
    },

    // ==================== CAP MANAGEMENT ====================
    renderCapManagement() {
        const report = FinanceEngine.getCapReport(game.getUserPlayers());

        // Cap bar visual
        const capPct = Math.min(parseFloat(report.capUsagePct), 150);
        const barColor = report.isOverCap ? '#f87171' : capPct > 85 ? '#fbbf24' : '#4ade80';

        return `
        <div class="page-header"><h2>Cap Management</h2></div>
        <div class="finance-grid">
            <div class="stat-card">
                <div class="stat-label">Total Payroll</div>
                <div class="stat-value">${Utils.formatMoney(report.totalSalary)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Salary Cap</div>
                <div class="stat-value">${Utils.formatMoney(report.salaryCap)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Cap Space</div>
                <div class="stat-value" style="color: ${report.capSpace > 0 ? '#4ade80' : '#f87171'}">${Utils.formatMoney(report.capSpace)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Luxury Tax</div>
                <div class="stat-value" style="color: ${report.luxuryTax > 0 ? '#f87171' : 'inherit'}">${Utils.formatMoney(report.luxuryTax)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Luxury Threshold</div>
                <div class="stat-value">${Utils.formatMoney(report.luxuryThreshold)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Projected Cap Space</div>
                <div class="stat-value" style="color: ${report.projectedCapSpace > 0 ? '#4ade80' : '#f87171'}">${Utils.formatMoney(report.projectedCapSpace)}</div>
            </div>
        </div>

        <div class="card">
            <h3>Cap Usage (${report.capUsagePct}%)</h3>
            <div style="background: #1e293b; border-radius: 8px; height: 24px; margin: 12px 0; position: relative; overflow: hidden;">
                <div style="background: ${barColor}; height: 100%; width: ${Math.min(capPct, 100)}%; border-radius: 8px; transition: width 0.3s;"></div>
                <div style="position: absolute; top: 0; left: ${100 * CONFIG.LUXURY_TAX_THRESHOLD / CONFIG.SALARY_CAP}%; width: 2px; height: 100%; background: #f59e0b;" title="Luxury Tax Line"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8;">
                <span>$0</span>
                <span>Cap: ${Utils.formatMoney(CONFIG.SALARY_CAP)}</span>
                <span>Lux: ${Utils.formatMoney(CONFIG.LUXURY_TAX_THRESHOLD)}</span>
            </div>
        </div>

        <div class="card">
            <h3>Player Contracts</h3>
            <table class="data-table">
                <thead><tr><th>Player</th><th>Pos</th><th>OVR</th><th>Salary</th><th>Years Left</th><th>Total Value</th></tr></thead>
                <tbody>
                    ${report.contracts.map(c => `
                        <tr class="clickable" onclick="UI.showPlayerModal('${c.player.id}')">
                            <td>${c.name}</td>
                            <td><span class="pos-badge pos-${c.position}">${c.position}</span></td>
                            <td><span class="ovr-badge ${Utils.getOvrClass(c.ovr)}">${c.ovr}</span></td>
                            <td>${Utils.formatMoney(c.salary)}</td>
                            <td>${c.yearsLeft}</td>
                            <td>${Utils.formatMoney(c.totalValue)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${report.expiringThisYear.length > 0 ? `
        <div class="card">
            <h3>Expiring Contracts (This Year)</h3>
            <div style="color: #94a3b8; margin-bottom: 8px;">These players will become free agents after the season.</div>
            <table class="data-table">
                <thead><tr><th>Player</th><th>Pos</th><th>OVR</th><th>Current Salary</th></tr></thead>
                <tbody>
                    ${report.expiringThisYear.map(c => `
                        <tr>
                            <td>${c.name}</td>
                            <td>${c.position}</td>
                            <td><span class="ovr-badge ${Utils.getOvrClass(c.ovr)}">${c.ovr}</span></td>
                            <td>${Utils.formatMoney(c.salary)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : ''}`;
    },

    // ==================== LEAGUE LEADERS ====================
    renderLeaders() {
        const activePlayers = game.players.filter(p => p.teamId && p.seasonStats.gamesPlayed > 5);
        const getAvg = (p, stat) => p.seasonStats[stat] / (p.seasonStats.gamesPlayed || 1);

        const categories = [
            { label: 'Points Per Game', key: 'points', format: v => v.toFixed(1) },
            { label: 'Assists Per Game', key: 'assists', format: v => v.toFixed(1) },
            { label: 'Rebounds Per Game', key: 'rebounds', format: v => v.toFixed(1) },
            { label: 'Steals Per Game', key: 'steals', format: v => v.toFixed(1) },
            { label: 'Blocks Per Game', key: 'blocks', format: v => v.toFixed(1) },
        ];

        return `
        <div class="page-header"><h2>League Leaders</h2></div>
        ${activePlayers.length === 0 ? '<div class="card empty-state">No stats available yet. Play some games first!</div>' : ''}
        <div class="leaders-grid">
            ${categories.map(cat => {
                const sorted = [...activePlayers]
                    .sort((a, b) => getAvg(b, cat.key) - getAvg(a, cat.key))
                    .slice(0, 10);
                return `
                <div class="card leader-card">
                    <h3>${cat.label}</h3>
                    <div class="leader-list">
                        ${sorted.map((p, i) => {
                            const team = game.getTeam(p.teamId);
                            return `
                            <div class="leader-item ${p.teamId === game.userTeamId ? 'user-player' : ''}" onclick="UI.showPlayerModal('${p.id}')">
                                <span class="leader-rank">${i + 1}</span>
                                <span class="leader-name">${PlayerEngine.getFullName(p)}</span>
                                <span class="leader-team">${team?.abbr || '?'}</span>
                                <span class="leader-stat">${cat.format(getAvg(p, cat.key))}</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    },

    // ==================== SETTINGS ====================
    renderSettings() {
        const manualInfo = SaveEngine.getSaveInfo('manual');
        const autoInfo = SaveEngine.getSaveInfo('auto');
        const settings = game.gameSettings || DEFAULT_GAME_SETTINGS;

        const makeSelect = (name, value, options) => {
            return `<select onchange="UI.updateGameSetting('${name}', this.value)" style="padding: 6px 12px; border-radius: 6px; background: #1e293b; color: #e2e8f0; border: 1px solid #334155;">
                ${options.map(opt => `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
            </select>`;
        };

        return `
        <div class="page-header"><h2>Settings</h2></div>
        <div class="settings-grid">
            <div class="card">
                <h3>Game Difficulty</h3>
                <div style="display: grid; gap: 16px;">
                    <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Trade Difficulty</strong>
                            <div style="font-size: 0.8rem; color: #94a3b8;">How hard it is to make trades with AI teams</div>
                        </div>
                        ${makeSelect('tradeDifficulty', settings.tradeDifficulty, [
                            { value: 'easy', label: 'Easy' },
                            { value: 'normal', label: 'Normal' },
                            { value: 'hard', label: 'Hard' },
                            { value: 'extreme', label: 'Extreme' },
                        ])}
                    </div>
                    <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Negotiation Difficulty</strong>
                            <div style="font-size: 0.8rem; color: #94a3b8;">How demanding free agents are in contract talks</div>
                        </div>
                        ${makeSelect('negotiationDifficulty', settings.negotiationDifficulty, [
                            { value: 'easy', label: 'Easy' },
                            { value: 'normal', label: 'Normal' },
                            { value: 'hard', label: 'Hard' },
                        ])}
                    </div>
                    <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Simulation Difficulty</strong>
                            <div style="font-size: 0.8rem; color: #94a3b8;">Affects your team's performance vs AI teams in games</div>
                        </div>
                        ${makeSelect('simDifficulty', settings.simDifficulty, [
                            { value: 'easy', label: 'Easy' },
                            { value: 'normal', label: 'Normal' },
                            { value: 'hard', label: 'Hard' },
                        ])}
                    </div>
                    <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Player Development Speed</strong>
                            <div style="font-size: 0.8rem; color: #94a3b8;">How fast players grow from training</div>
                        </div>
                        ${makeSelect('developerSpeed', settings.developerSpeed, [
                            { value: 'slow', label: 'Slow' },
                            { value: 'normal', label: 'Normal' },
                            { value: 'fast', label: 'Fast' },
                        ])}
                    </div>
                    <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Cap Strictness</strong>
                            <div style="font-size: 0.8rem; color: #94a3b8;">Hard cap = strict limit. Soft cap = more flexibility with exceptions</div>
                        </div>
                        ${makeSelect('capStrictness', settings.capStrictness, [
                            { value: 'soft', label: 'Soft Cap' },
                            { value: 'hard', label: 'Hard Cap' },
                        ])}
                    </div>
                    <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Injury Frequency</strong>
                            <div style="font-size: 0.8rem; color: #94a3b8;">How often players get injured during games</div>
                        </div>
                        ${makeSelect('injuryFrequency', settings.injuryFrequency, [
                            { value: 'off', label: 'Off' },
                            { value: 'low', label: 'Low' },
                            { value: 'normal', label: 'Normal' },
                            { value: 'high', label: 'High' },
                        ])}
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>Save / Load</h3>
                <div class="settings-row">
                    <button class="btn btn-primary" onclick="UI.actionSave()">Save Game</button>
                    <span class="save-info">${manualInfo ? 'Last saved: ' + manualInfo.date : 'No manual save'}</span>
                </div>
                <div class="settings-row">
                    <button class="btn btn-secondary" onclick="UI.actionLoad('manual')">Load Save</button>
                    <button class="btn btn-secondary" onclick="UI.actionLoad('auto')">Load Autosave</button>
                    <span class="save-info">${autoInfo ? 'Autosave: ' + autoInfo.date : 'No autosave'}</span>
                </div>
                <div class="settings-row">
                    <button class="btn btn-secondary" onclick="SaveEngine.exportSave()">Export Save</button>
                    <label class="btn btn-secondary file-upload-btn">
                        Import Save
                        <input type="file" accept=".json" onchange="UI.importSave(event)" style="display:none">
                    </label>
                </div>
            </div>

            <div class="card">
                <h3>New Game</h3>
                <p>Start a completely new game. This won't affect your current save.</p>
                <button class="btn btn-danger" onclick="UI.showNewGameModal()">New Game</button>
            </div>

            <div class="card">
                <h3>Game Info</h3>
                <div class="info-grid">
                    <div><strong>Current Year:</strong> ${game.currentYear}</div>
                    <div><strong>Phase:</strong> ${game.phase}</div>
                    <div><strong>Your Team:</strong> ${game.getUserTeam()?.fullName || 'None'}</div>
                    <div><strong>Total Players:</strong> ${game.players.length}</div>
                </div>
            </div>
        </div>`;
    },

    updateGameSetting(key, value) {
        if (!game.gameSettings) game.gameSettings = { ...DEFAULT_GAME_SETTINGS };
        game.gameSettings[key] = value;
        game.autoSave();
        this.showToast(`Setting updated: ${key} = ${value}`);
    },

    // ==================== MODALS ====================
    showPlayerModal(playerId) {
        const player = game.players.find(p => p.id === playerId) || game.freeAgents.find(p => p.id === playerId);
        if (!player) return;

        const avg = PlayerEngine.getAverages(player.seasonStats);
        const team = player.teamId ? game.getTeam(player.teamId) : null;

        const html = `
        <div class="modal-overlay" onclick="UI.closeModal()">
            <div class="modal-content modal-lg" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="UI.closeModal()">&times;</button>
                <div class="player-modal-header">
                    <div>
                        <h2>${PlayerEngine.getFullName(player)}</h2>
                        <div class="player-meta">
                            <span class="pos-badge pos-${player.position}">${player.position}</span>
                            <span>Age: ${player.age}</span>
                            <span>Team: ${team ? team.fullName : 'Free Agent'}</span>
                            <span>${Utils.getAgeCategory(player.age)}</span>
                        </div>
                    </div>
                    <div class="player-ratings">
                        <div class="big-ovr ${Utils.getOvrClass(player.ovr)}">${player.ovr}</div>
                        <div class="ovr-label">OVR</div>
                        <div class="pot-value">${player.potential} POT</div>
                    </div>
                </div>

                <div class="player-modal-body">
                    <div class="player-section">
                        <h3>Attributes</h3>
                        <div class="attributes-grid">
                            ${ATTRIBUTES.map(attr => `
                                <div class="attr-row">
                                    <span class="attr-name">${ATTRIBUTE_LABELS[attr]}</span>
                                    <div class="attr-bar-container">
                                        <div class="attr-bar" style="width: ${player.attributes[attr]}%; background: ${this.getAttrColor(player.attributes[attr])}"></div>
                                    </div>
                                    <span class="attr-value">${Math.round(player.attributes[attr])}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="player-section">
                        <h3>Season Averages</h3>
                        ${player.seasonStats.gamesPlayed > 0 ? `
                        <div class="avg-grid">
                            <div class="avg-item"><span class="avg-label">GP</span><span class="avg-value">${player.seasonStats.gamesPlayed}</span></div>
                            <div class="avg-item"><span class="avg-label">PPG</span><span class="avg-value">${avg.ppg.toFixed(1)}</span></div>
                            <div class="avg-item"><span class="avg-label">APG</span><span class="avg-value">${avg.apg.toFixed(1)}</span></div>
                            <div class="avg-item"><span class="avg-label">RPG</span><span class="avg-value">${avg.rpg.toFixed(1)}</span></div>
                            <div class="avg-item"><span class="avg-label">SPG</span><span class="avg-value">${avg.spg.toFixed(1)}</span></div>
                            <div class="avg-item"><span class="avg-label">BPG</span><span class="avg-value">${avg.bpg.toFixed(1)}</span></div>
                            <div class="avg-item"><span class="avg-label">TPG</span><span class="avg-value">${avg.tpg.toFixed(1)}</span></div>
                            <div class="avg-item"><span class="avg-label">MPG</span><span class="avg-value">${avg.mpg.toFixed(1)}</span></div>
                            <div class="avg-item"><span class="avg-label">FG%</span><span class="avg-value">${(avg.fgPct * 100).toFixed(1)}</span></div>
                            <div class="avg-item"><span class="avg-label">3P%</span><span class="avg-value">${(avg.threePct * 100).toFixed(1)}</span></div>
                            <div class="avg-item"><span class="avg-label">FT%</span><span class="avg-value">${(avg.ftPct * 100).toFixed(1)}</span></div>
                        </div>` : '<div class="empty-state">No games played this season.</div>'}
                    </div>

                    <div class="player-section">
                        <h3>Contract</h3>
                        ${player.contract ? `
                        <div class="contract-info">
                            <div><strong>Salary:</strong> ${Utils.formatMoneyFull(player.contract.salary)}</div>
                            <div><strong>Years Remaining:</strong> ${player.contract.years - player.contract.yearsSigned}</div>
                            <div><strong>Total Value:</strong> ${Utils.formatMoneyFull(player.contract.totalValue)}</div>
                        </div>` : '<div class="empty-state">No active contract</div>'}
                    </div>

                    ${player.careerStats && player.careerStats.length > 0 ? `
                    <div class="player-section">
                        <h3>Career History</h3>
                        <table class="data-table compact">
                            <thead><tr><th>Year</th><th>GP</th><th>PPG</th><th>APG</th><th>RPG</th><th>FG%</th></tr></thead>
                            <tbody>
                                ${player.careerStats.map(s => {
                                    const gp = s.gamesPlayed || 1;
                                    return `<tr>
                                        <td>${s.year || '-'}</td>
                                        <td>${s.gamesPlayed}</td>
                                        <td>${(s.points / gp).toFixed(1)}</td>
                                        <td>${(s.assists / gp).toFixed(1)}</td>
                                        <td>${(s.rebounds / gp).toFixed(1)}</td>
                                        <td>${s.fgAttempted > 0 ? ((s.fgMade / s.fgAttempted) * 100).toFixed(1) + '%' : '-'}</td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>` : ''}
                </div>
            </div>
        </div>`;

        document.getElementById('modal-container').innerHTML = html;
    },

    showProspectModal(index) {
        const player = game.draftClass[index];
        if (!player) return;

        const report = player.scoutingReport || {};

        const html = `
        <div class="modal-overlay" onclick="UI.closeModal()">
            <div class="modal-content modal-lg" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="UI.closeModal()">&times;</button>
                <div class="player-modal-header">
                    <div>
                        <h2>${PlayerEngine.getFullName(player)}</h2>
                        <div class="player-meta">
                            <span class="pos-badge pos-${player.position}">${player.position}</span>
                            <span>Age: ${player.age}</span>
                            <span>Projection: ${report.projection || 'Unknown'}</span>
                        </div>
                    </div>
                    <div class="player-ratings">
                        <div class="big-ovr ${Utils.getOvrClass(player.ovr)}">${player.ovr}</div>
                        <div class="ovr-label">OVR</div>
                        <div class="pot-value">${player.potential} POT</div>
                    </div>
                </div>
                <div class="player-modal-body">
                    <div class="player-section">
                        <h3>Scouting Report</h3>
                        <div class="scouting-grid">
                            <div>
                                <h4>Strengths</h4>
                                ${report.strengths && report.strengths.length > 0 ?
                                    report.strengths.map(s => `<span class="badge badge-green">${s}</span>`).join('') :
                                    '<span class="empty-state">None standout</span>'}
                            </div>
                            <div>
                                <h4>Weaknesses</h4>
                                ${report.weaknesses && report.weaknesses.length > 0 ?
                                    report.weaknesses.map(s => `<span class="badge badge-red">${s}</span>`).join('') :
                                    '<span class="empty-state">None notable</span>'}
                            </div>
                        </div>
                    </div>
                    <div class="player-section">
                        <h3>Attributes</h3>
                        <div class="attributes-grid">
                            ${ATTRIBUTES.map(attr => `
                                <div class="attr-row">
                                    <span class="attr-name">${ATTRIBUTE_LABELS[attr]}</span>
                                    <div class="attr-bar-container">
                                        <div class="attr-bar" style="width: ${player.attributes[attr]}%; background: ${this.getAttrColor(player.attributes[attr])}"></div>
                                    </div>
                                    <span class="attr-value">${Math.round(player.attributes[attr])}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        document.getElementById('modal-container').innerHTML = html;
    },

    showSignModal(playerId) {
        const player = game.freeAgents.find(p => p.id === playerId) || game.players.find(p => p.id === playerId);
        if (!player) return;

        const marketValue = PlayerEngine.estimateMarketValue(player);
        const suggestedYears = PlayerEngine.estimateContractYears(player);

        const html = `
        <div class="modal-overlay" onclick="UI.closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="UI.closeModal()">&times;</button>
                <h2>Sign ${PlayerEngine.getFullName(player)}</h2>
                <div class="player-meta" style="margin-bottom: 20px;">
                    <span class="pos-badge pos-${player.position}">${player.position}</span>
                    <span class="ovr-badge ${Utils.getOvrClass(player.ovr)}">${player.ovr} OVR</span>
                    <span>Age: ${player.age}</span>
                </div>
                <div class="sign-info">
                    <p>Estimated Market Value: <strong>${Utils.formatMoneyFull(marketValue)}</strong>/year</p>
                    <p>Preferred Contract Length: <strong>${suggestedYears} years</strong></p>
                    <p>Your Cap Space: <strong>${Utils.formatMoney(ContractEngine.getCapSpace(game.getUserPlayers()))}</strong></p>
                </div>
                <div class="sign-form">
                    <div class="form-group">
                        <label>Annual Salary ($)</label>
                        <input type="number" id="sign-salary" value="${marketValue}" min="${CONFIG.MIN_SALARY}" max="${CONFIG.MAX_SALARY}" step="100000">
                    </div>
                    <div class="form-group">
                        <label>Contract Years</label>
                        <input type="number" id="sign-years" value="${suggestedYears}" min="1" max="500">
                    </div>
                    <div id="sign-result"></div>
                    <button class="btn btn-primary btn-lg" onclick="UI.submitSignOffer('${player.id}')">Submit Offer</button>
                </div>
            </div>
        </div>`;

        document.getElementById('modal-container').innerHTML = html;
    },

    submitSignOffer(playerId) {
        const salary = parseInt(document.getElementById('sign-salary').value);
        const years = parseInt(document.getElementById('sign-years').value);

        if (!salary || !years) {
            document.getElementById('sign-result').innerHTML = '<div class="alert alert-error">Enter valid salary and years.</div>';
            return;
        }

        const result = game.signFreeAgent(playerId, salary, years);
        const resultDiv = document.getElementById('sign-result');

        if (result.accepted) {
            resultDiv.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
            setTimeout(() => { this.closeModal(); this.refresh(); }, 1500);
        } else {
            let counterHtml = '';
            if (result.counterOffer) {
                counterHtml = `<p>Counter offer: ${Utils.formatMoneyFull(result.counterOffer.salary)}/yr for ${result.counterOffer.years} years</p>`;
            }
            resultDiv.innerHTML = `<div class="alert alert-error">${result.message}${counterHtml}</div>`;
        }
    },

    showNewGameModal() {
        const html = `
        <div class="modal-overlay" onclick="UI.closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="UI.closeModal()">&times;</button>
                <h2>Select Your Team</h2>
                <div class="team-select-grid">
                    ${TEAMS_DATA.map((t, i) => `
                        <div class="team-select-card" onclick="UI.startNewGame(${i})" style="border-color: ${t.color}">
                            <div class="team-select-city">${t.city}</div>
                            <div class="team-select-name" style="color: ${t.color}">${t.name}</div>
                            <div class="team-select-conf">${t.conference}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`;

        document.getElementById('modal-container').innerHTML = html;
    },

    closeModal() {
        document.getElementById('modal-container').innerHTML = '';
    },

    getAttrColor(val) {
        if (val >= 85) return '#22c55e';
        if (val >= 70) return '#3b82f6';
        if (val >= 55) return '#f59e0b';
        if (val >= 40) return '#f97316';
        return '#ef4444';
    },

    // ==================== ACTIONS ====================
    startNewGame(teamIndex) {
        this.closeModal();
        game.initNewGame(teamIndex);
        this.showTab('dashboard');
        this.showToast(`You are now the GM of the ${game.getUserTeam().fullName}!`, 'success');
    },

    actionStartSeason() {
        game.startSeason();
        this.showTab('dashboard');
        this.showToast('The season has started!', 'success');
    },

    actionSimDay() {
        const results = game.simNextDay();
        this.refresh();
        if (results && results.length > 0) {
            const userGame = results.find(r =>
                r.game.homeTeamId === game.userTeamId || r.game.awayTeamId === game.userTeamId
            );
            if (userGame) {
                const r = userGame.result;
                const isHome = userGame.game.homeTeamId === game.userTeamId;
                const won = isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
                this.showToast(`${won ? 'Win' : 'Loss'}: ${r.homeScore} - ${r.awayScore}`, won ? 'success' : 'error');
            }
        }
    },

    actionSimWeek() {
        game.simDays(7);
        this.refresh();
        this.showToast('Simulated 1 week');
    },

    actionSimMonth() {
        game.simDays(30);
        this.refresh();
        this.showToast('Simulated 1 month');
    },

    actionSimSeason() {
        game.simToEndOfSeason();
        this.refresh();
        this.showToast('Regular season complete!', 'success');
    },

    actionSimPlayoffGame() {
        const result = game.advancePlayoffs();
        this.refresh();
        if (game.playoffs?.champion) {
            const champ = game.getTeam(game.playoffs.champion);
            this.showToast(`${champ?.fullName || 'Unknown'} wins the championship!`, 'success');
        }
    },

    actionSimAllPlayoffs() {
        game.simAllPlayoffs();
        this.refresh();
        if (game.playoffs?.champion) {
            const champ = game.getTeam(game.playoffs.champion);
            this.showToast(`${champ?.fullName || 'Unknown'} wins the championship!`, 'success');
        }
    },

    actionStartDraft() {
        game.startDraft();
        this.showTab('draft');
    },

    actionSimDraftPick() {
        const result = game.executeDraftPick();
        this.refresh();
        if (result) {
            this.showToast(`#${result.pick}: ${result.team.abbr} selects ${PlayerEngine.getFullName(result.player)}`);
        }
    },

    actionSimToMyPick() {
        const results = game.simDraftToUserPick();
        this.refresh();
        const currentPick = game.draftOrder[game.draftCurrentPick];
        if (currentPick && currentPick.teamId === game.userTeamId) {
            this.showToast('It\'s your pick!', 'success');
        } else {
            this.showToast('No more picks for your team.');
        }
    },

    actionDraftPlayer(index) {
        const result = game.executeDraftPick(index);
        if (result) {
            this.showToast(`You drafted ${PlayerEngine.getFullName(result.player)}!`, 'success');
            game.addMessage(`You drafted ${PlayerEngine.getFullName(result.player)} (${result.player.position}, ${result.player.ovr} OVR) with pick #${result.pick}.`);
        }
        this.refresh();
    },

    actionEndDraft() {
        game.endDraft();
        this.showTab('freeagency');
    },

    actionAiFreeAgency() {
        game.aiHandleFreeAgency();
        this.refresh();
        this.showToast('AI teams have signed free agents.');
    },

    actionAdvanceYear() {
        game.advanceToNextYear();
        this.showTab('dashboard');
        this.showToast(`Welcome to ${game.currentYear}!`, 'success');
    },

    actionSave() {
        const result = game.manualSave();
        this.showToast(result.message, result.success ? 'success' : 'error');
    },

    actionLoad(slot) {
        const result = game.loadGame(slot);
        if (result.success) {
            this.showTab('dashboard');
            this.showToast('Game loaded!', 'success');
        } else {
            this.showToast(result.message, 'error');
        }
    },

    importSave(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = SaveEngine.importSave(e.target.result);
            this.showToast(result.message, result.success ? 'success' : 'error');
            if (result.success) {
                this.actionLoad('manual');
            }
        };
        reader.readAsText(file);
    },

    releasePlayerConfirm(playerId) {
        const player = game.players.find(p => p.id === playerId);
        if (!player) return;
        if (confirm(`Release ${PlayerEngine.getFullName(player)}? This cannot be undone.`)) {
            game.releasePlayer(playerId);
            this.refresh();
            this.showToast(`${PlayerEngine.getFullName(player)} has been released.`);
        }
    },

    // ==================== TOAST ====================
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // ==================== TAB EVENT BINDINGS ====================
    bindTabEvents(tab) {
        // Any specific event bindings for tabs can go here
    },
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Check for existing save
    if (SaveEngine.hasSave('auto') || SaveEngine.hasSave('manual')) {
        // Show load option
        const html = `
        <div class="start-screen">
            <div class="start-content">
                <h1 class="game-title">Basketball<br>Manager</h1>
                <p class="game-subtitle">Build Your Dynasty</p>
                <div class="start-buttons">
                    ${SaveEngine.hasSave('auto') ? '<button class="btn btn-primary btn-lg" onclick="UI.actionLoad(\'auto\'); document.querySelector(\'.start-screen\').remove();">Continue (Autosave)</button>' : ''}
                    ${SaveEngine.hasSave('manual') ? '<button class="btn btn-secondary btn-lg" onclick="UI.actionLoad(\'manual\'); document.querySelector(\'.start-screen\').remove();">Load Manual Save</button>' : ''}
                    <button class="btn btn-warning btn-lg" onclick="document.querySelector('.start-screen').remove(); UI.showNewGameModal();">New Game</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    } else {
        UI.showNewGameModal();
    }

    UI.init();
});
