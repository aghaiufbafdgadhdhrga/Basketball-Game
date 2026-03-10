// ============================================================
// FINANCE.JS - Cap management (finances removed, cap-focused)
// ============================================================

const FinanceEngine = {
    // Get cap management report for display
    getCapReport(teamPlayers) {
        const totalSalary = ContractEngine.getTeamSalary(teamPlayers);
        const capSpace = ContractEngine.getCapSpace(teamPlayers);
        const luxuryTax = ContractEngine.getLuxuryTax(teamPlayers);
        const isOverCap = ContractEngine.isOverCap(teamPlayers);

        // Break down contracts by tier
        const contracts = teamPlayers
            .filter(p => p.contract)
            .sort((a, b) => b.contract.salary - a.contract.salary)
            .map(p => ({
                player: p,
                name: PlayerEngine.getFullName(p),
                position: p.position,
                ovr: p.ovr,
                salary: p.contract.salary,
                yearsLeft: p.contract.years - p.contract.yearsSigned,
                totalValue: p.contract.totalValue,
            }));

        // Future cap projections
        const expiringThisYear = contracts.filter(c => c.yearsLeft <= 1);
        const expiringNextYear = contracts.filter(c => c.yearsLeft === 2);
        const projectedCapSpace = capSpace + expiringThisYear.reduce((sum, c) => sum + c.salary, 0);

        return {
            totalSalary,
            capSpace,
            luxuryTax,
            isOverCap,
            salaryCap: CONFIG.SALARY_CAP,
            luxuryThreshold: CONFIG.LUXURY_TAX_THRESHOLD,
            contracts,
            expiringThisYear,
            expiringNextYear,
            projectedCapSpace,
            capUsagePct: (totalSalary / CONFIG.SALARY_CAP * 100).toFixed(1),
        };
    },
};
