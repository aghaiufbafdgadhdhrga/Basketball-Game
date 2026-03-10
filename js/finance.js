// ============================================================
// FINANCE.JS - Team finances management
// ============================================================

const FinanceEngine = {
    // Create initial finance state
    createFinances(budget) {
        return {
            budget: budget || CONFIG.STARTING_BUDGET,
            revenue: {
                tickets: 0,
                merch: 0,
                tv: 0,
                other: 0,
            },
            expenses: {
                salaries: 0,
                arena: 0,
                staff: 0,
                luxuryTax: 0,
                other: 0,
            },
            history: [],
        };
    },

    // Calculate season finances
    calculateSeasonFinances(finances, teamPlayers, wins, losses) {
        const totalGames = wins + losses;
        const winPct = totalGames > 0 ? wins / totalGames : 0.5;

        // Revenue
        const ticketMultiplier = 0.7 + winPct * 0.6; // Better teams sell more tickets
        finances.revenue.tickets = Math.round(CONFIG.TICKET_REVENUE_PER_GAME * 41 * ticketMultiplier); // 41 home games
        finances.revenue.merch = Math.round(CONFIG.MERCH_REVENUE_PER_YEAR * (0.8 + winPct * 0.4));
        finances.revenue.tv = CONFIG.TV_REVENUE_PER_YEAR;
        finances.revenue.other = Utils.randInt(2000000, 8000000);

        // Expenses
        finances.expenses.salaries = ContractEngine.getTeamSalary(teamPlayers);
        finances.expenses.arena = CONFIG.ARENA_COSTS_PER_YEAR;
        finances.expenses.staff = CONFIG.STAFF_COSTS_PER_YEAR;
        finances.expenses.luxuryTax = ContractEngine.getLuxuryTax(teamPlayers);
        finances.expenses.other = Utils.randInt(3000000, 7000000);

        const totalRevenue = Object.values(finances.revenue).reduce((a, b) => a + b, 0);
        const totalExpenses = Object.values(finances.expenses).reduce((a, b) => a + b, 0);
        const profit = totalRevenue - totalExpenses;

        finances.budget += profit;

        finances.history.push({
            year: typeof game !== 'undefined' && game ? game.currentYear : CONFIG.STARTING_YEAR,
            revenue: totalRevenue,
            expenses: totalExpenses,
            profit,
            budget: finances.budget,
        });

        return {
            totalRevenue,
            totalExpenses,
            profit,
        };
    },

    // Get total revenue
    getTotalRevenue(finances) {
        return Object.values(finances.revenue).reduce((a, b) => a + b, 0);
    },

    // Get total expenses
    getTotalExpenses(finances) {
        return Object.values(finances.expenses).reduce((a, b) => a + b, 0);
    },

    // Format finance report
    getFinanceReport(finances) {
        return {
            budget: finances.budget,
            revenue: { ...finances.revenue, total: this.getTotalRevenue(finances) },
            expenses: { ...finances.expenses, total: this.getTotalExpenses(finances) },
            profit: this.getTotalRevenue(finances) - this.getTotalExpenses(finances),
            history: finances.history,
        };
    },
};
