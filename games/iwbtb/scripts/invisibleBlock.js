// an invisible block, which becomes visible, when the player touches it
Quintus.InvisibleBlock = function (Q) {
    Q.Sprite.extend("InvisibleBlock", {
        init: function (p) {
            this._super(p, {
                type: Q.SPRITE_MAP,
                collisionMask: Q.SPRITE_PLAYER,
                sheet: "invisibleBlock"
            });

            this.on("hit.sprite", function (collision) {
                if (collision.obj.isA("Player")) {
                    if (!this.p.visible) {
                        // make the block visible
                        this.p.sheet = "visibleBlock";
                        Q.audio.play("blockChange.mp3");
                        this.p.visible = true;
                    }
                }
            });
        }
    });
};