import * as PIXI from "pixi.js";


let grassKey = "./src/assets/grass.png";

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
    grassKey
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
let ballSpeed = 5;

function initBoard() {
    /** Terrain */
    let sprite = new PIXI.Sprite(resources[grassKey].texture);
    sprite.alpha = 0.6;
    // app.stage.addChild(sprite);

    /** Cage */
    let cage = new PIXI.Graphics();
    cage.beginFill(0x00ff00);
    cage.drawRect(420, 0, 1080, 1080);
    cage.endFill();
    cage.alpha = 0.6;
    app.stage.addChild(cage);

    /** Gates */
    gateTop = new PIXI.Graphics();
    gateTop.beginFill(0x000000);
    gateTop.drawRect(1920/2 - 100, 0, 200, 20);
    app.stage.addChild(gateTop);

    gateBottom = new PIXI.Graphics();
    gateBottom.beginFill(0x000000);
    gateBottom.drawRect(1920/2 - 100, 1080-20, 200, 20);
    app.stage.addChild(gateBottom);

    gateLeft = new PIXI.Graphics();
    gateLeft.beginFill(0x000000);
    gateLeft.drawRect(420, 1080/2 - 100, 20, 200);
    app.stage.addChild(gateLeft);

    gateRight = new PIXI.Graphics();
    gateRight.beginFill(0x000000);
    gateRight.drawRect(420 + 1080 - 20, 1080/2 - 100, 20, 200);
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
    ball = new PIXI.Graphics();
    ball.beginFill(0x000000);
    ball.drawCircle(1920/2, 1080/2, 10);
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
        if (gateTop.x > -440) {
            gateTop.x -= 10;
            gateBottom.x -= 10;
        }
    }
    if (bottomDir) {
        if (gateLeft.y < 440) {
            gateLeft.y += 10;
            gateRight.y += 10;
        }
    }
    if (rightDir) {
        if (gateTop.x < 440) {
            gateTop.x += 10;
            gateBottom.x += 10;
        }
    }
    if (topDir) {
        if (gateLeft.y > -440) {
            gateLeft.y -= 10;
            gateRight.y -= 10;
        }
    }

    if (gameStarted) {
        if (ball.x >= 520 || ball.x <= -520) {
            if (ball.y < gateRight.y - 100 || ball.y > gateRight.y + 100) {
                endGame();
            }
            ballDirX = -ballDirX;
        }
        if (ball.y >= 520 || ball.y <= -520) {
            if (ball.x < gateTop.x - 100 || ball.x > gateTop.x + 100) {
                endGame();
            }
            ballDirY = -ballDirY;
        }
        ball.x += ballDirX * ballSpeed;
        ball.y += ballDirY * ballSpeed;
    }
}
app.ticker.add(updateLoop.bind(this));