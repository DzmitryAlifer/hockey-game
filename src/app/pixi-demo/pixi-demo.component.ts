import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Application, Container, Sprite, Texture } from 'pixi.js';

@Component({
  selector: 'app-pixi-demo',
  standalone: true,
  template: '<canvas #canvas></canvas>',
})
export class PixiDemoComponent implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef;
  
  constructor(private readonly zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular((): void => {
      const app = new Application({ background: 'gray', resizeTo: window, view: this.canvas.nativeElement });
      const container = new Container();
      app.stage.addChild(container);
      const texture = Texture.from('https://pixijs.com/assets/bunny.png');

      for (let i = 0; i < 25; i++) {
        const bunny = new Sprite(texture);
        bunny.anchor.set(0.5);
        bunny.x = (i % 5) * 40;
        bunny.y = Math.floor(i / 5) * 40;
        container.addChild(bunny);
      }

      container.x = app.screen.width / 2;
      container.y = app.screen.height / 2;
      container.pivot.x = container.width / 2;
      container.pivot.y = container.height / 2;

      app.ticker.add((delta) => {
        container.rotation -= 0.01 * delta;
      });
    });
  }
}
