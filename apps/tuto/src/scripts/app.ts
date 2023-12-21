import {
  ArcRotateCamera,
  Color4,
  Engine,
  FreeCamera,
  HemisphericLight,
  MeshBuilder,
  Scene,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import { AdvancedDynamicTexture, Button, Control } from '@babylonjs/gui';

enum State {
  START = 0,
  GAME = 1,
  LOSE = 2,
  CUTSCENE = 3,
}

class App {
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  cutScene: Scene;
  state: State;

  constructor() {
    this.canvas = this.createCanvas();
    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);

    //     this.main();
    this.test();
  }

  private createCanvas() {
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.id = 'tutoCanvas';
    document.body.appendChild(this.canvas);
    return this.canvas;
  }
  private test() {
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2.5,
      3,
      new Vector3(0, 0, 0),
      this.scene
    );

    const light = new HemisphericLight(
      'light',
      new Vector3(0, 1, 0),
      this.scene
    );

    const box = MeshBuilder.CreateBox('box', {}, this.scene);
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  private async main() {
    await this.goToStart();

    this.engine.runRenderLoop(() => {
      switch (this.state) {
        case State.START:
          this.scene.render();
          break;
        case State.CUTSCENE:
          this.scene.render();
          break;
        case State.GAME:
          this.scene.render();
          break;
        case State.LOSE:
          this.scene.render();
          break;
        default:
          break;
      }
    });
  }

  private async goToStart() {
    this.engine.displayLoadingUI();

    this.scene.detachControl();

    const scene = new Scene(this.engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    const camera = new FreeCamera(
      'camera1',
      new Vector3(0, 0, 0),
      this.cutScene
    );
    camera.setTarget(Vector3.Zero());

    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    guiMenu.idealHeight = 720;
    const startBtn = Button.CreateSimpleButton('start', 'PLAY');
    startBtn.width = 0.2;
    startBtn.height = '40px';
    startBtn.color = 'white';
    startBtn.top = '-14px';
    startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    guiMenu.addControl(startBtn);

    startBtn.onPointerDownObservable.add(() => {
      this.goToCutScene();
      scene.detachControl();
    });

    await scene.whenReadyAsync();
    this.engine.hideLoadingUI();
    this.scene.dispose();
    this.scene = scene;
    this.state = State.START;
  }

  private goToCutScene() {}

  private goToGame() {}
}

new App();
