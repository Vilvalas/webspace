Quintus.Spike = function (Q) {
    // define a basic spike component, which can be added by objects to reduce code duplication
    // normalSpike adds common spike properties and checks for collision with the player
    Q.component("normalSpike", {
        added: function (p) {
            // get the entity which adds the component
            var entity = this.entity;
            entity.p.type = Q.SPRITE_HAZARD;
            entity.p.collisionMask = Q.SPRITE_PLAYER;
            entity.p.sprite = "spike_animation";
            // give the spike a non-square bounding box
            // coordinates start at the center of the sprite
            entity.p.points = [[-16, 16], [0, -16], [16, 16]];
            entity.add("animation");
            entity.play("hdSpikesAnimation");

            // check for collision with player
            entity.on("hit.sprite", function (collision) {
                if (collision.obj.isA("Player") || collision.obj.isA("ClonePlayer")) {
                    collision.obj.die();
                }
            });

        }
    });

    // define the spike types, which get created by staging the tmx level file
    // Spikes pointing in different directions also use this class, but have a custom angle and are flipped if necessary
    // the following parameters are defined in the SpriteSets of the level files (if needed) --> open a .tmx file with Tiled if you are interested
    // angle: rotates bounding box and sprite; rotations other than 90, 180, 270 lead to display errors with FF and IE
    // flip: rotating the spike with angle also rotates the animation
    // --> we have to flip in "x"- direction for spikes pointing down or left to get the same animation as spikes pointing up or right
    Q.Sprite.extend("Spike", {
        init: function (p) {
            this._super(p, {
                sheet: "hdSpikes"
            });
            // give the spike the properties of the normalSpike component
            this.add("normalSpike");
        }
    });

    // fallingSpike makes spikes fall down (or up) when the player comes close
    // falling spikes need a speed, which defines how fast the spike is falling
    // e.g. a speed of 900 means 900px / sec (~15 px each update step * 60fps)
    Q.Sprite.extend("FallingSpike", {
        init: function (p) {
            this._super(p, {
                sheet: "hdSpikes"
            });
            this.add("normalSpike, outOfBounds");
        },

        step: function (dt) {
            // check if the spike already fell down
            if (this.p.falling == true) {
                this.p.y += this.p.speed * dt;
                // check if the spike is out of bounds
                if (this.outOfBounds.checkBounds()) {
                    this.destroy();
                }
            } else {
                // check if the spike has to fall down in this step
                // get the player
                var player = Q("Player").first();
                // check if the player is currently directly under or above this spike, by checking if the players x-value is in the range of the spike
                // entity.p.cx is the distance from the left side of the spike sprite to its center
                if (player.p.x > (this.p.x - this.p.cx) && player.p.x < (this.p.x + this.p.cx)) {
                    // the spike either falls up or down, depending on the player position
                    // check if the spike has to "fall" upwards and set the speed accordingly
                    if (player.p.y < this.p.y) {
                        // the player is above the spike
                        this.p.speed = -this.p.speed;
                    }
                    this.p.falling = true;
                    Q.audio.play("fall.mp3");
                }
            }
        }
    });

    // movingSpike makes spikes move left / right on a platform
    // movingSpikes get a vx from the level file, which defines how fast the spike moves
    Q.Sprite.extend("MovingSpike", {
        init: function (p) {
            this._super(p, {
                sheet: "hdSpikes"
            });
            // 2d and aiBounce allow the spike to move and make him bounce off walls
            this.add("normalSpike, 2d, aiBounce");
            // the moving spike also needs to collide with the map, so he needs a unique collision mask (for a spike)
            this.p.collisionMask = Q.SPRITE_MAP || Q.SPRITE_PLAYER;
        },

        step: function (dt) {
            // check if the spike is about to fall down of a platform and prevent it by changing direction
            // check in which direction the spike is currently moving: -1 means left, 1 means right
            var xDirection = this.p.vx < 0 ? -1 : 1;
            // get the object the spike is standing on, if there is no map object locate returns false
            var ground = Q.stage().locate(this.p.x, this.p.y + this.p.h / 2 + 1, Q.SPRITE_MAP);
            // get the next element the spike is approaching
            var nextElement = Q.stage().locate(this.p.x + xDirection * this.p.w / 2 + xDirection, this.p.y + this.p.h / 2 + 1, Q.SPRITE_MAP);
            var nextTile;
            // check if nextElement is an element of the collision layer (the spike can still move in this direction)
            // or empty (the spike is about to fall down)
            if (nextElement instanceof Q.TileLayer) {
                nextTile = true;
            }
            // check if the spike is standing on ground and approaching a cliff
            if (!nextTile && ground) {
                // make the spike change direction
                this.p.vx = -this.p.vx;
            }
        }
    });

    // shootingSpike moves on the same height as the player and shoots smaller spikes (creates SpawningSpikes)
    // shootingSpike needs a speed, a firerate and a direction from the map file
    // speed defines how fast he's moving, firerate describes how fast he fires (in seconds) and direction is the direction he is facing
    Q.Sprite.extend("ShootingSpike", {
        init: function (p) {
            this._super(p, {
                sheet: "hdSpikes",
                // timer needed for shooting spikes
                timer: 0
            });
            this.add("normalSpike");
        },

        step: function (dt) {
            var player = Q("Player").first();
            // check in which direction the spike is moving and update him accordingly
            if (this.p.direction == "left" || this.p.direction == "right") {
                if (player.p.y < this.p.y) {
                    // the player is above the spike
                    this.p.y -= this.p.speed * dt;
                } else {
                    // the player is under the spike
                    this.p.y += this.p.speed * dt;
                }
            } else {
                if (player.p.x < this.p.x) {
                    // the player is left of the spike
                    this.p.x -= this.p.speed * dt;
                } else {
                    // the player is right of the spike
                    this.p.x += this.p.speed * dt;
                }
            }
            // check if it is time to fire a small spike
            this.p.timer += dt;
            if (this.p.timer > this.p.firerate) {
                var spike = new Q.SpawningSpike({
                    x: this.p.x,
                    y: this.p.y,
                    direction: this.p.direction
                });
                // align the new spike to the direction of the shooting spike
                switch (this.p.direction) {
                    case "right":
                        spike.p.angle = 90;
                        break;
                    case "down":
                        spike.p.angle = 180;
                        spike.p.flip = "x";
                        break;
                    case "left":
                        spike.p.angle = 270;
                        spike.p.flip = "x";
                        break;
                }
                this.stage.insert(spike);
                this.p.timer = 0;
            }
        }
    });

    // spawningSpike represents smaller spikes, that move in a specific direction
    // spawningSpikes need a direction, which indicates in which direction they are moving
    // they are created / shot by ShootingSpikes
    Q.Sprite.extend("SpawningSpike", {
        init: function (p) {
            this._super(p, {
                sheet: "hdSpikes",
                speed: 150,
                scale: 0.5
            });
            this.add("normalSpike, outOfBounds");
        },

        step: function (dt) {
            // check in which direction the spike is moving and update him accordingly
            switch (this.p.direction) {
                case "up":
                    this.p.y -= this.p.speed * dt;
                    break;
                case "down":
                    this.p.y += this.p.speed * dt;
                    break;
                case "left":
                    this.p.x -= this.p.speed * dt;
                    break;
                case "right":
                    this.p.x += this.p.speed * dt;
                    break;
            }
            // check if the spike is out of bounds
            if (this.outOfBounds.checkBounds()) {
                this.destroy();
            }
        }
    });

    // this spike allows the player to stand on top of the spike like a platform and is always facing down
    // however, if the player touches the bottom of the spike he will still die
    Q.Sprite.extend("PlatformSpike", {
        init: function (p) {
            this._super(p, {
                type: Q.SPRITE_HAZARD,
                collisionMask: Q.SPRITE_PLAYER,
                sheet: "hdSpikes",
                sprite: "spike_animation",
                points: [[-16, 16], [0, -16], [16, 16]],
                angle: 180,
                flip: "x"
            });
            this.add("animation");
            this.play("hdSpikesAnimation");

            this.on("hit.sprite", function (collision) {
                if (collision.obj.isA("Player") || collision.obj.isA("ClonePlayer")) {
                    // only kill the player if he touched the spike at the bottom side
                    // p.y is the central point of the sprite
                    // so we have to subtract 1/2 his width to check for all collisions except on the top of the spike
                    if (collision.obj.p.y > (this.p.y - this.p.w / 2)) {
                        collision.obj.die();
                    }
                }
            });
        }
    });
};