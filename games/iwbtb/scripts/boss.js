Quintus.Boss = function (Q) {
    // this component is used for all bosses and adds the basic boss behaviour
    // e.g. being invulnerable for a short period of time after getting hit
    // note: the methods updateStep(), bossHit(), changeSprite("boolean") and die()
    // have to be implemented on the instance, which adds the component
    Q.component("boss", {
        added: function (p) {
            var entity = this.entity;
            entity.p.type = Q.SPRITE_BOSS;
            entity.p.collisionMask = Q.SPRITE_BULLET | Q.SPRITE_PLAYER;
            // how often the boss has lost health
            entity.p.hitCount = 0;
            // how much time has passed since the boss got hit
            entity.p.lastHit = 0;
            // how long the boss is invulnerable (in seconds) after getting hit
            entity.p.cooldown = 2;
            // bosses can instantly be hit after staging a level
            entity.p.vulnerable = true;
            entity.add("animation");
            entity.on("hit.sprite", function (collision) {
                if (collision.obj.isA("Player") || collision.obj.isA("ClonePlayer")) {
                    collision.obj.die();
                } else if (collision.obj.isA("Bullet")) {
                    // call the onHit function of the boss component
                    entity.boss.onHit();
                    // destroy the bullet
                    collision.obj.die();
                }
            });
        },

        extend: {
            step: function (dt) {
                // make the boss, which adds the component, make specific update calls
                this.updateStep(dt);
                if (!this.p.vulnerable) {
                    // count up the time until the boss can be hit again
                    this.p.lastHit += dt;
                    if (this.p.lastHit >= this.p.cooldown) {
                        this.p.vulnerable = true;
                        // the boss can be hit again --> change the boss sprite back to normal
                        this.changeSprite(false);
                    }
                }
            }
        },

        onHit: function (dt) {
            var entity = this.entity;
            // the boss might only get hit once in a time interval
            if (entity.p.vulnerable) {
                entity.p.hitCount++;
                // reset the timer since the last hit
                entity.p.lastHit = 0;
                entity.p.vulnerable = false;
                // check if the boss will die from this hit
                if (entity.p.hitCount >= entity.p.hp) {
                    Q.audio.stop();
                    // ensure that the music plays again, if the player restarts the level, without going to the next level
                    Q.state.set({keepAudio: false});
                    Q.audio.play("death.mp3");
                    this.createWarp();
                    entity.die();
                } else {
                    // some functions are boss specific and can't be changed inside the component, so we call a function on our boss instance
                    entity.bossHit();
                    // change the boss sprite, so the player can see that he's temporary invulnerable
                    entity.changeSprite(true);
                    Q.audio.play("bossHit.mp3");
                }
            }
        },

        // creates a warp to the next stage, when the boss is defeated
        createWarp: function () {
            var warp = new Q.Warp({
                // create the warp near the middle of the stage
                x: 400,
                y: 430
            });
            this.entity.stage.insert(warp);
        }
    });

    Q.Sprite.extend("BossFruit", {
            // we could add the fruit component here, but boss adds more value and is clearer for bullet collision detection
            init: function (p) {
                this._super(p, {
                    sheet: "fruitBoss",
                    sprite: "boss1_animation",
                    points: [[-10, 4], [-10, -3], [-4, -9], [7, -11], [9, 4], [3, 10], [-4, 10]],
                    hp: 13,
                    // how much size the fruit looses on each hit
                    fruitDamage: 0.2,
                    // set the speed for the boss
                    speedX: 100,
                    speedY: 100
                });
                // make the boss bigger than a normal fruit; for this boss his size displays his hp to the player
                // he dies when he goes under the size of a normal fruit --> when his scale falls under 1
                this.p.scale = (this.p.hp / (1 / this.p.fruitDamage)) + 1;
                // note: it's intended that the BossFruit takes longer to bounce off the walls in the start (moves more into them)
                // that way the easier / boring beginning of the fight gets a bit harder
                this.add("animation, bouncingOffWalls, boss");
                this.play("fruitBossAnimation");
            },

            // specific behaviour on hit for this boss
            bossHit: function () {
                // spawn a minion fruit
                var minion = new Q.MovingFruit({
                    // create the minion at the current position of the boss
                    x: this.p.x,
                    y: this.p.y
                });
                // give the minion a random fruit animation color != red
                // get a random number from 0 - 9
                switch (Math.floor(Math.random() * 10)) {
                    case 0:
                        minion.p.sheet = "azureFruit";
                        break;
                    case 1:
                        minion.p.sheet = "greenFruit";
                        break;
                    case 2:
                        minion.p.sheet = "magentFruit";
                        break;
                    case 3:
                        minion.p.sheet = "orangeFruit";
                        break;
                    case 4:
                        minion.p.sheet = "blueFruit";
                        break;
                    case 5:
                        minion.p.sheet = "emeraldFruit";
                        break;
                    case 6:
                        minion.p.sheet = "cyanFruit";
                        break;
                    case 7:
                        minion.p.sheet = "pinkFruit";
                        break;
                    case 8:
                        minion.p.sheet = "purpleFruit";
                        break;
                    default:
                        minion.p.sheet = "yellowFruit";
                        break;
                }
                minion.play("fruitAnimation");
                // give the minion a random speed (speed of 200 split between x and y)
                // get a random number from 1 - 200
                var randomSpeed = Math.floor(Math.random() * 200) + 1;
                minion.p.speedX = randomSpeed;
                minion.p.speedY = 200 - randomSpeed;
                this.stage.insert(minion);
                // spawn a moving spike when the boss is hit for the first time
                if (this.p.hitCount == 1) {
                    var spike = new Q.MovingSpike({
                        x: this.p.x,
                        y: this.p.y,
                        vx: 300
                    });
                    this.stage.insert(spike);
                    // spawn a shooting spike when the boss got hit 5 times
                } else if (this.p.hitCount == 5) {
                    var spike = new Q.ShootingSpike({
                        x: 400,
                        y: 48,
                        speed: 100,
                        direction: "down",
                        firerate: 2,
                        angle: 180,
                        flip: "x"
                    });
                    this.stage.insert(spike);
                    // spawn an additional shooting spike when the boss got hit 10 times
                } else if (this.p.hitCount == 10) {
                    var spike = new Q.ShootingSpike({
                        x: 48,
                        y: 304,
                        speed: 100,
                        direction: "right",
                        firerate: 2,
                        angle: 90
                    });
                    this.stage.insert(spike);
                }
                // the fruit boss becomes smaller when getting hit
                this.p.scale -= this.p.fruitDamage;
            },

            // bool defines if the boss just got hit (true), or if he returns to his old sprite (false)
            changeSprite: function (bool) {
                if (bool) {
                    this.play("fruitBossHitAnimation");
                } else {
                    this.play("fruitBossAnimation");
                }
            },

            // gets called every step by the boss component
            // specific behaviour for this boss
            updateStep: function (dt) {
                // call the update method of the bouncingOffWalls component
                this.bouncingOffWalls.updateBounce(dt);
            },

            die: function () {
                // destroy all spawned fruit and spike objects
                var fruits = Q("MovingFruit");
                fruits.destroy();
                var movingSpikes = Q("MovingSpike");
                movingSpikes.destroy();
                var shootingSpikes = Q("ShootingSpike");
                shootingSpikes.destroy();
                var spawningSpikes = Q("SpawningSpike");
                spawningSpikes.destroy();
                this.destroy();
            }
        }
    );

    Q.Sprite.extend("Exmatrikulator", {
            init: function (p) {
                this._super(p, {
                    sheet: "exmatrikulator",
                    sprite: "boss2_animation",
                    points: [[-101, 72], [-92, 52], [-70, 42], [-34, 34], [-34, 27], [-46, 8], [-46, -48], [-26, -69],
                        [20, -69], [32, -48], [32, 8], [23, 22], [25, 33], [70, 42], [92, 52], [101, 72]],
                    hp: 30,
                    // how much hits it takes to trigger the specific phase
                    phase2: 15,
                    phase3: 25,
                    // triggers certain events (e.g. spawning exams)
                    timer: 0,
                    // specific variables for phase 1 and 3:
                    // speedY indicates how fast the boss moves up and down and if he is currently moving up (negative value) or down (positive value)
                    speedY: -100,
                    // rangeY indicates how far the boss moves away from his initial position, before moving back
                    rangeY: 150,
                    // specific variables for phase2:
                    // spawn a placeholder warp for where the boss is going to move
                    // placeholder indicates, if the placeholder has been set already
                    placeholder: false,
                    // the position, where the boss is going to move next (in phase 2)
                    newX: 0,
                    newY: 0,
                    phase2ExamSpeed: 600,
                    phase3ExamSpeed: 300
                });
                // save the initial position, where we placed the boss, so he can move back to this position
                this.p.initialY = this.p.y;
                this.add("animation, boss");
                this.play("exmatrikulatorAnimation");
            },

            // specific behaviour on hit for this boss
            bossHit: function () {
                if (this.p.hitCount == 1) {
                    // if the player died instantly the intro might be still playing
                    // stop the intro if that is the case, so it doesn't overlap
                    Q.audio.stop("boss2_intro.mp3");
                    Q.audio.play("boss2_intro.mp3");
                }
                if (this.p.hitCount == this.p.phase2) {
                    // reset the timer when entering a new phase
                    this.p.timer = 0;
                } else if (this.p.hitCount == this.p.phase3) {
                    this.p.timer = 0;
                    // if there is a bossWarp left, destroy him
                    var bossWarp = Q("BossWarp");
                    if (bossWarp != undefined) {
                        bossWarp.destroy();
                    }
                    // reset the boss to its initial position in phase 1
                    // otherwise he would keep the random position, where he ported last in phase 2
                    this.p.x = 592 + 0.5 * this.p.w;
                    this.p.y = this.p.initialY;
                    // increase the moving speed of the boss
                    this.p.speedY = this.p.speedY * 2;
                }
            },

            // bool defines if the boss just got hit (true), or if he returns to his old sprite (false)
            changeSprite: function (bool) {
                if (bool) {
                    this.play("exmatrikulatorHitAnimation");
                } else {
                    this.play("exmatrikulatorAnimation");
                }
            },

            // gets called every step by the boss component
            // specific behaviour for this boss
            updateStep: function (dt) {
                this.p.timer += dt;
                // this boss has 3 phases, depending on his hp
                // the player triggers the fight by shooting the boss
                if (this.p.hitCount > 0) {
                    if (this.p.hitCount < this.p.phase2) {
                        // phase 1
                        this.move(dt);
                        if (this.p.timer > 0.18) {
                            // throw exams
                            var phase1Exam = new Q.Exam({
                                x: this.p.x,
                                y: this.p.y
                            });
                            // give the exam a random speed (speed of 600 split between vx and vy)
                            // get a random number from 1 - 600
                            var randomSpeed = Math.floor(Math.random() * 600) + 1;
                            // vx has to be negative, so the exam moves to the left
                            phase1Exam.p.vx = -randomSpeed;
                            // vy has to be negative, so the exam goes up before falling down
                            // -400 is the maximum for vy, so the player still has time to dodge
                            phase1Exam.p.vy = randomSpeed - 1000;
                            this.stage.insert(phase1Exam);
                            this.p.timer = 0;
                        }
                    } else if (this.p.hitCount < this.p.phase3) {
                        // phase 2
                        // check if the placeholder warp has been set already
                        if (!this.p.placeholder) {
                            // check if it's time to set the placeholder warp
                            if (this.p.timer > 3) {
                                // get a random x-position from 65 - 768
                                this.p.newX = Math.floor(Math.random() * 704) + 65;
                                // get a random y-position from 256 - 576
                                this.p.newY = Math.floor(Math.random() * 320) + 257;
                                // set the placeholder warp on that position
                                var warp = new Q.BossWarp({
                                    x: this.p.newX,
                                    y: this.p.newY
                                });
                                this.stage.insert(warp);
                                this.p.placeholder = true;
                                Q.audio.play("boss2_teleport.mp3");
                            }
                        } else if (this.p.timer > 4.25) {
                            // destroy the placeholder warp
                            var bossWarp = Q("BossWarp");
                            bossWarp.destroy();
                            // move the boss to it's new position (where the placeholder warp was)
                            this.p.x = this.p.newX;
                            this.p.y = this.p.newY;
                            this.p.placeholder = false;
                            this.p.timer = 0;
                            // shoot exams around the boss
                            // only calculate half of the speed once to save cpu
                            var halfSpeed = this.p.phase2ExamSpeed / 2;
                            var phase2Exam = [];
                            for (var i = 0; i < 8; i++) {
                                phase2Exam[i] = new Q.Exam({
                                    x: this.p.x,
                                    y: this.p.y,
                                    gravity: 0,
                                    scale: 1.5
                                });
                                // give each exam an individual moving direction
                                switch (i) {
                                    case 0:
                                        phase2Exam[i].p.vx = -halfSpeed;
                                        phase2Exam[i].p.vy = -halfSpeed;
                                        break;
                                    case 1:
                                        phase2Exam[i].p.vx = 0;
                                        phase2Exam[i].p.vy = -this.p.phase2ExamSpeed;
                                        break;
                                    case 2:
                                        phase2Exam[i].p.vx = halfSpeed;
                                        phase2Exam[i].p.vy = -halfSpeed;
                                        break;
                                    case 3:
                                        phase2Exam[i].p.vx = this.p.phase2ExamSpeed;
                                        phase2Exam[i].p.vy = 0;
                                        break;
                                    case 4:
                                        phase2Exam[i].p.vx = halfSpeed;
                                        phase2Exam[i].p.vy = halfSpeed;
                                        break;
                                    case 5:
                                        phase2Exam[i].p.vx = 0;
                                        phase2Exam[i].p.vy = this.p.phase2ExamSpeed;
                                        break;
                                    case 6:
                                        phase2Exam[i].p.vx = -halfSpeed;
                                        phase2Exam[i].p.vy = halfSpeed;
                                        break;
                                    case 7:
                                        phase2Exam[i].p.vx = -this.p.phase2ExamSpeed;
                                        phase2Exam[i].p.vy = 0;
                                        break;
                                }
                                this.stage.insert(phase2Exam[i]);
                            }
                        }
                    } else {
                        // phase 3
                        this.move(dt);
                        if (this.p.timer > 0.2) {
                            // throw exams
                            var phase3Exam = [];
                            for (i = 0; i < 2; i++) {
                                phase3Exam[i] = new Q.Exam({
                                    x: this.p.x,
                                    vx: -this.p.phase3ExamSpeed,
                                    gravity: 0,
                                    scale: 0.5
                                });
                                switch (i) {
                                    case 0:
                                        phase3Exam[i].p.y = this.p.y;
                                        break;
                                    case 1:
                                        phase3Exam[i].p.y = this.p.y + 140;
                                        break;
                                }
                                this.stage.insert(phase3Exam[i]);
                            }
                            this.p.timer = 0;
                        }
                    }
                }
            },

            // moves the boss up / down in phase 1 and 3
            move: function (dt) {
                this.p.y += this.p.speedY * dt;
                // check if the boss has to switch directions
                var yDirection = this.p.speedY < 0 ? -1 : 1;
                if (yDirection < 0) {
                    // the boss is moving up
                    if (this.p.y <= this.p.initialY - this.p.rangeY) {
                        // switch directions
                        this.p.speedY = -this.p.speedY;
                    }
                } else {
                    // the boss is moving down
                    if (this.p.y >= this.p.initialY) {
                        this.p.speedY = -this.p.speedY;
                    }
                }
            },

            die: function () {
                // destroy all remaining exams
                var exams = Q("Exam");
                exams.destroy();
                // as an act of final revenge throw fructiv in the middle of the stage
                var fructiv = new Q.Fructiv({
                    x: 336,
                    y: 32,
                    angle: 90
                });
                this.stage.insert(fructiv);
                // note: this sound is played additionally to the boss component death sound
                Q.audio.play("boss2_death.mp3");
                this.destroy();
            }
        }
    );

    // the exams, which are thrown by the exmatrikulator
    Q.Sprite.extend("Exam", {
        init: function (p) {
            this._super(p, {
                sheet: "exam",
                type: Q.SPRITE_HAZARD,
                collisionMask: Q.SPRITE_PLAYER,
                points: [[-17, 33], [-17, 30], [-22, 30], [-22, 7], [-28, -29], [-25, -33], [23, -33], [28, -27], [24, -3], [24, 33]]
            });
            this.add("2d");

            // check for collision with player
            this.on("hit.sprite", function (collision) {
                if (collision.obj.isA("Player") || collision.obj.isA("ClonePlayer")) {
                    collision.obj.die();
                }
            });

        },

        step: function (dt) {
            // check if the exam is out of bounds
            // note: sadly we can't add the outOfBounds component here, since exams get scaled up to a bigger size sometimes
            // adding the component would make them disappear too early, since the width value of a sprite doesn't change when applying a scale
            // take width * 2 instead of 1/2 * w, so bigger exams don't disappear too early
            if (this.p.x < (0 - this.p.w * 2) || this.p.x > (800 + this.p.w * 2) || this.p.y < (0 - this.p.w * 2) || this.p.y > (608 + this.p.w * 2)) {
                this.destroy();
            }
        }
    });

    // fructiv just falls down in y-direction, until it's out of bounds
    // the 2d component automatically accelerates the sprite in y-direction (gravity)
    Q.Sprite.extend("Fructiv", {
        init: function (p) {
            this._super(p, {
                sheet: "fructiv",
                type: Q.SPRITE_HAZARD,
                collisionMask: Q.SPRITE_PLAYER
            });
            this.add("2d, outOfBounds");
            // check for collision with player
            this.on("hit.sprite", function (collision) {
                if (collision.obj.isA("Player") || collision.obj.isA("ClonePlayer")) {
                    collision.obj.die();
                }
            });
        },

        step: function (dt) {
            // check if the fructiv is out of bounds
            if (this.outOfBounds.checkBounds()) {
                this.destroy();
            }
        }
    });
};