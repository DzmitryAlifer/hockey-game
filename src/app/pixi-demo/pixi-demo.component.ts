import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import * as PIXI from 'pixi.js';
import { Application } from '@pixi/app';
import { Sprite } from '@pixi/sprite';

@Component({
  selector: 'app-pixi-demo',
  standalone: true,
  template: '<canvas #canvas></canvas>',
})
export class PixiDemoComponent implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef;
  
  constructor(private readonly zone: NgZone) {}

  public ngAfterViewInit(): void {
    this.zone.runOutsideAngular((): void => {
      const app: Application = new Application({ view: this.canvas.nativeElement });
      const sprite: Sprite = Sprite.from('https://avatars.githubusercontent.com/in/2740?s=64&v=4');
      app.stage.addChild(sprite);
      app.render();
    });
  }
}
