Quintus.Warp = function (Q) {
    Q.component("warp", {
        added: function (p) {
            var entity = this.entity;
            entity.p.type = Q.SPRITE_HAZARD;
            entity.p.collisionMask = Q.SPRITE_PLAYER;
            entity.p.points = [[-12, 11], [-12, -13], [10, -13], [10, 11]];
        }
    });

    // warp leads to the next level
    Q.Sprite.extend("Warp", {
        init: function (p) {
            this._super(p, {
                // since there is only one sprite warp doesn't need an AnimationSheet
                sheet: "warp"
            });
            this.add("warp");
            // check for collision with player
            this.on("hit.sprite", function (collision) {
                if (collision.obj.isA("Player") || collision.obj.isA("ClonePlayer")) {
                    // increment the level by one
                    Q.state.inc("level", 1);
                    var currentLevel = Q.state.get("level");
                    // check if the player reached a level with new music
                    if (currentLevel == 15 || currentLevel == 25 || currentLevel == 29) {
                        // tell the game we have to play new music when staging the next level
                        Q.state.set({keepAudio: false});
                    }
                    // save the current user stats in the database, by calling the method of iwbtb.html
                    saveUserStats(currentLevel, Q.state.get("deaths"), Q.state.get("shots"));
                    // load the next level
                    Q.stageScene("level");
                }
            });
        }
    });

    // fakeWarp that spawns a warp somewhere else on the map when the player reaches it
    // warpX and warpY are set by the level file
    Q.Sprite.extend("FakeWarp", {
        init: function (p) {
            this._super(p, {
                sheet: "warp"
            });
            this.add("warp");

            // check for collision with player
            this.on("hit.sprite", function (collision) {
                if (collision.obj.isA("Player") || collision.obj.isA("ClonePlayer")) {
                    var warp = new Q.Warp({
                        // warpX and warpY are map specific and are set by the map file
                        x: this.p.warpX,
                        y: this.p.warpY
                    });
                    this.stage.insert(warp);
                    Q.audio.play("blockChange.mp3");
                    this.destroy();
                }
            });
        }
    });

    // spawns a fakeWarp, which spawns a warp after it is reached
    // fakeWarpX, fakeWarpY, warpX and warpY are set by the level file
    Q.Sprite.extend("FakeFakeWarp", {
        init: function (p) {
            this._super(p, {
                sheet: "warp"
            });
            this.add("warp");

            // check for collision with player
            this.on("hit.sprite", function (collision) {
                if (collision.obj.isA("Player") || collision.obj.isA("ClonePlayer")) {
                    var warp = new Q.FakeWarp({
                        // warpX and warpY describe in this case, where the new fake warp will spawn a warp
                        x: this.p.fakeWarpX,
                        y: this.p.fakeWarpY,
                        warpX: this.p.warpX,
                        warpY: this.p.warpY
                    });
                    this.stage.insert(warp);
                    Q.audio.play("blockChange.mp3");
                    this.destroy();
                }
            });
        }
    });

    // the placeholder warp used for boss 2
    Q.Sprite.extend("BossWarp", {
        init: function (p) {
            this._super(p, {
                sheet: "bossWarp",
                type: Q.SPRITE_NONE,
                collisionMask: Q.SPRITE_NONE
            });
        }
    });
};