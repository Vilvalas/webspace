// adds normal fruit behaviour: fruits float in the air where they are set on the level file, and kill the player on contact
Quintus.Fruit = function (Q) {
    Q.component("normalFruit", {
        added: function (p) {
            var entity = this.entity;
            entity.p.type = Q.SPRITE_HAZARD;
            entity.p.collisionMask = Q.SPRITE_PLAYER;
            entity.p.sprite = "fruit_animation";
            // give the fruit a really precise bounding box
            entity.p.points = [[-10, 4], [-10, -3], [-4, -9], [7, -11], [9, 4], [3, 10], [-4, 10]];
            entity.add("animation");
            entity.play("fruitAnimation");
            entity.on("hit.sprite", function (collision) {
                if (collision.obj.isA("Player") || collision.obj.isA("ClonePlayer")) {
                    collision.obj.die();
                }
            });

        }
    });

    // this component adds the updateBounce() function, which makes moving fruits change their direction when approaching a wall
    Q.component("bouncingOffWalls", {
        updateBounce: function (dt) {
            var entity = this.entity;
            entity.p.x += (entity.p.speedX * dt);
            entity.p.y += (entity.p.speedY * dt);
            // check if the fruit is about to hit a wall and make it turn around if needed
            var xDirection;
            var yDirection;
            // check if the fruit is moving left (xDirection = -1) or right (xDirection = +1)
            entity.p.speedX <= 0 ? xDirection = -1 : xDirection = 1;
            // check if the fruit is moving up (yDirection = -1) or down (yDirection = +1)
            entity.p.speedY <= 0 ? yDirection = -1 : yDirection = 1;
            var nextElementX = Q.stage().locate(entity.p.x + xDirection * entity.p.w / 2 + xDirection, entity.p.y, Q.SPRITE_MAP);
            if (nextElementX instanceof Q.TileLayer) {
                entity.p.speedX = -entity.p.speedX;
            }
            var nextElementY = Q.stage().locate(entity.p.x, entity.p.y + yDirection * entity.p.w / 2 + yDirection, Q.SPRITE_MAP);
            if (nextElementY instanceof Q.TileLayer) {
                entity.p.speedY = -entity.p.speedY;
            }
        }
    });

    Q.Sprite.extend("Fruit", {
        init: function (p) {
            this._super(p, {
                sheet: "redFruit"
            });
            this.add("normalFruit");
        }
    });

    // a moving fruit, which bounces from the collision layer
    // movingFruit needs a speedX and a speedY, which describe how fast the fruit moves in those directions
    Q.Sprite.extend("MovingFruit", {
        init: function (p) {
            this._super(p, {
                sheet: "redFruit"
            });
            this.add("normalFruit, bouncingOffWalls");
        },

        step: function (dt) {
            // calls the update function of the component
            this.bouncingOffWalls.updateBounce(dt);
        }
    });
};