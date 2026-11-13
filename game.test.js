const fs = require("node:fs");
const vm = require("node:vm");

let passed = 0;
let failed = 0;

const source = fs.readFileSync(__dirname + "/game.js", "utf-8");

function eq(actual, expected) {
    if (actual !== expected) {
        throw new Error(`Oodatud ${expected}, saadud ${actual}`);
    }
}

function makeContext() {
    const window = {
        addEventListener() {},
        location: { reload() {} },
        requestAnimationFrame() {}
    };

    const document = {
        getElementById() {
            return {
                getContext() {
                    return {
                        clearRect() {},
                        drawImage() {},
                        fillText() {},
                        font: "",
                        fillStyle: ""
                    };
                }
            };
        }
    };

    return {
        window,
        document,
        Image: function () {},
        Audio: function () {},
        alert() {},
        console
    };
}

function test(name, check) {
    try {
        const context = makeContext();
        vm.runInNewContext(`${source}; this.game = game; this.KEYS = KEYS;`, context);
        const game = context.game;
        const KEYS = context.KEYS;

        check(game, KEYS);
        passed++;
        console.log(`OK ${name}`);
    } catch (error) {
        failed++;
        process.exitCode = 1;
        console.error(`VIGA ${name}: ${error.message}`);
    }

    console.log(`Läbitud: ${passed}, ebaõnnestunud: ${failed}`);
}

test("Plokkide loomine", game => {
    game.create();
    eq(game.blocks.length, 32);
    eq(game.blocks.every(block => block.active === true), true);
    eq(game.blocks[0].x, 65);
    eq(game.blocks[0].y, 35);
    eq(game.blocks[31].x, 513);
    eq(game.blocks[31].y, 107);
});

test("Punkti lisamine", game => {
    game.create();
    let endings = 0;
    game.end = () => { endings++; };
    game.addScore();
    eq(game.score, 1);
    eq(endings, 0);
});

test("Viimane punkt lõpetab mängu täpselt ühe korra", game => {
    game.create();
    game.score = 31;
    let endings = 0;
    game.end = () => { endings++; };
    game.addScore();
    eq(game.score, 32);
    eq(endings, 1);
});

test("Palli liikumine", game => {
    game.ball.dx = 2;
    game.ball.dy = -3;
    game.ball.move();
    eq(game.ball.x, 322);
    eq(game.ball.y, 277);
});

test("Paigal olev pall", game => {
    game.ball.x = 320;
    game.ball.y = 280;
    game.ball.dx = 0;
    game.ball.dy = 0;
    game.ball.move();
    eq(game.ball.x, 320);
    eq(game.ball.y, 280);
});

test("Kokkupõrge", game => {
    const block = { x: 330, y: 290, width: 60, height: 20 };
    eq(game.ball.collide(block), true);
});

test("Kokkupõrget pole", game => {
    const block = { x: 10, y: 10, width: 60, height: 20 };
    eq(game.ball.collide(block), false);
});

test("Servade puudutus", game => {
    const block = { x: 340, y: 280, width: 60, height: 20 };
    eq(game.ball.collide(block), false);
});

test("Järgmine asukoht", game => {
    const block = { x: 342, y: 280, width: 60, height: 20 };
    game.ball.dx = 3;
    eq(game.ball.collide(block), true);
});

test("Plokilt põrkamine", game => {
    const block = { active: true };
    game.ball.dy = -3;
    game.ball.bumpBlock(block);
    eq(game.ball.dy, 3);
    eq(block.active, false);
});

test("Platvormi suund", (game, KEYS) => {
    game.platform.start(KEYS.LEFT);
    eq(game.platform.dx, -6);
    game.platform.start(KEYS.RIGHT);
    eq(game.platform.dx, 6);
});

test("Platvormi peatamine", game => {
    game.platform.dx = 6;
    game.platform.stop();
    eq(game.platform.dx, 0);
});

test("Pall platvormil", game => {
    game.platform.dx = 6;
    game.platform.move();
    eq(game.platform.x, 286);
    eq(game.ball.x, 326);
});

test("Vaba pall", game => {
    game.platform.ball = null;
    game.platform.dx = -6;
    game.platform.move();
    eq(game.platform.x, 274);
    eq(game.ball.x, 320);
});

test("Ühekordne lask", game => {
    let starts = 0;
    game.ball.start = () => { starts++; };
    game.platform.fire();
    game.platform.fire();
    eq(starts, 1);
    eq(game.platform.ball, null);
});

test("Palli start", game => {
    game.random = (min, max) => {
        eq(min, -3);
        eq(max, 3);
        return 2;
    };
    game.ball.start();
    eq(game.ball.dy, -3);
    eq(game.ball.dx, 2);
});

test("Puutepunkt", game => {
    eq(game.platform.getTouchOffset(280), -1);
    eq(game.platform.getTouchOffset(330), 0);
    eq(game.platform.getTouchOffset(380), 1);
});

test("Platvormi vasak piir", game => {
    game.platform.x = 0;
    game.platform.dx = -6;
    game.platform.collideWorldBounds();
    eq(game.platform.dx, 0);
});

test("Platvormi parem piir", game => {
    game.platform.x = 540;
    game.platform.dx = 6;
    game.platform.collideWorldBounds();
    eq(game.platform.dx, 0);
});

test("Platvormilt põrkamine", game => {
    game.ball.dy = 3;
    game.ball.dx = 2;
    game.ball.bumpPlatform(game.platform);
    eq(game.ball.dy, -3);
    eq(game.ball.dx, 0);
});

test("Palli vasak piir", game => {
    let sounds = 0;
    game.sounds.bump = { play() { sounds++; } };
    game.ball.x = 1;
    game.ball.dx = -3;
    game.ball.collideWorldBounds();
    eq(game.ball.x, 0);
    eq(game.ball.dx, 3);
    eq(sounds, 1);
});

test("Palli parem piir", game => {
    let sounds = 0;
    game.sounds.bump = { play() { sounds++; } };
    game.ball.x = game.width - game.ball.width - 1;
    game.ball.dx = 3;
    game.ball.collideWorldBounds();
    eq(game.ball.x, game.width - game.ball.width);
    eq(game.ball.dx, -3);
    eq(sounds, 1);
});

test("Palli ülemine piir", game => {
    let sounds = 0;
    game.sounds.bump = { play() { sounds++; } };
    game.ball.y = 1;
    game.ball.dy = -3;
    game.ball.collideWorldBounds();
    eq(game.ball.y, 0);
    eq(game.ball.dy, 3);
    eq(sounds, 1);
});

test("Kaotus", game => {
    let endings = 0;
    game.end = () => { endings++; };
    game.ball.y = 340;
    game.ball.dy = 3;
    game.ball.collideWorldBounds();
    eq(endings, 1);
});

test("Ploki tabamine", game => {
    const block = { x: 330, y: 290, width: 60, height: 20, active: true };
    game.blocks = [block, { x: 10, y: 10, width: 60, height: 20, active: true }];
    game.score = 0;
    game.ball.dy = 3;
    let sounds = 0;
    game.sounds.bump = { play() { sounds++; } };
    game.collideBlocks();
    game.collideBlocks();
    eq(block.active, false);
    eq(game.blocks[1].active, true);
    eq(game.score, 1);
    eq(game.ball.dy, -3);
    eq(sounds, 1);
});