class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 200;
        this.DRAG = 1500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -550;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.playerHP = 100;
        this.gameWon = false;
        this.gameLost = false;
        
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // TODO: Add createFromObjects here
                // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });
        this.poison = this.map.createFromObjects("Objects", {
            name: "poison",
            key: "tilemap_sheet",
            frame: 74
        });
        this.heart = this.map.createFromObjects("Objects", {
            name: "heart",
            key: "tilemap_sheet",
            frame: 44
        });
        
        this.titleText1 = this.add.text(50, 150, "Collect all the coins!", {
            fontFamily: 'Verdana, Geneva, sans-serif',
            fontSize: 10,
        });
        this.HPText = this.add.text(50, 50, "HP:100", {
            fontFamily: 'Verdana, Geneva, sans-serif',
            fontSize: 10,
        });



        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.poison, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.heart, Phaser.Physics.Arcade.STATIC_BODY);
        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        this.poisonGroup = this.add.group(this.poison);
        this.heartGroup = this.add.group(this.heart);
        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // TODO: Add coin collision handler
        // Handle collision detection with coins
        this.coinCount = 0;
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.coinCount += 1;
            this.sound.play("coin", {
                volume: 0.5   // Can adjust volume using this, goes from 0 to 1
            });
        });
        this.physics.add.overlap(my.sprite.player, this.poisonGroup, (obj1, obj2) => {
            this.playerHP -= 0.1;
        });
        this.physics.add.overlap(my.sprite.player, this.heartGroup, (obj1, obj2) => {
            obj2.destroy();
            this.playerHP += 20;
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        // movement vfx

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.02, end: 0.05},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

    }

    update() {
        if(this.playerHP <= 0 && this.gameLost == false){
            this.gameLost = true;
            this.loseText1 = this.add.text(this.cameras.main.worldView.x+240, 130, "You died!", {
                fontFamily: 'Lucida, monospace',
                fontSize: 20,
            });
            this.loseText3 = this.add.text(this.cameras.main.worldView.x+160, 170, "Press R to restart", {
                fontFamily: 'Lucida, monospace',
                fontSize: 30,
            });
            this.physics.pause();
        }
        if(this.coinCount == 29 && this.gameWon == false){
            this.textX = my.sprite.player.x;
            this.winText1 = this.add.text(this.cameras.main.worldView.x+30, 130, "All coins have been collected!", {
                fontFamily: 'Lucida, monospace',
                fontSize: 20,
            });
            this.winText3 = this.add.text(this.cameras.main.worldView.x+160, 210, "Press R to restart", {
                fontFamily: 'Lucida, monospace',
                fontSize: 30,
            });
            this.gameWon = true;
            this.physics.pause();
        }

        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }


        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        this.HPText.setText("HP: " + Math.floor(this.playerHP));
        this.HPText.x = my.sprite.player.x-28;
        this.HPText.y = my.sprite.player.y-25;

        

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {

            this.scene.restart();
            this.coinCount = 0;
        }
    }
}
r