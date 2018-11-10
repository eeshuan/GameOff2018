import * as PIXI from "pixi.js";
import "pixi-layers";
import TWEEN from "@tweenjs/tween.js";

let grassKey = "./src/assets/grass.png";
let monsterJsonKey = "./src/assets/monster.json";
let monsterPng = "./src/assets/monster.png";
let gatePng = "./src/assets/gate.png";
let splashJpg = "./src/assets/splash.jpg";
let popupJpg = "./src/assets/popup.jpg";

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
    gatePng,
    splashJpg,
    popupJpg
]);
loader.load((_, res)=>{
    console.log(res);
    resources = res;
    initBoard();
    initControls();
    initBallStart();
    initUI();
    initSplash(()=>{
        startGame();
    });
});

let gateTop;
let gateBottom;
let gateLeft;
let gateRight;
let topDir = false;
let bottomDir = false;
let leftDir = false;
let rightDir = false;
let gateSpeed = 20;

let ball;
let initialBallSpeed = 1;
let maxBallSpeed = 10;
let ballSpeed = initialBallSpeed;
let ballDirX;
let ballDirY;

let popup;
let endTxt;

let highScore = 0;
let highScoreText;
let score = 0;
let scoreText;
let level = 1;
let levelText;

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

    popup = new PIXI.Sprite(resources[popupJpg].texture);
    popup.anchor.set(0.5, 0.5);
    popup.x = 1920/2;
    popup.y = 1080/2;
    popup.scale.set(3, 3);
    popup.zIndex = 2;
    popup.visible = false;
    popup.interactive = false;
    popup.on("pointerup", ()=>{
        startGame();
    });
    app.stage.addChild(popup);

    endTxt = new PIXI.Text("Game ended\n\n\nTap to restart", {fontSize: 50});
    endTxt.x = 1920/2;
    endTxt.y = 1080/2;
    endTxt.anchor.set(0.5, 0.5);
    endTxt.visible = false;
    app.stage.addChild(endTxt);
}

function initControls() {
    document.onkeydown = (ev) => {
        let key = ev.key.toLowerCase();
        if (key === "a" || key === "arrowleft") {
            leftDir = true;
        }
        if (key === "s" || key === "arrowdown") {
            bottomDir = true;
        }
        if (key === "d" || key === "arrowright") {
            rightDir = true;
        }
        if (key === "w" || key === "arrowup") {
            topDir = true;
        }
    }

    document.onkeyup = (ev) => {
        let key = ev.key.toLowerCase();
        if (key === "a" || key === "arrowleft") {
            leftDir = false;
        }
        if (key === "s" || key === "arrowdown") {
            bottomDir = false;
        }
        if (key === "d" || key === "arrowright") {
            rightDir = false;
        }
        if (key === "w" || key === "arrowup") {
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

    popup.visible = true;
    popup.interactive = true;
    endTxt.visible = true;

    if (score >= highScore) {
        highScore = score;
        highScoreText.text = highScore.toLocaleString();
    }
}

function startGame() {
    resetBoard();
    gameStarted = true;
    
    setInterval(()=>{
        if (gameStarted) {
            if (ballSpeed < maxBallSpeed) {
                ballSpeed += 0.1;
            }
            let speedLevel = Math.floor(ballSpeed / 2);
            if (speedLevel > level) {
                level = speedLevel;
                levelText.text = level.toString();
                if (level === maxBallSpeed / 2) {
                    levelText.text = level.toString() + "\n(Max)";
                }
            }
        }
    }, 1000);
}

function initSplash(callback) {
    let container = new PIXI.Container();
    let splash = new PIXI.Sprite(resources[splashJpg].texture);
    splash.width = 1920;
    splash.height = 1080;
    splash.zIndex = 2;
    splash.interactive = true;
    container.addChild(splash);

    let title = new PIXI.Text("Angry Angry PIG", {fontSize: 100, fill: "#FFFFFF"});
    title.anchor.set(0.5, 0.5);
    title.x = 1920/2;
    title.y = 200;
    container.addChild(title);

    let startBtn = new PIXI.Text("Tap to Start", {fontSize: 100, fill: "#FFFFFF"});
    startBtn.anchor.set(0.5, 0.5);
    startBtn.x = 1920/2;
    startBtn.y = 1080 - 200;
    container.addChild(startBtn);

    new TWEEN.Tween(startBtn)
    .to({alpha: 0}, 1000)
    .repeat(Infinity)
    .yoyo(true)
    .start();

    splash.on("pointerup", ()=>{
        splash.visible = false;
        splash.interactive = false;
        title.visible = false;
        startBtn.visible = false;
        callback();
    });

    app.stage.addChild(container);
}

function resetBoard() {
    gateTop.x = 1920/2;
    gateTop.y = 0;
    gateBottom.x = 1920/2;
    gateBottom.y = 1080;
    gateLeft.x = 420;
    gateLeft.y = 1080/2;
    gateRight.x = 1920 - 420;
    gateRight.y = 1080/2;
    
    popup.visible = false;
    popup.interactive = false;
    endTxt.visible = false;

    ballSpeed = initialBallSpeed;
    ball.x = 1920/2;
    ball.y = 1080/2;
    randomBallDirection();

    score = 0;
    scoreText.text = score.toLocaleString();
    level = 1;
    levelText.text = level.toLocaleString();
}

function randomBallDirection() {
    ballDirX = Math.random() * ((Math.random() > 0.5) ? 1 : -1);
    ballDirY = Math.random() * ((Math.random() > 0.5) ? 1 : -1);
}

function initUI() {
    let leftUIContainer = new PIXI.Container();
    let highScoreLabel = new PIXI.Text("High Score:", {fontSize: 40, fill: "#FFFFFF"});
    highScoreLabel.anchor.set(0.5, 0.5);
    highScoreLabel.x = 420/2;
    highScoreLabel.y = 1080/2 - 100;
    leftUIContainer.addChild(highScoreLabel);
    highScoreText = new PIXI.Text(highScore.toLocaleString(), {fontSize: 100, fill: "#FFFFFF"});
    highScoreText.anchor.set(0.5, 0.5);
    highScoreText.x = 420/2;
    highScoreText.y = 1080/2;
    leftUIContainer.addChild(highScoreText);

    let rightUiContainer = new PIXI.Container();
    rightUiContainer.x = 1080 + 420;
    let scoreLabel = new PIXI.Text("Score:", {fontSize: 40, fill: "#FFFFFF"});
    scoreLabel.anchor.set(0.5, 0.5);
    scoreLabel.x = 420/2;
    scoreLabel.y = 1080/2 - 300;
    rightUiContainer.addChild(scoreLabel);
    scoreText = new PIXI.Text(score.toLocaleString(), {fontSize: 100, fill: "#FFFFFF"});
    scoreText.anchor.set(0.5, 0.5);
    scoreText.x = 420/2;
    scoreText.y = 1080/2 - 200;
    rightUiContainer.addChild(scoreText);
    let levelLabel = new PIXI.Text("Anger Level:", {fontSize: 40, fill: "#FFFFFF"});
    levelLabel.anchor.set(0.5, 0.5);
    levelLabel.x = 420/2;
    levelLabel.y = 1080/2 + 200;
    rightUiContainer.addChild(levelLabel);
    levelText = new PIXI.Text(level.toString(), {fontSize: 100, fill: "#FFFFFF", align: "center"});
    levelText.anchor.set(0.5, 0);
    levelText.x = 420/2;
    levelText.y = 1080/2 + 250;
    rightUiContainer.addChild(levelText);

    app.stage.addChild(leftUIContainer);
    app.stage.addChild(rightUiContainer);
}

function updateLoop() {
    TWEEN.update();
    if (leftDir) {
        if (gateTop.x > 420 + 100) {
            gateTop.x -= gateSpeed;
            gateBottom.x -= gateSpeed;
        }
    }
    if (bottomDir) {
        if (gateLeft.y < 1080 - 100) {
            gateLeft.y += gateSpeed;
            gateRight.y += gateSpeed;
        }
    }
    if (rightDir) {
        if (gateTop.x < 1920 - 420 - 100) {
            gateTop.x += gateSpeed;
            gateBottom.x += gateSpeed;
        }
    }
    if (topDir) {
        if (gateLeft.y > 0 + 100) {
            gateLeft.y -= gateSpeed;
            gateRight.y -= gateSpeed;
        }
    }

    if (gameStarted) {
        ball.x += ballDirX * ballSpeed;
        ball.y += ballDirY * ballSpeed;
        if (ballDirY !== 0) {
            ball.rotation = ballDirX/ballDirY;
        }
        score += level;
        scoreText.text = score.toLocaleString();
        if (ball.x >= 1920 - 440 || ball.x <= 440) {
            if (ball.y < gateRight.y - 100 || ball.y > gateRight.y + 100) {
                endGame();
            }
            ballDirX = -ballDirX;
            // ballDirY = randomNumberInRange(-ballDirY, ballDirY);
            ball.scale.x *= -1;
        }
        if (ball.y >= 1080 - 20 || ball.y <= 0 + 20) {
            if (ball.x < gateTop.x - 100 || ball.x > gateTop.x + 100) {
                endGame();
            }
            ballDirY = -ballDirY;
            // ballDirX = randomNumberInRange(-ballDirX, ballDirX);
        }
    }
}
app.ticker.add(updateLoop.bind(this));

/** Helper */
function randomNumberInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}