// ============================================================
// UTILS.JS - Helper functions and random generators
// ============================================================

const Utils = {
    // Random integer between min and max (inclusive)
    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Random float between min and max
    randFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    // Gaussian random (Box-Muller)
    randGauss(mean, stddev) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return Math.round(mean + z * stddev);
    },

    // Clamp a value
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    // Format currency
    formatMoney(amount) {
        if (Math.abs(amount) >= 1000000) {
            return '$' + (amount / 1000000).toFixed(1) + 'M';
        } else if (Math.abs(amount) >= 1000) {
            return '$' + (amount / 1000).toFixed(0) + 'K';
        }
        return '$' + amount.toLocaleString();
    },

    formatMoneyFull(amount) {
        return '$' + amount.toLocaleString();
    },

    // Format percentage
    formatPct(val) {
        return (val * 100).toFixed(1) + '%';
    },

    formatStat(val, decimals = 1) {
        return val.toFixed(decimals);
    },

    // Pick random element from array
    pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    // Shuffle array (Fisher-Yates)
    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    },

    // Generate unique ID
    generateId() {
        return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Weighted random selection
    weightedRandom(items, weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (let i = 0; i < items.length; i++) {
            r -= weights[i];
            if (r <= 0) return items[i];
        }
        return items[items.length - 1];
    },

    // Get OVR color class
    getOvrClass(ovr) {
        if (ovr >= 90) return 'ovr-elite';
        if (ovr >= 80) return 'ovr-star';
        if (ovr >= 70) return 'ovr-starter';
        if (ovr >= 60) return 'ovr-rotation';
        return 'ovr-bench';
    },

    // Get potential label
    getPotentialLabel(pot) {
        if (pot >= 90) return 'Generational';
        if (pot >= 80) return 'All-Star';
        if (pot >= 70) return 'Starter';
        if (pot >= 60) return 'Rotation';
        if (pot >= 50) return 'Bench';
        return 'End of Bench';
    },

    // Age string
    getAgeCategory(age) {
        if (age <= 22) return 'Young';
        if (age <= 27) return 'Prime';
        if (age <= 31) return 'Veteran';
        if (age <= 35) return 'Aging';
        return 'Ancient';
    },

    // Deep clone
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};
