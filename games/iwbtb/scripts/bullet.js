Quintus.Bullet = function (Q) {
    Q.Sprite.extend("Bullet", {
        init: function (p) {
            this._super(p, {
                type: Q.SPRITE_BULLET,
                collisionMask: Q.SPRITE_BOSS,
                sheet: "bullet",
                sprite: "bullet_animation",
                points: [[-2, 2], [-2, -2], [2, -2], [2, 2]],
                // speed defines how fast the bullet travels
                // the bullet is supposed to travel 12px a second
                // since we multiply with delta that makes a speed of 720
                speed: 720,
                // make the bullet ignore gravitation (applied by the 2d component)
                gravity: 0
            });

            // check if the player is facing left (player sprite flipped in x-direction) when he shoots
            // also change the x-component, so the bullet doesn't start at the right side of the player when he is shooting left
            if (Q("Player").first().p.flip == "x") {
                this.p.x -= 12;
                this.p.xDirection = -1;
            } else {
                this.p.xDirection = 1;
            }
            // add the quintus 2d component, so we can listen for collisions
            this.add("animation, 2d, outOfBounds");
            this.play("bulletAnimation");
            // note: we could check for collision with walls here, but the quintus engine is sometimes buggy with wall collision for fast moving objects
            // (to fulfill the high quality standard of this game) we implemented our own kind of collision check for that in the step function
        },

        step: function (dt) {
            if (this.p.xDirection == 1) {
                this.p.x += this.p.speed * dt;
            } else {
                this.p.x -= this.p.speed * dt;
            }
            // check if the bullet is about to hit a wall
            var nextElement = Q.stage().locate(this.p.x + this.p.xDirection * this.p.w / 2 + this.p.xDirection, this.p.y, Q.SPRITE_MAP);
            if (nextElement instanceof Q.TileLayer) {
                this.die();
            } else {
                // check if the bullet is out of bounds
                if (this.outOfBounds.checkBounds()) {
                    this.die();
                }
            }
        },

        die: function () {
            // decrease the number of bullets by 1
            Q.state.dec("bullets", 1);
            this.destroy();
        }
    });
};