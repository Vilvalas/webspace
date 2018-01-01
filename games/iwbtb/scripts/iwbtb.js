// initialises the user stats from the parameters, given by iwbtb.html, which got them from the database
function loadGame(level, deaths, shots, callback) {
    // development mode - external files don't get cached
    var Q = window.Q = new Quintus({development: false})
        .include("Scenes, Sprites, Anim, 2D, Input, UI, TMX, Audio")
        // include game modules over javascript files
        .include("Animation")
        .include("Player")
        .include("Spike")
        .include("Fruit")
        .include("Bullet")
        .include("Warp")
        .include("InvisibleBlock")
        .include("Boss")
        .include("GameOver")
        // give Quintus the gameCanvas we defined in iwbtb.html, and let it work with it
        // Quintus takes the width and height automatically from the canvas element
        .setup("gameCanvas");

    // set keyboard controls (multiple options for personal preference)
    // A | Shift: jump
    // S | Y | Space: shoot
    // R: restart level
    // ESC: go back to mainMenu
    Q.input.keyboardControls({
        LEFT: 'left', RIGHT: 'right',
        A: 'up',
        SHIFT: 'up',
        S: 'fire',
        Y: 'fire',
        SPACE: 'fire',
        R: 'esc',
        ESC: 'confirm'
    });

    Q.enableSound();
    // images will get scaled as they are, without smoothing the edges
    // normally we would call Q.setImageSmoothing(false), but we get a nice error message:
    // 'CanvasRenderingContext2D.webkitImageSmoothingEnabled' is deprecated. Please use 'CanvasRenderingContext2D.imageSmoothingEnabled' instead.
    // --> we have to change the settings ourselves, instead of calling the Quintus function
    Q.ctx.mozImageSmoothingEnabled = false;
    Q.ctx.imageSmoothingEnabled = false;
    Q.ctx.msImageSmoothingEnabled = false;
    Q.ctx.imageSmoothingEnabled = false;

    // define sprite type and collision mask constants
    // used in sprite classes for collision detection
    Q.SPRITE_NONE = 0;
    Q.SPRITE_MAP = 1;
    Q.SPRITE_PLAYER = 2;
    Q.SPRITE_HAZARD = 4;
    Q.SPRITE_BULLET = 8;
    Q.SPRITE_BOSS = 16;
    Q.SPRITE_UI = 32;
    Q.SPRITE_ALL = 0xFFFF;

    // initialize the quintus user stats
    Q.state.set({level: level});
    Q.state.set({deaths: deaths});
    Q.state.set({shots: shots});

    // load game files
    Q.loadTMX(
        // levels
        "level1.tmx, level2.tmx, level3.tmx, level4.tmx, level5.tmx, level6.tmx, level7.tmx, level8.tmx, level9.tmx, level10.tmx, " +
        "level11.tmx, level12.tmx, level13.tmx, level14.tmx, level15.tmx, level16.tmx, level17.tmx, level18.tmx, level19.tmx, level20.tmx, " +
        "level21.tmx, level22.tmx, level23.tmx, level24.tmx, level25.tmx, level26.tmx, level27.tmx, level28.tmx, level29.tmx, level30.tmx, " +
        // sprites
        "player.png, player.json, hdSpikes.png, hdSpikes.json, fruit.png, fruit.json, utility.png, utility.json, " +
        "boss1.png, boss1.json, boss2.png, boss2.json, gameover.png, gameover.json, " +
        // sounds + music
        "jump.mp3, doubleJump.mp3, shoot.mp3, fall.mp3, blockChange.mp3, bossHit.mp3, death.mp3, boss2_intro.mp3, boss2_death.mp3, boss2_teleport.mp3, " +
        "stage1.mp3, stage2.mp3, stage3.mp3, boss1.mp3, boss2.mp3, credits.mp3", function () {
            // Quintus takes the separate pictures from the png according to the json-file
            // the next line alone creates the sprite sheets player_death, player_idle, player_walking, player_jumping and player_falling
            Q.compileSheets("player.png", "player.json");
            Q.compileSheets("hdSpikes.png", "hdSpikes.json");
            Q.compileSheets("fruit.png", "fruit.json");
            Q.compileSheets("utility.png", "utility.json");
            Q.compileSheets("boss1.png", "boss1.json");
            Q.compileSheets("boss2.png", "boss2.json");
            Q.compileSheets("gameover.png", "gameover.json");
            // tell iwbtb.html, that the game has fully loaded
            callback();
        });

    // called by Q.stageScene("level");
    // define scene and load the appropriate level from .tmx file
    Q.scene("level", function (stage) {
        // get the current level, which has to be staged
        var currentLevel = Q.state.get("level");
        // the bullet objects get destroyed by staging a level, so we can set the active bullet counter to 0
        Q.state.set({bullets: 0});
        Q.stageTMX("level" + currentLevel + ".tmx", stage);
        // music is supposed to keep playing for specific stages in a row
        // only reset music if a stage with new music is reached (checked in warp.js), or if a boss stopped the music on death
        if (Q.state.get("keepAudio") != true) {
            // everything (sounds and music) will stop playing
            Q.audio.stop();
            // check for stage numbers and play the according music
            if (currentLevel <= 14) {
                Q.audio.play("stage1.mp3", {loop: true});
            } else if (currentLevel == 15) {
                Q.audio.play("boss1.mp3", {loop: true});
            } else if (currentLevel <= 24) {
                Q.audio.play("stage2.mp3", {loop: true});
            } else if (currentLevel <= 28) {
                Q.audio.play("stage3.mp3", {loop: true});
            } else if (currentLevel == 29) {
                Q.audio.play("boss2.mp3", {loop: true});
            } else {
                Q.audio.play("credits.mp3", {loop: true});
            }
            Q.state.set({keepAudio: true});
        }

    });
}

function startGame() {
    // initialize the first / current level
    Q.stageScene("level");
}