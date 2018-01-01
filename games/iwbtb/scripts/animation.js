// this class defines all animated sprites for game objects
Quintus.Animation = function (Q) {
    // animate the player sprites
    Q.animations('player_animation', {
        player_deathAnimation: {
            // 15 is an empty space --> the player disappears after the animation has played
            // rate defines, how long an individual sprite is displayed
            // e.g. a rate of 1 displays a sprite much longer, than a rate of 1 / 10
            frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], rate: 1 / 10, loop: false
        },
        player_idleAnimation: {frames: [16, 17, 18, 19], rate: 1 / 5},
        player_walkingAnimation: {frames: [20, 21, 22, 23], rate: 1 / 5},
        player_jumpingAnimation: {frames: [24, 25], rate: 1 / 5},
        player_fallingAnimation: {frames: [26, 27], rate: 1 / 5}
    });

    Q.animations('bullet_animation', {
        bulletAnimation: {frames: [0, 1], rate: 1 / 20}
    });

    Q.animations('spike_animation', {
        // play the first frame several times, so the spike reflection doesn't constantly show up
        hdSpikesAnimation: {
            frames: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
            rate: 1 / 20
        }
    });

    Q.animations('fruit_animation', {
        // note: FF and IE have a problem with rendering moving sprites
        // they sometimes render 1/4 px of a nearby sprite, which leads to small black bars
        // to fix this bug we had to use a different approach, than the one we used for the other animations:
        // instead of always starting the sprite sheet (entity.p.sheet) with the first element (redFruit)
        // we now start with the color according to our fruit (e.g. greenFruit)
        // also we only have one animation, which gets played by all fruits (fruitAnimation)
        // it takes the 2 fruit frames, relative to the starting position in the sprite sheet
        // --> to change fruit color, we don't change the animation, but instead the sheet property of the sprite
        fruitAnimation: {frames: [0, 2], rate: 1 / 2}
    });

    Q.animations('boss1_animation', {
        // the FF, IE rendering bug is especially noticeable with the big boss fruit
        // to make the boss flicker on hit, and still fix the rendering bug, we had to define an individual sprite sheet for the boss
        fruitBossAnimation: {frames: [0, 2], rate: 1 / 2},
        // for the hitAnimation we need a sprite, which is empty and has no neighbours
        // 5 is an empty space (with empty neighbour sprites)
        fruitBossHitAnimation: {frames: [5, 0, 5, 2], rate: 1 / 4}
    });

    Q.animations('boss2_animation', {
        exmatrikulatorAnimation: {frames: [0]},
        exmatrikulatorHitAnimation: {frames: [1, 0], rate: 1 / 4}
    });
};