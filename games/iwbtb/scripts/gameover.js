Quintus.GameOver = function (Q) {
    // define a second scene on top of the GamePlay stage, which only contains the GameOverSprite
    Q.scene("GameOver", function (stage) {
        // show the GameOver image on top of the gameplay scene
        stage.insert(new Q.GameOver());
    });


    // define a simple sprite, which only shows the GameOver image
    Q.Sprite.extend("GameOver", {
        init: function (p) {
            this._super(p, {
                sheet: "gameover",
                // set the position to the middle of the screen (quintus coordinates start in the middle of a sprite)
                x: 400,
                y: 304
            });
        }
    });
};