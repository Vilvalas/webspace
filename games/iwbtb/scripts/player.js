Quintus.Player = function (Q) {
    // a few levels have multiple players: the "real" player and ClonePlayers, who share most of the properties
    // by using components we only have to define the common properties of player once
    // note: the method die() has to be implemented on the instance, which adds the component
    Q.component("player", {
        added: function (p) {
            // get the entity which adds the component
            var entity = this.entity;
            // set a collision type and mask for each sprite we use in the game, so we don't have to check for all possible collisions
            // e.g. collisions spike vs map, bullet vs player are unnecessary
            entity.p.type = Q.SPRITE_PLAYER;
            entity.p.collisionMask = Q.SPRITE_MAP | Q.SPRITE_HAZARD | Q.SPRITE_BOSS;
            // AnimationSheet - holds information for all player animations
            entity.p.sprite = "player_animation";
            // give the player a realistic bounding box (defined as points of a polygon)
            // coordinates start at the center of the sprite
            entity.p.points = [[-6, 16], [-6, -4], [6, -4], [6, 16]];
            entity.p.jumpSpeed = -425;
            entity.p.speed = 150;
            entity.add("animation");
            entity.play("player_idleAnimation");
            // 2d component adds basic physics, platformerControls adds basic player control (left, right, jump)
            // outOfBounds checks if the player is out of the stage and not visible anymore
            entity.add("2d, platformerControls, outOfBounds");

            // triggered every timer the player performs a normal jump (not from double jumps)
            // jump automatically has a listener, so we don't have to listen on Q.input in this case
            entity.on("jump", function () {
                // check if the player is currently not standing on ground
                // check vy (velocity in y-direction) so the sound doesn't get looped for holding the button
                if (!entity.p.inAir && entity.p.vy < 0) {
                    entity.p.inAir = true;
                    Q.audio.play("jump.mp3");
                }
            });

            // triggered by the 2d-component every timer the player falls back on the ground
            entity.on("bump.bottom", function () {
                this.p.inAir = false;
                // reset doubleJump() "booleans"
                this.p.dJumped = false;
                this.p.jumpReleasedInAir = false;
            });
        },

        // extended functions are directly executed on the entity which adds the component
        // so we can directly access the Sprite properties with this.p, instead of this.entity.p
        // careful: extending basic functions in components overwrites functions with the same name in adding entity
        extend: {
            // step gets executed in every game-step and is similar to a classic "update"-method
            step: function (dt) {
                if (!this.p.dead) {
                    // check if the player is out of bounds and not visible anymore --> kill him
                    if (this.outOfBounds.checkBounds()) {
                        this.die();
                    } else {
                        // change the player animation accordingly
                        if (this.p.vy == 0) {
                            if (this.p.vx == 0) {
                                // the player is not moving in any direction
                                this.play("player_idleAnimation");
                            } else {
                                // the player is only moving in x-direction
                                this.play("player_walkingAnimation");
                            }
                        } else {
                            // the player is currently in the air, since his velocity in y-direction is not 0
                            // check for double jumps
                            // doubleJump is defined in the player component, so we have to call it by using this.player.doubleJump
                            this.player.doubleJump(dt);
                            if (this.p.vy < 0) {
                                // the player is moving upwards / jumping
                                // as a reminder: game coordinates always start in the top left corner
                                this.play("player_jumpingAnimation");
                            } else {
                                // the player is falling
                                // prevent the player from falling to fast by limiting his falling speed
                                if (this.p.vy < -this.p.speed * 2) {
                                    this.p.vy = -this.p.speed * 2;
                                }
                                this.play("player_fallingAnimation");
                            }
                        }
                    }
                }
                // check in which direction the player is moving and flip his sprite accordingly
                if (this.p.vx < 0) {
                    // the player is moving to the left
                    // flip the sprite in x-direction --> facing left
                    this.p.flip = "x";
                } else if (this.p.vx > 0) {
                    // the player is moving to the right
                    // returns the sprite to normal --> facing right
                    this.p.flip = false;
                }
            }
        },

        // the platformerControls component does not support double jumping, so we have to implement it ourselves
        doubleJump: function (dt) {
            var entity = this.entity;
            if (!Q.inputs['up']) {
                // the player is in the air, but doesn't hold the jump button anymore
                // he is potentially ready to double jump
                entity.p.jumpReleasedInAir = true;
            }
            // the player may only double jump once every time he is in the air --> check dJumped
            if (Q.inputs['up'] && entity.p.dJumped == false && entity.p.jumpReleasedInAir == true) {
                // double jumping works similar to the normal jump in quintus_input.js
                // the double jump is supposed to be lower than a normal jump, so we apply a lower force
                entity.p.vy = entity.p.jumpSpeed * 0.78;
                entity.p.landed = -dt;
                entity.p.jumping = true;
                entity.p.dJumped = true;
                Q.audio.play("doubleJump.mp3");
            }
        }
    });

    // extend the Quintus Sprite Class
    Q.Sprite.extend("Player", {
        // init is called every time the class is created
        init: function (p) {
            // initiate the sprite
            this._super(p, {
                // defines, with which sprite the sprite sheet starts - important for definition of frames in AnimationSheet
                // the sheet can't be set inside of components or the player won't render properly
                sheet: "player_death"
            });
            // give the player the properties of the player component
            this.add("player");
            // listen to several events
            // call the functions "shoot", "restartLevel" and "goBackToMenu" on this instance for specific key events
            Q.input.on("fire", this, "shoot");
            Q.input.on("esc", this, "restartLevel");
            Q.input.on("confirm", this, "goBackToMenu");
        },

        // fires the weapon if "fire" is pressed
        shoot: function () {
            // don't allow shooting when the stage is paused or when the player is dead
            if (!this.p.dead) {
                // there may only be 4 bullets on the screen at a time (to prevent button mashing)
                // check if there are currently 4 bullets alive
                if (Q.state.get("bullets") < 4) {
                    Q.audio.play("shoot.mp3");
                    // increment the number of active bullets
                    Q.state.inc("bullets", 1);
                    // increment the ShotsFired counter
                    Q.state.inc("shots", 1);
                    // create a new Bullet
                    var bullet = new Q.Bullet({
                        // create the bullet at the end of the players pistol
                        x: this.p.x + 6,
                        y: this.p.y + 4
                    });
                    // insert it in the players stage (gameplay stage (stage 0))
                    this.stage.insert(bullet);
                }
            }
        },

        // restarts the current level, if "r" is pressed
        restartLevel: function () {
            // check if the player died and is currently in the GameOver Scene
            // this can't be checked in stageScene itself, since Quintus already removes the player sprite by calling the function
            if (this.p.dead) {
                // clean up the GameOver stage
                Q.stage(1).hide();
            }
            Q.stageScene("level");
        },

        // go back to the main menu, if "esc" is pressed
        goBackToMenu: function () {
            Q.audio.stop();
            // ensure that music plays, if the player starts the game again
            Q.state.set({keepAudio: false});
            // clear the stage, so it doesn't cover the menu
            // 0 = gameStage, 1 = gameOverStage (gameOverStage might be set or hidden --> in that case the call is ignored)
            Q.clearStage(1);
            Q.clearStage(0);
            // call the playingToMainMenu method of iwbtb.html
            // give it the current user stats, since we can't know how long it takes to save them in the database, and we want to display them immediately
            playingToMainMenu(Q.state.get("level"), Q.state.get("deaths"), Q.state.get("shots"));
        },

        // the player is destroyed by the Quintus Engine itself, when the level gets restarted (by calling Q.stageScene())
        die: function () {
            // since a dead player stops moving this function might get called all the time, so we have to check if he already died
            if (!this.p.dead) {
                // a few levels have clone players, so we have to check if there are additional players and destroy them
                // get all current clone player objects from Quintus
                var players = Q("ClonePlayer");
                // check if we found any clone players
                if (players != undefined) {
                    players.destroy();
                }
                Q.audio.play("death.mp3");
                this.play("player_deathAnimation");
                // the player is supposed to stay on the position where he died
                // set gravity to 0, so quintus doesn't make him fall down
                this.p.gravity = 0;
                // set any velocity to 0 so the player can't slide while he's dead
                this.p.vx = this.p.vy = 0;
                // disable the player controls
                this.p.ignoreControls = true;
                // the player is dead and may only move again by reloading the level
                this.p.dead = true;
                // increment the death counter
                Q.state.inc("deaths", 1);
                // save the current user stats in the database, by calling the method of iwbtb.html
                saveUserStats(Q.state.get("level"), Q.state.get("deaths"), Q.state.get("shots"));
                // this stages the GameOver scene on the second (index 1) stage, leaving anything on the first stage (index 0) alone
                Q.stageScene("GameOver", 1);
            }
        }
    });

    // ClonePlayers can not shoot or restart the level and simply get destroyed when the player dies
    Q.Sprite.extend("ClonePlayer", {
        init: function (p) {
            this._super(p, {
                sheet: "player_death"
            });
            // give the ClonePlayer the properties of the player component
            this.add("player");
        },

        die: function () {
            // destroy the real player --> he also removes all clone players in his die() method
            Q("Player").first().die();
        }
    });

    // a small component, which checks if an object is out of bounds
    // the adding sprite has to call this.outOfBounds.checkBounds(), which returns true if the sprite is out of bounds
    Q.component("outOfBounds", {
        checkBounds: function () {
            var entity = this.entity;
            // the stage is 800x608 px
            // since x / y saves the center of sprites: sprites are not visible anymore, if they are half of their width over the bounds
            return (entity.p.x < (0 - entity.p.w / 2) || entity.p.x > (800 + entity.p.w / 2) || entity.p.y < (0 - entity.p.w / 2) || entity.p.y > (608 + entity.p.w / 2))
        }
    });
};