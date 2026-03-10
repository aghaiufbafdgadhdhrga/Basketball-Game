// ============================================================
// DRAFT.JS - Draft system
// ============================================================

const DraftEngine = {
    // Generate draft class
    generateDraftClass(year) {
        const prospects = [];
        for (let i = 0; i < CONFIG.DRAFT_PROSPECTS; i++) {
            const prospect = PlayerEngine.generateDraftProspect(year, i + 1);
            prospects.push(prospect);
        }

        // Sort by projected OVR + potential
        prospects.sort((a, b) => {
            const aScore = a.ovr * 0.4 + a.potential * 0.6;
            const bScore = b.ovr * 0.4 + b.potential * 0.6;
            return bScore - aScore;
        });

        // Assign projected rank
        prospects.forEach((p, i) => {
            p.projectedPick = i + 1;
        });

        return prospects;
    },

    // Get draft order based on standings (worst to best, non-playoff teams first)
    getDraftOrder(standings, teams) {
        const allStandings = Object.values(standings);
        
        // Sort by win percentage (worst first)
        allStandings.sort((a, b) => {
            const aPct = a.wins / (a.wins + a.losses || 1);
            const bPct = b.wins / (b.wins + b.losses || 1);
            return aPct - bPct;
        });

        // Two rounds
        const order = [];
        for (let round = 0; round < CONFIG.DRAFT_ROUNDS; round++) {
            for (const s of allStandings) {
                order.push({
                    teamId: s.teamId,
                    round: round + 1,
                    pick: order.length + 1,
                });
            }
        }

        return order;
    },

    // AI team makes draft pick
    aiDraftPick(team, prospects, allPlayers) {
        const teamPlayers = allPlayers.filter(p => p.teamId === team.id);
        const posCount = {};
        for (const pos of POSITIONS) posCount[pos] = 0;
        for (const p of teamPlayers) posCount[p.position]++;

        // Find position of greatest need
        const needPositions = POSITIONS.filter(pos => posCount[pos] < 2);

        // Pick best available, with slight preference for needs
        let bestIdx = 0;
        let bestScore = -1;

        for (let i = 0; i < Math.min(prospects.length, 10); i++) {
            const p = prospects[i];
            let score = p.ovr * 0.35 + p.potential * 0.65;

            if (needPositions.includes(p.position)) {
                score += 5;
            }

            if (score > bestScore) {
                bestScore = score;
                bestIdx = i;
            }
        }

        return bestIdx;
    },

    // Execute draft pick
    executePick(prospect, team, pickNumber, year) {
        prospect.teamId = team.id;
        prospect.draftYear = year;
        prospect.draftPick = pickNumber;
        prospect.contract = ContractEngine.createRookieContract(pickNumber);
        return prospect;
    },
};
