import * as PIXI from "pixi.js";

let grassKey = "./src/assets/grass.png";
let monsterJsonKey = "./src/assets/monster.json";
let monsterPng = "./src/assets/monster.png";
let gatePng = "./src/assets/gate.png";

let options = {
    backgroundColor: 0xAAAAAA,
    height: 1080,
    width: 1920
}
let app = new PIXI.Application(options);
document.body.appendChild(app.view);

let gameStarted = false;
let resources;
let loader = new PIXI.loaders.Loader();
loader.add([
    grassKey,
    monsterJsonKey,
    monsterPng,
    gatePng
]);
loader.load((_, res)=>{
    console.log(res);
    resources = res;
    initBoard();
    initControls();
    initBallStart();
    gameStarted = true;
});

let gateTop;
let gateBottom;
let gateLeft;
let gateRight;
let topDir = false;
let bottomDir = false;
let leftDir = false;
let rightDir = false;

let ball;
let ballDirX = 1;
let ballDirY = 2;
let ballSpeed = 2;

function initBoard() {
    /** Cage */
    let cage = new PIXI.Sprite(resources[grassKey].texture);
    cage.alpha = 1;
    cage.anchor.set(0.5, 0.5);
    cage.width = 1080;
    cage.height = 1080;
    cage.x = 1920/2;
    cage.y = 1080/2;
    app.stage.addChild(cage);

    /** Gates */
    gateTop = new PIXI.Sprite(resources[gatePng].texture);
    gateTop.anchor.set(0.5, 0);
    gateTop.x = 1920/2;
    gateTop.y = 0;
    gateTop.width = 200;
    gateTop.height = 20;
    app.stage.addChild(gateTop);

    gateBottom = new PIXI.Sprite(resources[gatePng].texture);
    gateBottom.anchor.set(0.5, 1);
    gateBottom.x = 1920/2;
    gateBottom.y = 1080;
    gateBottom.width = 200;
    gateBottom.height = 20;
    app.stage.addChild(gateBottom);

    gateLeft = new PIXI.Sprite(resources[gatePng].texture);
    gateLeft.rotation = Math.PI/2;
    gateLeft.anchor.set(0.5, 1);
    gateLeft.x = 420;
    gateLeft.y = 1080/2;
    gateLeft.width = 200;
    gateLeft.height = 20;
    app.stage.addChild(gateLeft);

    gateRight = new PIXI.Sprite(resources[gatePng].texture);
    gateRight.rotation = -Math.PI/2;
    gateRight.anchor.set(0.5, 1);
    gateRight.x = 1920 - 420;
    gateRight.y = 1080/2;
    gateRight.width = 200;
    gateRight.height = 20;
    app.stage.addChild(gateRight);
}

function initControls() {
    document.onkeydown = (ev) => {
        let key = ev.key;
        if (key === "a" || key === "ArrowLeft") {
            leftDir = true;
        }
        if (key === "s" || key === "ArrowDown") {
            bottomDir = true;
        }
        if (key === "d" || key === "ArrowRight") {
            rightDir = true;
        }
        if (key === "w" || key === "ArrowUp") {
            topDir = true;
        }
    }

    document.onkeyup = (ev) => {
        let key = ev.key;
        if (key === "a" || key === "ArrowLeft") {
            leftDir = false;
        }
        if (key === "s" || key === "ArrowDown") {
            bottomDir = false;
        }
        if (key === "d" || key === "ArrowRight") {
            rightDir = false;
        }
        if (key === "w" || key === "ArrowUp") {
            topDir = false;
        }
    }
}

function initBallStart() {
    let sheet = resources[monsterJsonKey].spritesheet;
    ball = new PIXI.extras.AnimatedSprite(sheet.animations["walk"]);
    ball.anchor.set(0.5, 0.5);
    ball.x = 1920/2;
    ball.y = 1080/2;
    ball.scale.set(3, 3);
    ball.animationSpeed = 0.15;
    ball.play();
    app.stage.addChild(ball);
}

/** Helper area */
function resize() {
    let ratio = 1920/1080;
    let w = 0;
    let h = 0;

    if (window.innerWidth / window.innerHeight >= ratio) {
        w = window.innerHeight * ratio;
        h = window.innerHeight;
    } 
    else {
        w = window.innerWidth;
        h = window.innerWidth / ratio;
    }
    app.renderer.view.style.width = w+"px";
    app.renderer.view.style.height = h+"px";
}

window.onresize = ()=>{
    resize();
};
resize();
function endGame() {
    gameStarted = false;
    ballDirX = 0;
    ballDirY = 0;
    
    let endTxt = new PIXI.Text("Game end", {fontSize: 50});
    endTxt.x = 1920/2;
    endTxt.y = 1080/2;
    endTxt.anchor.set(0.5, 0.5);
    app.stage.addChild(endTxt);
}

function updateLoop() {
    if (leftDir) {
        if (gateTop.x > 420 + 100) {
            gateTop.x -= 10;
            gateBottom.x -= 10;
        }
    }
    if (bottomDir) {
        if (gateLeft.y < 1080 - 100) {
            gateLeft.y += 10;
            gateRight.y += 10;
        }
    }
    if (rightDir) {
        if (gateTop.x < 1920 - 420 - 100) {
            gateTop.x += 10;
            gateBottom.x += 10;
        }
    }
    if (topDir) {
        if (gateLeft.y > 0 + 100) {
            gateLeft.y -= 10;
            gateRight.y -= 10;
        }
    }

    if (gameStarted) {
        if (ball.x >= 1920 - 440 || ball.x <= 440) {
            if (ball.y < gateRight.y - 100 || ball.y > gateRight.y + 100) {
                endGame();
            }
            ballDirX = -ballDirX;
            ball.scale.x *= -1;
        }
        if (ball.y >= 1080 - 20 || ball.y <= 0 + 20) {
            if (ball.x < gateTop.x - 100 || ball.x > gateTop.x + 100) {
                endGame();
            }
            ballDirY = -ballDirY;
        }
        ball.x += ballDirX * ballSpeed;
        ball.y += ballDirY * ballSpeed;
        if (ballDirY !== 0) {
            ball.rotation = ballDirX/ballDirY;
        }
    }
}
app.ticker.add(updateLoop.bind(this));