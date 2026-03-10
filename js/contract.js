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

    // Negotiate with player (returns offer result)
    negotiate(player, offeredSalary, offeredYears, teamPrestige = 50) {
        const marketValue = PlayerEngine.estimateMarketValue(player);
        const desiredYears = PlayerEngine.estimateContractYears(player);

        // Player's acceptance threshold
        let salaryThreshold = marketValue * 0.85; // Will accept 85% of market value
        let yearsThreshold = Math.max(1, desiredYears - 1);

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
        const counterSalary = Math.round(marketValue * Utils.randFloat(0.95, 1.10));
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
