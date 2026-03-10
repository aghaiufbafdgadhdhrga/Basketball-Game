// ============================================================
// TRAINING.JS - Team and individual training system
// ============================================================

const TrainingEngine = {
    // Default team training schedule (weekly)
    createDefaultSchedule() {
        return {
            monday: 'shooting',
            tuesday: 'defense',
            wednesday: 'playmaking',
            thursday: 'physical',
            friday: 'rebounding',
            saturday: 'balanced',
            sunday: 'rest',
        };
    },

    // Apply weekly training to all team players
    applyWeeklyTraining(players, schedule, gameSettings = null) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // Get development speed multiplier from game settings
        const devSpeed = gameSettings ? gameSettings.developerSpeed : 'normal';
        const growthMult = (DIFFICULTY_SETTINGS.development[devSpeed] || DIFFICULTY_SETTINGS.development.normal).growthMultiplier;

        for (const player of players) {
            let totalBoost = 0;

            for (const day of days) {
                const focus = schedule[day];
                if (focus === 'rest') continue;

                const focusData = TRAINING_FOCUSES[focus];
                if (!focusData) continue;

                // Training effectiveness based on age and stamina
                let effectiveness = 1.0;
                if (player.age <= 23) effectiveness = 1.3;
                else if (player.age <= 27) effectiveness = 1.1;
                else if (player.age >= 33) effectiveness = 0.7;
                else if (player.age >= 35) effectiveness = 0.5;

                // Stamina factor
                effectiveness *= (player.attributes.stamina / 99) * 0.3 + 0.7;

                // Potential factor
                if (player.ovr < player.potential) {
                    effectiveness *= 1.2;
                }

                // Apply development speed setting
                effectiveness *= growthMult;

                // Apply small boost to focus attributes
                for (const attr of focusData.attrs) {
                    const boost = Utils.randFloat(0.01, 0.08) * effectiveness;
                    player.attributes[attr] = Utils.clamp(
                        player.attributes[attr] + boost,
                        25, 99
                    );
                    totalBoost += boost;
                }
            }

            // Morale boost from training
            if (totalBoost > 0) {
                player.morale = Utils.clamp(player.morale + Utils.randInt(0, 2), 0, 100);
            }

            // Recalc OVR
            player.ovr = PlayerEngine.calculateOvr(player.attributes, player.position);
        }
    },

    // Individual training session
    applyIndividualTraining(player, focus, gameSettings = null) {
        const focusData = TRAINING_FOCUSES[focus];
        if (!focusData) return;

        // Get development speed multiplier
        const devSpeed = gameSettings ? gameSettings.developerSpeed : 'normal';
        const growthMult = (DIFFICULTY_SETTINGS.development[devSpeed] || DIFFICULTY_SETTINGS.development.normal).growthMultiplier;

        let effectiveness = 1.0;
        if (player.age <= 23) effectiveness = 1.4;
        else if (player.age <= 27) effectiveness = 1.15;
        else if (player.age >= 33) effectiveness = 0.65;

        if (player.ovr < player.potential) {
            effectiveness *= 1.25;
        }

        // Apply development speed setting
        effectiveness *= growthMult;

        for (const attr of focusData.attrs) {
            const boost = Utils.randFloat(0.05, 0.15) * effectiveness;
            player.attributes[attr] = Utils.clamp(
                Math.round((player.attributes[attr] + boost) * 100) / 100,
                25, 99
            );
        }

        // Round attributes
        for (const attr of ATTRIBUTES) {
            player.attributes[attr] = Math.round(player.attributes[attr]);
        }

        player.ovr = PlayerEngine.calculateOvr(player.attributes, player.position);
        player.trainingFocus = focus;

        return {
            player: PlayerEngine.getFullName(player),
            focus: focusData.label,
            newOvr: player.ovr,
        };
    },

    // Get training summary for display
    getTrainingSummary(schedule) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return days.map(day => ({
            day: day.charAt(0).toUpperCase() + day.slice(1),
            focus: schedule[day],
            label: schedule[day] === 'rest' ? 'Rest Day' : (TRAINING_FOCUSES[schedule[day]]?.label || 'Unknown'),
        }));
    },
};
