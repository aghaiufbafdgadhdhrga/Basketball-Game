// ============================================================
// CAREER-UI.JS - Career Mode UI rendering and actions
// ============================================================

const CareerUI = {
    currentCareerTab: 'overview',

    // ==================== CAREER MODE START SCREEN ====================

    showCareerCreateModal() {
        const pointsTotal = CAREER_CONFIG.PLAYER_CREATE_POINTS;

        const html = `
        <div class="modal-overlay" onclick="UI.closeModal()">
            <div class="modal-content modal-lg" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="UI.closeModal()">&times;</button>
                <h2>Create Your Player</h2>
                <div class="career-create-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>First Name</label>
                            <input type="text" id="career-firstname" value="${Utils.pickRandom(FIRST_NAMES)}" class="career-input">
                        </div>
                        <div class="form-group">
                            <label>Last Name</label>
                            <input type="text" id="career-lastname" value="${Utils.pickRandom(LAST_NAMES)}" class="career-input">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Position</label>
                            <select id="career-position" class="career-input">
                                ${POSITIONS.map(p => `<option value="${p}">${p}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Height</label>
                            <select id="career-height" class="career-input">
                                <option value="5'10">5'10"</option>
                                <option value="6'0">6'0"</option>
                                <option value="6'2">6'2"</option>
                                <option value="6'4" selected>6'4"</option>
                                <option value="6'6">6'6"</option>
                                <option value="6'8">6'8"</option>
                                <option value="6'10">6'10"</option>
                                <option value="7'0">7'0"</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Weight (lbs)</label>
                            <input type="number" id="career-weight" value="195" min="150" max="300" class="career-input">
                        </div>
                    </div>

                    <h3>Distribute Attribute Points <span id="career-points-remaining" class="points-counter">${pointsTotal} points remaining</span></h3>
                    <div class="career-attrs-grid" id="career-attrs-grid">
                        ${ATTRIBUTES.map(attr => `
                            <div class="career-attr-row">
                                <label>${ATTRIBUTE_LABELS[attr]}</label>
                                <input type="range" min="${CAREER_CONFIG.ATTR_MIN}" max="${CAREER_CONFIG.ATTR_MAX}"
                                       value="25" class="career-attr-slider" data-attr="${attr}"
                                       oninput="CareerUI.updateAttrPoints()">
                                <span class="career-attr-val" id="attr-val-${attr}">25</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="career-create-actions">
                        <button class="btn btn-primary btn-lg" onclick="CareerUI.startCareer()">Start Career</button>
                        <button class="btn btn-secondary" onclick="CareerUI.randomizeAttributes()">Randomize</button>
                    </div>
                </div>
            </div>
        </div>`;

        document.getElementById('modal-container').innerHTML = html;
    },

    updateAttrPoints() {
        const sliders = document.querySelectorAll('.career-attr-slider');
        let total = 0;
        sliders.forEach(s => {
            total += parseInt(s.value);
            const valSpan = document.getElementById('attr-val-' + s.dataset.attr);
            if (valSpan) valSpan.textContent = s.value;
        });
        const remaining = CAREER_CONFIG.PLAYER_CREATE_POINTS - total;
        const counter = document.getElementById('career-points-remaining');
        if (counter) {
            counter.textContent = `${remaining} points remaining`;
            counter.style.color = remaining < 0 ? '#f87171' : remaining === 0 ? '#4ade80' : '#fbbf24';
        }
    },

    randomizeAttributes() {
        const sliders = document.querySelectorAll('.career-attr-slider');
        const numAttrs = sliders.length;
        let budget = CAREER_CONFIG.PLAYER_CREATE_POINTS;
        const values = [];

        for (let i = 0; i < numAttrs - 1; i++) {
            const maxVal = Math.min(CAREER_CONFIG.ATTR_MAX, budget - (numAttrs - i - 1) * CAREER_CONFIG.ATTR_MIN);
            const val = Utils.randInt(CAREER_CONFIG.ATTR_MIN, maxVal);
            values.push(val);
            budget -= val;
        }
        values.push(Utils.clamp(budget, CAREER_CONFIG.ATTR_MIN, CAREER_CONFIG.ATTR_MAX));

        Utils.shuffle(values);
        sliders.forEach((s, i) => {
            s.value = values[i] || CAREER_CONFIG.ATTR_MIN;
        });
        this.updateAttrPoints();
    },

    startCareer() {
        const firstName = document.getElementById('career-firstname').value.trim() || 'Player';
        const lastName = document.getElementById('career-lastname').value.trim() || 'One';
        const position = document.getElementById('career-position').value;
        const height = document.getElementById('career-height').value;
        const weight = parseInt(document.getElementById('career-weight').value) || 195;

        // Collect attributes
        const attributes = {};
        const sliders = document.querySelectorAll('.career-attr-slider');
        let total = 0;
        sliders.forEach(s => {
            attributes[s.dataset.attr] = parseInt(s.value);
            total += parseInt(s.value);
        });

        if (total > CAREER_CONFIG.PLAYER_CREATE_POINTS + 10) {
            UI.showToast('Too many attribute points allocated!', 'error');
            return;
        }

        CareerEngine.createCareer({
            firstName, lastName, position, height, weight, attributes,
        });

        UI.closeModal();
        UI.showTab('career');
        UI.showToast(`${firstName} ${lastName}'s career has begun!`, 'success');
    },

    // ==================== CAREER MAIN RENDER ====================

    renderCareer() {
        const c = CareerEngine.career;
        if (!c) {
            return `
            <div class="page-header"><h2>Player Career Mode</h2></div>
            <div class="card" style="text-align: center; padding: 60px 20px;">
                <h3>Start a New Career</h3>
                <p style="color: #94a3b8; margin: 16px 0;">Create a player and guide them from high school through college to the NBA.</p>
                <button class="btn btn-primary btn-lg" onclick="CareerUI.showCareerCreateModal()">Create Player</button>
            </div>`;
        }

        // Career mode nav tabs
        const tabs = this.getCareerTabs();

        return `
        <div class="page-header">
            <h2>${c.player.firstName} ${c.player.lastName}'s Career</h2>
            <div class="header-info">
                <span class="pos-badge pos-${c.player.position}">${c.player.position}</span>
                <span class="ovr-badge ${Utils.getOvrClass(c.player.ovr)}">${c.player.ovr} OVR</span>
                <span>Age: ${c.player.age}</span>
                <span>Phase: ${this.getPhaseLabel(c.phase)}</span>
            </div>
        </div>
        <div class="tabs-row career-tabs">
            ${tabs.map(t => `<button class="tab-btn ${this.currentCareerTab === t.id ? 'active' : ''}" onclick="CareerUI.switchCareerTab('${t.id}')">${t.label}</button>`).join('')}
        </div>
        <div id="career-tab-content">
            ${this.renderCareerTabContent()}
        </div>`;
    },

    getCareerTabs() {
        const c = CareerEngine.career;
        const tabs = [{ id: 'overview', label: 'Overview' }];

        if (c.phase === 'highschool' || c.hs.seasonResults.length > 0) {
            tabs.push({ id: 'highschool', label: 'High School' });
        }
        if (c.phase === 'college_recruiting') {
            tabs.push({ id: 'recruiting', label: 'Choose College' });
        }
        if (c.phase === 'college' || c.phase === 'college_offseason' || c.college.seasonResults.length > 0) {
            tabs.push({ id: 'college', label: 'College' });
        }
        if (c.college.collegePlayerRankings.length > 0) {
            tabs.push({ id: 'college_rankings', label: 'Rankings' });
        }
        if (c.college.marchMadness) {
            tabs.push({ id: 'march_madness', label: 'March Madness' });
        }
        if (c.phase === 'nba_draft' || c.nba.mockDraft.length > 0) {
            tabs.push({ id: 'mock_draft', label: 'Mock Draft' });
        }
        if (c.phase === 'nba' || c.phase === 'nba_free_agency' || c.nba.seasonLog.length > 0) {
            tabs.push({ id: 'nba', label: 'NBA' });
        }
        tabs.push({ id: 'stats', label: 'Career Stats' });
        tabs.push({ id: 'accolades', label: 'Accolades' });

        return tabs;
    },

    switchCareerTab(tabId) {
        this.currentCareerTab = tabId;
        const content = document.getElementById('career-tab-content');
        if (content) content.innerHTML = this.renderCareerTabContent();
    },

    getPhaseLabel(phase) {
        const labels = {
            highschool: 'High School',
            college_recruiting: 'College Recruiting',
            college: 'College',
            college_offseason: 'College Offseason',
            nba_draft: 'NBA Draft',
            nba: 'NBA',
            nba_free_agency: 'NBA Free Agency',
            retired: 'Retired',
        };
        return labels[phase] || phase;
    },

    renderCareerTabContent() {
        switch (this.currentCareerTab) {
            case 'overview': return this.renderCareerOverview();
            case 'highschool': return this.renderHighSchool();
            case 'recruiting': return this.renderCollegeRecruiting();
            case 'college': return this.renderCollege();
            case 'college_rankings': return this.renderCollegeRankings();
            case 'march_madness': return this.renderMarchMadness();
            case 'mock_draft': return this.renderMockDraft();
            case 'nba': return this.renderNBACareer();
            case 'stats': return this.renderCareerStats();
            case 'accolades': return this.renderAccolades();
            default: return this.renderCareerOverview();
        }
    },

    // ==================== OVERVIEW ====================

    renderCareerOverview() {
        const c = CareerEngine.career;
        const p = c.player;
        const avg = p.seasonStats.gamesPlayed > 0 ? PlayerEngine.getAverages(p.seasonStats) : null;

        return `
        <div class="career-overview">
            <div class="card career-player-card">
                <div class="career-player-header">
                    <div>
                        <h3>${p.firstName} ${p.lastName}</h3>
                        <div class="player-meta">
                            <span class="pos-badge pos-${p.position}">${p.position}</span>
                            <span>${p.height} | ${p.weight} lbs</span>
                            <span>Age: ${p.age}</span>
                        </div>
                    </div>
                    <div class="player-ratings">
                        <div class="big-ovr ${Utils.getOvrClass(p.ovr)}">${p.ovr}</div>
                        <div class="ovr-label">OVR</div>
                        <div class="pot-value">${p.potential} POT</div>
                    </div>
                </div>

                <div class="career-attrs-display">
                    ${ATTRIBUTES.map(attr => `
                        <div class="attr-row">
                            <span class="attr-name">${ATTRIBUTE_LABELS[attr]}</span>
                            <div class="attr-bar-container">
                                <div class="attr-bar" style="width: ${p.attributes[attr]}%; background: ${UI.getAttrColor(p.attributes[attr])}"></div>
                            </div>
                            <span class="attr-value">${Math.round(p.attributes[attr])}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card">
                <h3>Current Status</h3>
                <div class="career-status-grid">
                    <div class="career-status-item">
                        <span class="status-label">Phase</span>
                        <span class="status-value">${this.getPhaseLabel(c.phase)}</span>
                    </div>
                    <div class="career-status-item">
                        <span class="status-label">Year</span>
                        <span class="status-value">${c.currentYear}</span>
                    </div>
                    ${c.phase === 'highschool' ? `
                        <div class="career-status-item">
                            <span class="status-label">School</span>
                            <span class="status-value">${c.hs.school}</span>
                        </div>
                        <div class="career-status-item">
                            <span class="status-label">HS Year</span>
                            <span class="status-value">${['Freshman', 'Sophomore', 'Junior', 'Senior'][c.hs.year - 1]}</span>
                        </div>
                        ${c.hs.stars > 0 ? `<div class="career-status-item"><span class="status-label">Rating</span><span class="status-value">${'★'.repeat(c.hs.stars)}</span></div>` : ''}
                    ` : ''}
                    ${c.phase === 'college' || c.phase === 'college_offseason' ? `
                        <div class="career-status-item">
                            <span class="status-label">School</span>
                            <span class="status-value">${c.college.team ? c.college.team.name : 'N/A'}</span>
                        </div>
                        <div class="career-status-item">
                            <span class="status-label">Conference</span>
                            <span class="status-value">${c.college.conference || 'N/A'}</span>
                        </div>
                        <div class="career-status-item">
                            <span class="status-label">Year</span>
                            <span class="status-value">${c.college.yearLabel}</span>
                        </div>
                    ` : ''}
                    ${c.phase === 'nba' || c.phase === 'nba_free_agency' ? `
                        <div class="career-status-item">
                            <span class="status-label">Team</span>
                            <span class="status-value">${c.nba.teamId ? (game.getTeam(c.nba.teamId)?.fullName || 'N/A') : 'Free Agent'}</span>
                        </div>
                        <div class="career-status-item">
                            <span class="status-label">NBA Year</span>
                            <span class="status-value">${c.nba.year}</span>
                        </div>
                        <div class="career-status-item">
                            <span class="status-label">Rings</span>
                            <span class="status-value">${c.nba.championships}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="card">
                <h3>Quick Actions</h3>
                <div class="quick-actions">
                    ${this.getCareerActions()}
                </div>
            </div>

            <div class="card">
                <h3>Career Log</h3>
                <div class="message-log">
                    ${c.messageLog.slice(0, 20).map(m => `
                        <div class="message-item">
                            <span class="message-text">${m.text}</span>
                        </div>
                    `).join('')}
                    ${c.messageLog.length === 0 ? '<div class="empty-state">No messages yet.</div>' : ''}
                </div>
            </div>
        </div>`;
    },

    getCareerActions() {
        const c = CareerEngine.career;
        let actions = '';

        switch (c.phase) {
            case 'highschool':
                actions = `<button class="btn btn-primary" onclick="CareerUI.actionSimHSSeason()">Sim HS Season</button>`;
                break;
            case 'college_recruiting':
                actions = `<button class="btn btn-primary" onclick="CareerUI.switchCareerTab('recruiting')">Choose College</button>`;
                break;
            case 'college':
                actions = `<button class="btn btn-primary" onclick="CareerUI.actionSimCollegeSeason()">Sim College Season</button>`;
                break;
            case 'college_offseason':
                if (c.college.marchMadness && !c.college.marchMadness.champion) {
                    actions = `<button class="btn btn-primary" onclick="CareerUI.actionSimMarchMadnessRound()">Sim March Madness Round</button>`;
                } else {
                    actions = `
                        <button class="btn btn-primary" onclick="CareerUI.actionDeclareForDraft()">Declare for NBA Draft</button>
                        <button class="btn btn-secondary" onclick="CareerUI.actionStayInCollege()">Stay in College</button>
                        ${c.college.transferAvailable ? '<button class="btn btn-warning" onclick="CareerUI.switchCareerTab(\'recruiting\')">Transfer Portal</button>' : ''}
                    `;
                }
                break;
            case 'nba_draft':
                actions = `<button class="btn btn-primary" onclick="CareerUI.actionSimNBADraft()">Sim NBA Draft</button>`;
                break;
            case 'nba':
                actions = `
                    <button class="btn btn-primary" onclick="CareerUI.actionSimNBASeason()">Sim NBA Season</button>
                    <button class="btn btn-secondary" onclick="CareerUI.actionSimNBAPlayoffs()">Sim Playoffs</button>
                    <button class="btn btn-warning" onclick="CareerUI.actionAdvanceNBAYear()">Advance Year</button>
                `;
                break;
            case 'nba_free_agency':
                actions = `<button class="btn btn-primary" onclick="CareerUI.showNBAFreeAgencyModal()">Choose Team</button>`;
                break;
            case 'retired':
                actions = `<p style="color: #94a3b8;">Your career is over. What a journey!</p>`;
                break;
        }

        actions += `<button class="btn btn-secondary" style="margin-left:8px;" onclick="game.manualSave(); UI.showToast('Career saved!')">Save</button>`;
        return actions;
    },

    // ==================== HIGH SCHOOL ====================

    renderHighSchool() {
        const c = CareerEngine.career;
        return `
        <div class="card">
            <h3>${c.hs.school}</h3>
            <div class="career-status-grid">
                <div class="career-status-item"><span class="status-label">Year</span><span class="status-value">${['Freshman', 'Sophomore', 'Junior', 'Senior'][c.hs.year - 1]}</span></div>
                ${c.hs.stars > 0 ? `<div class="career-status-item"><span class="status-label">Recruit Rating</span><span class="status-value career-stars">${'★'.repeat(c.hs.stars)}${'☆'.repeat(5 - c.hs.stars)}</span></div>` : ''}
                ${c.hs.recruitingRank ? `<div class="career-status-item"><span class="status-label">National Rank</span><span class="status-value">#${c.hs.recruitingRank}</span></div>` : ''}
            </div>
            <div class="quick-actions" style="margin-top:16px;">
                <button class="btn btn-primary" onclick="CareerUI.actionSimHSSeason()">Sim Season</button>
            </div>
        </div>

        ${c.hs.seasonResults.length > 0 ? `
        <div class="card">
            <h3>Season History</h3>
            <table class="data-table">
                <thead><tr><th>Year</th><th>Record</th><th>PPG</th><th>RPG</th><th>APG</th></tr></thead>
                <tbody>
                    ${c.hs.seasonResults.map(s => `
                        <tr>
                            <td>${s.yearLabel}</td>
                            <td>${s.wins}-${s.losses}</td>
                            <td>${s.avgPPG.toFixed(1)}</td>
                            <td>${s.avgRPG.toFixed(1)}</td>
                            <td>${s.avgAPG.toFixed(1)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : ''}`;
    },

    // ==================== COLLEGE RECRUITING ====================

    renderCollegeRecruiting() {
        const c = CareerEngine.career;

        // If in college offseason with transfer available, show transfer options
        if (c.phase === 'college_offseason' && c.college.transferAvailable) {
            return this.renderTransferPortal();
        }

        if (c.hs.offers.length === 0) {
            return '<div class="card empty-state">No college offers yet. Finish your high school career first.</div>';
        }

        return `
        <div class="card">
            <h3>College Offers (${c.hs.offers.length})</h3>
            <p style="color:#94a3b8; margin-bottom:16px;">Based on your ${c.hs.stars}-star rating and #${c.hs.recruitingRank} national ranking.</p>
            <div class="college-offers-grid">
                ${c.hs.offers.map(o => `
                    <div class="college-offer-card" onclick="CareerUI.commitToCollege('${o.team.abbr}')">
                        <div class="college-offer-name">${o.team.name}</div>
                        <div class="college-offer-mascot">${o.team.mascot}</div>
                        <div class="college-offer-conf">${o.team.conference}</div>
                        <div class="college-offer-prestige">
                            <span class="prestige-bar" style="width:${o.team.prestige}%"></span>
                            <span>Prestige: ${o.team.prestige}</span>
                        </div>
                        ${o.scholarship ? '<span class="badge badge-green">Full Scholarship</span>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>`;
    },

    renderTransferPortal() {
        const c = CareerEngine.career;
        const allTeams = [...COLLEGE_TEAMS_DATA].sort((a, b) => b.prestige - a.prestige);

        return `
        <div class="card">
            <h3>Transfer Portal</h3>
            <p style="color:#94a3b8; margin-bottom:16px;">Choose a new school. Your rating: ${c.player.ovr} OVR</p>
            <div class="college-offers-grid">
                ${allTeams.filter(t => t.abbr !== c.college.team.abbr).slice(0, 30).map(t => `
                    <div class="college-offer-card" onclick="CareerUI.transferCollege('${t.abbr}')">
                        <div class="college-offer-name">${t.name}</div>
                        <div class="college-offer-mascot">${t.mascot}</div>
                        <div class="college-offer-conf">${t.conference}</div>
                        <div class="college-offer-prestige">
                            <span class="prestige-bar" style="width:${t.prestige}%"></span>
                            <span>Prestige: ${t.prestige}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    },

    // ==================== COLLEGE ====================

    renderCollege() {
        const c = CareerEngine.career;
        if (!c.college.team) return '<div class="card empty-state">Not enrolled in college yet.</div>';

        return `
        <div class="card">
            <h3>${c.college.team.name} ${c.college.team.mascot}</h3>
            <div class="career-status-grid">
                <div class="career-status-item"><span class="status-label">Conference</span><span class="status-value">${c.college.conference}</span></div>
                <div class="career-status-item"><span class="status-label">Year</span><span class="status-value">${c.college.yearLabel}</span></div>
                <div class="career-status-item"><span class="status-label">Natl Championships</span><span class="status-value">${c.college.nationalChampionships}</span></div>
            </div>
            ${c.phase === 'college' ? '<div class="quick-actions" style="margin-top:16px;"><button class="btn btn-primary" onclick="CareerUI.actionSimCollegeSeason()">Sim Season</button></div>' : ''}
        </div>

        ${c.college.conferenceStandings.length > 0 ? `
        <div class="card">
            <h3>${c.college.conference} Standings</h3>
            <table class="data-table">
                <thead><tr><th>#</th><th>Team</th><th>Conf</th><th>Overall</th></tr></thead>
                <tbody>
                    ${c.college.conferenceStandings.map((t, i) => `
                        <tr class="${t.abbr === c.college.team.abbr ? 'user-row' : ''}">
                            <td>${i + 1}</td>
                            <td>${t.name}</td>
                            <td>${t.confWins}-${t.confLosses}</td>
                            <td>${t.wins}-${t.losses}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : ''}

        ${c.college.seasonResults.length > 0 ? `
        <div class="card">
            <h3>Season History</h3>
            <table class="data-table">
                <thead><tr><th>Year</th><th>School</th><th>Record</th><th>PPG</th><th>RPG</th><th>APG</th></tr></thead>
                <tbody>
                    ${c.college.seasonResults.map(s => `
                        <tr>
                            <td>${s.yearLabel}</td>
                            <td>${s.team}</td>
                            <td>${s.wins}-${s.losses}</td>
                            <td>${s.avgPPG.toFixed(1)}</td>
                            <td>${s.avgRPG.toFixed(1)}</td>
                            <td>${s.avgAPG.toFixed(1)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : ''}`;
    },

    // ==================== COLLEGE RANKINGS ====================

    renderCollegeRankings() {
        const c = CareerEngine.career;
        const rankings = c.college.collegePlayerRankings;

        if (rankings.length === 0) return '<div class="card empty-state">No rankings available yet.</div>';

        return `
        <div class="card">
            <h3>National Player Rankings</h3>
            <table class="data-table">
                <thead><tr><th>#</th><th>Name</th><th>School</th><th>Pos</th><th>Year</th><th>OVR</th><th>PPG</th><th>RPG</th><th>APG</th></tr></thead>
                <tbody>
                    ${rankings.slice(0, 50).map(r => `
                        <tr class="${r.isUser ? 'user-row' : ''}">
                            <td>${r.rank}</td>
                            <td>${r.name}</td>
                            <td>${r.team}</td>
                            <td><span class="pos-badge pos-${r.position}">${r.position}</span></td>
                            <td>${r.year}</td>
                            <td><span class="ovr-badge ${Utils.getOvrClass(r.ovr)}">${r.ovr}</span></td>
                            <td>${r.ppg.toFixed(1)}</td>
                            <td>${r.rpg.toFixed(1)}</td>
                            <td>${r.apg.toFixed(1)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
    },

    // ==================== MARCH MADNESS ====================

    renderMarchMadness() {
        const c = CareerEngine.career;
        const bracket = c.college.marchMadness;
        if (!bracket) return '<div class="card empty-state">March Madness has not started yet.</div>';

        let actionButton = '';
        if (!bracket.champion && (c.phase === 'college_offseason' || c.phase === 'college')) {
            actionButton = `<button class="btn btn-primary" onclick="CareerUI.actionSimMarchMadnessRound()">Sim Next Round</button>`;
        }

        return `
        <div class="card">
            <h3>NCAA Tournament - ${bracket.currentRound}</h3>
            ${bracket.champion ? `<div class="champion-banner">Champion: ${bracket.champion.name} ${bracket.champion.mascot || ''}</div>` : ''}
            ${bracket.userInTournament && !bracket.userEliminated && !bracket.champion ? '<p style="color:#4ade80;">Your team is still alive!</p>' : ''}
            ${bracket.userEliminated ? '<p style="color:#f87171;">Your team has been eliminated.</p>' : ''}
            ${actionButton}
        </div>

        <div class="march-madness-bracket">
            ${Object.entries(bracket.regions).map(([name, region]) => `
                <div class="bracket-region card">
                    <h4>${name} Region</h4>
                    <div class="bracket-matchups">
                        ${region.matchups.map(m => `
                            <div class="mm-matchup ${m.winner ? 'completed' : ''}">
                                <div class="mm-team ${m.winner && m.winner.abbr === m.team1.abbr ? 'winner' : ''} ${m.team1.abbr === c.college.team.abbr ? 'user-team' : ''}">
                                    <span class="mm-seed">${m.team1.seed || '?'}</span>
                                    <span class="mm-name">${m.team1.name || m.team1.abbr}</span>
                                    ${m.winner ? `<span class="mm-score">${m.score1}</span>` : ''}
                                </div>
                                <div class="mm-team ${m.winner && m.winner.abbr === m.team2.abbr ? 'winner' : ''} ${m.team2.abbr === c.college.team.abbr ? 'user-team' : ''}">
                                    <span class="mm-seed">${m.team2.seed || '?'}</span>
                                    <span class="mm-name">${m.team2.name || m.team2.abbr}</span>
                                    ${m.winner ? `<span class="mm-score">${m.score2}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>

        ${bracket.finalFour && bracket.finalFour.length > 0 ? `
        <div class="card">
            <h3>Final Four</h3>
            <div class="final-four-grid">
                ${bracket.finalFour.map(t => `
                    <div class="ff-team ${t.abbr === c.college.team.abbr ? 'user-team' : ''}">
                        <div class="ff-name">${t.name}</div>
                        <div class="ff-region">${t.regionWon} Region Champion</div>
                    </div>
                `).join('')}
            </div>
            ${bracket.semiFinals ? `
                <div class="ff-results">
                    ${bracket.semiFinals.map(sf => `
                        <div class="ff-game">${sf.team1.name} ${sf.score1} - ${sf.score2} ${sf.team2.name} ${sf.winner ? '(Winner: ' + sf.winner.name + ')' : ''}</div>
                    `).join('')}
                </div>
            ` : ''}
            ${bracket.championship ? `
                <div class="ff-championship">
                    <h4>Championship</h4>
                    <div class="ff-game">${bracket.championship.team1.name} ${bracket.championship.score1} - ${bracket.championship.score2} ${bracket.championship.team2.name}</div>
                </div>
            ` : ''}
        </div>` : ''}`;
    },

    // ==================== MOCK DRAFT ====================

    renderMockDraft() {
        const c = CareerEngine.career;
        const prospects = c.nba.mockDraft;

        if (prospects.length === 0) return '<div class="card empty-state">Mock draft not available yet.</div>';

        return `
        <div class="card">
            <h3>NBA Mock Draft</h3>
            ${c.phase === 'nba_draft' ? '<div class="quick-actions" style="margin-bottom:16px;"><button class="btn btn-primary" onclick="CareerUI.actionSimNBADraft()">Enter Draft</button></div>' : ''}
            <table class="data-table">
                <thead><tr><th>Proj</th><th>Name</th><th>Pos</th><th>Age</th><th>OVR</th><th>POT</th><th>College</th><th>PPG</th><th>Strengths</th><th>Weaknesses</th></tr></thead>
                <tbody>
                    ${prospects.slice(0, 60).map(p => `
                        <tr class="${p.isUser ? 'user-row' : ''}">
                            <td>#${p.projectedPick}</td>
                            <td>${p.name}</td>
                            <td><span class="pos-badge pos-${p.position}">${p.position}</span></td>
                            <td>${p.age}</td>
                            <td><span class="ovr-badge ${Utils.getOvrClass(p.ovr)}">${p.ovr}</span></td>
                            <td>${p.potential}</td>
                            <td>${p.college}</td>
                            <td>${p.ppg.toFixed(1)}</td>
                            <td>${(p.strengths || []).map(s => `<span class="badge badge-green">${s}</span>`).join(' ')}</td>
                            <td>${(p.weaknesses || []).map(s => `<span class="badge badge-red">${s}</span>`).join(' ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
    },

    // ==================== NBA CAREER ====================

    renderNBACareer() {
        const c = CareerEngine.career;
        const team = c.nba.teamId ? game.getTeam(c.nba.teamId) : null;

        return `
        <div class="card">
            <h3>NBA Career</h3>
            <div class="career-status-grid">
                <div class="career-status-item"><span class="status-label">Team</span><span class="status-value">${team ? team.fullName : 'Free Agent'}</span></div>
                <div class="career-status-item"><span class="status-label">Draft</span><span class="status-value">#${c.nba.draftPick || 'N/A'} (${c.nba.draftYear || 'N/A'})</span></div>
                <div class="career-status-item"><span class="status-label">NBA Year</span><span class="status-value">${c.nba.year}</span></div>
                <div class="career-status-item"><span class="status-label">Championships</span><span class="status-value">${c.nba.championships}</span></div>
                <div class="career-status-item"><span class="status-label">MVPs</span><span class="status-value">${c.nba.mvps}</span></div>
                ${c.nba.contract ? `
                    <div class="career-status-item"><span class="status-label">Contract</span><span class="status-value">${Utils.formatMoney(c.nba.contract.salary)}/yr (${c.nba.contract.years - c.nba.contract.yearsSigned}yr left)</span></div>
                ` : ''}
            </div>

            ${c.phase === 'nba' ? `
            <div class="quick-actions" style="margin-top:16px;">
                <button class="btn btn-primary" onclick="CareerUI.actionSimNBASeason()">Sim Season</button>
                <button class="btn btn-secondary" onclick="CareerUI.actionSimNBAPlayoffs()">Sim Playoffs</button>
                <button class="btn btn-warning" onclick="CareerUI.actionAdvanceNBAYear()">Next Year</button>
            </div>` : ''}

            ${c.phase === 'nba_free_agency' ? `
            <div class="quick-actions" style="margin-top:16px;">
                <button class="btn btn-primary" onclick="CareerUI.showNBAFreeAgencyModal()">Choose New Team</button>
            </div>` : ''}
        </div>

        ${c.nba.seasonLog.length > 0 ? `
        <div class="card">
            <h3>NBA Season Log</h3>
            <table class="data-table">
                <thead><tr><th>Year</th><th>Team</th><th>Record</th><th>PPG</th><th>RPG</th><th>APG</th></tr></thead>
                <tbody>
                    ${c.nba.seasonLog.map(s => `
                        <tr>
                            <td>${s.year}</td>
                            <td>${s.team}</td>
                            <td>${s.record}</td>
                            <td>${s.avgPPG.toFixed(1)}</td>
                            <td>${s.avgRPG.toFixed(1)}</td>
                            <td>${s.avgAPG.toFixed(1)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : ''}`;
    },

    // ==================== CAREER STATS ====================

    renderCareerStats() {
        const c = CareerEngine.career;
        const stats = c.player.careerStats;

        if (stats.length === 0) return '<div class="card empty-state">No career stats yet.</div>';

        return `
        <div class="card">
            <h3>Career Statistics</h3>
            <table class="data-table">
                <thead><tr><th>Year</th><th>Level</th><th>Team</th><th>GP</th><th>PPG</th><th>RPG</th><th>APG</th><th>SPG</th><th>BPG</th><th>FG%</th><th>3P%</th></tr></thead>
                <tbody>
                    ${stats.map(s => {
                        const gp = s.gamesPlayed || 1;
                        return `
                        <tr>
                            <td>${s.year}</td>
                            <td>${s.level || 'N/A'}</td>
                            <td>${s.team || 'N/A'}</td>
                            <td>${s.gamesPlayed}</td>
                            <td>${(s.points / gp).toFixed(1)}</td>
                            <td>${(s.rebounds / gp).toFixed(1)}</td>
                            <td>${(s.assists / gp).toFixed(1)}</td>
                            <td>${(s.steals / gp).toFixed(1)}</td>
                            <td>${(s.blocks / gp).toFixed(1)}</td>
                            <td>${s.fgAttempted > 0 ? ((s.fgMade / s.fgAttempted) * 100).toFixed(1) + '%' : '-'}</td>
                            <td>${s.threeAttempted > 0 ? ((s.threeMade / s.threeAttempted) * 100).toFixed(1) + '%' : '-'}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    },

    // ==================== ACCOLADES ====================

    renderAccolades() {
        const c = CareerEngine.career;
        const accolades = c.player.accolades;

        return `
        <div class="card">
            <h3>Awards & Accolades</h3>
            ${accolades.length === 0 ? '<div class="empty-state">No accolades yet. Keep playing!</div>' : `
            <div class="accolades-grid">
                ${accolades.map(a => `
                    <div class="accolade-card">
                        <div class="accolade-type">${a.type}</div>
                        <div class="accolade-detail">${a.year} | ${a.level}</div>
                    </div>
                `).join('')}
            </div>`}
        </div>

        <div class="card">
            <h3>Career Summary</h3>
            <div class="career-status-grid">
                <div class="career-status-item"><span class="status-label">Championships</span><span class="status-value">${c.nba.championships + c.college.nationalChampionships}</span></div>
                <div class="career-status-item"><span class="status-label">NBA Rings</span><span class="status-value">${c.nba.championships}</span></div>
                <div class="career-status-item"><span class="status-label">College Titles</span><span class="status-value">${c.college.nationalChampionships}</span></div>
                <div class="career-status-item"><span class="status-label">MVPs</span><span class="status-value">${c.nba.mvps}</span></div>
                <div class="career-status-item"><span class="status-label">Total Accolades</span><span class="status-value">${accolades.length}</span></div>
            </div>
        </div>`;
    },

    // ==================== NBA FREE AGENCY MODAL ====================

    showNBAFreeAgencyModal() {
        const teams = game.teams || TEAMS_DATA.map((td, i) => ({
            id: 'team_' + td.abbr,
            fullName: `${td.city} ${td.name}`,
            abbr: td.abbr,
            color: td.color,
        }));

        const html = `
        <div class="modal-overlay" onclick="UI.closeModal()">
            <div class="modal-content modal-lg" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="UI.closeModal()">&times;</button>
                <h2>Choose Your Next Team</h2>
                <div class="team-select-grid">
                    ${teams.map(t => `
                        <div class="team-select-card" onclick="CareerUI.signWithNBATeam('${t.id}')" style="border-color: ${t.color}">
                            <div class="team-select-name" style="color: ${t.color}">${t.fullName || t.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`;

        document.getElementById('modal-container').innerHTML = html;
    },

    signWithNBATeam(teamId) {
        const c = CareerEngine.career;
        const salary = PlayerEngine.estimateMarketValue(c.player);
        const years = PlayerEngine.estimateContractYears(c.player);
        CareerEngine.signNBAFreeAgent(teamId, salary, years);
        UI.closeModal();
        UI.showTab('career');
        UI.showToast('Signed with new team!', 'success');
    },

    // ==================== CAREER ACTIONS ====================

    actionSimHSSeason() {
        CareerEngine.simHSSeason();
        UI.showTab('career');
    },

    actionSimCollegeSeason() {
        CareerEngine.simCollegeSeason();
        const c = CareerEngine.career;
        // After college season, transition to offseason for March Madness
        c.phase = 'college_offseason';
        UI.showTab('career');
        if (c.college.marchMadness && c.college.marchMadness.userInTournament) {
            this.currentCareerTab = 'march_madness';
        }
        UI.showTab('career');
    },

    actionSimMarchMadnessRound() {
        CareerEngine.simMarchMadnessRound();
        const c = CareerEngine.career;
        if (c.college.marchMadness.champion) {
            CareerEngine.finishCollegeSeason();
        }
        UI.showTab('career');
    },

    commitToCollege(abbr) {
        CareerEngine.commitToCollege(abbr);
        this.currentCareerTab = 'college';
        UI.showTab('career');
    },

    transferCollege(abbr) {
        CareerEngine.transferCollege(abbr);
        this.currentCareerTab = 'college';
        UI.showTab('career');
    },

    actionDeclareForDraft() {
        CareerEngine.declareForDraft();
        this.currentCareerTab = 'mock_draft';
        UI.showTab('career');
    },

    actionStayInCollege() {
        CareerEngine.stayInCollege();
        this.currentCareerTab = 'college';
        UI.showTab('career');
    },

    actionSimNBADraft() {
        CareerEngine.simNBADraft();
        this.currentCareerTab = 'nba';
        UI.showTab('career');
    },

    actionSimNBASeason() {
        CareerEngine.simNBASeason();
        UI.showTab('career');
    },

    actionSimNBAPlayoffs() {
        CareerEngine.simNBAPlayoffs();
        UI.showTab('career');
    },

    actionAdvanceNBAYear() {
        CareerEngine.advanceNBAYear();
        UI.showTab('career');
    },
};
