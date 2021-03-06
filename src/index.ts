import * as PIXI from "pixi.js";
import "pixi-layers";
import TWEEN from "@tweenjs/tween.js";

/** Sprites */
let grassKey = "./src/assets/sprites/grass.png";
let piggyJsonKey = "./src/assets/sprites/piggy.json";
let gatePng = "./src/assets/sprites/gate.png";
let splashJpg = "./src/assets/sprites/splash.jpg";
let startBtnImg = "./src/assets/sprites/startBtn.png";
let helpBtnImg = "./src/assets/sprites/helpBtn.png";
let startPopupImg = "./src/assets/sprites/startPopup.png";
let helpPopupImg = "./src/assets/sprites/helpPopup.png";
let endPopupImg = "./src/assets/sprites/endPopup.png";
let piggyShadow = "./src/assets/sprites/shadow.png";

/** Sounds */
let titleBgm = "./src/assets/sounds/title.mp3";
let gameBgm = "./src/assets/sounds/bgm.mp3";
let buttonFeedback = "./src/assets/sounds/button_feedback.wav";
let hurtSound = "./src/assets/sounds/hurt.wav";
let blockSound = "./src/assets/sounds/block.wav";

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
    piggyJsonKey,
    gatePng,
    splashJpg,
    startBtnImg,
    helpBtnImg,
    startPopupImg,
    helpPopupImg,
    endPopupImg,
    piggyShadow,
    titleBgm,
    gameBgm,
    buttonFeedback,
    hurtSound,
    blockSound
]);
let loadingBarContainer = new PIXI.Container();
loadingBarContainer.x = 1920/2 - 500;
loadingBarContainer.y = 1080/2;

let loadingBarBase = new PIXI.Graphics();
loadingBarBase.beginFill(0x000000);
loadingBarBase.drawRoundedRect(0, 0, 1000, 20, 15);
loadingBarBase.endFill();
loadingBarContainer.addChild(loadingBarBase);

let loadingBarProgress = new PIXI.Graphics();
loadingBarProgress.beginFill(0xFFFFFF);
loadingBarProgress.drawRoundedRect(0, 0, 1000, 20, 15);
loadingBarProgress.endFill();
loadingBarProgress.width = 0;
loadingBarContainer.addChild(loadingBarProgress);

let loadingBarText = new PIXI.Text("", {fontSize: 60, fill: 0xFFFFFF});
loadingBarText.anchor.set(0.5, 0.5);
loadingBarText.x = 500;
loadingBarText.y = 100;
loadingBarContainer.addChild(loadingBarText);

app.stage.addChild(loadingBarContainer);

loader.on("progress", (loader) => {
    loadingBarProgress.width = loader.progress / 100 * 1000;
    loadingBarText.text = `${loader.progress.toFixed(0)}%`;
})

let startPtX = 0;
let startPtY = 0;
let pointerdown = false;
let inGame = false;

loader.load((_, res)=>{
    // console.log(res);
    setTimeout(() => {
        loadingBarText.text = "Press anywhere to start";
        document.onpointerup = () => {
            run(res);
            makeFullScreen();

            let joyStick = new PIXI.Container();
            joyStick.x = 210;
            joyStick.y = 1080 - 300;
            joyStick.alpha = 0.6;
            joyStick.visible = false;

            let joyStickBase = new PIXI.Graphics();
            joyStickBase.beginFill(0x000000);
            joyStickBase.drawCircle(0, 0, 100);
            joyStickBase.endFill();
            joyStick.addChild(joyStickBase);

            let joyStickHandle = new PIXI.Graphics();
            joyStickHandle.beginFill(0xFFFFFF);
            joyStickHandle.drawCircle(0, 0, 50);
            joyStickHandle.endFill();
            joyStick.addChild(joyStickHandle);

            app.stage.addChild(joyStick);

            document.onpointerdown = (ev) => {
                if (inGame) {
                    if (ev.x/screen.width * 1920 > gateTop.worldTransform.tx) {
                        rightDir = true;
                    }
                    if (ev.x/screen.width * 1920 < gateTop.worldTransform.tx) {
                        leftDir = true;
                    }
                    if (ev.y/screen.height * 1080 > gateLeft.worldTransform.ty) {
                        bottomDir = true;
                    }
                    if (ev.y/screen.height * 1080 < gateLeft.worldTransform.ty) {
                        topDir = true;
                    }
                }
            }
            document.onpointermove = (ev) => {

            }
            document.onpointerup = () => {
                if (inGame) {
                    rightDir = false;
                    leftDir = false;
                    topDir = false;
                    bottomDir = false;
                }
            }
        }
    }, 1000);
});

function run(res) {
    resources = res;
    initBoard();
    initControls();
    initBallStart();
    initUI();
    initSplash(()=>{
        bounceIn(startPopup);
        startPopup.interactive = true;
        resources[gameBgm].data.loop = true;
        resources[gameBgm].data.volume = 0.1;
        resources[gameBgm].data.play();
        resources[titleBgm].data.pause();
        inGame = true;
    });
    resources[titleBgm].data.loop = true;
    resources[titleBgm].data.volume = 0.1;
    resources[titleBgm].data.play();
    resources[buttonFeedback].data.volume = 0.5;
}

let gateTop;
let gateBottom;
let gateLeft;
let gateRight;
let topDir = false;
let bottomDir = false;
let leftDir = false;
let rightDir = false;
let gateSpeedInit = 20;
let gateSpeedX = gateSpeedInit;
let gateSpeedY = gateSpeedInit;

let piggy;
let initialBallSpeed = 1;
let maxBallSpeed = 10;
let ballSpeed = initialBallSpeed;
let ballDirX;
let ballDirY;
let ballIncreaseRate = 0.5;
let ballUpdateInterval;

let startPopup;
let endPopup;

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
    gateTop.rotation = Math.PI;
    gateTop.anchor.set(0.5, 0.5);
    gateTop.x = 1920/2;
    gateTop.y = 0;
    gateTop.width = 200;
    gateTop.height = 50;
    app.stage.addChild(gateTop);

    gateBottom = new PIXI.Sprite(resources[gatePng].texture);
    gateBottom.anchor.set(0.5, 0.5);
    gateBottom.x = 1920/2;
    gateBottom.y = 1080;
    gateBottom.width = 200;
    gateBottom.height = 50;
    app.stage.addChild(gateBottom);

    gateLeft = new PIXI.Sprite(resources[gatePng].texture);
    gateLeft.rotation = Math.PI/2;
    gateLeft.anchor.set(0.5, 0.5);
    gateLeft.x = 420;
    gateLeft.y = 1080/2;
    gateLeft.width = 200;
    gateLeft.height = 50;
    app.stage.addChild(gateLeft);

    gateRight = new PIXI.Sprite(resources[gatePng].texture);
    gateRight.rotation = -Math.PI/2;
    gateRight.anchor.set(0.5, 0.5);
    gateRight.x = 1920 - 420;
    gateRight.y = 1080/2;
    gateRight.width = 200;
    gateRight.height = 50;
    app.stage.addChild(gateRight);

    startPopup = new PIXI.Sprite(resources[startPopupImg].texture);
    startPopup.anchor.set(0.5, 0.5);
    startPopup.scale.set(0.0001, 0.0001);
    startPopup.x = 1920/2;
    startPopup.y = 1080/2;
    startPopup.zIndex = 2;
    startPopup.interactive = false;
    startPopup.on("pointerup", ()=>{
        bounceOut(startPopup);
        setTimeout(() => {
            startGame();
        }, 500);
        resources[buttonFeedback].data.play();
    });
    app.stage.addChild(startPopup);

    endPopup = new PIXI.Sprite(resources[endPopupImg].texture);
    endPopup.anchor.set(0.5, 0.5);
    endPopup.x = 1920/2;
    endPopup.y = 1080/2;
    endPopup.scale.set(0.0001, 0.0001);
    endPopup.zIndex = 2;
    endPopup.visible = false;
    endPopup.interactive = false;
    endPopup.hitArea = new PIXI.Rectangle(-1920/2, -1080/2, 1920, 1080);
    endPopup.on("pointerup", ()=>{
        bounceOut(endPopup);
        setTimeout(() => {
            startGame();
        }, 500);
        resources[buttonFeedback].data.play();
    });

    let endScoreText = new PIXI.Text("", {fontSize: 100, fill: "0xFFFFFF", fontFamily: "Arial"});
    endScoreText.anchor.set(0, 0.5);
    endScoreText.x = 10;
    endScoreText.y = -60;
    endScoreText.name = "scoreText";
    endPopup.addChild(endScoreText);
    app.stage.addChild(endPopup);  
}

function initControls() {
    document.onkeydown = (ev) => {
        let key = ev.key.toLowerCase();
        gateSpeedX = gateSpeedInit;
        gateSpeedY = gateSpeedInit;
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
    let sheet = resources[piggyJsonKey].spritesheet;
    piggy = new PIXI.Container();
    piggy.x = 1920/2;
    piggy.y = 1080/2;
    piggy.height = 100;
    piggy.width = 100;
    piggy.visible = false;

    let shadow = new PIXI.Sprite(resources[piggyShadow].texture);
    shadow.anchor.set(0.5, 0.5);
    shadow.scale.set(0.16, 0.16);
    shadow.name = "shadow";
    piggy.addChild(shadow);

    let pig = new PIXI.extras.AnimatedSprite(sheet.animations["walk"]);
    pig.anchor.set(0.5, 0.5);
    pig.scale.set(0.15, 0.15);
    pig.name = "pig";
    pig.play();
    piggy.addChild(pig);

    app.stage.addChild(piggy);
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
    resources[hurtSound].data.volume = 0.5;
    resources[hurtSound].data.play();
    gameStarted = false;
    ballDirX = 0;
    ballDirY = 0;

    endPopup.visible = true;
    bounceIn(endPopup);
    endPopup.interactive = true;
    endPopup.getChildByName("scoreText").text = score.toString();

    if (score >= highScore) {
        highScore = score;
        highScoreText.text = highScore.toLocaleString();
    }
}

function startGame() {
    resetBoard();
    gameStarted = true;
    piggy.getChildByName("pig").tint = 0xFFFFFF;
    ballUpdateInterval = setInterval(()=>{
        if (gameStarted) {
            if (ballSpeed < maxBallSpeed) {
                ballSpeed += ballIncreaseRate;
            }
            let speedLevel = Math.floor(ballSpeed / 2);
            if (speedLevel > level) {
                level = speedLevel;
                levelText.text = level.toString();
                if (speedLevel >= maxBallSpeed/4) {
                    piggy.getChildByName("pig").tint = 0xDB7093;
                }
                if (level === maxBallSpeed / 2) {
                    levelText.text = level.toString() + "\n(Max)";
                    piggy.getChildByName("pig").tint = 0xFF0000;
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
    container.addChild(splash);

    let playButton = new PIXI.Sprite(resources[startBtnImg].texture);
    playButton.anchor.set(0.5, 0.5);
    playButton.x = 1920/2 - 150;
    playButton.y = 1080 - 300;
    playButton.zIndex = 2;
    playButton.interactive = true;
    playButton.on("pointerdown", ()=>{
        playButton.scale.set(0.9, 0.9);
    });
    playButton.on("mouseover", ()=> {
        playButton.tint = 0xFFFF00;
        resources[buttonFeedback].data.play();
    });
    playButton.on("mouseout", ()=> {
        playButton.tint = 0xFFFFFF;
    });
    playButton.on("pointerupoutside", ()=>{
        playButton.scale.set(1, 1);
    });
    playButton.on("pointerup", ()=>{
        playButton.scale.set(1, 1);
        container.visible = false;
        resources[buttonFeedback].data.play();
        callback();
    });
    container.addChild(playButton);

    let helpButton = new PIXI.Sprite(resources[helpBtnImg].texture);
    helpButton.anchor.set(0.5, 0.5);
    helpButton.x = 1920/2 + 90;
    helpButton.y = 1080 - 150;
    helpButton.zIndex = 2;
    helpButton.interactive = true;
    helpButton.on("pointerdown", ()=>{
        helpButton.scale.set(0.9, 0.9);
    });
    helpButton.on("mouseover", ()=> {
        helpButton.tint = 0xFFFF00;
        resources[buttonFeedback].data.play();
    });
    helpButton.on("mouseout", ()=> {
        helpButton.tint = 0xFFFFFF;
    });
    helpButton.on("pointerupoutside", ()=>{
        helpButton.scale.set(1, 1);
    });
    helpButton.on("pointerup", ()=>{
        helpButton.scale.set(1, 1);
        helpPopup.interactive = true;
        helpPopup.scale.set(0.0001, 0.0001);
        bounceIn(helpPopup);
        resources[buttonFeedback].data.play();
    });
    container.addChild(helpButton);

    let helpPopup = new PIXI.Sprite(resources[helpPopupImg].texture);
    helpPopup.scale.set(0.0001, 0.0001);
    helpPopup.interactive = false;
    helpPopup.anchor.set(0.5, 0.5);
    helpPopup.x = 1920/2;
    helpPopup.y = 1080/2;
    helpPopup.on("pointerup", ()=>{
        helpPopup.interactive = false;
        bounceOut(helpPopup);
        resources[buttonFeedback].data.play();
    });
    container.addChild(helpPopup);
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
    
    endPopup.interactive = false;

    clearInterval(ballUpdateInterval);
    ballSpeed = initialBallSpeed;
    piggy.x = 1920/2;
    piggy.y = 1080/2;
    piggy.visible = true;
    randomBallDirection();

    score = 0;
    scoreText.text = score.toLocaleString();
    level = 1;
    levelText.text = level.toLocaleString();
}

function randomBallDirection() {
    let threshold = 0.5;
    ballDirX = Math.random() * ((Math.random() > 0.5) ? 1 : -1);
    ballDirY = Math.random() * ((Math.random() > 0.5) ? 1 : -1);
    if (Math.abs(ballDirX) < threshold) {
        ballDirX *= 2;
    }
    if (Math.abs(ballDirY) < threshold) {
        ballDirY *= 2;
    }
    piggy.rotation = Math.atan2(ballDirY, ballDirX) + Math.PI/2;
}

function randomBallDirectionX() {
    ballDirX = Math.random() * ((Math.random() > 0.5) ? 1 : -1) + ballIncreaseRate;
    piggy.rotation = Math.atan2(ballDirY, ballDirX) + Math.PI/2;
    resources[blockSound].data.volume = 0.5;
    resources[blockSound].data.currentTime = 0;
    resources[blockSound].data.play();
}

function randomBallDirectionY() {
    ballDirY = Math.random() * ((Math.random() > 0.5) ? 1 : -1) + ballIncreaseRate;
    piggy.rotation = Math.atan2(ballDirY, ballDirX) + Math.PI/2;
    resources[blockSound].data.volume = 0.5;
    resources[blockSound].data.currentTime = 0;
    resources[blockSound].data.play();
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
    let creditsDev = new PIXI.Text("Developed by Hazelnut", {fontSize: 25, fill: "#FFFFFF"});
    creditsDev.anchor.set(0.5, 0.5);
    creditsDev.x = 420/2;
    creditsDev.y = 1080 - 110;
    leftUIContainer.addChild(creditsDev);
    let creditsArt = new PIXI.Text("Art by ArtOfCielver", {fontSize: 25, fill: "#FFFFFF"});
    creditsArt.anchor.set(0.5, 0.5);
    creditsArt.x = 420/2;
    creditsArt.y = 1080 - 70;
    leftUIContainer.addChild(creditsArt);
    let creditsMusic = new PIXI.Text("Music by www.ourmusicbox.com", {fontSize: 25, fill: "#FFFFFF"});
    creditsMusic.anchor.set(0.5, 0.5);
    creditsMusic.x = 420/2;
    creditsMusic.y = 1080 - 30;
    leftUIContainer.addChild(creditsMusic);

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

let lenientThreshold = 130;
function updateLoop() {
    TWEEN.update();
    if (leftDir) {
        if (gateTop.x > 420 + 100) {
            gateTop.x -= gateSpeedX;
            gateBottom.x -= gateSpeedX;
        }
    }
    if (bottomDir) {
        if (gateLeft.y < 1080 - 100) {
            gateLeft.y += gateSpeedY;
            gateRight.y += gateSpeedY;
        }
    }
    if (rightDir) {
        if (gateTop.x < 1920 - 420 - 100) {
            gateTop.x += gateSpeedX;
            gateBottom.x += gateSpeedX;
        }
    }
    if (topDir) {
        if (gateLeft.y > 0 + 100) {
            gateLeft.y -= gateSpeedY;
            gateRight.y -= gateSpeedY;
        }
    }

    if (gameStarted) {
        piggy.getChildByName("pig").animationSpeed = ballSpeed/40;
        piggy.x += ballDirX * ballSpeed;
        piggy.y += ballDirY * ballSpeed;
        score += 1;
        scoreText.text = score.toLocaleString();
        if (piggy.x >= 1920 - 440 || piggy.x <= 440) {
            if (piggy.y < gateRight.y - lenientThreshold || piggy.y > gateRight.y + lenientThreshold) {
                endGame();
            }
            else {
                ballDirX = -ballDirX;
                randomBallDirectionY();
            }
        }
        if (piggy.y >= 1080 - 20 || piggy.y <= 0 + 20) {
            if (piggy.x < gateTop.x - lenientThreshold || piggy.x > gateTop.x + lenientThreshold) {
                endGame();
            }
            else {
                ballDirY = -ballDirY;
                randomBallDirectionX();
            }
        }
    }
}
app.ticker.add(updateLoop.bind(this));

/** Helper */
function makeFullScreen() {
    let htmlDocElement = document.documentElement;
    if (htmlDocElement != null) {
        let requestMethod = htmlDocElement.requestFullscreen || htmlDocElement.webkitRequestFullScreen || htmlDocElement.mozRequestFullScreen || htmlDocElement.msRequestFullScreen ||
        htmlDocElement.requestFullscreen || htmlDocElement.webkitRequestFullscreen || htmlDocElement.mozRequestFullscreen || htmlDocElement.msRequestFullscreen;
        if (requestMethod != undefined) {
            requestMethod.call(htmlDocElement);
        }
    }
}

function bounceIn(element) {
    new TWEEN.Tween(element.scale)
    .to({x: 1.2, y: 1.2}, 200)
    .easing(TWEEN.Easing.Exponential.Out)
    .chain(
        new TWEEN.Tween(element.scale)
        .to({x: 1, y: 1}, 100)
        .easing(TWEEN.Easing.Exponential.Out)
    )
    .start();
}

function bounceOut(element) {
    new TWEEN.Tween(element.scale)
    .to({x: 1.2, y: 1.2}, 200)
    .easing(TWEEN.Easing.Exponential.Out)
    .chain(
        new TWEEN.Tween(element.scale)
        .to({x: 0.0001, y: 0.0001}, 100)
        .easing(TWEEN.Easing.Exponential.Out)
    )
    .start();
}