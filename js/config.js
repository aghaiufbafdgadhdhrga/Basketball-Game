// ============================================================
// CONFIG.JS - Game constants, team data, position weights
// ============================================================

const CONFIG = {
    SALARY_CAP: 136000000,
    LUXURY_TAX_THRESHOLD: 165000000,
    MIN_SALARY: 1100000,
    MAX_SALARY: 50000000,
    ROOKIE_SCALE: [12000000, 10500000, 9000000, 7500000, 6000000, 4500000, 3500000, 3000000, 2500000, 2000000,
        1800000, 1700000, 1600000, 1500000, 1400000, 1350000, 1300000, 1250000, 1200000, 1150000,
        1100000, 1100000, 1100000, 1100000, 1100000, 1100000, 1100000, 1100000, 1100000, 1100000],
    ROSTER_MIN: 12,
    ROSTER_MAX: 15,
    SEASON_GAMES: 82,
    PLAYOFF_TEAMS: 8,
    PLAYOFF_SERIES_WINS: 4,
    DRAFT_ROUNDS: 2,
    DRAFT_PROSPECTS: 100,
    QUARTER_MINUTES: 12,
    STARTING_YEAR: 2026,
    TRAINING_BOOST_MAX: 3,
    GROWTH_PEAK_AGE: 27,
    DECLINE_START_AGE: 32,
    // Max elite (90+ OVR) players allowed on one team via trade
    MAX_ELITE_PLAYERS_TRADE: 3,
};

// Default game settings
const DEFAULT_GAME_SETTINGS = {
    tradeDifficulty: 'normal',       // easy, normal, hard, extreme
    negotiationDifficulty: 'normal', // easy, normal, hard
    simDifficulty: 'normal',         // easy, normal, hard
    developerSpeed: 'normal',        // slow, normal, fast
    capStrictness: 'hard',           // soft, hard
    injuryFrequency: 'normal',       // off, low, normal, high
};

// Difficulty multipliers
const DIFFICULTY_SETTINGS = {
    trade: {
        easy:    { fairnessThreshold: 0.70, elitePlayerMax: 5, starValueMultiplier: 1.0 },
        normal:  { fairnessThreshold: 0.90, elitePlayerMax: 3, starValueMultiplier: 1.3 },
        hard:    { fairnessThreshold: 1.00, elitePlayerMax: 2, starValueMultiplier: 1.6 },
        extreme: { fairnessThreshold: 1.10, elitePlayerMax: 2, starValueMultiplier: 2.0 },
    },
    negotiation: {
        easy:   { salaryMultiplier: 0.75, yearsFlexibility: 2 },
        normal: { salaryMultiplier: 1.00, yearsFlexibility: 1 },
        hard:   { salaryMultiplier: 1.25, yearsFlexibility: 0 },
    },
    sim: {
        easy:   { userBoost: 1.08, aiBoost: 0.95 },
        normal: { userBoost: 1.00, aiBoost: 1.00 },
        hard:   { userBoost: 0.93, aiBoost: 1.05 },
    },
    development: {
        slow: { growthMultiplier: 0.6 },
        normal: { growthMultiplier: 1.0 },
        fast: { growthMultiplier: 1.5 },
    },
    injury: {
        off:    { chance: 0.000 },
        low:    { chance: 0.003 },
        normal: { chance: 0.008 },
        high:   { chance: 0.015 },
    },
};

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

const ATTRIBUTES = [
    'insideScoring', 'midRange', 'threePoint', 'freeThrow',
    'passing', 'ballHandling', 'speed', 'stamina',
    'rebounding', 'block', 'steal', 'perimeterDefense', 'interiorDefense',
    'strength', 'athleticism'
];

const ATTRIBUTE_LABELS = {
    insideScoring: 'Inside Scoring',
    midRange: 'Mid-Range',
    threePoint: 'Three-Point',
    freeThrow: 'Free Throw',
    passing: 'Passing',
    ballHandling: 'Ball Handling',
    speed: 'Speed',
    stamina: 'Stamina',
    rebounding: 'Rebounding',
    block: 'Block',
    steal: 'Steal',
    perimeterDefense: 'Perimeter Def',
    interiorDefense: 'Interior Def',
    strength: 'Strength',
    athleticism: 'Athleticism'
};

// Position-based OVR weights (sum to ~1.0)
const POSITION_WEIGHTS = {
    PG: {
        insideScoring: 0.03, midRange: 0.06, threePoint: 0.12, freeThrow: 0.05,
        passing: 0.18, ballHandling: 0.16, speed: 0.12, stamina: 0.04,
        rebounding: 0.02, block: 0.01, steal: 0.06, perimeterDefense: 0.08, interiorDefense: 0.01,
        strength: 0.02, athleticism: 0.04
    },
    SG: {
        insideScoring: 0.05, midRange: 0.10, threePoint: 0.16, freeThrow: 0.06,
        passing: 0.08, ballHandling: 0.10, speed: 0.08, stamina: 0.04,
        rebounding: 0.03, block: 0.01, steal: 0.06, perimeterDefense: 0.10, interiorDefense: 0.02,
        strength: 0.03, athleticism: 0.08
    },
    SF: {
        insideScoring: 0.08, midRange: 0.10, threePoint: 0.10, freeThrow: 0.05,
        passing: 0.06, ballHandling: 0.06, speed: 0.06, stamina: 0.04,
        rebounding: 0.08, block: 0.03, steal: 0.05, perimeterDefense: 0.10, interiorDefense: 0.05,
        strength: 0.06, athleticism: 0.08
    },
    PF: {
        insideScoring: 0.14, midRange: 0.08, threePoint: 0.06, freeThrow: 0.04,
        passing: 0.04, ballHandling: 0.03, speed: 0.04, stamina: 0.04,
        rebounding: 0.14, block: 0.06, steal: 0.03, perimeterDefense: 0.04, interiorDefense: 0.12,
        strength: 0.08, athleticism: 0.06
    },
    C: {
        insideScoring: 0.16, midRange: 0.04, threePoint: 0.03, freeThrow: 0.04,
        passing: 0.03, ballHandling: 0.02, speed: 0.03, stamina: 0.04,
        rebounding: 0.16, block: 0.12, steal: 0.02, perimeterDefense: 0.02, interiorDefense: 0.14,
        strength: 0.10, athleticism: 0.05
    }
};

// Training focus areas
const TRAINING_FOCUSES = {
    shooting: { attrs: ['threePoint', 'midRange', 'freeThrow', 'insideScoring'], label: 'Shooting' },
    playmaking: { attrs: ['passing', 'ballHandling', 'speed'], label: 'Playmaking' },
    defense: { attrs: ['perimeterDefense', 'interiorDefense', 'steal', 'block'], label: 'Defense' },
    physical: { attrs: ['strength', 'athleticism', 'stamina', 'speed'], label: 'Physical' },
    rebounding: { attrs: ['rebounding', 'strength', 'athleticism'], label: 'Rebounding' },
    balanced: { attrs: ATTRIBUTES, label: 'Balanced' }
};

const TEAMS_DATA = [
    { city: 'Atlanta', name: 'Hawks', abbr: 'ATL', conference: 'East', color: '#E03A3E' },
    { city: 'Boston', name: 'Celtics', abbr: 'BOS', conference: 'East', color: '#007A33' },
    { city: 'Brooklyn', name: 'Nets', abbr: 'BKN', conference: 'East', color: '#000000' },
    { city: 'Charlotte', name: 'Hornets', abbr: 'CHA', conference: 'East', color: '#1D1160' },
    { city: 'Chicago', name: 'Bulls', abbr: 'CHI', conference: 'East', color: '#CE1141' },
    { city: 'Cleveland', name: 'Cavaliers', abbr: 'CLE', conference: 'East', color: '#860038' },
    { city: 'Detroit', name: 'Pistons', abbr: 'DET', conference: 'East', color: '#C8102E' },
    { city: 'Indiana', name: 'Pacers', abbr: 'IND', conference: 'East', color: '#002D62' },
    { city: 'Miami', name: 'Heat', abbr: 'MIA', conference: 'East', color: '#98002E' },
    { city: 'Milwaukee', name: 'Bucks', abbr: 'MIL', conference: 'East', color: '#00471B' },
    { city: 'New York', name: 'Knicks', abbr: 'NYK', conference: 'East', color: '#F58426' },
    { city: 'Orlando', name: 'Magic', abbr: 'ORL', conference: 'East', color: '#0077C0' },
    { city: 'Philadelphia', name: 'Sixers', abbr: 'PHI', conference: 'East', color: '#006BB6' },
    { city: 'Toronto', name: 'Raptors', abbr: 'TOR', conference: 'East', color: '#CE1141' },
    { city: 'Washington', name: 'Wizards', abbr: 'WAS', conference: 'East', color: '#002B5C' },
    { city: 'Dallas', name: 'Mavericks', abbr: 'DAL', conference: 'West', color: '#00538C' },
    { city: 'Denver', name: 'Nuggets', abbr: 'DEN', conference: 'West', color: '#0E2240' },
    { city: 'Golden State', name: 'Warriors', abbr: 'GSW', conference: 'West', color: '#1D428A' },
    { city: 'Houston', name: 'Rockets', abbr: 'HOU', conference: 'West', color: '#CE1141' },
    { city: 'LA', name: 'Clippers', abbr: 'LAC', conference: 'West', color: '#C8102E' },
    { city: 'Los Angeles', name: 'Lakers', abbr: 'LAL', conference: 'West', color: '#552583' },
    { city: 'Memphis', name: 'Grizzlies', abbr: 'MEM', conference: 'West', color: '#5D76A9' },
    { city: 'Minnesota', name: 'Timberwolves', abbr: 'MIN', conference: 'West', color: '#0C2340' },
    { city: 'New Orleans', name: 'Pelicans', abbr: 'NOP', conference: 'West', color: '#0C2340' },
    { city: 'Oklahoma City', name: 'Thunder', abbr: 'OKC', conference: 'West', color: '#007AC1' },
    { city: 'Phoenix', name: 'Suns', abbr: 'PHX', conference: 'West', color: '#1D1160' },
    { city: 'Portland', name: 'Trail Blazers', abbr: 'POR', conference: 'West', color: '#E03A3E' },
    { city: 'Sacramento', name: 'Kings', abbr: 'SAC', conference: 'West', color: '#5A2D81' },
    { city: 'San Antonio', name: 'Spurs', abbr: 'SAS', conference: 'West', color: '#C4CED4' },
    { city: 'Utah', name: 'Jazz', abbr: 'UTA', conference: 'West', color: '#002B5C' },
];

const FIRST_NAMES = [
    'James', 'Marcus', 'DeAndre', 'Jaylen', 'Tyrese', 'Zion', 'Luka', 'Trae', 'Ja', 'Shai',
    'Anthony', 'Darius', 'Evan', 'Jalen', 'Cade', 'Paolo', 'Victor', 'Brandon', 'Scottie', 'Desmond',
    'Malik', 'Isaiah', 'Tre', 'Cam', 'RJ', 'Keon', 'Jabari', 'Keegan', 'Bennedict', 'Walker',
    'Ayo', 'Dyson', 'Jaden', 'Herb', 'Keldon', 'Anfernee', 'Tyler', 'Coby', 'Deni', 'Josh',
    'Devin', 'Donovan', 'Jordan', 'Mikal', 'Chris', 'Kevin', 'Jayson', 'Bam', 'Damian', 'Stephen',
    'LeBron', 'Nikola', 'Joel', 'Giannis', 'Jimmy', 'Paul', 'Russell', 'Kyle', 'Fred', 'Pascal',
    'Andre', 'Michael', 'David', 'Robert', 'William', 'Daniel', 'Matthew', 'Kenneth', 'Charles', 'Thomas',
    'Terrence', 'Derrick', 'Xavier', 'Quincy', 'Dwayne', 'Rasheed', 'Lamar', 'Cedric', 'Jerome', 'Reggie',
    'Aaron', 'Brandon', 'Calvin', 'Dante', 'Eric', 'Frank', 'Gary', 'Hassan', 'Ivan', 'Jamal',
    'Keith', 'Lance', 'Maurice', 'Nate', 'Oscar', 'Patrick', 'Quentin', 'Ray', 'Sam', 'Tony'
];

const LAST_NAMES = [
    'Williams', 'Johnson', 'Brown', 'Davis', 'Smith', 'Jones', 'Wilson', 'Thomas', 'Jackson', 'White',
    'Harris', 'Robinson', 'Clark', 'Lewis', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott',
    'Green', 'Baker', 'Adams', 'Nelson', 'Carter', 'Mitchell', 'Turner', 'Phillips', 'Campbell', 'Parker',
    'Evans', 'Edwards', 'Collins', 'Stewart', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell',
    'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Howard', 'Ward', 'Watson', 'Brooks', 'Sanders',
    'Price', 'Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson', 'Coleman', 'Jenkins', 'Perry', 'Powell',
    'Long', 'Patterson', 'Hughes', 'Washington', 'Butler', 'Simmons', 'Foster', 'Graham', 'Sullivan', 'Hart',
    'Stone', 'Porter', 'Hunter', 'Gibson', 'Mills', 'Warren', 'Fox', 'Rose', 'Rice', 'Black',
    'Murray', 'Freeman', 'Wells', 'Webb', 'Simpson', 'Stevens', 'Tucker', 'Dixon', 'Hunt', 'Palmer',
    'Grant', 'Hamilton', 'Duncan', 'Crawford', 'Cunningham', 'George', 'Burton', 'Hayes', 'Griffin', 'Payne'
];
