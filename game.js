// ============================================================
// SEGMENT DISCOVERY — A Neuralift Dungeon
// ============================================================

const TILE = 32;
const COLS = 31;  // 1000 / 32 ≈ 31
const ROWS = 23;  // 750 / 32 ≈ 23
const MAX_LIVES = 3;
const TOTAL_LEVELS = 6;
const MAX_INVENTORY = 6;

// Tile types
const T = {
    VOID: 0, FLOOR: 1, WALL: 2, DOOR: 3,
    STAIRS_DOWN: 4, STAIRS_UP: 5,
    CHEST: 6, CHEST_OPEN: 7, CHEST_HIDDEN: 8,
};

// Game states
const STATE = { EXPLORE: 0, BATTLE: 1, QUIZ: 2, BATTLE_INTRO: 3, BATTLE_RESULT: 4, NEURALIFT: 5, INVENTORY: 6 };

// Colors
const C = {
    void: '#090016', floor: '#1a1028', floorAlt: '#1e1230',
    wall: '#2a1848', wallTop: '#3d2466', door: '#4a3070',
    stairs: '#7E0CF7', stairsUp: '#444466',
    chest: '#f0c040', chestOpen: '#665520',
    player: '#22bbaa', playerOutline: '#44ddcc',
    playerNeuralifted: '#7E0CF7', playerNeuraliftedOutline: '#b060ff',
    hpBar: '#44ff44', hpBarBg: '#333',
};

// ============================================================
// CHARACTERS
// ============================================================

const CHARACTERS = {
    analyst: {
        name: 'Alex Chen',
        title: 'Data Analyst',
        desc: 'Skilled with queries but drowning in spreadsheets. Knows the data is hiding something.',
        weapon: 'Staff of Deep Learning',
        color: '#22bbaa',
        colorDk: '#188878',
        colorLt: '#44ddcc',
        hair: '#553322',
        hairStyle: 'short',
        skin: '#ddbb99',
        skinDk: '#cc9977',
        eyeColor: '#336655',
        outfit: '#22bbaa',
        outfitDk: '#188878',
    },
    marketing: {
        name: 'Jordan Blake',
        title: 'Marketing Executive',
        desc: 'Runs campaigns on instinct but craves data-backed decisions. Ready to go deeper.',
        weapon: 'Campaign Wand',
        color: '#dd6644',
        colorDk: '#aa4422',
        colorLt: '#ff8866',
        hair: '#ccaa55',
        hairStyle: 'swept',
        skin: '#eecca8',
        skinDk: '#ddbb97',
        eyeColor: '#446688',
        outfit: '#dd6644',
        outfitDk: '#aa4422',
    },
    scientist: {
        name: 'Dr. Maya Patel',
        title: 'Data Scientist',
        desc: 'Builds models by day, questions assumptions by night. Knows there has to be a better way.',
        weapon: 'Model Staff',
        color: '#33aa66',
        colorDk: '#228844',
        colorLt: '#55cc88',
        hair: '#221122',
        hairStyle: 'long',
        skin: '#cc9966',
        skinDk: '#bb8855',
        eyeColor: '#334433',
        outfit: '#33aa66',
        outfitDk: '#228844',
    },
    cxo: {
        name: 'Sarah Owens',
        title: 'Chief Experience Officer',
        desc: 'Sees the big picture but needs the proof points. Won\'t settle for surface-level insight.',
        weapon: 'Strategy Sceptre',
        color: '#cc9922',
        colorDk: '#aa7711',
        colorLt: '#eebb44',
        hair: '#1a1016',
        hairStyle: 'updo',
        skin: '#bb8866',
        skinDk: '#aa7755',
        eyeColor: '#443322',
        outfit: '#cc9922',
        outfitDk: '#aa7711',
    },
};

// ============================================================
// SEGMENTS
// ============================================================

const SEGMENT_NAMES = [
    'High-Value Dormant Fans', 'Cross-Genre Enthusiasts', 'Hidden Premium Buyers',
    'Lapsed Loyalty Reactivators', 'Omnichannel Power Users', 'Silent High-Spenders',
    'Event-Triggered Converters', 'Social-First Brand Advocates', 'Seasonal Surge Cohort',
    'Micro-Niche Superfans', 'Undervalued Mid-Tier Lifters', 'Churn-Risk Champions',
];

// ============================================================
// WEAPONS & ITEMS
// ============================================================

const WEAPONS = {
    staff: {
        name: 'Staff of Deep Learning', atk: 3, char: '|',
        desc: 'Your starting weapon. Channels raw neural power.',
    },
    blade: {
        name: 'Gradient Descent Blade', atk: 5, char: '/',
        desc: 'Each swing optimises toward the target.',
    },
    transformer: {
        name: "Transformer's Edge", atk: 7, char: '\u2020',
        desc: 'Attends to all positions simultaneously.',
    },
};

const ITEM_DEFS = {
    gpu_shield: {
        name: 'GPU Shield', icon: '\u25CB', color: '#44aaff',
        desc: 'Activate a shield. Halves damage for the first 3 hits of your next battle.',
        context: 'Anytime',
        battleUse: true, exploreUse: true,
        exploreEffect: (game) => {
            game.gpuShieldReady = 3;
            game.addMessage('GPU Shield activated! Protection ready for next battle.', 'info');
            return true;
        },
        effect: (battle) => {
            battle.playerBuffs.gpuShield = 3;
            return 'GPU Shield activated! Damage halved for 3 turns.';
        },
    },
    denoiser: {
        name: 'Denoiser', icon: '~', color: '#88ffaa',
        desc: 'Weakens an enemy. Reduces their atk by 2. Bonus 4 damage vs Noise.',
        context: 'Battle',
        battleUse: true, exploreUse: false,
        effect: (battle) => {
            let msg = 'Denoiser deployed! Enemy attack reduced by 2.';
            battle.enemy.atk = Math.max(1, battle.enemy.atk - 2);
            if (battle.enemy.type === 'noise') {
                battle.enemy.hp -= 4;
                msg += ' Super effective vs Noise! 4 bonus damage!';
            }
            return msg;
        },
    },
    hyperparameterizer: {
        name: 'Hyperparameterizer', icon: '\u03B8', color: '#ffaa44',
        desc: 'Boosts your attack power by +3 for 3 turns of combat.',
        context: 'Battle',
        battleUse: true, exploreUse: false,
        effect: (battle) => {
            battle.playerBuffs.hyperParam = { turns: 3, bonus: 3 };
            return 'Parameters tuned! +3 attack for 3 turns.';
        },
    },
    neural_cloak: {
        name: 'Neural Cloak', icon: '\u00A7', color: '#aa66ff',
        desc: 'Grants stealth. Your next room encounter is skipped entirely.',
        context: 'Explore',
        battleUse: false, exploreUse: true,
        exploreEffect: (game) => {
            game.stealthActive = true;
            game.addMessage('Neural Cloak engaged! Next encounter will be avoided.', 'boss');
            return true;
        },
    },
    batch_normalizer: {
        name: 'Batch Normalizer', icon: '+', color: '#44ff44',
        desc: 'Heals 5 HP instantly. Usable anytime.',
        context: 'Anytime',
        battleUse: true, exploreUse: true,
        exploreEffect: (game) => {
            if (game.player.hp >= game.player.maxHp) {
                game.addMessage('Already at full HP!', 'info');
                return false;
            }
            const heal = 5;
            game.player.hp = Math.min(game.player.maxHp, game.player.hp + heal);
            game.addMessage(`Batch Normalizer applied! Restored ${heal} HP.`, 'info');
            return true;
        },
        effect: (battle) => {
            const heal = 5;
            battle.game.player.hp = Math.min(battle.game.player.maxHp, battle.game.player.hp + heal);
            return `Batch Normalizer applied! Restored ${heal} HP.`;
        },
    },
    dropout_layer: {
        name: 'Dropout Layer', icon: '\u2205', color: '#ff8844',
        desc: "Forces the enemy to miss their next attack in combat.",
        context: 'Battle',
        battleUse: true, exploreUse: false,
        effect: (battle) => {
            battle.playerBuffs.dropout = 1;
            return 'Dropout Layer active! Enemy will miss their next attack.';
        },
    },
    attention_head: {
        name: 'Attention Head', icon: '\u2299', color: '#ff44aa',
        desc: 'Your next attack in combat will be a critical hit dealing 2x damage.',
        context: 'Battle',
        battleUse: true, exploreUse: false,
        effect: (battle) => {
            battle.playerBuffs.critical = true;
            return 'Attention focused! Your next attack will be a critical hit!';
        },
    },
    regularizer: {
        name: 'Regularizer', icon: '\u03BB', color: '#66bbff',
        desc: 'Caps enemy damage at 2 for the entire battle. Great vs bosses.',
        context: 'Battle',
        battleUse: true, exploreUse: false,
        effect: (battle) => {
            battle.playerBuffs.regularizer = true;
            return 'Regularizer applied! Enemy damage capped at 2.';
        },
    },
    lr_scheduler: {
        name: 'LR Scheduler', icon: '\u2191', color: '#ffff44',
        desc: 'Each successive attack in combat deals +1 more damage than the last.',
        context: 'Battle',
        battleUse: true, exploreUse: false,
        effect: (battle) => {
            battle.playerBuffs.lrScheduler = true;
            battle.playerBuffs.lrBonus = 0;
            return 'Learning Rate Scheduler active! Attacks grow stronger each turn.';
        },
    },
};

// Neuralift — the ultimate power-up (not a regular inventory item)
const NEURALIFT_DEF = {
    name: 'NEURALIFT', icon: '\u2726', color: '#7E0CF7',
    desc: 'The Segmenter. Discovers everything.',
};

// Item drop tables per level range
function getRandomItem(level) {
    const pool = ['gpu_shield', 'denoiser', 'batch_normalizer', 'dropout_layer', 'neural_cloak'];
    if (level >= 2) pool.push('hyperparameterizer', 'attention_head');
    if (level >= 3) pool.push('regularizer', 'lr_scheduler');
    return pool[Math.floor(Math.random() * pool.length)];
}

function getChestWeapon(level) {
    if (level >= 5) return Math.random() < 0.4 ? 'transformer' : 'blade';
    if (level >= 3) return 'blade';
    return null;
}

// ============================================================
// ENEMIES
// ============================================================

const ENEMY_DEFS = {
    noise: {
        name: 'Noise', hp: 6, atk: 2, color: '#ff6644', char: 'N',
        intro: 'Random Noise floods the signal!',
        attacks: ['scatters random values', 'corrupts your features', 'broadcasts static'],
    },
    bias: {
        name: 'Bias', hp: 8, atk: 2, color: '#ff8844', char: 'B',
        intro: 'Human Bias distorts the truth!',
        attacks: ['applies confirmation bias', 'filters inconvenient data', 'cherry-picks features'],
    },
    silo: {
        name: 'Data Silo', hp: 10, atk: 3, color: '#4488ff', char: 'S',
        intro: 'A Data Silo blocks your view!',
        attacks: ['walls off a dataset', 'fragments your features', 'denies access'],
    },
    rules: {
        name: 'Rules Engine', hp: 12, atk: 3, color: '#ffaa00', char: 'R',
        intro: 'The Rules Engine enforces rigid logic!',
        attacks: ['applies boolean filter', 'forces a hard threshold', 'rejects nuance'],
    },
    excel: {
        name: 'Spreadsheet', hp: 8, atk: 2, color: '#44bb44', char: 'X',
        intro: 'A rogue Spreadsheet attacks!',
        attacks: ['throws a pivot table', 'launches VLOOKUP', 'crashes with #REF!'],
    },
    sql: {
        name: 'SQL QUERY', hp: 20, atk: 4, color: '#ff44ff', char: 'Q', isBoss: true,
        intro: 'BOSS: SELECT * FROM bias WHERE insight = FALSE',
        attacks: ['executes DROP TABLE insight', 'runs a nested subquery', 'locks the database', 'triggers a full table scan'],
    },
};

// Encounter table — what enemies can appear at each level + probability of encounter per room
const ENCOUNTER_TABLE = [
    { chance: 0.5, pool: [['noise', 0.8], ['bias', 0.2]] },
    { chance: 0.55, pool: [['noise', 0.5], ['bias', 0.35], ['excel', 0.15]] },
    { chance: 0.6, pool: [['bias', 0.3], ['excel', 0.3], ['silo', 0.25], ['noise', 0.15]] },
    { chance: 0.65, pool: [['silo', 0.3], ['rules', 0.3], ['bias', 0.25], ['excel', 0.15]] },
    { chance: 0.7, pool: [['rules', 0.35], ['silo', 0.3], ['excel', 0.2], ['bias', 0.15]] },
    { chance: 0.5, pool: [['noise', 0.3], ['bias', 0.3], ['rules', 0.25], ['silo', 0.15]] }, // Level 6 rooms (boss is separate)
];

function rollEncounter(level) {
    const table = ENCOUNTER_TABLE[Math.min(level - 1, ENCOUNTER_TABLE.length - 1)];
    if (Math.random() > table.chance) return null;
    const roll = Math.random();
    let cumulative = 0;
    for (const [type, prob] of table.pool) {
        cumulative += prob;
        if (roll < cumulative) return type;
    }
    return table.pool[table.pool.length - 1][0];
}

// ============================================================
// QUIZ QUESTIONS
// ============================================================

const QUIZ_QUESTIONS = [
    { q: 'What is the biggest limitation of rules-based segmentation?', answers: ['It only finds what you already expect', 'It costs too much', 'It takes too long to run', 'It requires too much storage'], correct: 0 },
    { q: 'What does "human bias" in segmentation mean?', answers: ['Analysts only test hypotheses they already believe', 'Humans type too slowly', 'Manual processes use too much RAM', 'Teams forget to save their queries'], correct: 0 },
    { q: 'Why is demographic data alone a poor predictor of purchase behaviour?', answers: ['Demographics are too expensive to collect', 'People with identical demographics often have very different preferences and buying patterns', 'It only works for B2B companies', 'Demographic data violates GDPR'], correct: 1 },
    { q: 'What is "Lift Potential"?', answers: ['How heavy the data warehouse is', 'The value of moving a customer between states', 'A type of SQL function', 'Server uptime percentage'], correct: 1 },
    { q: 'Why do data silos hurt segmentation?', answers: ['They use too much electricity', 'They prevent seeing the full customer picture', 'They make dashboards ugly', 'They slow down email sends'], correct: 1 },
    { q: 'What is a "lookalike audience" based on?', answers: ['People who look physically similar', 'A seed set of high-quality first-party data, used to find similar users at scale', 'Accounts with the same password', 'Customers in the same timezone'], correct: 1 },
    { q: 'What does RFM stand for in marketing analytics?', answers: ['Recency, Frequency, Monetary', 'Real-time Feature Mapping', 'Revenue From Marketing', 'Reach, Funnel, Metrics'], correct: 0 },
    { q: 'Why is sampling problematic for segmentation?', answers: ['It can miss small but valuable micro-segments', 'It makes charts look wrong', 'Databases cannot handle samples', 'It violates GDPR'], correct: 0 },
    { q: 'What is "churn" in a customer context?', answers: ['A database backup method', 'When customers stop engaging or buying', 'A type of data visualisation', 'Server processing speed'], correct: 1 },
    { q: 'What advantage does AI segmentation have over SQL queries?', answers: ['It runs on cheaper hardware', 'It discovers patterns humans wouldn\'t think to test', 'It uses less data', 'It doesn\'t need a database'], correct: 1 },
    { q: 'What is Customer Lifetime Value (CLV/LTV)?', answers: ['How long a customer has been alive', 'Predicted total revenue from a customer relationship', 'The age of a customer record', 'Average session duration'], correct: 1 },
    { q: 'What does "explainable AI" mean for marketing teams?', answers: ['AI that can write documentation', 'AI outputs come with clear reasoning, not just numbers', 'AI that explains itself to regulators only', 'A chatbot for customer service'], correct: 1 },
    { q: 'Why are boolean filters limiting for segmentation?', answers: ['They crash the database', 'They force binary yes/no splits, missing nuance', 'Boolean logic is deprecated', 'They only work in Excel'], correct: 1 },
    { q: 'What is "bottom-up segmentation"?', answers: ['Building segments from the smallest data points upward', 'Manually cutting data at the divisional or single-tool level, based on predefined criteria', 'Letting junior analysts define the segments first', 'Starting with individual customers and clustering them'], correct: 1 },
    { q: 'Why is feature engineering important in segmentation?', answers: ['It makes the UI look better', 'It creates meaningful variables from raw data for the model', 'It reduces server costs', 'It encrypts customer data'], correct: 1 },
    { q: 'What is a "persona" in marketing?', answers: ['A fictional user account for testing', 'A qualitative archetype representing a customer segment, used to guide messaging and strategy', 'A username on social media', 'An executive sponsor'], correct: 1 },
    { q: 'What does CAC stand for?', answers: ['Customer Acquisition Cost', 'Central Analytics Committee', 'Cached Application Content', 'Customer Activity Counter'], correct: 0 },
    { q: 'Which data type would a traditional segmentation model likely miss?', answers: ['Age', 'Cross-genre event attendance patterns', 'Gender', 'Email address'], correct: 1 },
    { q: 'What is the risk of relying on demographic segmentation alone?', answers: ['It violates patents', 'It assumes behaviour follows demographics, which it often doesn\'t', 'Demographics are too expensive to collect', 'It only works for B2B'], correct: 1 },
    { q: 'Why is Neuralift\'s consumption-based pricing model better for customers?', answers: ['It\'s the cheapest option on the market', 'It doesn\'t lock you in, and provides total usage flexibility', 'It charges per user seat', 'It requires a 3-year minimum contract'], correct: 1 },
    { q: 'What AI technology underpins Neuralift\'s unsupervised learning approach?', answers: ['Large language models', 'Deep learning neural network', 'Decision trees and random forests', 'Reinforcement learning agents'], correct: 1 },
    { q: 'Why is Neuralift described as a "context engine" rather than just a segmentation tool?', answers: ['It connects to more data sources than competitors', 'It creates a narrative layer alongside the mathematics', 'It replaces your entire data warehouse', 'It only works with contextual advertising data'], correct: 1 },
    { q: 'What problem does Neuralift solve for data science teams specifically?', answers: ['It replaces the need for data scientists entirely', 'It automates deep segmentation that otherwise takes weeks or months', 'It writes SQL queries for them', 'It manages their cloud infrastructure'], correct: 1 },
    { q: 'What is the typical starting point for a Neuralift engagement?', answers: ['A 12-month enterprise licence', 'A single-use-case pilot with no long-term commitment', 'A full data warehouse migration', 'A six-month proof of concept'], correct: 1 },
    { q: 'What does Neuralift\'s Reasoning module do?', answers: ['It runs the neural network training', 'Uses frontier LLMs to create narratives, insights, strategies and personas from the neural output', 'It manages user permissions and access control', 'It optimises SQL query performance'], correct: 1 },
    { q: 'How much incremental revenue did Neuralift\'s launch customer generate through deep learning segmentation?', answers: ['$100', '$10,000', '$100,000', 'Over $10,000,000'], correct: 3 },
];

// ============================================================
// DUNGEON GENERATOR
// ============================================================

class Dungeon {
    constructor(level) {
        this.level = level;
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(T.VOID));
        this.rooms = [];
        this.generate();
    }

    generate() {
        const roomCount = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < 200 && this.rooms.length < roomCount; i++) {
            const w = 4 + Math.floor(Math.random() * 5);
            const h = 4 + Math.floor(Math.random() * 4);
            const x = 1 + Math.floor(Math.random() * (COLS - w - 2));
            const y = 1 + Math.floor(Math.random() * (ROWS - h - 2));
            if (!this.overlaps(x, y, w, h)) {
                this.rooms.push({ x, y, w, h, searched: false, encounterDone: false, bossRoom: false });
                this.carveRoom(x, y, w, h);
            }
        }
        for (let i = 1; i < this.rooms.length; i++) {
            this.carveCorridor(this.rooms[i - 1], this.rooms[i]);
        }
        this.buildWalls();
    }

    overlaps(x, y, w, h) {
        for (const r of this.rooms) {
            if (x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y) return true;
        }
        return false;
    }

    carveRoom(x, y, w, h) {
        for (let ry = y; ry < y + h; ry++)
            for (let rx = x; rx < x + w; rx++)
                this.grid[ry][rx] = T.FLOOR;
    }

    carveCorridor(a, b) {
        let ax = Math.floor(a.x + a.w / 2), ay = Math.floor(a.y + a.h / 2);
        const bx = Math.floor(b.x + b.w / 2), by = Math.floor(b.y + b.h / 2);
        while (ax !== bx) { if (ax >= 0 && ax < COLS && ay >= 0 && ay < ROWS) this.grid[ay][ax] = T.FLOOR; ax += ax < bx ? 1 : -1; }
        while (ay !== by) { if (ax >= 0 && ax < COLS && ay >= 0 && ay < ROWS) this.grid[ay][ax] = T.FLOOR; ay += ay < by ? 1 : -1; }
    }

    buildWalls() {
        const copy = this.grid.map(r => [...r]);
        for (let y = 0; y < ROWS; y++)
            for (let x = 0; x < COLS; x++)
                if (copy[y][x] === T.VOID)
                    for (let dy = -1; dy <= 1; dy++)
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = y + dy, nx = x + dx;
                            if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && copy[ny][nx] === T.FLOOR)
                                this.grid[y][x] = T.WALL;
                        }
    }

    getRandomFloorInRoom(idx) {
        const r = this.rooms[idx];
        return { x: r.x + 1 + Math.floor(Math.random() * Math.max(1, r.w - 2)), y: r.y + 1 + Math.floor(Math.random() * Math.max(1, r.h - 2)) };
    }

    getRandomFloorInSpecificRoom(idx, exclude) {
        const r = this.rooms[idx];
        const c = [];
        for (let ry = r.y + 1; ry < r.y + r.h - 1; ry++)
            for (let rx = r.x + 1; rx < r.x + r.w - 1; rx++)
                if ((this.grid[ry][rx] === T.FLOOR || this.grid[ry][rx] === T.CHEST_HIDDEN) && !exclude.some(e => e.x === rx && e.y === ry))
                    c.push({ x: rx, y: ry });
        return c.length > 0 ? c[Math.floor(Math.random() * c.length)] : null;
    }

    getRandomFloor(exclude) {
        const f = [];
        for (let y = 0; y < ROWS; y++)
            for (let x = 0; x < COLS; x++)
                if (this.grid[y][x] === T.FLOOR && !exclude.some(e => e.x === x && e.y === y))
                    f.push({ x, y });
        return f[Math.floor(Math.random() * f.length)];
    }

    getRoomAt(x, y) {
        for (let i = 0; i < this.rooms.length; i++) {
            const r = this.rooms[i];
            if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i;
        }
        return -1;
    }

    getFurthestRoom(fromIdx) {
        let best = -1, bestDist = -1;
        const f = this.rooms[fromIdx];
        const fx = f.x + f.w / 2, fy = f.y + f.h / 2;
        for (let i = 0; i < this.rooms.length; i++) {
            if (i === fromIdx) continue;
            const r = this.rooms[i];
            const d = (r.x + r.w / 2 - fx) ** 2 + (r.y + r.h / 2 - fy) ** 2;
            if (d > bestDist) { bestDist = d; best = i; }
        }
        return best;
    }
}

// ============================================================
// BATTLE SYSTEM
// ============================================================

class Battle {
    constructor(game, enemyType) {
        this.game = game;
        this.type = enemyType;
        const def = ENEMY_DEFS[enemyType];
        const lvl = game.level;

        this.enemy = {
            name: def.name,
            hp: def.hp + Math.floor(lvl * 1.5),
            maxHp: def.hp + Math.floor(lvl * 1.5),
            atk: def.atk + Math.floor(lvl * 0.3),
            color: def.color,
            char: def.char,
            type: enemyType,
            isBoss: !!def.isBoss,
            attacks: def.attacks,
        };

        this.playerBuffs = {
            gpuShield: 0,
            hyperParam: null,
            cloak: 0,
            dropout: 0,
            critical: false,
            regularizer: false,
            lrScheduler: false,
            lrBonus: 0,
        };

        this.turn = 'intro'; // intro -> player -> enemy -> player...
        this.log = [def.intro];
        this.selectedAction = 0; // 0=Attack, 1=Item
        this.showingItems = false;
        this.selectedItem = 0;
        this.animFrame = 0;
        this.shakePlayer = 0;
        this.shakeEnemy = 0;
        this.turnDelay = 0;
        this.finished = false;
        this.won = false;
        this.flashEnemy = 0;
        this.flashPlayer = 0;

        // Start intro delay
        this.introTimer = 60; // frames
    }

    update() {
        this.animFrame++;

        if (this.shakePlayer > 0) this.shakePlayer--;
        if (this.shakeEnemy > 0) this.shakeEnemy--;
        if (this.flashEnemy > 0) this.flashEnemy--;
        if (this.flashPlayer > 0) this.flashPlayer--;

        if (this.introTimer > 0) {
            this.introTimer--;
            if (this.introTimer === 0) this.turn = 'player';
            return;
        }

        if (this.turnDelay > 0) {
            this.turnDelay--;
            if (this.turnDelay === 0) {
                if (this.turn === 'enemy_acting') {
                    this.doEnemyAttack();
                } else if (this.turn === 'post_enemy') {
                    if (this.game.player.hp <= 0) {
                        this.finished = true;
                        this.won = false;
                    } else {
                        this.turn = 'player';
                        this.selectedAction = 0;
                        this.showingItems = false;
                    }
                } else if (this.turn === 'post_player') {
                    if (this.enemy.hp <= 0) {
                        this.finished = true;
                        this.won = true;
                    } else {
                        this.turn = 'enemy_acting';
                        this.turnDelay = 30;
                    }
                }
            }
            return;
        }
    }

    handleKey(key) {
        if (this.turn !== 'player') return;

        if (this.showingItems) {
            // Item selection
            const items = this.game.inventory.filter(it => ITEM_DEFS[it].battleUse);
            if (items.length === 0) {
                this.showingItems = false;
                return;
            }
            if (key === 'ArrowUp' || key === 'w') this.selectedItem = Math.max(0, this.selectedItem - 1);
            if (key === 'ArrowDown' || key === 's') this.selectedItem = Math.min(items.length - 1, this.selectedItem + 1);
            if (key === 'Escape' || key === 'ArrowLeft' || key === 'a') { this.showingItems = false; return; }
            if (key === 'Enter' || key === ' ' || key === 'ArrowRight' || key === 'd') {
                this.useItem(items[this.selectedItem]);
            }
            return;
        }

        if (key === 'ArrowUp' || key === 'w') this.selectedAction = Math.max(0, this.selectedAction - 1);
        if (key === 'ArrowDown' || key === 's') this.selectedAction = Math.min(1, this.selectedAction + 1);
        if (key === 'Enter' || key === ' ' || key === 'ArrowRight' || key === 'd') {
            this.executeAction();
        }
    }

    executeAction() {
        switch (this.selectedAction) {
            case 0: this.doPlayerAttack(); break;
            case 1: this.openItemMenu(); break;
        }
    }

    doPlayerAttack() {
        const weapon = WEAPONS[this.game.weapon];
        let dmg = weapon.atk + Math.floor(Math.random() * 2);

        // Buffs
        if (this.playerBuffs.hyperParam && this.playerBuffs.hyperParam.turns > 0) {
            dmg += this.playerBuffs.hyperParam.bonus;
            this.playerBuffs.hyperParam.turns--;
        }
        if (this.playerBuffs.lrScheduler) {
            dmg += this.playerBuffs.lrBonus;
            this.playerBuffs.lrBonus++;
        }
        if (this.playerBuffs.critical) {
            dmg *= 2;
            this.playerBuffs.critical = false;
            this.log.push('CRITICAL HIT!');
        }

        this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
        this.shakeEnemy = 8;
        this.flashEnemy = 8;
        this.log.push(`You strike with ${weapon.name} for ${dmg} damage!`);

        this.turn = 'post_player';
        this.turnDelay = 25;
    }

    openItemMenu() {
        const items = this.game.inventory.filter(it => ITEM_DEFS[it].battleUse);
        if (items.length === 0) {
            this.log.push('No items to use!');
            return;
        }
        this.showingItems = true;
        this.selectedItem = 0;
    }

    useItem(itemKey) {
        const def = ITEM_DEFS[itemKey];
        const msg = def.effect(this);
        this.log.push(msg);

        // Remove from inventory
        const idx = this.game.inventory.indexOf(itemKey);
        if (idx !== -1) this.game.inventory.splice(idx, 1);

        this.showingItems = false;
        this.turn = 'post_player';
        this.turnDelay = 25;
    }

    doEnemyAttack() {
        // Check dropout
        if (this.playerBuffs.dropout > 0) {
            this.playerBuffs.dropout--;
            this.log.push(`${this.enemy.name}'s neurons dropped out! Attack missed!`);
            this.turn = 'post_enemy';
            this.turnDelay = 25;
            return;
        }

        // Check cloak
        if (this.playerBuffs.cloak > 0) {
            this.playerBuffs.cloak--;
            this.log.push(`Neural Cloak! ${this.enemy.name}'s attack passes through you!`);
            this.turn = 'post_enemy';
            this.turnDelay = 25;
            return;
        }

        // Natural miss chance — higher for weaker enemies / earlier levels
        const missChance = this.enemy.isBoss ? 0.05 : Math.max(0.05, 0.35 - this.game.level * 0.04 - this.enemy.atk * 0.02);
        if (Math.random() < missChance) {
            const missMsgs = ['whiffs completely!', 'fumbles the attack!', 'loses focus!', 'misfires!'];
            this.log.push(`${this.enemy.name} ${missMsgs[Math.floor(Math.random() * missMsgs.length)]}`);
            this.turn = 'post_enemy';
            this.turnDelay = 25;
            return;
        }

        const atkText = this.enemy.attacks[Math.floor(Math.random() * this.enemy.attacks.length)];
        let dmg = this.enemy.atk + Math.floor(Math.random() * 2);

        // Regularizer
        if (this.playerBuffs.regularizer) {
            dmg = Math.min(2, dmg);
        }

        // GPU Shield
        if (this.playerBuffs.gpuShield > 0) {
            dmg = Math.max(1, Math.floor(dmg / 2));
            this.playerBuffs.gpuShield--;
        }

        // Neuralifted — enemies deal reduced damage
        if (this.game.neuraliftActive) {
            dmg = this.enemy.isBoss
                ? Math.max(1, Math.floor(dmg / 2))   // Boss: half damage
                : Math.max(1, Math.floor(dmg / 3));   // Regular: third damage
        }

        this.game.player.hp = Math.max(0, this.game.player.hp - dmg);
        this.shakePlayer = 8;
        this.flashPlayer = 8;
        this.log.push(`${this.enemy.name} ${atkText} for ${dmg} damage!`);

        this.turn = 'post_enemy';
        this.turnDelay = 25;
    }
}

// ============================================================
// GAME
// ============================================================

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = COLS * TILE;
        this.canvas.height = ROWS * TILE;

        this.messages = [];
        this.segmentsFound = [];
        this.animFrame = 0;
        this.usedQuestions = new Set();

        this.selectedCharKey = 'analyst';
        this.charData = CHARACTERS.analyst;

        this.bindEvents();
        this.buildCharSelect();
    }

    buildCharSelect() {
        const grid = document.getElementById('char-grid');
        const keys = Object.keys(CHARACTERS);
        keys.forEach((key, idx) => {
            const ch = CHARACTERS[key];
            const card = document.createElement('div');
            card.className = 'char-card' + (idx === 0 ? ' selected' : '');
            card.dataset.key = key;

            // Draw a mini avatar on a small canvas
            const avatarCanvas = document.createElement('canvas');
            avatarCanvas.width = 64;
            avatarCanvas.height = 64;
            avatarCanvas.className = 'char-avatar';
            this.drawMiniAvatar(avatarCanvas.getContext('2d'), ch);

            const info = document.createElement('div');
            info.className = 'char-info';
            info.innerHTML = `<div class="char-name">${ch.name}</div>` +
                `<div class="char-title">${ch.title}</div>` +
                `<div class="char-desc">${ch.desc}</div>` +
                `<div class="char-weapon">Weapon: ${ch.weapon}</div>`;

            card.appendChild(avatarCanvas);
            card.appendChild(info);

            card.addEventListener('click', () => {
                grid.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCharKey = key;
            });

            grid.appendChild(card);
        });
    }

    drawMiniAvatar(ctx, ch) {
        const s = 2; // scale: 64px canvas, drawing at 2x
        ctx.fillStyle = '#0d0620';
        ctx.fillRect(0, 0, 64, 64);

        // Feet
        ctx.fillStyle = '#554433';
        ctx.fillRect(9*s, 28*s, 4*s, 3*s);
        ctx.fillRect(18*s, 28*s, 4*s, 3*s);
        // Legs
        ctx.fillStyle = '#445566';
        ctx.fillRect(10*s, 23*s, 3*s, 6*s);
        ctx.fillRect(18*s, 23*s, 3*s, 6*s);
        // Body
        ctx.fillStyle = ch.outfit;
        ctx.fillRect(8*s, 13*s, 15*s, 11*s);
        ctx.fillStyle = ch.outfitDk;
        ctx.fillRect(8*s, 21*s, 15*s, 3*s);
        // Belt
        ctx.fillStyle = '#887744';
        ctx.fillRect(8*s, 19*s, 15*s, 2*s);
        // Arms
        ctx.fillStyle = ch.skin;
        ctx.fillRect(4*s, 14*s, 4*s, 7*s);
        ctx.fillRect(23*s, 14*s, 4*s, 7*s);
        // Head
        ctx.fillStyle = ch.skin;
        ctx.fillRect(10*s, 4*s, 11*s, 10*s);
        // Hair
        ctx.fillStyle = ch.hair;
        if (ch.hairStyle === 'short') {
            ctx.fillRect(9*s, 3*s, 13*s, 4*s);
            ctx.fillRect(9*s, 5*s, 3*s, 4*s);
        } else if (ch.hairStyle === 'swept') {
            ctx.fillRect(9*s, 2*s, 14*s, 4*s);
            ctx.fillRect(21*s, 4*s, 3*s, 3*s);
        } else if (ch.hairStyle === 'long') {
            ctx.fillRect(9*s, 3*s, 13*s, 4*s);
            ctx.fillRect(9*s, 5*s, 3*s, 8*s);
            ctx.fillRect(19*s, 5*s, 3*s, 8*s);
        } else if (ch.hairStyle === 'updo') {
            ctx.fillRect(10*s, 1*s, 11*s, 3*s);
            ctx.fillRect(9*s, 3*s, 13*s, 4*s);
            ctx.fillRect(12*s, 0, 7*s, 2*s);
        }
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(12*s, 8*s, 3*s, 2*s);
        ctx.fillRect(17*s, 8*s, 3*s, 2*s);
        ctx.fillStyle = ch.eyeColor;
        ctx.fillRect(13*s, 8*s, 2*s, 2*s);
        ctx.fillRect(18*s, 8*s, 2*s, 2*s);
        // Weapon
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(26*s, 5*s, 1*s, 16*s);
        ctx.fillStyle = ch.color;
        ctx.fillRect(25*s, 3*s, 3*s, 3*s);
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            e.preventDefault();

            if (this.state === STATE.NEURALIFT) return;

            if (this.state === STATE.INVENTORY) {
                this.handleInventoryKey(e.key);
                return;
            }

            if (this.state === STATE.BATTLE || this.state === STATE.BATTLE_INTRO) {
                if (this.battle) this.battle.handleKey(e.key);
                return;
            }

            if (this.state === STATE.QUIZ) {
                if (e.key >= '1' && e.key <= '4') this.answerQuiz(parseInt(e.key) - 1);
                return;
            }

            if (this.state === STATE.BATTLE_RESULT) {
                if (e.key === 'Enter' || e.key === ' ') this.dismissBattleResult();
                return;
            }

            if (this.state === STATE.EXPLORE) {
                if (e.key === 'i' || e.key === 'e' || e.key === 'I' || e.key === 'E') {
                    this.openInventory();
                    return;
                }
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
                    this.keyQueue.push(e.key);
                }
            }
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('title-screen').style.display = 'none';
            document.getElementById('charselect-screen').style.display = 'flex';
        });

        document.getElementById('char-start-btn').addEventListener('click', () => {
            this.charData = CHARACTERS[this.selectedCharKey];
            document.getElementById('charselect-screen').style.display = 'none';
            this.startGame();
        });

        document.getElementById('retry-btn').addEventListener('click', () => {
            document.getElementById('gameover-screen').style.display = 'none';
            document.getElementById('charselect-screen').style.display = 'flex';
        });
        document.getElementById('replay-btn').addEventListener('click', () => {
            document.getElementById('victory-screen').style.display = 'none';
            document.getElementById('charselect-screen').style.display = 'flex';
        });
    }

    startGame() {
        this.lives = MAX_LIVES;
        this.score = 0;
        this.level = 1;
        this.segmentsFound = [];
        this.gameOver = false;
        this.victory = false;
        this.state = STATE.EXPLORE;
        this.keyQueue = [];
        this.weapon = 'staff';
        this.inventory = [];
        this.usedQuestions = new Set();
        this.neuraliftUsed = false;
        this.neuraliftActive = false;
        this.neuraliftAnim = null;
        this.stealthActive = false;
        this.gpuShieldReady = 0;
        this.invSelectedIdx = 0;
        this.updateHUD();
        this.initLevel();
        if (!this.running) {
            this.running = true;
            this.lastTick = performance.now();
            this.gameLoop();
        }
    }

    initLevel() {
        this.dungeon = new Dungeon(this.level);
        this.state = STATE.EXPLORE;
        this.battle = null;

        const spawnRoomIdx = 0;
        const exitRoomIdx = this.dungeon.getFurthestRoom(spawnRoomIdx);

        const pPos = this.dungeon.getRandomFloorInRoom(spawnRoomIdx);
        if (this.level === 1) {
            this.player = { x: pPos.x, y: pPos.y, hp: 10, maxHp: 10, atk: 3 };
        } else {
            this.player.x = pPos.x;
            this.player.y = pPos.y;
        }

        const occupied = [pPos];

        // Entry stairs (cosmetic)
        if (this.level > 1) {
            const upPos = this.dungeon.getRandomFloorInSpecificRoom(spawnRoomIdx, occupied);
            if (upPos) { this.dungeon.grid[upPos.y][upPos.x] = T.STAIRS_UP; occupied.push(upPos); }
        }

        // Exit stairs in far room
        const sPos = this.dungeon.getRandomFloorInSpecificRoom(exitRoomIdx, occupied);
        if (sPos) { this.dungeon.grid[sPos.y][sPos.x] = T.STAIRS_DOWN; occupied.push(sPos); }

        // Boss room on final level
        if (this.level === TOTAL_LEVELS) {
            this.dungeon.rooms[exitRoomIdx].bossRoom = true;
        }

        this.dungeon.rooms[spawnRoomIdx].searched = true;
        this.dungeon.rooms[spawnRoomIdx].encounterDone = true; // No fight in spawn room

        // Place hidden chests across rooms
        this.chests = [];
        const availableRooms = [];
        for (let i = 0; i < this.dungeon.rooms.length; i++) {
            if (i !== spawnRoomIdx) availableRooms.push(i);
        }
        // Shuffle
        for (let i = availableRooms.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableRooms[i], availableRooms[j]] = [availableRooms[j], availableRooms[i]];
        }

        const chestCount = 4 + Math.floor(Math.random() * 2); // 4-5 chests

        // Pre-assign guaranteed slots: 2 segments + 1 item/weapon power-up
        // Remaining chests are random
        const chestTypes = [];
        chestTypes[0] = 'segment';  // Guaranteed segment #1
        chestTypes[1] = 'segment';  // Guaranteed segment #2
        chestTypes[2] = Math.random() < 0.4 ? 'weapon' : 'item'; // Guaranteed power-up

        // Decide if this level has a Neuralift chest (level 3+, once per game, increasing chance)
        let neuraliftChestIdx = -1;
        if (this.level >= 3 && !this.neuraliftUsed) {
            // Guaranteed by level 5 if not found yet
            const nlChance = this.level === 3 ? 0.35 : (this.level === 4 ? 0.6 : 1.0);
            if (Math.random() < nlChance) {
                neuraliftChestIdx = 3 + Math.floor(Math.random() * (chestCount - 3)); // After guaranteed slots
            }
        }

        // Fill remaining slots
        for (let i = 3; i < chestCount; i++) {
            if (i === neuraliftChestIdx) {
                chestTypes[i] = 'neuralift';
            } else {
                const roll = Math.random();
                if (roll < 0.3) chestTypes[i] = 'segment';
                else if (roll < 0.6) chestTypes[i] = 'item';
                else if (roll < 0.75) chestTypes[i] = 'weapon';
                else chestTypes[i] = 'item';
            }
        }

        // Shuffle the types so guaranteed slots aren't always first chests found
        for (let i = chestTypes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chestTypes[i], chestTypes[j]] = [chestTypes[j], chestTypes[i]];
        }

        for (let i = 0; i < chestCount; i++) {
            const roomIdx = availableRooms[i % availableRooms.length];
            const cPos = this.dungeon.getRandomFloorInSpecificRoom(roomIdx, occupied);
            if (!cPos) continue;
            occupied.push(cPos);
            this.dungeon.grid[cPos.y][cPos.x] = T.CHEST_HIDDEN;

            this.chests.push({ x: cPos.x, y: cPos.y, type: chestTypes[i], opened: false, revealed: false, roomIdx });
        }

        this.particles = [];
        this.addMessage(`Entered Level ${this.level} of the Data Dungeon`, 'info');
        if (this.level === TOTAL_LEVELS) this.addMessage('A powerful query lurks in the deepest room...', 'boss');
        this.updateHUD();
    }

    // --------------------------------------------------------
    // ROOM ENTRY — search + encounter
    // --------------------------------------------------------

    enterRoom(roomIdx) {
        const room = this.dungeon.rooms[roomIdx];
        if (room.searched) return;

        room.searched = true;

        // Reveal chests
        let chestCount = 0;
        for (const chest of this.chests) {
            if (chest.roomIdx === roomIdx && !chest.revealed) {
                chest.revealed = true;
                this.dungeon.grid[chest.y][chest.x] = T.CHEST;
                this.spawnParticles(chest.x, chest.y, '#f0c040', 8);
                chestCount++;
            }
        }
        if (chestCount > 0) {
            this.addMessage(`Found ${chestCount} chest${chestCount > 1 ? 's' : ''} in this room!`, 'segment');
        }

        // Trigger encounter if not done
        if (!room.encounterDone) {
            room.encounterDone = true;

            let enemyType = null;
            if (room.bossRoom) {
                enemyType = 'sql';
            } else {
                enemyType = rollEncounter(this.level);
            }

            if (enemyType) {
                if (this.stealthActive && !room.bossRoom) {
                    this.stealthActive = false;
                    this.addMessage(`Neural Cloak! ${ENEMY_DEFS[enemyType].name} didn't notice you!`, 'boss');
                    this.spawnParticles(this.player.x, this.player.y, '#aa66ff', 12);
                } else {
                    this.startBattle(enemyType);
                }
            } else if (chestCount === 0) {
                this.addMessage('This room is empty. Move on.', 'info');
            }
        }
    }

    // --------------------------------------------------------
    // BATTLE
    // --------------------------------------------------------

    startBattle(enemyType) {
        this.battle = new Battle(this, enemyType);
        // Apply pre-activated GPU Shield
        if (this.gpuShieldReady > 0) {
            this.battle.playerBuffs.gpuShield = this.gpuShieldReady;
            this.battle.log.push(`GPU Shield active! Damage halved for ${this.gpuShieldReady} hits.`);
            this.gpuShieldReady = 0;
        }
        this.state = STATE.BATTLE;
        this.keyQueue = [];
    }

    dismissBattleResult() {
        if (!this.battle) return;

        if (this.battle.won) {
            // Victory — small HP restore
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
            this.addMessage(`Defeated ${this.battle.enemy.name}!`, this.battle.enemy.isBoss ? 'boss' : 'enemy');
        } else {
            // Defeat
            this.lives--;
            this.player.hp = this.player.maxHp;
            this.updateHUD();

            if (this.lives <= 0) {
                this.gameOver = true;
                this.showGameOver(this.battle.enemy.name);
                return;
            } else {
                this.addMessage(`Lost a life! (${this.lives} remaining)`, 'trap');
                // Respawn in first room
                const pPos = this.dungeon.getRandomFloorInRoom(0);
                this.player.x = pPos.x;
                this.player.y = pPos.y;
            }
        }

        this.battle = null;
        this.state = STATE.EXPLORE;
        this.keyQueue = [];
        this.updateHUD();
    }

    // --------------------------------------------------------
    // QUIZ
    // --------------------------------------------------------

    getRandomQuestion() {
        const available = [];
        for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
            if (!this.usedQuestions.has(i)) available.push(i);
        }
        if (available.length === 0) { this.usedQuestions.clear(); for (let i = 0; i < QUIZ_QUESTIONS.length; i++) available.push(i); }
        const idx = available[Math.floor(Math.random() * available.length)];
        this.usedQuestions.add(idx);
        return QUIZ_QUESTIONS[idx];
    }

    showQuiz(chest) {
        this.state = STATE.QUIZ;
        this.quizChest = chest;
        this.quizQuestion = this.getRandomQuestion();
        this.quizResult = null;
        this.keyQueue = [];
    }

    answerQuiz(answerIdx) {
        if (this.quizResult !== null) return;

        const correct = answerIdx === this.quizQuestion.correct;
        this.quizResult = { correct, chosen: answerIdx };

        const chest = this.quizChest;
        chest.opened = true;
        this.dungeon.grid[chest.y][chest.x] = T.CHEST_OPEN;

        if (correct) {
            const segName = SEGMENT_NAMES[this.segmentsFound.length % SEGMENT_NAMES.length];
            this.segmentsFound.push(segName);
            this.score += 100 * this.level;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
            this.addMessage(`Correct! Segment discovered: "${segName}" +1 HP`, 'segment');
            this.spawnParticles(chest.x, chest.y, '#f0c040', 20);
        } else {
            const dmg = 1 + Math.floor(this.level / 2);
            this.player.hp -= dmg;
            this.addMessage(`Wrong! Corrupted insight deals ${dmg} damage.`, 'trap');
            this.spawnParticles(chest.x, chest.y, '#ff4444', 10);
            if (this.player.hp <= 0) {
                this.lives--;
                this.player.hp = this.player.maxHp;
                this.updateHUD();
                if (this.lives <= 0) {
                    this.gameOver = true;
                    setTimeout(() => this.showGameOver('corrupted data'), 1200);
                }
            }
        }
        this.updateHUD();

        setTimeout(() => {
            this.state = STATE.EXPLORE;
            this.quizChest = null;
            this.quizQuestion = null;
            this.quizResult = null;
        }, 1200);
    }

    // --------------------------------------------------------
    // INVENTORY SCREEN
    // --------------------------------------------------------

    openInventory() {
        this.state = STATE.INVENTORY;
        this.invSelectedIdx = 0; // 0 = weapon slot, 1+ = items
        this.keyQueue = [];
    }

    closeInventory() {
        this.state = STATE.EXPLORE;
        this.keyQueue = [];
    }

    handleInventoryKey(key) {
        const totalSlots = 1 + this.inventory.length; // weapon + items

        if (key === 'i' || key === 'e' || key === 'I' || key === 'E' || key === 'Escape') {
            this.closeInventory();
            return;
        }

        if (key === 'ArrowUp' || key === 'w') {
            this.invSelectedIdx = Math.max(0, this.invSelectedIdx - 1);
        }
        if (key === 'ArrowDown' || key === 's') {
            this.invSelectedIdx = Math.min(totalSlots - 1, this.invSelectedIdx + 1);
        }

        if (key === 'Enter' || key === ' ') {
            if (this.invSelectedIdx === 0) return; // Can't "use" weapon

            const itemIdx = this.invSelectedIdx - 1;
            const itemKey = this.inventory[itemIdx];
            const def = ITEM_DEFS[itemKey];

            if (def.exploreUse) {
                const consumed = def.exploreEffect(this);
                if (consumed) {
                    this.inventory.splice(itemIdx, 1);
                    this.invSelectedIdx = Math.min(this.invSelectedIdx, this.inventory.length);
                    this.updateHUD();
                }
            }
        }
    }

    renderInventory() {
        const { ctx } = this;
        const W = this.canvas.width, H = this.canvas.height;

        // Darken background
        ctx.fillStyle = 'rgba(9, 0, 22, 0.88)';
        ctx.fillRect(0, 0, W, H);

        // Panel
        const panelW = 700, panelH = 560;
        const px = (W - panelW) / 2, py = (H - panelH) / 2;

        ctx.fillStyle = '#0d0620';
        ctx.fillRect(px, py, panelW, panelH);
        ctx.strokeStyle = '#7E0CF7'; ctx.lineWidth = 2;
        ctx.strokeRect(px, py, panelW, panelH);

        // Header
        ctx.fillStyle = '#7E0CF7';
        ctx.fillRect(px, py, panelW, 36);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px "Press Start 2P", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('INVENTORY', W / 2, py + 18);

        // Stats bar
        const statY = py + 46;
        ctx.fillStyle = '#1a1028';
        ctx.fillRect(px + 10, statY, panelW - 20, 30);
        ctx.fillStyle = '#888'; ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'left';
        ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp}`, px + 20, statY + 19);
        ctx.fillText(`ATK: ${this.player.atk}`, px + 200, statY + 19);
        ctx.fillText(`Level: ${this.level}/${TOTAL_LEVELS}`, px + 340, statY + 19);
        ctx.fillText(`Lives: ${'\u2665'.repeat(this.lives)}`, px + 520, statY + 19);
        if (this.stealthActive) {
            ctx.fillStyle = '#aa66ff';
            ctx.fillText('STEALTH', px + 560, statY + 19);
        }
        if (this.gpuShieldReady > 0) {
            ctx.fillStyle = '#44aaff';
            ctx.fillText('SHIELD', px + 640, statY + 19);
        }

        let slotY = py + 90;
        const slotH = 56;

        // -- Weapon slot --
        const isWpnSelected = this.invSelectedIdx === 0;
        ctx.fillStyle = isWpnSelected ? 'rgba(126, 12, 247, 0.15)' : 'rgba(26, 16, 40, 0.5)';
        ctx.fillRect(px + 10, slotY, panelW - 20, slotH);
        ctx.strokeStyle = isWpnSelected ? '#7E0CF7' : '#2a1848';
        ctx.lineWidth = isWpnSelected ? 2 : 1;
        ctx.strokeRect(px + 10, slotY, panelW - 20, slotH);

        // Weapon icon
        const wpn = WEAPONS[this.weapon];
        ctx.fillStyle = this.neuraliftActive ? '#7E0CF7' : '#22bbaa';
        ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(wpn.char, px + 40, slotY + slotH / 2);

        // Weapon info
        ctx.fillStyle = '#fff'; ctx.font = '10px "Press Start 2P", monospace'; ctx.textAlign = 'left';
        ctx.fillText(wpn.name, px + 70, slotY + 20);
        ctx.fillStyle = '#888'; ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(`ATK: ${wpn.atk}  |  ${wpn.desc}`, px + 70, slotY + 40);

        // Label
        ctx.fillStyle = '#555'; ctx.font = '7px "Press Start 2P", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('WEAPON', px + panelW - 20, slotY + 20);

        slotY += slotH + 8;

        // -- Item slots --
        if (this.inventory.length === 0) {
            ctx.fillStyle = '#444'; ctx.font = '9px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('No items. Find them in dungeon chests!', W / 2, slotY + 24);
        }

        for (let i = 0; i < this.inventory.length; i++) {
            const itemKey = this.inventory[i];
            const def = ITEM_DEFS[itemKey];
            const isSelected = this.invSelectedIdx === i + 1;

            ctx.fillStyle = isSelected ? 'rgba(126, 12, 247, 0.15)' : 'rgba(26, 16, 40, 0.5)';
            ctx.fillRect(px + 10, slotY, panelW - 20, slotH);
            ctx.strokeStyle = isSelected ? '#7E0CF7' : '#2a1848';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(px + 10, slotY, panelW - 20, slotH);

            // Icon
            ctx.fillStyle = def.color;
            ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(def.icon, px + 40, slotY + slotH / 2);

            // Name
            ctx.fillStyle = '#fff'; ctx.font = '10px "Press Start 2P", monospace'; ctx.textAlign = 'left';
            ctx.fillText(def.name, px + 70, slotY + 20);

            // Description
            ctx.fillStyle = '#999'; ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText(def.desc.substring(0, 65), px + 70, slotY + 40);

            // Context tag
            const tagCol = def.exploreUse ? '#44ff44' : '#ffaa44';
            ctx.fillStyle = tagCol; ctx.font = '7px "Press Start 2P", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(def.context, px + panelW - 20, slotY + 20);

            // "Use" prompt if selected and usable
            if (isSelected && def.exploreUse) {
                ctx.fillStyle = '#44ff44'; ctx.font = '7px "Press Start 2P", monospace';
                ctx.fillText('ENTER to use', px + panelW - 20, slotY + 40);
            } else if (isSelected && !def.exploreUse) {
                ctx.fillStyle = '#666'; ctx.font = '7px "Press Start 2P", monospace';
                ctx.fillText('Battle only', px + panelW - 20, slotY + 40);
            }

            slotY += slotH + 4;
        }

        // Footer
        ctx.fillStyle = '#555'; ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center';
        ctx.fillText('\u2191\u2193 navigate  |  ENTER use  |  I / ESC close', W / 2, py + panelH - 16);
    }

    // --------------------------------------------------------
    // CHEST OPEN (non-segment)
    // --------------------------------------------------------

    openChestDirect(chest) {
        chest.opened = true;
        this.dungeon.grid[chest.y][chest.x] = T.CHEST_OPEN;

        if (chest.type === 'item') {
            const itemKey = getRandomItem(this.level);
            if (this.inventory.length < MAX_INVENTORY) {
                this.inventory.push(itemKey);
                this.addMessage(`Found: ${ITEM_DEFS[itemKey].name}!`, 'segment');
            } else {
                this.addMessage(`Found ${ITEM_DEFS[itemKey].name} but inventory is full!`, 'trap');
            }
            this.spawnParticles(chest.x, chest.y, ITEM_DEFS[itemKey].color, 12);
        } else if (chest.type === 'weapon') {
            const wpnKey = getChestWeapon(this.level);
            if (wpnKey && WEAPONS[wpnKey].atk > WEAPONS[this.weapon].atk) {
                this.weapon = wpnKey;
                this.addMessage(`Weapon upgrade: ${WEAPONS[wpnKey].name}!`, 'boss');
                this.spawnParticles(chest.x, chest.y, '#ff44ff', 15);
            } else {
                // Give an item instead
                const itemKey = getRandomItem(this.level);
                if (this.inventory.length < MAX_INVENTORY) {
                    this.inventory.push(itemKey);
                    this.addMessage(`Found: ${ITEM_DEFS[itemKey].name}!`, 'segment');
                } else {
                    this.addMessage('The chest crumbles to dust.', 'info');
                }
                this.spawnParticles(chest.x, chest.y, '#88bbff', 8);
            }
        }
        this.updateHUD();
    }

    // --------------------------------------------------------
    // NEURALIFT — THE ULTIMATE POWER-UP
    // --------------------------------------------------------

    activateNeuralift() {
        this.neuraliftUsed = true;
        this.neuraliftActive = true;
        this.state = STATE.NEURALIFT;
        this.keyQueue = [];

        // Animation state
        this.neuraliftAnim = {
            phase: 0,       // 0=flash, 1=shake+reveal, 2=segments flying, 3=done
            timer: 0,
            totalTime: 0,
            shake: 0,
            flash: 1.0,
            segmentsToGrant: [],
            flyingSegments: [],
            chestsToReveal: [],
            particleBurst: false,
        };

        // Determine which segments to grant (3 new ones)
        for (let i = 0; i < 3; i++) {
            const segName = SEGMENT_NAMES[this.segmentsFound.length + i < SEGMENT_NAMES.length
                ? this.segmentsFound.length + i
                : (this.segmentsFound.length + i) % SEGMENT_NAMES.length];
            this.neuraliftAnim.segmentsToGrant.push(segName);
        }

        // Collect all unrevealed/unopened chests on this level
        for (const chest of this.chests) {
            if (!chest.opened) {
                this.neuraliftAnim.chestsToReveal.push(chest);
            }
        }

        this.addMessage('NEURALIFT ACTIVATED!', 'boss');
    }

    updateNeuralift(dt) {
        const a = this.neuraliftAnim;
        if (!a) return;
        a.timer += dt;
        a.totalTime += dt;

        // Phase 0: Initial white flash (0-0.5s)
        if (a.phase === 0) {
            a.flash = Math.max(0, 1 - a.timer * 2);
            if (a.timer > 0.5) {
                a.phase = 1;
                a.timer = 0;
            }
        }

        // Phase 1: Screen shake + reveal all chests + kill encounters (0.5-2.5s)
        if (a.phase === 1) {
            a.shake = Math.sin(a.timer * 40) * (8 - a.timer * 3);

            // Progressively reveal and open chests
            if (!a.particleBurst) {
                a.particleBurst = true;

                // Reveal all rooms
                for (const room of this.dungeon.rooms) {
                    room.searched = true;
                    room.encounterDone = true; // Kill all encounters
                }

                // Reveal and open all chests with particles
                for (const chest of a.chestsToReveal) {
                    chest.revealed = true;
                    chest.opened = true;
                    this.dungeon.grid[chest.y][chest.x] = T.CHEST_OPEN;
                    this.spawnParticles(chest.x, chest.y, '#7E0CF7', 15);
                }

                // Massive purple particle explosion from player
                for (let i = 0; i < 50; i++) {
                    this.particles.push({
                        x: this.player.x, y: this.player.y,
                        ox: TILE / 2, oy: TILE / 2,
                        vx: (Math.random() - 0.5) * 200,
                        vy: (Math.random() - 0.5) * 200,
                        life: 1.5 + Math.random(), maxLife: 2.5,
                        size: 3 + Math.random() * 4,
                        color: Math.random() < 0.5 ? '#7E0CF7' : '#b060ff',
                    });
                }
            }

            if (a.timer > 2.0) {
                a.phase = 2;
                a.timer = 0;
                // Create flying segment objects
                for (let i = 0; i < a.segmentsToGrant.length; i++) {
                    const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
                    const dist = 200;
                    a.flyingSegments.push({
                        name: a.segmentsToGrant[i],
                        startX: this.player.x * TILE + TILE / 2 + Math.cos(angle) * dist,
                        startY: this.player.y * TILE + TILE / 2 + Math.sin(angle) * dist,
                        targetX: this.player.x * TILE + TILE / 2,
                        targetY: this.player.y * TILE + TILE / 2,
                        delay: i * 0.5,
                        arrived: false,
                        t: 0,
                    });
                }
            }
        }

        // Phase 2: Segments fly to player (2.5-5s)
        if (a.phase === 2) {
            a.shake = Math.sin(a.timer * 20) * Math.max(0, 3 - a.timer);

            let allArrived = true;
            for (const seg of a.flyingSegments) {
                if (a.timer < seg.delay) { allArrived = false; continue; }
                seg.t = Math.min(1, (a.timer - seg.delay) / 0.8);
                if (seg.t < 1) allArrived = false;

                if (seg.t >= 1 && !seg.arrived) {
                    seg.arrived = true;
                    this.segmentsFound.push(seg.name);
                    this.score += 100 * this.level;
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
                    this.spawnParticles(this.player.x, this.player.y, '#f0c040', 15);
                    this.addMessage(`Segment discovered: "${seg.name}" +1 HP`, 'segment');
                    this.updateHUD();
                }
            }

            if (allArrived && a.timer > a.flyingSegments.length * 0.5 + 1.5) {
                a.phase = 3;
                a.timer = 0;
            }
        }

        // Phase 3: Settle (brief pause then return to explore)
        if (a.phase === 3) {
            if (a.timer > 1.0) {
                this.state = STATE.EXPLORE;
                this.neuraliftAnim = null;
                // Permanent boost — full heal + massively increased stats
                this.player.maxHp += 10;
                this.player.hp = this.player.maxHp;
                this.player.atk += 4;
                this.addMessage('The Segmenter sees all. You are transformed.', 'boss');
                this.updateHUD();
            }
        }
    }

    // --------------------------------------------------------
    // MOVEMENT & EXPLORE
    // --------------------------------------------------------

    movePlayer(dx, dy) {
        const nx = this.player.x + dx;
        const ny = this.player.y + dy;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;

        const tile = this.dungeon.grid[ny][nx];
        if (tile === T.WALL || tile === T.VOID || tile === T.CHEST_HIDDEN) return;

        // Chest interaction
        const chest = this.chests.find(c => c.x === nx && c.y === ny && !c.opened && c.revealed);
        if (chest) {
            if (chest.type === 'neuralift') {
                chest.opened = true;
                this.dungeon.grid[chest.y][chest.x] = T.CHEST_OPEN;
                this.activateNeuralift();
            } else if (chest.type === 'segment') {
                this.showQuiz(chest);
            } else {
                this.openChestDirect(chest);
            }
            return;
        }

        // Stairs
        if (tile === T.STAIRS_DOWN) { this.descend(); return; }

        // Move
        this.player.x = nx;
        this.player.y = ny;

        // Check room entry
        const roomIdx = this.dungeon.getRoomAt(nx, ny);
        if (roomIdx >= 0) this.enterRoom(roomIdx);
    }

    descend() {
        if (this.level >= TOTAL_LEVELS) { this.win(); return; }
        this.level++;
        this.player.maxHp += 1;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
        this.addMessage(`Descending to Level ${this.level}... +1 Max HP, +2 HP`, 'info');
        this.initLevel();
    }

    win() {
        this.victory = true;
        this.showVictory();
    }

    // --------------------------------------------------------
    // GAME LOOP
    // --------------------------------------------------------

    gameLoop() {
        if (!this.running) return;
        const now = performance.now();
        const dt = (now - this.lastTick) / 1000;
        this.lastTick = now;
        this.animFrame++;

        this.update(dt);
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update(dt) {
        if (this.gameOver || this.victory) return;

        if (this.state === STATE.NEURALIFT) {
            this.updateNeuralift(dt);
            // Still update particles during neuralift
            this.particles = this.particles.filter(p => {
                p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt;
                return p.life > 0;
            });
            return;
        }

        if (this.state === STATE.BATTLE && this.battle) {
            this.battle.update();
            if (this.battle.finished && this.state === STATE.BATTLE) {
                this.state = STATE.BATTLE_RESULT;
            }
            return;
        }

        if (this.state === STATE.EXPLORE && this.keyQueue.length > 0) {
            const key = this.keyQueue.shift();
            let dx = 0, dy = 0;
            if (key === 'ArrowUp' || key === 'w') dy = -1;
            if (key === 'ArrowDown' || key === 's') dy = 1;
            if (key === 'ArrowLeft' || key === 'a') dx = -1;
            if (key === 'ArrowRight' || key === 'd') dx = 1;
            if (dx !== 0 || dy !== 0) this.movePlayer(dx, dy);
        }

        // Particles
        this.particles = this.particles.filter(p => {
            p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt;
            return p.life > 0;
        });

        this.messages = this.messages.filter(m => Date.now() - m.time < 4000);
    }

    // --------------------------------------------------------
    // HUD & MESSAGES
    // --------------------------------------------------------

    updateHUD() {
        const hearts = '\u2665'.repeat(this.lives) + '\u2661'.repeat(MAX_LIVES - this.lives);
        document.getElementById('hud-lives').textContent = hearts;
        document.getElementById('hud-lives').style.color = this.lives <= 1 ? '#ff4444' : '#ff6688';
        document.getElementById('hud-level').textContent = `Level: ${this.level}/${TOTAL_LEVELS}`;
        document.getElementById('hud-score').textContent = `Segments: ${this.segmentsFound.length}`;
    }

    addMessage(text, type) {
        this.messages.push({ text, type, time: Date.now() });
        const log = document.getElementById('message-log');
        const el = document.createElement('div');
        el.className = `msg msg-${type}`;
        el.textContent = text;
        log.appendChild(el);
        while (log.children.length > 3) log.removeChild(log.firstChild);
    }

    // --------------------------------------------------------
    // SHARING
    // --------------------------------------------------------

    getGameUrl() {
        return 'https://typedformiles.github.io/dungeonlift';
    }

    generateScorecard(won) {
        const lines = [];
        lines.push('\u{1F3F0} DungeonLift by Neuralift');
        lines.push('');

        if (won) {
            lines.push(`\u2694\uFE0F DUNGEON COMPLETE | \u{1F3AF} ${this.segmentsFound.length} Segments | \u2764\uFE0F ${this.lives} Lives Left`);
        } else {
            lines.push(`\u{1F480} Defeated on Level ${this.level} | \u{1F3AF} ${this.segmentsFound.length} Segments`);
        }

        if (this.neuraliftActive) {
            lines.push('\u{1F7E3} NEURALIFTED!');
        } else {
            lines.push('\u{1F534} Never found Neuralift...');
        }

        lines.push('');

        if (this.segmentsFound.length > 0) {
            const segsToShow = this.segmentsFound.slice(0, 5);
            for (const s of segsToShow) {
                lines.push(`\u2726 ${s}`);
            }
            if (this.segmentsFound.length > 5) {
                lines.push(`...and ${this.segmentsFound.length - 5} more`);
            }
            lines.push('');
        }

        lines.push('Can you survive the Data Dungeon?');
        lines.push(`\u{1F3AE} ${this.getGameUrl()}`);

        return lines.join('\n');
    }

    copyScorecard(won, buttonId) {
        const text = this.generateScorecard(won);
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById(buttonId);
            btn.textContent = '\u2705 Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.textContent = '\u{1F4CB} Copy Score';
                btn.classList.remove('copied');
            }, 2000);
        });
    }

    getLinkedInShareUrl(won) {
        const text = this.generateScorecard(won);
        return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
    }

    showGameOver(source) {
        const s = document.getElementById('gameover-screen');
        document.getElementById('gameover-subtitle').textContent = `Defeated by ${source} on Level ${this.level}`;
        document.getElementById('gameover-stats').innerHTML = `Score: ${this.score}<br>Levels: ${this.level - 1}/${TOTAL_LEVELS}<br>Segments: ${this.segmentsFound.length}`;
        document.getElementById('gameover-segments').innerHTML = this.segmentsFound.length > 0 ? this.segmentsFound.map(seg => `\u2726 ${seg}`).join('<br>') : 'No segments discovered...';

        const hint = document.getElementById('gameover-hint');
        if (!this.neuraliftActive) {
            document.getElementById('gameover-hint-text').innerHTML = '<strong>You never found Neuralift.</strong>Manual tools can only take you so far — deep learning would have changed everything.';
            hint.style.display = 'block';
        } else {
            hint.style.display = 'none';
        }

        // Share buttons
        document.getElementById('gameover-copy-btn').onclick = () => this.copyScorecard(false, 'gameover-copy-btn');
        document.getElementById('gameover-linkedin-btn').href = this.getLinkedInShareUrl(false);

        s.style.display = 'flex';
    }

    showVictory() {
        const s = document.getElementById('victory-screen');

        // Stats as big numbers
        document.getElementById('victory-stats').innerHTML = `
            <div class="victory-stat">
                <span class="victory-stat-value">${this.score}</span>
                <span class="victory-stat-label">Score</span>
            </div>
            <div class="victory-stat">
                <span class="victory-stat-value">${this.segmentsFound.length}</span>
                <span class="victory-stat-label">Segments</span>
            </div>
            <div class="victory-stat">
                <span class="victory-stat-value">${TOTAL_LEVELS}</span>
                <span class="victory-stat-label">Levels</span>
            </div>
            <div class="victory-stat">
                <span class="victory-stat-value">${this.lives}</span>
                <span class="victory-stat-label">Lives Left</span>
            </div>`;

        // Segments as tags
        document.getElementById('victory-segments').innerHTML =
            this.segmentsFound.map(seg => `<span class="seg-tag">\u2726 ${seg}</span>`).join('');

        // Share buttons
        document.getElementById('victory-copy-btn').onclick = () => this.copyScorecard(true, 'victory-copy-btn');
        document.getElementById('victory-linkedin-btn').href = this.getLinkedInShareUrl(true);

        s.style.display = 'flex';
    }

    // --------------------------------------------------------
    // RENDERING
    // --------------------------------------------------------

    render() {
        const { ctx } = this;

        if (this.state === STATE.BATTLE || this.state === STATE.BATTLE_INTRO || this.state === STATE.BATTLE_RESULT) {
            this.renderBattle();
            return;
        }

        // Explore mode (also renders during NEURALIFT state)
        ctx.fillStyle = C.void;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const camX = Math.max(0, Math.min(this.player.x * TILE - this.canvas.width / 2 + TILE / 2, COLS * TILE - this.canvas.width));
        const camY = Math.max(0, Math.min(this.player.y * TILE - this.canvas.height / 2 + TILE / 2, ROWS * TILE - this.canvas.height));

        ctx.save();
        // Apply screen shake during Neuralift
        const shakeX = this.neuraliftAnim ? this.neuraliftAnim.shake : 0;
        const shakeY = this.neuraliftAnim ? this.neuraliftAnim.shake * 0.6 : 0;
        ctx.translate(-camX + shakeX, -camY + shakeY);

        const grid = this.dungeon.grid;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = grid[y][x];
                const px = x * TILE, py = y * TILE;

                switch (tile) {
                    case T.VOID: case T.CHEST_HIDDEN: break;
                    case T.FLOOR: this.drawFloor(px, py, x, y); break;
                    case T.WALL:
                        ctx.fillStyle = C.wall; ctx.fillRect(px, py, TILE, TILE);
                        ctx.fillStyle = C.wallTop; ctx.fillRect(px, py, TILE, 4);
                        ctx.fillStyle = 'rgba(0,0,0,0.15)';
                        ctx.fillRect(px + TILE - 1, py, 1, TILE);
                        ctx.fillRect(px, py + TILE - 1, TILE, 1);
                        break;
                    case T.STAIRS_DOWN: this.drawFloor(px, py, x, y); this.drawStairsDown(px, py); break;
                    case T.STAIRS_UP: this.drawFloor(px, py, x, y); this.drawStairsUp(px, py); break;
                    case T.CHEST: this.drawFloor(px, py, x, y); this.drawChest(px, py, false); break;
                    case T.CHEST_OPEN: this.drawFloor(px, py, x, y); this.drawChest(px, py, true); break;
                }
            }
        }

        // Player
        this.drawExplorePlayer();

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x * TILE + p.ox, p.y * TILE + p.oy, p.size, p.size);
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        // Inventory bar
        this.renderInventoryBar();

        // Quiz overlay
        if (this.state === STATE.QUIZ) this.renderQuiz();

        // Inventory overlay
        if (this.state === STATE.INVENTORY) this.renderInventory();

        // Neuralift cinematic overlay
        if (this.state === STATE.NEURALIFT && this.neuraliftAnim) this.renderNeuraliftOverlay();
    }

    drawFloor(px, py, x, y) {
        const { ctx } = this;
        ctx.fillStyle = (x + y) % 2 === 0 ? C.floor : C.floorAlt;
        ctx.fillRect(px, py, TILE, TILE);
        if ((x * 7 + y * 13) % 17 === 0) {
            ctx.fillStyle = 'rgba(126, 12, 247, 0.06)';
            ctx.fillRect(px + 4, py + 4, 2, 2);
        }
    }

    drawExplorePlayer() {
        const { ctx } = this;
        const px = this.player.x * TILE, py = this.player.y * TILE;
        const pulse = Math.sin(this.animFrame * 0.1) * 0.15 + 0.85;
        const isNL = this.neuraliftActive;
        const ch = this.charData;
        const mainCol = isNL ? '#7E0CF7' : ch.color;
        const darkCol = isNL ? '#5a08b0' : ch.colorDk;
        const lightCol = isNL ? '#b060ff' : ch.colorLt;

        // Glow
        ctx.shadowColor = mainCol;
        ctx.shadowBlur = isNL ? (15 + Math.sin(this.animFrame * 0.08) * 8) : 6 * pulse;

        // -- Pixel character (32x32) --
        const s = TILE / 32; // scale factor

        // Feet
        ctx.fillStyle = '#554433';
        ctx.fillRect(px + 9*s, py + 28*s, 5*s, 4*s);
        ctx.fillRect(px + 18*s, py + 28*s, 5*s, 4*s);

        // Legs
        ctx.fillStyle = '#445566';
        ctx.fillRect(px + 10*s, py + 22*s, 4*s, 7*s);
        ctx.fillRect(px + 18*s, py + 22*s, 4*s, 7*s);

        // Body / tunic
        ctx.fillStyle = mainCol;
        ctx.fillRect(px + 8*s, py + 12*s, 16*s, 11*s);
        // Tunic shading
        ctx.fillStyle = darkCol;
        ctx.fillRect(px + 8*s, py + 20*s, 16*s, 3*s);
        // Belt
        ctx.fillStyle = '#887744';
        ctx.fillRect(px + 8*s, py + 18*s, 16*s, 2*s);

        // Arms
        ctx.fillStyle = ch.skin;
        ctx.fillRect(px + 4*s, py + 13*s, 4*s, 8*s);  // left arm
        ctx.fillRect(px + 24*s, py + 13*s, 4*s, 8*s); // right arm

        // Staff (in right hand)
        const staffGlow = Math.sin(this.animFrame * 0.08) * 0.4 + 0.6;
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(px + 26*s, py + 4*s, 2*s, 18*s);
        // Staff orb
        ctx.fillStyle = isNL ? `rgba(126, 12, 247, ${staffGlow})` : `rgba(34, 187, 170, ${staffGlow})`;
        ctx.fillRect(px + 24*s, py + 2*s, 6*s, 5*s);
        ctx.fillStyle = '#fff';
        ctx.fillRect(px + 26*s, py + 3*s, 2*s, 2*s);

        // Head
        ctx.fillStyle = ch.skin;
        ctx.fillRect(px + 10*s, py + 3*s, 12*s, 10*s);
        // Hair
        ctx.fillStyle = ch.hair;
        if (ch.hairStyle === 'short') {
            ctx.fillRect(px + 9*s, py + 2*s, 14*s, 4*s);
            ctx.fillRect(px + 9*s, py + 4*s, 3*s, 5*s);
        } else if (ch.hairStyle === 'swept') {
            ctx.fillRect(px + 9*s, py + 1*s, 15*s, 4*s);
            ctx.fillRect(px + 22*s, py + 3*s, 3*s, 3*s);
        } else if (ch.hairStyle === 'long') {
            ctx.fillRect(px + 9*s, py + 2*s, 14*s, 4*s);
            ctx.fillRect(px + 9*s, py + 4*s, 3*s, 9*s);
            ctx.fillRect(px + 20*s, py + 4*s, 3*s, 9*s);
        } else if (ch.hairStyle === 'updo') {
            ctx.fillRect(px + 10*s, py + 0*s, 12*s, 3*s);
            ctx.fillRect(px + 9*s, py + 2*s, 14*s, 4*s);
            ctx.fillRect(px + 12*s, py - 1*s, 8*s, 2*s);
        }
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(px + 13*s, py + 7*s, 3*s, 3*s);
        ctx.fillRect(px + 19*s, py + 7*s, 3*s, 3*s);
        ctx.fillStyle = ch.eyeColor;
        ctx.fillRect(px + 14*s, py + 8*s, 2*s, 2*s);
        ctx.fillRect(px + 20*s, py + 8*s, 2*s, 2*s);

        ctx.shadowBlur = 0;

        // Neuralift aura
        if (isNL) {
            const aura = Math.sin(this.animFrame * 0.06) * 0.2 + 0.25;
            ctx.strokeStyle = `rgba(126, 12, 247, ${aura})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 2, py + 1, TILE - 4, TILE - 2);
        }

        // GPU Shield glow
        if (this.gpuShieldReady > 0) {
            const shieldGlow = Math.sin(this.animFrame * 0.08) * 0.2 + 0.35;
            ctx.strokeStyle = `rgba(68, 170, 255, ${shieldGlow})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(px + TILE / 2, py + TILE / 2, TILE / 2 + 2, TILE / 2 + 2, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Stealth shimmer
        if (this.stealthActive) {
            const shimmer = Math.sin(this.animFrame * 0.1) * 0.15 + 0.2;
            ctx.strokeStyle = `rgba(170, 102, 255, ${shimmer})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(px - 1, py - 1, TILE + 2, TILE + 2);
            ctx.setLineDash([]);
        }

        // HP bar
        ctx.fillStyle = C.hpBarBg; ctx.fillRect(px, py - 6, TILE, 4);
        const ratio = Math.max(0, this.player.hp / this.player.maxHp);
        ctx.fillStyle = ratio > 0.5 ? C.hpBar : (ratio > 0.25 ? '#ffaa00' : '#ff4444');
        ctx.fillRect(px, py - 6, TILE * ratio, 4);
    }

    drawChest(px, py, opened) {
        const { ctx } = this;
        if (opened) {
            ctx.fillStyle = C.chestOpen; ctx.fillRect(px + 4, py + 8, TILE - 8, TILE - 12);
            ctx.fillStyle = '#887740'; ctx.fillRect(px + 3, py + 6, TILE - 6, 4);
        } else {
            const glow = Math.sin(this.animFrame * 0.06) * 0.3 + 0.7;
            ctx.globalAlpha = glow;
            ctx.fillStyle = C.chest; ctx.fillRect(px + 4, py + 8, TILE - 8, TILE - 12);
            ctx.fillStyle = '#d4a830'; ctx.fillRect(px + 3, py + 6, TILE - 6, 5);
            ctx.fillStyle = '#fff'; ctx.fillRect(px + TILE / 2 - 2, py + 10, 4, 4);
            ctx.globalAlpha = 1;
        }
    }

    drawStairsDown(px, py) {
        const { ctx } = this;
        const pulse = Math.sin(this.animFrame * 0.04) * 0.3 + 0.7;
        ctx.globalAlpha = pulse; ctx.fillStyle = C.stairs;
        for (let i = 0; i < 4; i++) ctx.fillRect(px + 4 + i * 2, py + 4 + i * 4, TILE - 8 - i * 2, 3);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
        ctx.fillText('\u25BC', px + TILE / 2, py + TILE - 2);
    }

    drawStairsUp(px, py) {
        const { ctx } = this;
        ctx.globalAlpha = 0.4; ctx.fillStyle = C.stairsUp;
        for (let i = 0; i < 4; i++) ctx.fillRect(px + 4 + i * 2, py + 16 - i * 4, TILE - 8 - i * 2, 3);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#666'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
        ctx.fillText('\u25B2', px + TILE / 2, py + 6);
    }

    // --------------------------------------------------------
    // INVENTORY BAR (explore mode)
    // --------------------------------------------------------

    renderInventoryBar() {
        const { ctx } = this;
        const barY = this.canvas.height - 38;
        const barX = 10;

        // Weapon
        ctx.fillStyle = 'rgba(9, 0, 22, 0.9)';
        ctx.fillRect(barX, barY, 260, 30);
        ctx.strokeStyle = '#3d2466'; ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, 260, 30);

        const wpn = WEAPONS[this.weapon];
        ctx.fillStyle = this.neuraliftActive ? '#7E0CF7' : this.charData.color;
        ctx.font = '9px "Press Start 2P", monospace'; ctx.textAlign = 'left';
        ctx.fillText(`${wpn.char} ${wpn.name}`, barX + 8, barY + 19);

        // Items
        const itemX = 284;
        for (let i = 0; i < MAX_INVENTORY; i++) {
            const ix = itemX + i * 36;
            ctx.fillStyle = 'rgba(9, 0, 22, 0.9)';
            ctx.fillRect(ix, barY, 32, 30);
            ctx.strokeStyle = '#2a1848'; ctx.lineWidth = 1;
            ctx.strokeRect(ix, barY, 32, 30);

            if (i < this.inventory.length) {
                const item = ITEM_DEFS[this.inventory[i]];
                ctx.fillStyle = item.color;
                ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(item.icon, ix + 16, barY + 16);
            }
        }
    }

    // --------------------------------------------------------
    // BATTLE RENDERING
    // --------------------------------------------------------

    // Draw the player character in battle (large pixel art)
    drawBattlePlayer(x, y, flash) {
        const { ctx } = this;
        const isNL = this.neuraliftActive;
        const ch = this.charData;
        const tunic = flash ? '#fff' : (isNL ? '#7E0CF7' : ch.color);
        const tunicDk = flash ? '#ddd' : (isNL ? '#5a08b0' : ch.colorDk);
        const skin = flash ? '#fff' : ch.skin;
        const skinDk = flash ? '#eee' : ch.skinDk;
        const hair = flash ? '#eee' : ch.hair;
        const glowCol = isNL ? '#7E0CF7' : ch.color;

        // Glow aura
        ctx.shadowColor = glowCol;
        ctx.shadowBlur = isNL ? 30 : 12;

        // -- Boots --
        ctx.fillStyle = flash ? '#ddd' : '#554433';
        ctx.fillRect(x + 18, y + 108, 18, 12); // left
        ctx.fillRect(x + 48, y + 108, 18, 12); // right

        // -- Legs --
        ctx.fillStyle = flash ? '#ddd' : '#445566';
        ctx.fillRect(x + 22, y + 82, 12, 28);  // left
        ctx.fillRect(x + 50, y + 82, 12, 28);  // right

        // -- Body / tunic --
        ctx.fillStyle = tunic;
        ctx.fillRect(x + 16, y + 38, 52, 48);
        // Tunic bottom edge
        ctx.fillStyle = tunicDk;
        ctx.fillRect(x + 16, y + 74, 52, 12);
        // Belt
        ctx.fillStyle = flash ? '#eee' : '#887744';
        ctx.fillRect(x + 16, y + 68, 52, 6);
        ctx.fillStyle = flash ? '#fff' : '#aa9944';
        ctx.fillRect(x + 36, y + 66, 10, 10); // buckle

        // -- Left arm --
        ctx.fillStyle = skin;
        ctx.fillRect(x + 4, y + 42, 12, 30);
        ctx.fillStyle = tunic;
        ctx.fillRect(x + 4, y + 38, 14, 16); // sleeve

        // -- Right arm (holding staff) --
        ctx.fillStyle = skin;
        ctx.fillRect(x + 68, y + 42, 12, 26);
        ctx.fillStyle = tunic;
        ctx.fillRect(x + 66, y + 38, 14, 16); // sleeve

        // -- Staff --
        ctx.fillStyle = flash ? '#fff' : '#8B6914';
        ctx.fillRect(x + 74, y + 8, 6, 64);
        // Staff orb
        const orbPulse = Math.sin(this.animFrame * 0.08) * 0.3 + 0.7;
        ctx.shadowColor = isNL ? '#7E0CF7' : '#44ddcc';
        ctx.shadowBlur = 15 * orbPulse;
        ctx.fillStyle = flash ? '#fff' : (isNL ? '#7E0CF7' : '#22bbaa');
        ctx.fillRect(x + 68, y + 0, 18, 14);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 74, y + 3, 6, 6);
        ctx.shadowBlur = 0;

        // -- Head --
        ctx.fillStyle = skin;
        ctx.fillRect(x + 22, y + 6, 40, 34);
        // Neck
        ctx.fillRect(x + 32, y + 36, 18, 6);

        // Hair
        ctx.fillStyle = hair;
        if (ch.hairStyle === 'short') {
            ctx.fillRect(x + 18, y + 2, 48, 14);
            ctx.fillRect(x + 18, y + 14, 8, 16);
        } else if (ch.hairStyle === 'swept') {
            ctx.fillRect(x + 16, y + 0, 52, 14);
            ctx.fillRect(x + 58, y + 12, 10, 10);
        } else if (ch.hairStyle === 'long') {
            ctx.fillRect(x + 18, y + 2, 48, 14);
            ctx.fillRect(x + 16, y + 14, 10, 26);
            ctx.fillRect(x + 58, y + 14, 10, 26);
        } else if (ch.hairStyle === 'updo') {
            ctx.fillRect(x + 22, y - 6, 40, 10);
            ctx.fillRect(x + 18, y + 2, 48, 14);
            ctx.fillRect(x + 28, y - 10, 28, 8);
        }

        // Face details
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 28, y + 18, 10, 8);
        ctx.fillRect(x + 46, y + 18, 10, 8);
        ctx.fillStyle = flash ? '#aaa' : ch.eyeColor;
        ctx.fillRect(x + 32, y + 20, 6, 6); // iris L
        ctx.fillRect(x + 48, y + 20, 6, 6); // iris R
        ctx.fillStyle = '#111';
        ctx.fillRect(x + 34, y + 22, 3, 3); // pupil L
        ctx.fillRect(x + 50, y + 22, 3, 3); // pupil R
        // Eyebrows
        ctx.fillStyle = hair;
        ctx.fillRect(x + 27, y + 15, 12, 3);
        ctx.fillRect(x + 45, y + 15, 12, 3);
        // Mouth
        ctx.fillStyle = skinDk;
        ctx.fillRect(x + 34, y + 32, 14, 3);

        ctx.shadowBlur = 0;
    }

    // Draw enemy sprite in battle (large pixel art per type)
    drawBattleEnemy(x, y, enemy, flash, animFrame) {
        const { ctx } = this;
        const col = flash ? '#fff' : enemy.color;
        const colDk = flash ? '#ddd' : this.darkenColor(enemy.color, 0.6);
        const isBoss = enemy.isBoss;
        const sc = isBoss ? 1.3 : 1;

        ctx.save();
        if (isBoss) {
            ctx.shadowColor = enemy.color;
            ctx.shadowBlur = 20 + Math.sin(animFrame * 0.05) * 10;
        }

        switch (enemy.type) {
            case 'noise': this.drawEnemyNoise(ctx, x, y, col, colDk, flash, animFrame); break;
            case 'bias': this.drawEnemyBias(ctx, x, y, col, colDk, flash, animFrame); break;
            case 'silo': this.drawEnemySilo(ctx, x, y, col, colDk, flash, animFrame); break;
            case 'rules': this.drawEnemyRules(ctx, x, y, col, colDk, flash, animFrame); break;
            case 'excel': this.drawEnemyExcel(ctx, x, y, col, colDk, flash, animFrame); break;
            case 'sql': this.drawEnemySQL(ctx, x, y, col, colDk, flash, animFrame); break;
            default:
                ctx.fillStyle = col;
                ctx.fillRect(x + 10, y + 10, 64, 100);
                break;
        }

        ctx.restore();
    }

    darkenColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
    }

    // -- NOISE: glitchy static creature --
    drawEnemyNoise(ctx, x, y, col, colDk, flash, af) {
        // Jittery body — shifts slightly each frame
        const jx = Math.sin(af * 0.3) * 3;
        const jy = Math.cos(af * 0.4) * 2;
        // Body mass — amorphous blob
        ctx.fillStyle = col;
        ctx.fillRect(x + 14 + jx, y + 30, 56, 70);
        ctx.fillRect(x + 22 + jx, y + 20, 40, 14);
        // Static lines
        ctx.fillStyle = colDk;
        for (let i = 0; i < 6; i++) {
            const ly = y + 35 + i * 11;
            const lw = 20 + Math.sin(af * 0.5 + i) * 15;
            ctx.fillRect(x + 20 + jx, ly, lw, 3);
        }
        // Eyes — glitchy, different positions
        const eyeOff = Math.floor(af / 8) % 3;
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 24 + jx + eyeOff, y + 38 + jy, 12, 10);
        ctx.fillRect(x + 48 + jx - eyeOff, y + 38 + jy, 12, 10);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x + 28 + jx + eyeOff, y + 40 + jy, 6, 6);
        ctx.fillRect(x + 52 + jx - eyeOff, y + 40 + jy, 6, 6);
        // Tendrils
        ctx.fillStyle = col;
        ctx.fillRect(x + 8, y + 60, 8, 30 + Math.sin(af * 0.2) * 8);
        ctx.fillRect(x + 68, y + 55, 8, 35 + Math.cos(af * 0.2) * 8);
    }

    // -- BIAS: one-eyed hooded figure (tunnel vision) --
    drawEnemyBias(ctx, x, y, col, colDk, flash, af) {
        // Hood/cloak
        ctx.fillStyle = colDk;
        ctx.fillRect(x + 12, y + 10, 60, 100);
        ctx.fillRect(x + 8, y + 80, 68, 30);
        // Body
        ctx.fillStyle = col;
        ctx.fillRect(x + 18, y + 20, 48, 80);
        // Hood top
        ctx.fillStyle = colDk;
        ctx.fillRect(x + 16, y + 6, 52, 24);
        ctx.fillRect(x + 22, y + 2, 40, 10);
        // Single giant eye (tunnel vision)
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 26, y + 32, 32, 24);
        ctx.fillStyle = col;
        const pupilX = Math.sin(af * 0.06) * 4;
        ctx.fillRect(x + 34 + pupilX, y + 36, 16, 16);
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 38 + pupilX, y + 40, 8, 8);
        // Eyelid (narrows over time)
        ctx.fillStyle = colDk;
        ctx.fillRect(x + 26, y + 30, 32, 4);
        ctx.fillRect(x + 26, y + 54, 32, 4);
        // Arms in cloak
        ctx.fillStyle = colDk;
        ctx.fillRect(x + 4, y + 50, 12, 30);
        ctx.fillRect(x + 68, y + 50, 12, 30);
    }

    // -- DATA SILO: tower/wall creature --
    drawEnemySilo(ctx, x, y, col, colDk, flash, af) {
        // Tower shape
        ctx.fillStyle = colDk;
        ctx.fillRect(x + 18, y + 5, 48, 105);
        // Brickwork pattern
        ctx.fillStyle = col;
        for (let row = 0; row < 7; row++) {
            const ry = y + 8 + row * 15;
            const off = row % 2 === 0 ? 0 : 12;
            for (let bx = 0; bx < 3; bx++) {
                ctx.fillRect(x + 20 + off + bx * 16, ry, 14, 12);
            }
        }
        // Lock/keyhole in center
        ctx.fillStyle = '#223';
        ctx.fillRect(x + 32, y + 45, 20, 26);
        ctx.fillStyle = '#556';
        ctx.fillRect(x + 38, y + 50, 8, 8);
        ctx.fillRect(x + 40, y + 58, 4, 10);
        // Angry eyes at top
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 26, y + 14, 10, 8);
        ctx.fillRect(x + 48, y + 14, 10, 8);
        ctx.fillStyle = '#001144';
        ctx.fillRect(x + 30, y + 16, 5, 5);
        ctx.fillRect(x + 50, y + 16, 5, 5);
        // Battlements on top
        ctx.fillStyle = colDk;
        for (let i = 0; i < 4; i++) ctx.fillRect(x + 16 + i * 14, y - 2, 10, 10);
    }

    // -- RULES ENGINE: rigid robot --
    drawEnemyRules(ctx, x, y, col, colDk, flash, af) {
        // Feet
        ctx.fillStyle = colDk;
        ctx.fillRect(x + 16, y + 100, 18, 12);
        ctx.fillRect(x + 50, y + 100, 18, 12);
        // Legs — rigid pillars
        ctx.fillStyle = col;
        ctx.fillRect(x + 20, y + 76, 12, 26);
        ctx.fillRect(x + 52, y + 76, 12, 26);
        // Body — boxy
        ctx.fillStyle = col;
        ctx.fillRect(x + 12, y + 32, 60, 48);
        // Chest plate with rules
        ctx.fillStyle = colDk;
        ctx.fillRect(x + 18, y + 38, 48, 36);
        // IF/THEN text lines
        ctx.fillStyle = flash ? '#ccc' : '#fff';
        ctx.font = '7px monospace'; ctx.textAlign = 'left';
        ctx.fillText('IF x>0', x + 22, y + 50);
        ctx.fillText('THEN y', x + 22, y + 60);
        ctx.fillText('ELSE 0', x + 22, y + 70);
        // Arms — rigid
        ctx.fillStyle = col;
        ctx.fillRect(x + 2, y + 36, 10, 36);
        ctx.fillRect(x + 72, y + 36, 10, 36);
        // Clamp hands
        ctx.fillStyle = colDk;
        ctx.fillRect(x + 0, y + 68, 14, 8);
        ctx.fillRect(x + 70, y + 68, 14, 8);
        // Head — square with antenna
        ctx.fillStyle = col;
        ctx.fillRect(x + 20, y + 6, 44, 30);
        // Screen face
        ctx.fillStyle = '#112';
        ctx.fillRect(x + 26, y + 12, 32, 18);
        // Pixel eyes on screen
        ctx.fillStyle = col;
        ctx.fillRect(x + 30, y + 16, 8, 6);
        ctx.fillRect(x + 46, y + 16, 8, 6);
        ctx.fillRect(x + 34, y + 26, 16, 3); // flat mouth
        // Antenna
        ctx.fillStyle = colDk;
        ctx.fillRect(x + 40, y - 4, 4, 12);
        ctx.fillStyle = '#ff0';
        ctx.fillRect(x + 38, y - 8, 8, 6);
    }

    // -- SPREADSHEET: green grid monster --
    drawEnemyExcel(ctx, x, y, col, colDk, flash, af) {
        // Body — grid shape
        ctx.fillStyle = colDk;
        ctx.fillRect(x + 10, y + 12, 64, 90);
        // Grid cells
        ctx.fillStyle = col;
        for (let row = 0; row < 5; row++) {
            for (let c = 0; c < 3; c++) {
                ctx.fillRect(x + 14 + c * 20, y + 16 + row * 17, 18, 14);
            }
        }
        // Angry face in top cells
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 18, y + 20, 10, 8); // left eye
        ctx.fillRect(x + 56, y + 20, 10, 8); // right eye
        ctx.fillStyle = '#001100';
        ctx.fillRect(x + 22, y + 22, 4, 4);
        ctx.fillRect(x + 58, y + 22, 4, 4);
        // #REF! error in middle
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
        ctx.fillText('#REF!', x + 42, y + 60);
        // Arms — column handles
        ctx.fillStyle = colDk;
        ctx.fillRect(x + 2, y + 40, 8, 40);
        ctx.fillRect(x + 74, y + 40, 8, 40);
        // Teeth at bottom
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 18 + i * 14, y + 98, 10, 8);
        }
    }

    // -- SQL QUERY BOSS: hooded dark sorcerer with query symbol --
    drawEnemySQL(ctx, x, y, col, colDk, flash, af) {
        const pulse = Math.sin(af * 0.04) * 0.3 + 0.7;
        // Scale up for boss
        const ox = x - 10, oy = y - 15;
        // Dark robe
        ctx.fillStyle = flash ? '#ddd' : '#220033';
        ctx.fillRect(ox + 8, oy + 25, 80, 100);
        ctx.fillRect(ox + 0, oy + 90, 96, 36);
        // Robe body
        ctx.fillStyle = flash ? '#eee' : '#440066';
        ctx.fillRect(ox + 16, oy + 35, 64, 80);
        // Hood
        ctx.fillStyle = flash ? '#ddd' : '#220033';
        ctx.fillRect(ox + 14, oy + 8, 68, 36);
        ctx.fillRect(ox + 22, oy + 2, 52, 14);
        // Face in shadow
        ctx.fillStyle = flash ? '#ccc' : '#110022';
        ctx.fillRect(ox + 24, oy + 18, 48, 24);
        // Glowing eyes
        ctx.fillStyle = col;
        ctx.shadowColor = col; ctx.shadowBlur = 10;
        ctx.fillRect(ox + 30, oy + 26, 10, 6);
        ctx.fillRect(ox + 56, oy + 26, 10, 6);
        ctx.shadowBlur = 0;
        // Floating query text
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = col;
        ctx.shadowColor = col; ctx.shadowBlur = 15;
        ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
        ctx.fillText('SELECT *', ox + 48, oy + 65);
        ctx.fillText('FROM data', ox + 48, oy + 80);
        ctx.fillText('WHERE 1=1', ox + 48, oy + 95);
        ctx.shadowBlur = 0;
        ctx.restore();
        // Hands
        ctx.fillStyle = flash ? '#ccc' : '#553366';
        ctx.fillRect(ox + 2, oy + 60, 14, 20);
        ctx.fillRect(ox + 80, oy + 60, 14, 20);
        // Floating orbs around boss
        for (let i = 0; i < 3; i++) {
            const angle = af * 0.03 + (Math.PI * 2 / 3) * i;
            const orbX = ox + 48 + Math.cos(angle) * 50;
            const orbY = oy + 55 + Math.sin(angle) * 25;
            ctx.fillStyle = col;
            ctx.shadowColor = col; ctx.shadowBlur = 8;
            ctx.fillRect(orbX - 3, orbY - 3, 6, 6);
        }
        ctx.shadowBlur = 0;
    }

    renderBattle() {
        const { ctx } = this;
        const W = this.canvas.width, H = this.canvas.height;
        const b = this.battle;
        if (!b) return;

        // Background — dungeon floor
        ctx.fillStyle = '#090016';
        ctx.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 32) {
            for (let x = 0; x < W; x += 32) {
                ctx.fillStyle = ((x + y) / 32) % 2 === 0 ? '#0d0620' : '#100828';
                ctx.fillRect(x, y, 32, 32);
            }
        }
        // Dungeon walls at top
        ctx.fillStyle = '#2a1848';
        ctx.fillRect(0, 0, W, 60);
        ctx.fillStyle = '#3d2466';
        for (let x = 0; x < W; x += 32) { ctx.fillRect(x, 56, 30, 4); }

        // Border
        ctx.strokeStyle = '#7E0CF7'; ctx.lineWidth = 3;
        ctx.strokeRect(4, 4, W - 8, H - 8);

        // --- PLAYER (left side) ---
        const pX = 80, pY = 220;
        const pShake = b.shakePlayer > 0 ? (Math.random() - 0.5) * 8 : 0;

        // Platform
        ctx.fillStyle = '#1a1028';
        ctx.beginPath(); ctx.ellipse(pX + 42, pY + 130, 55, 14, 0, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.translate(pShake, 0);

        // GPU Shield glow behind player
        if (b.playerBuffs.gpuShield > 0) {
            const shieldPulse = Math.sin(this.animFrame * 0.08) * 0.15 + 0.35;
            ctx.shadowColor = '#44aaff';
            ctx.shadowBlur = 25 + Math.sin(this.animFrame * 0.06) * 10;
            ctx.strokeStyle = `rgba(68, 170, 255, ${shieldPulse})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(pX + 42, pY + 55, 52, 68, 0, 0, Math.PI * 2);
            ctx.stroke();
            // Inner glow
            ctx.strokeStyle = `rgba(68, 255, 100, ${shieldPulse * 0.6})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(pX + 42, pY + 55, 44, 60, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        this.drawBattlePlayer(pX, pY, b.flashPlayer > 0);
        ctx.restore();

        // Player name & HP
        ctx.fillStyle = '#333'; ctx.fillRect(30, pY + 148, 160, 12);
        const pRatio = Math.max(0, this.player.hp / this.player.maxHp);
        ctx.fillStyle = pRatio > 0.5 ? '#44ff44' : (pRatio > 0.25 ? '#ffaa00' : '#ff4444');
        ctx.fillRect(30, pY + 148, 160 * pRatio, 12);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(30, pY + 148, 160, 12);

        ctx.fillStyle = '#e0d0ff'; ctx.font = '9px "Press Start 2P", monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${this.player.hp}/${this.player.maxHp}`, 110, pY + 175);
        ctx.fillStyle = this.neuraliftActive ? '#7E0CF7' : this.charData.color;
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(this.neuraliftActive ? 'NEURALIFTED!' : this.charData.title.toUpperCase(), 110, pY + 190);

        // Weapon label
        const wpn = WEAPONS[this.weapon];
        ctx.fillStyle = '#887744'; ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillText(wpn.name, 110, pY + 205);

        // --- ENEMY (right side) ---
        const eX = W - 200, eY = b.enemy.isBoss ? 80 : 120;
        const eShake = b.shakeEnemy > 0 ? (Math.random() - 0.5) * 8 : 0;

        // Platform
        ctx.fillStyle = '#1a1028';
        const platW = b.enemy.isBoss ? 65 : 50;
        ctx.beginPath(); ctx.ellipse(eX + 42, eY + 130, platW, 14, 0, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.translate(eShake, 0);
        this.drawBattleEnemy(eX, eY, b.enemy, b.flashEnemy > 0, b.animFrame);
        ctx.restore();

        // Enemy name & HP
        const ehpX = W - 220;
        ctx.fillStyle = '#333'; ctx.fillRect(ehpX, eY + 148, 180, 12);
        const eRatio = Math.max(0, b.enemy.hp / b.enemy.maxHp);
        ctx.fillStyle = b.enemy.color;
        ctx.fillRect(ehpX, eY + 148, 180 * eRatio, 12);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(ehpX, eY + 148, 180, 12);

        ctx.fillStyle = '#e0d0ff'; ctx.font = '9px "Press Start 2P", monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${b.enemy.hp}/${b.enemy.maxHp}`, ehpX + 90, eY + 175);
        ctx.fillStyle = b.enemy.color; ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText(b.enemy.name, ehpX + 90, eY + 195);

        // --- BATTLE LOG ---
        const logY = H - 200;
        ctx.fillStyle = 'rgba(9, 0, 22, 0.92)';
        ctx.fillRect(20, logY, W - 40, 80);
        ctx.strokeStyle = '#2a1848'; ctx.lineWidth = 1;
        ctx.strokeRect(20, logY, W - 40, 80);

        ctx.fillStyle = '#b088dd'; ctx.font = '9px "Press Start 2P", monospace'; ctx.textAlign = 'left';
        const visibleLog = b.log.slice(-3);
        for (let i = 0; i < visibleLog.length; i++) {
            ctx.fillText(visibleLog[i].substring(0, 70), 34, logY + 22 + i * 24);
        }

        // --- ACTION MENU ---
        if (b.turn === 'player' && !b.showingItems) {
            const menuX = 30, menuY = H - 108;
            const actions = ['Attack', 'Item'];
            for (let i = 0; i < actions.length; i++) {
                const ax = menuX + i * 150;
                ctx.fillStyle = i === b.selectedAction ? 'rgba(126, 12, 247, 0.3)' : 'rgba(26, 16, 40, 0.9)';
                ctx.fillRect(ax, menuY, 140, 32);
                ctx.strokeStyle = i === b.selectedAction ? '#7E0CF7' : '#2a1848';
                ctx.lineWidth = i === b.selectedAction ? 2 : 1;
                ctx.strokeRect(ax, menuY, 140, 32);
                ctx.fillStyle = i === b.selectedAction ? '#fff' : '#888';
                ctx.font = '10px "Press Start 2P", monospace'; ctx.textAlign = 'center';
                ctx.fillText(actions[i], ax + 70, menuY + 21);
            }
            ctx.fillStyle = '#555'; ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center';
            ctx.fillText('\u2190\u2191\u2193\u2192 select, ENTER confirm', W / 2, H - 16);
        }

        // --- ITEM SUBMENU ---
        if (b.turn === 'player' && b.showingItems) {
            const items = this.inventory.filter(it => ITEM_DEFS[it].battleUse);
            const menuX = 30, menuY = H - 110 - items.length * 32;

            ctx.fillStyle = 'rgba(9, 0, 22, 0.95)';
            ctx.fillRect(menuX - 5, menuY - 5, 420, items.length * 32 + 10);
            ctx.strokeStyle = '#7E0CF7'; ctx.lineWidth = 1;
            ctx.strokeRect(menuX - 5, menuY - 5, 420, items.length * 32 + 10);

            for (let i = 0; i < items.length; i++) {
                const item = ITEM_DEFS[items[i]];
                const iy = menuY + i * 32;
                ctx.fillStyle = i === b.selectedItem ? 'rgba(126, 12, 247, 0.3)' : 'transparent';
                ctx.fillRect(menuX, iy, 410, 28);

                ctx.fillStyle = item.color;
                ctx.font = 'bold 16px monospace'; ctx.textAlign = 'left';
                ctx.fillText(item.icon, menuX + 10, iy + 20);

                ctx.fillStyle = i === b.selectedItem ? '#fff' : '#aaa';
                ctx.font = '9px "Press Start 2P", monospace';
                ctx.fillText(item.name, menuX + 36, iy + 19);
            }
            ctx.fillStyle = '#555'; ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center';
            ctx.fillText('\u2190 back, \u2191\u2193 select, ENTER use', W / 2, H - 16);
        }

        // --- BUFFS DISPLAY ---
        const buffs = [];
        if (b.playerBuffs.gpuShield > 0) buffs.push(`GPU Shield(${b.playerBuffs.gpuShield})`);
        if (b.playerBuffs.hyperParam && b.playerBuffs.hyperParam.turns > 0) buffs.push(`Hyper+${b.playerBuffs.hyperParam.bonus}(${b.playerBuffs.hyperParam.turns})`);
        if (b.playerBuffs.cloak > 0) buffs.push('Cloak');
        if (b.playerBuffs.dropout > 0) buffs.push('Dropout');
        if (b.playerBuffs.critical) buffs.push('Crit!');
        if (b.playerBuffs.regularizer) buffs.push('Regularizer');
        if (b.playerBuffs.lrScheduler) buffs.push(`LR+${b.playerBuffs.lrBonus}`);

        if (buffs.length > 0) {
            ctx.fillStyle = '#7E0CF7'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'left';
            ctx.fillText('Buffs: ' + buffs.join(' | '), 34, pY + 220);
        }

        // --- BATTLE RESULT OVERLAY ---
        if (this.state === STATE.BATTLE_RESULT) {
            ctx.fillStyle = 'rgba(9, 0, 22, 0.7)';
            ctx.fillRect(0, 0, W, H);
            ctx.textAlign = 'center';
            if (b.won) {
                ctx.fillStyle = '#44ff44'; ctx.font = '20px "Press Start 2P", monospace';
                ctx.fillText('VICTORY!', W / 2, H / 2 - 20);
                ctx.fillStyle = '#b088dd'; ctx.font = '10px "Press Start 2P", monospace';
                ctx.fillText(`${b.enemy.name} defeated! +2 HP restored.`, W / 2, H / 2 + 20);
            } else {
                ctx.fillStyle = '#ff4444'; ctx.font = '20px "Press Start 2P", monospace';
                ctx.fillText('DEFEATED!', W / 2, H / 2 - 20);
                ctx.fillStyle = '#b088dd'; ctx.font = '10px "Press Start 2P", monospace';
                ctx.fillText(`${b.enemy.name} overwhelmed you.`, W / 2, H / 2 + 20);
            }
            ctx.fillStyle = '#666'; ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText('Press ENTER to continue', W / 2, H / 2 + 60);
        }
    }

    // --------------------------------------------------------
    // NEURALIFT OVERLAY
    // --------------------------------------------------------

    renderNeuraliftOverlay() {
        const { ctx } = this;
        const W = this.canvas.width, H = this.canvas.height;
        const a = this.neuraliftAnim;

        // Phase 0: White flash
        if (a.phase === 0) {
            ctx.fillStyle = `rgba(126, 12, 247, ${a.flash * 0.8})`;
            ctx.fillRect(0, 0, W, H);
        }

        // Purple vignette during activation
        if (a.phase >= 1) {
            const grad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.7);
            grad.addColorStop(0, 'rgba(126, 12, 247, 0)');
            grad.addColorStop(1, `rgba(126, 12, 247, ${Math.min(0.4, a.totalTime * 0.1)})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }

        // Title text
        if (a.phase >= 1 && a.phase <= 2) {
            ctx.save();
            ctx.shadowColor = '#7E0CF7';
            ctx.shadowBlur = 30 + Math.sin(a.totalTime * 5) * 10;
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('NEURALIFT ACTIVATED', W / 2, 50);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#b060ff';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText('The Segmenter sees what you cannot.', W / 2, 76);
            ctx.restore();
        }

        // Phase 2: Flying segments
        if (a.phase === 2) {
            for (const seg of a.flyingSegments) {
                if (seg.t <= 0) continue;
                const easeT = 1 - Math.pow(1 - seg.t, 3); // ease out cubic
                const sx = seg.startX + (seg.targetX - seg.startX) * easeT;
                const sy = seg.startY + (seg.targetY - seg.startY) * easeT;

                // Transform from world to screen coords
                const camX = Math.max(0, Math.min(this.player.x * TILE - W / 2 + TILE / 2, COLS * TILE - W));
                const camY = Math.max(0, Math.min(this.player.y * TILE - H / 2 + TILE / 2, ROWS * TILE - H));
                const screenX = sx - camX;
                const screenY = sy - camY;

                // Glowing orb
                ctx.save();
                ctx.shadowColor = '#f0c040';
                ctx.shadowBlur = 20;
                ctx.fillStyle = '#f0c040';
                ctx.beginPath();
                ctx.arc(screenX, screenY, 8 * (1 + (1 - seg.t) * 0.5), 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Segment name label
                if (seg.t < 0.8) {
                    ctx.fillStyle = `rgba(240, 192, 64, ${1 - seg.t})`;
                    ctx.font = '8px "Press Start 2P", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(seg.name, screenX, screenY - 18);
                }
                ctx.restore();
            }
        }

        // Phase 3: Settling glow
        if (a.phase === 3) {
            const fade = Math.max(0, 1 - a.timer);
            ctx.fillStyle = `rgba(126, 12, 247, ${fade * 0.2})`;
            ctx.fillRect(0, 0, W, H);
        }
    }

    // --------------------------------------------------------
    // QUIZ RENDERING
    // --------------------------------------------------------

    renderQuiz() {
        const { ctx } = this;
        const q = this.quizQuestion;
        if (!q) return;

        const W = this.canvas.width, H = this.canvas.height;
        ctx.fillStyle = 'rgba(9, 0, 22, 0.85)';
        ctx.fillRect(0, 0, W, H);

        const boxW = 620, boxH = 280;
        const boxX = (W - boxW) / 2, boxY = (H - boxH) / 2;

        ctx.fillStyle = '#1a1028';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#7E0CF7'; ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = '#7E0CF7'; ctx.fillRect(boxX, boxY, boxW, 32);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px "Press Start 2P", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('UNLOCK SEGMENT', W / 2, boxY + 16);

        ctx.fillStyle = '#e0d0ff'; ctx.font = '10px "Press Start 2P", monospace'; ctx.textAlign = 'left';
        const lines = this.wrapText(q.q, boxW - 40, ctx);
        let textY = boxY + 52;
        for (const line of lines) { ctx.fillText(line, boxX + 20, textY); textY += 18; }

        const answerY = boxY + 110;
        for (let i = 0; i < q.answers.length; i++) {
            const ay = answerY + i * 38;
            const isChosen = this.quizResult && this.quizResult.chosen === i;
            const isCorrect = i === q.correct;

            if (this.quizResult) {
                ctx.fillStyle = isCorrect ? 'rgba(68,255,68,0.15)' : (isChosen && !this.quizResult.correct ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.03)');
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
            }
            ctx.fillRect(boxX + 16, ay, boxW - 32, 30);
            ctx.strokeStyle = this.quizResult ? (isCorrect ? '#44ff44' : (isChosen ? '#ff4444' : '#333')) : '#3d2466';
            ctx.lineWidth = 1; ctx.strokeRect(boxX + 16, ay, boxW - 32, 30);

            ctx.fillStyle = this.quizResult ? '#666' : '#7E0CF7';
            ctx.font = 'bold 10px "Press Start 2P", monospace'; ctx.textAlign = 'left';
            ctx.fillText(`${i + 1}`, boxX + 26, ay + 18);

            ctx.fillStyle = this.quizResult ? (isCorrect ? '#44ff44' : (isChosen && !this.quizResult.correct ? '#ff4444' : '#666')) : '#ccc';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText(q.answers[i], boxX + 54, ay + 18);
        }

        if (this.quizResult) {
            ctx.textAlign = 'center'; ctx.font = 'bold 12px "Press Start 2P", monospace';
            ctx.fillStyle = this.quizResult.correct ? '#f0c040' : '#ff4444';
            ctx.fillText(this.quizResult.correct ? 'SEGMENT UNLOCKED!' : 'CORRUPTED DATA!', W / 2, boxY + boxH - 16);
        } else {
            ctx.textAlign = 'center'; ctx.fillStyle = '#666'; ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('Press 1-4 to answer', W / 2, boxY + boxH - 16);
        }
    }

    wrapText(text, maxWidth, ctx) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            const test = currentLine + ' ' + words[i];
            if (ctx.measureText(test).width < maxWidth) { currentLine = test; }
            else { lines.push(currentLine); currentLine = words[i]; }
        }
        lines.push(currentLine);
        return lines;
    }

    // --------------------------------------------------------
    // PARTICLES
    // --------------------------------------------------------

    spawnParticles(tileX, tileY, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: tileX, y: tileY,
                ox: Math.random() * TILE, oy: Math.random() * TILE,
                vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60 - 20,
                life: 0.5 + Math.random() * 0.5, maxLife: 1,
                size: 2 + Math.random() * 2, color,
            });
        }
    }
}

// ============================================================
// BOOT
// ============================================================

const game = new Game();
