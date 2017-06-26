'use strict'

'use strict'

import Phaser from 'phaser'

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, playState }) {
    super(game, x, y, 'player')

    // hold reference to play state:
    this.playState = playState

    // define anchor and size:
    this.anchor.setTo(0.5, 0.5)
    this.scale.setTo(0, 0)

    // define sounds:
    this.appearanceSound = game.add.audio('appearance', 0.5, false)
    this.absorbSound = game.add.audio('absorb')
    this.burnSound = game.add.audio('burn')

    // define animations:
    this.animations.add('idle', [0])
    this.animations.add('shoot', [1])
    this.animations.add('twist', [2])

    // enable Arcade physics:
    game.physics.enable(this, Phaser.Physics.ARCADE)

    // set alive:
    this.alive = true
  }

  update () {}

  appear () {
    // add source:
    this.source = this.game.add.sprite(this.x, this.y, 'target')
    this.bringToTop()
    this.source.scale.setTo(2, 2)
    this.source.anchor.setTo(0.5, 0.5)
    this.source.animations.add('spiral', [7, 6, 5, 4, 3, 2, 1, 9])
    this.source.animations.play('spiral', 6, true)

    this.animations.play('twist')

    this.game.add.tween(this).to({angle: 720}, 2000, Phaser.Easing.Quadratic.Out, true, 1500, 0, false)
    this.game.add.tween(this.scale).to({x: 1.0, y: 1.0}, 2000, Phaser.Easing.Quadratic.Out, true, 1500, 0, false).onComplete.add(() => {
      this.game.add.tween(this.source.scale).to({x: 0, y: 0}, 1000, Phaser.Easing.Quadratic.In, true).onComplete.add(() => {
        this.source.destroy()
      })

      this.animations.play('idle')

      this.game.playerReady = true

      // play level intro (if available):
      if (typeof this.playState.level.intro !== 'undefined') {
        this.playState.level.currentScene = 1
        this.playState.level.intro.nextSceneAllowed = true
        this.playState.level.intro(this.game, this.x, this.y, this.playState.level.currentScene)
      }
    })
    this.game.time.events.add(Phaser.Timer.SECOND, () => {
      this.appearanceSound.play()
    })
  }

  absorb (targetx, targety, callback) {
  // play sound:
    this.absorbSound.play()

    this.game.playerReady = false

    this.animations.play('twist')

  // animate player being absorbed and execute callback at the end:
    this.game.add.tween(this).to({x: targetx, y: targety, angle: -720}, 2000, Phaser.Easing.Quadratic.In).start()
    this.game.add.tween(this.scale).to({x: 0.0, y: 0.0}, 2000, Phaser.Easing.Exponential.In).start().onComplete.add(() => {
    // remove player (for audio to stop)
      this.destroy()
      callback()
    })
  };

  burn (callback) {
    this.body.acceleration.setTo(0, 0)
    this.body.velocity.setTo(0, 0)

    this.game.playerControls = false
    this.game.playerReady = false

  // play sound:
    this.burnSound.play()

  // animate player burning and execute callback at the end:
    this.animations.play('twist')
    this.tint = 0x990000
    var burnEmitter = this.game.add.emitter(this.x, this.y, 50)
    burnEmitter.makeParticles('spark')
    burnEmitter.minParticleSpeed.setTo(-250, -250)
    burnEmitter.maxParticleSpeed.setTo(250, 250)
    burnEmitter.gravity = 0
    burnEmitter.width = 20
    burnEmitter.height = 20
    burnEmitter.start(false, 100, 5)
    this.game.time.events.add(Phaser.Timer.SECOND, () => {
      this.destroy()
      burnEmitter.destroy()
      callback()
    })
  };
}
