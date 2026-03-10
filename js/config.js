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
        slow: { growthMultiplier: 1 },
        normal: { growthMultiplier: 2 },
        fast: { growthMultiplier: 6.0 },
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

// ============================================================
// CAREER MODE CONFIG
// ============================================================

const CAREER_CONFIG = {
    HS_SEASONS: 4,
    HS_GAMES_PER_SEASON: 25,
    COLLEGE_GAMES_PER_SEASON: 30,
    COLLEGE_MAX_YEARS: 4,
    MARCH_MADNESS_TEAMS: 64,
    CONFERENCE_AUTO_BIDS: 32,
    AT_LARGE_BIDS: 32,
    PLAYER_CREATE_POINTS: 350,
    ATTR_MIN: 25,
    ATTR_MAX: 85,
    NBA_CAREER_MAX_YEARS: 20,
};

// High School tiers
const HS_TIERS = ['Elite Prep', 'Top Program', 'Competitive', 'Average', 'Developing'];

// College Conferences
const COLLEGE_CONFERENCES = [
    { name: 'ACC', prestige: 95 },
    { name: 'Big Ten', prestige: 93 },
    { name: 'SEC', prestige: 92 },
    { name: 'Big 12', prestige: 90 },
    { name: 'Big East', prestige: 88 },
    { name: 'Pac-12', prestige: 85 },
    { name: 'AAC', prestige: 72 },
    { name: 'Mountain West', prestige: 68 },
    { name: 'WCC', prestige: 65 },
    { name: 'A-10', prestige: 63 },
    { name: 'Missouri Valley', prestige: 58 },
    { name: 'Colonial', prestige: 52 },
    { name: 'Horizon', prestige: 50 },
    { name: 'Sun Belt', prestige: 48 },
    { name: 'MAC', prestige: 46 },
    { name: 'Patriot', prestige: 44 },
];

// College Teams (4 per conference = 64 teams for March Madness)
const COLLEGE_TEAMS_DATA = [
    // ACC
    { name: 'Duke', mascot: 'Blue Devils', abbr: 'DUKE', conference: 'ACC', prestige: 98 },
    { name: 'North Carolina', mascot: 'Tar Heels', abbr: 'UNC', conference: 'ACC', prestige: 97 },
    { name: 'Virginia', mascot: 'Cavaliers', abbr: 'UVA', conference: 'ACC', prestige: 88 },
    { name: 'Louisville', mascot: 'Cardinals', abbr: 'LOU', conference: 'ACC', prestige: 85 },
    // Big Ten
    { name: 'Michigan State', mascot: 'Spartans', abbr: 'MSU', conference: 'Big Ten', prestige: 95 },
    { name: 'Michigan', mascot: 'Wolverines', abbr: 'MICH', conference: 'Big Ten', prestige: 88 },
    { name: 'Purdue', mascot: 'Boilermakers', abbr: 'PUR', conference: 'Big Ten', prestige: 87 },
    { name: 'Illinois', mascot: 'Fighting Illini', abbr: 'ILL', conference: 'Big Ten', prestige: 82 },
    // SEC
    { name: 'Kentucky', mascot: 'Wildcats', abbr: 'UK', conference: 'SEC', prestige: 97 },
    { name: 'Auburn', mascot: 'Tigers', abbr: 'AUB', conference: 'SEC', prestige: 85 },
    { name: 'Tennessee', mascot: 'Volunteers', abbr: 'TENN', conference: 'SEC', prestige: 83 },
    { name: 'Alabama', mascot: 'Crimson Tide', abbr: 'BAMA', conference: 'SEC', prestige: 80 },
    // Big 12
    { name: 'Kansas', mascot: 'Jayhawks', abbr: 'KU', conference: 'Big 12', prestige: 97 },
    { name: 'Baylor', mascot: 'Bears', abbr: 'BAY', conference: 'Big 12', prestige: 86 },
    { name: 'Texas', mascot: 'Longhorns', abbr: 'TEX', conference: 'Big 12', prestige: 84 },
    { name: 'Houston', mascot: 'Cougars', abbr: 'HOU', conference: 'Big 12', prestige: 82 },
    // Big East
    { name: 'Villanova', mascot: 'Wildcats', abbr: 'NOVA', conference: 'Big East', prestige: 93 },
    { name: 'UConn', mascot: 'Huskies', abbr: 'UCONN', conference: 'Big East', prestige: 95 },
    { name: 'Creighton', mascot: 'Bluejays', abbr: 'CREI', conference: 'Big East', prestige: 78 },
    { name: 'Marquette', mascot: 'Golden Eagles', abbr: 'MARQ', conference: 'Big East', prestige: 75 },
    // Pac-12
    { name: 'UCLA', mascot: 'Bruins', abbr: 'UCLA', conference: 'Pac-12', prestige: 95 },
    { name: 'Arizona', mascot: 'Wildcats', abbr: 'ARIZ', conference: 'Pac-12', prestige: 90 },
    { name: 'Oregon', mascot: 'Ducks', abbr: 'ORE', conference: 'Pac-12', prestige: 78 },
    { name: 'USC', mascot: 'Trojans', abbr: 'USC', conference: 'Pac-12', prestige: 76 },
    // AAC
    { name: 'Memphis', mascot: 'Tigers', abbr: 'MEM', conference: 'AAC', prestige: 78 },
    { name: 'SMU', mascot: 'Mustangs', abbr: 'SMU', conference: 'AAC', prestige: 68 },
    { name: 'Wichita State', mascot: 'Shockers', abbr: 'WICH', conference: 'AAC', prestige: 72 },
    { name: 'Temple', mascot: 'Owls', abbr: 'TEM', conference: 'AAC', prestige: 65 },
    // Mountain West
    { name: 'San Diego State', mascot: 'Aztecs', abbr: 'SDSU', conference: 'Mountain West', prestige: 75 },
    { name: 'Nevada', mascot: 'Wolf Pack', abbr: 'NEV', conference: 'Mountain West', prestige: 68 },
    { name: 'Boise State', mascot: 'Broncos', abbr: 'BSU', conference: 'Mountain West', prestige: 62 },
    { name: 'Colorado State', mascot: 'Rams', abbr: 'CSU', conference: 'Mountain West', prestige: 58 },
    // WCC
    { name: 'Gonzaga', mascot: 'Bulldogs', abbr: 'GONZ', conference: 'WCC', prestige: 96 },
    { name: 'Saint Mary\'s', mascot: 'Gaels', abbr: 'SMC', conference: 'WCC', prestige: 75 },
    { name: 'BYU', mascot: 'Cougars', abbr: 'BYU', conference: 'WCC', prestige: 72 },
    { name: 'San Francisco', mascot: 'Dons', abbr: 'USF', conference: 'WCC', prestige: 60 },
    // A-10
    { name: 'Dayton', mascot: 'Flyers', abbr: 'DAY', conference: 'A-10', prestige: 72 },
    { name: 'VCU', mascot: 'Rams', abbr: 'VCU', conference: 'A-10', prestige: 70 },
    { name: 'Saint Louis', mascot: 'Billikens', abbr: 'SLU', conference: 'A-10', prestige: 62 },
    { name: 'Richmond', mascot: 'Spiders', abbr: 'RICH', conference: 'A-10', prestige: 58 },
    // Missouri Valley
    { name: 'Loyola Chicago', mascot: 'Ramblers', abbr: 'LUC', conference: 'Missouri Valley', prestige: 65 },
    { name: 'Drake', mascot: 'Bulldogs', abbr: 'DRAK', conference: 'Missouri Valley', prestige: 58 },
    { name: 'Bradley', mascot: 'Braves', abbr: 'BRAD', conference: 'Missouri Valley', prestige: 50 },
    { name: 'Missouri State', mascot: 'Bears', abbr: 'MOST', conference: 'Missouri Valley', prestige: 48 },
    // Colonial
    { name: 'Charleston', mascot: 'Cougars', abbr: 'CHAR', conference: 'Colonial', prestige: 58 },
    { name: 'Hofstra', mascot: 'Pride', abbr: 'HOF', conference: 'Colonial', prestige: 50 },
    { name: 'Drexel', mascot: 'Dragons', abbr: 'DREX', conference: 'Colonial', prestige: 48 },
    { name: 'Delaware', mascot: 'Fightin Blue Hens', abbr: 'DEL', conference: 'Colonial', prestige: 45 },
    // Horizon
    { name: 'Wright State', mascot: 'Raiders', abbr: 'WRST', conference: 'Horizon', prestige: 52 },
    { name: 'Northern Kentucky', mascot: 'Norse', abbr: 'NKU', conference: 'Horizon', prestige: 48 },
    { name: 'Oakland', mascot: 'Grizzlies', abbr: 'OAK', conference: 'Horizon', prestige: 46 },
    { name: 'Cleveland State', mascot: 'Vikings', abbr: 'CSU2', conference: 'Horizon', prestige: 42 },
    // Sun Belt
    { name: 'Louisiana', mascot: 'Ragin Cajuns', abbr: 'ULL', conference: 'Sun Belt', prestige: 55 },
    { name: 'Georgia State', mascot: 'Panthers', abbr: 'GAST', conference: 'Sun Belt', prestige: 50 },
    { name: 'Texas State', mascot: 'Bobcats', abbr: 'TXST', conference: 'Sun Belt', prestige: 45 },
    { name: 'App State', mascot: 'Mountaineers', abbr: 'APP', conference: 'Sun Belt', prestige: 44 },
    // MAC
    { name: 'Ohio', mascot: 'Bobcats', abbr: 'OHIO', conference: 'MAC', prestige: 55 },
    { name: 'Toledo', mascot: 'Rockets', abbr: 'TOL', conference: 'MAC', prestige: 50 },
    { name: 'Buffalo', mascot: 'Bulls', abbr: 'BUFF', conference: 'MAC', prestige: 48 },
    { name: 'Kent State', mascot: 'Golden Flashes', abbr: 'KENT', conference: 'MAC', prestige: 45 },
    // Patriot
    { name: 'Navy', mascot: 'Midshipmen', abbr: 'NAVY', conference: 'Patriot', prestige: 52 },
    { name: 'Army', mascot: 'Black Knights', abbr: 'ARMY', conference: 'Patriot', prestige: 48 },
    { name: 'Colgate', mascot: 'Raiders', abbr: 'COLG', conference: 'Patriot', prestige: 50 },
    { name: 'Bucknell', mascot: 'Bison', abbr: 'BUCK', conference: 'Patriot', prestige: 46 },
];

// High School names
const HS_NAMES = [
    'Oak Hill Academy', 'Montverde Academy', 'IMG Academy', 'Sierra Canyon',
    'Duncanville', 'La Lumiere', 'Sunrise Christian', 'AZ Compass Prep',
    'Prolific Prep', 'Wasatch Academy', 'Brewster Academy', 'Findlay Prep',
    'DeMatha Catholic', 'St. Vincent-St. Mary', 'Mater Dei', 'Bishop Gorman',
    'Centennial', 'Hillcrest Prep', 'Link Academy', 'Heritage Christian',
];
