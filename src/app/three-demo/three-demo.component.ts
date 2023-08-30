import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import * as Three from 'three';

@Component({
  selector: 'app-three-demo',
  standalone: true,
  template: '<canvas #canvas id="canvas" style="height: 100%; width: 100%;" ></canvas>',
})
export class ThreeDemoComponent implements AfterViewInit {
  @ViewChild('canvas') private canvasRef!: ElementRef;

  @Input() rotationSpeedX: number = 0.05;
  @Input() rotationSpeedY: number = 0.01;
  @Input() size: number = 200;
  @Input() texture: string = '/assets/texture.jpg';
  @Input() public cameraZ: number = 400;
  @Input() public fieldOfView: number = 1;
  @Input('nearClipping') public nearClippingPlane: number = 1;
  @Input('farClipping') public farClippingPlane: number = 1000;

  private camera!: THREE.PerspectiveCamera;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }
  private loader = new Three.TextureLoader();
  private geometry = new Three.BoxGeometry(1, 1, 1);
  private material = new Three.MeshBasicMaterial({ map: this.loader.load(this.texture) });

  private cube: Three.Mesh = new Three.Mesh(this.geometry, this.material);
  private renderer!: Three.WebGLRenderer;
  private scene!: Three.Scene;


  ngAfterViewInit(): void {
    this.createScene();
    this.startRenderingLoop();
  }

  private animateCube() {
    this.cube.rotation.x += this.rotationSpeedX;
    this.cube.rotation.y += this.rotationSpeedY;
  }

  private createScene() {
    this.scene = new Three.Scene();
    this.scene.background = new Three.Color(0x000000);
    this.scene.add(this.cube);
    this.camera = new Three.PerspectiveCamera(this.fieldOfView, this.canvas.clientWidth / this.canvas.clientHeight, this.nearClippingPlane, this.farClippingPlane);
    this.camera.position.z = this.cameraZ;
  }

  private startRenderingLoop() {
    this.renderer = new Three.WebGLRenderer({ canvas: this.canvas });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    let component = this;

    (function render() {
      requestAnimationFrame(render);
      component.animateCube();
      component.renderer.render(component.scene, component.camera);
    }());
  }
}