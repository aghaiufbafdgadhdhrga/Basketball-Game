// ============================================================
// CONTRACT.JS - Salary cap, contracts, negotiations
// ============================================================

const ContractEngine = {
    // Create a contract
    createContract(salary, years, playerOption = false, teamOption = false) {
        return {
            salary,
            years,
            yearsSigned: 0,
            playerOption,
            teamOption,
            totalValue: salary * years,
        };
    },

    // Create rookie contract from draft pick
    createRookieContract(pickNumber) {
        const salary = CONFIG.ROOKIE_SCALE[Math.min(pickNumber - 1, 29)] || CONFIG.MIN_SALARY;
        return this.createContract(salary, 4, false, true);
    },

    // Get team total salary
    getTeamSalary(players) {
        return players.reduce((total, p) => {
            return total + (p.contract ? p.contract.salary : 0);
        }, 0);
    },

    // Check if team is over salary cap
    isOverCap(players) {
        return this.getTeamSalary(players) > CONFIG.SALARY_CAP;
    },

    // Get luxury tax amount
    getLuxuryTax(players) {
        const salary = this.getTeamSalary(players);
        if (salary <= CONFIG.LUXURY_TAX_THRESHOLD) return 0;
        const over = salary - CONFIG.LUXURY_TAX_THRESHOLD;
        return Math.round(over * 1.5); // 150% tax rate
    },

    // Get cap space
    getCapSpace(players) {
        return Math.max(0, CONFIG.SALARY_CAP - this.getTeamSalary(players));
    },

    // Check if a signing fits under the cap (or soft cap exception)
    canSignPlayer(teamPlayers, salary, settings) {
        const capStrictness = settings ? settings.capStrictness : 'hard';
        const currentSalary = this.getTeamSalary(teamPlayers);
        const projectedSalary = currentSalary + salary;

        if (capStrictness === 'hard') {
            // Hard cap: cannot exceed salary cap at all
            return projectedSalary <= CONFIG.SALARY_CAP;
        } else {
            // Soft cap: can exceed cap but not luxury tax threshold
            return projectedSalary <= CONFIG.LUXURY_TAX_THRESHOLD;
        }
    },

    // Check if a trade works under the cap
    canExecuteTrade(teamPlayers, incomingPlayers, outgoingPlayers, settings) {
        const capStrictness = settings ? settings.capStrictness : 'hard';
        const currentSalary = this.getTeamSalary(teamPlayers);

        const outgoingSalary = outgoingPlayers.reduce((sum, p) => sum + (p.contract ? p.contract.salary : 0), 0);
        const incomingSalary = incomingPlayers.reduce((sum, p) => sum + (p.contract ? p.contract.salary : 0), 0);

        const projectedSalary = currentSalary - outgoingSalary + incomingSalary;

        if (capStrictness === 'hard') {
            // Hard cap: projected salary must be under the cap
            // Exception: if already over cap, incoming salary must be <= 125% of outgoing
            if (currentSalary > CONFIG.SALARY_CAP) {
                return incomingSalary <= outgoingSalary * 1.25;
            }
            return projectedSalary <= CONFIG.SALARY_CAP;
        } else {
            // Soft cap: incoming salary must be within 150% of outgoing if over cap
            if (currentSalary > CONFIG.SALARY_CAP) {
                return incomingSalary <= outgoingSalary * 1.50;
            }
            return projectedSalary <= CONFIG.LUXURY_TAX_THRESHOLD;
        }
    },

    // Negotiate with player (returns offer result) - difficulty aware
    negotiate(player, offeredSalary, offeredYears, teamPrestige = 50, settings = null) {
        const marketValue = PlayerEngine.estimateMarketValue(player);
        const desiredYears = PlayerEngine.estimateContractYears(player);

        // Get negotiation difficulty settings
        const difficulty = settings ? settings.negotiationDifficulty : 'normal';
        const diffSettings = DIFFICULTY_SETTINGS.negotiation[difficulty] || DIFFICULTY_SETTINGS.negotiation.normal;

        // Player's acceptance threshold - adjusted by difficulty
        let salaryThreshold = marketValue * 0.85 * diffSettings.salaryMultiplier;
        let yearsThreshold = Math.max(1, desiredYears - 1 - diffSettings.yearsFlexibility);

        // Prestige adjustment
        if (teamPrestige > 70) salaryThreshold *= 0.90;
        else if (teamPrestige < 30) salaryThreshold *= 1.10;

        // Morale adjustment
        if (player.morale > 70) salaryThreshold *= 0.95;
        else if (player.morale < 40) salaryThreshold *= 1.15;

        const salaryOk = offeredSalary >= salaryThreshold;
        const yearsOk = offeredYears >= yearsThreshold;

        if (salaryOk && yearsOk) {
            return {
                accepted: true,
                message: `${PlayerEngine.getFullName(player)} accepted the offer!`,
                contract: this.createContract(offeredSalary, offeredYears),
            };
        }

        // Counter offer
        const counterSalary = Math.round(marketValue * diffSettings.salaryMultiplier * Utils.randFloat(0.95, 1.10));
        const counterYears = desiredYears;

        let reason = '';
        if (!salaryOk && !yearsOk) {
            reason = 'wants more money and a longer deal';
        } else if (!salaryOk) {
            reason = 'wants a higher salary';
        } else {
            reason = 'wants more years on the deal';
        }

        return {
            accepted: false,
            message: `${PlayerEngine.getFullName(player)} declined - ${reason}.`,
            counterOffer: {
                salary: counterSalary,
                years: counterYears,
            },
            playerDemands: {
                minSalary: Math.round(salaryThreshold),
                minYears: yearsThreshold,
            }
        };
    },

    // Age contracts by one year
    ageContracts(players) {
        const expiring = [];

        for (const player of players) {
            if (!player.contract) continue;

            player.contract.yearsSigned++;

            if (player.contract.yearsSigned >= player.contract.years) {
                expiring.push(player);
                player.contract = null;
            }
        }

        return expiring;
    },

    // Contract Extension - extend a player's current contract
    offerExtension(player, offeredSalary, offeredYears, teamPrestige = 50, settings = null) {
        if (!player.contract) {
            return { accepted: false, message: `${PlayerEngine.getFullName(player)} has no active contract to extend.` };
        }

        const marketValue = PlayerEngine.estimateMarketValue(player);
        const difficulty = settings ? settings.negotiationDifficulty : 'normal';
        const diffSettings = DIFFICULTY_SETTINGS.negotiation[difficulty] || DIFFICULTY_SETTINGS.negotiation.normal;

        // Extension demands are slightly higher than regular FA since player has leverage
        let salaryThreshold = marketValue * 0.90 * diffSettings.salaryMultiplier;
        let yearsThreshold = Math.max(2, PlayerEngine.estimateContractYears(player));

        // Loyalty / morale discount
        if (player.morale > 75) salaryThreshold *= 0.92;
        else if (player.morale < 40) salaryThreshold *= 1.15;

        // Prestige adjustment
        if (teamPrestige > 70) salaryThreshold *= 0.90;
        else if (teamPrestige < 30) salaryThreshold *= 1.12;

        // Age adjustment - older players accept less
        if (player.age > 32) salaryThreshold *= 0.85;
        else if (player.age > 28) salaryThreshold *= 0.95;

        const salaryOk = offeredSalary >= salaryThreshold;
        const yearsOk = offeredYears >= yearsThreshold;

        if (salaryOk && yearsOk) {
            const newContract = this.createContract(offeredSalary, offeredYears);
            player.contract = newContract;
            return {
                accepted: true,
                message: `${PlayerEngine.getFullName(player)} signed a ${offeredYears}-year extension worth ${Utils.formatMoney(offeredSalary * offeredYears)}!`,
                contract: newContract,
            };
        }

        const counterSalary = Math.round(salaryThreshold * Utils.randFloat(1.0, 1.15));
        const counterYears = yearsThreshold;

        let reason = '';
        if (!salaryOk && !yearsOk) reason = 'wants more money and a longer deal';
        else if (!salaryOk) reason = 'wants a higher salary';
        else reason = 'wants more years';

        return {
            accepted: false,
            message: `${PlayerEngine.getFullName(player)} declined the extension - ${reason}.`,
            counterOffer: { salary: counterSalary, years: counterYears },
            playerDemands: { minSalary: Math.round(salaryThreshold), minYears: yearsThreshold },
        };
    },

    // Get extension-eligible players (in last 2 years of contract)
    getExtensionEligible(players) {
        return players.filter(p => {
            if (!p.contract) return false;
            const remaining = p.contract.years - p.contract.yearsSigned;
            return remaining <= 2 && remaining > 0;
        });
    },

    // AI team signs free agents
    aiSignFreeAgents(team, freePlayers, allTeamPlayers) {
        const teamPlayers = allTeamPlayers.filter(p => p.teamId === team.id);
        const rosterSize = teamPlayers.length;
        const capSpace = this.getCapSpace(teamPlayers);

        if (rosterSize >= CONFIG.ROSTER_MAX) return [];

        const signed = [];
        const needed = CONFIG.ROSTER_MIN - rosterSize;

        // Sort free agents by OVR
        const available = freePlayers
            .filter(p => !p.teamId)
            .sort((a, b) => b.ovr - a.ovr);

        for (const player of available) {
            if (teamPlayers.length + signed.length >= CONFIG.ROSTER_MAX) break;

            const marketValue = PlayerEngine.estimateMarketValue(player);
            const years = PlayerEngine.estimateContractYears(player);

            if (marketValue <= capSpace || teamPlayers.length + signed.length < CONFIG.ROSTER_MIN) {
                const salary = Math.min(marketValue, Math.max(capSpace, CONFIG.MIN_SALARY));
                player.contract = this.createContract(salary, years);
                player.teamId = team.id;
                signed.push(player);
            }
        }

        return signed;
    },
};
