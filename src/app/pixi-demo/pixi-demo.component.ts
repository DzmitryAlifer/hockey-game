import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Application, Assets, BaseTexture, BLEND_MODES, Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { RINK_LENGTH_PX, RINK_WIDTH_PX } from 'src/utils/render';
import * as PIXI from 'pixi.js';

@Component({
  selector: 'app-pixi-demo',
  standalone: true,
  template: '',
})
export class PixiDemoComponent implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef;

  constructor(private readonly elementRef: ElementRef, private readonly zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(async () => {
      const app = new Application<HTMLCanvasElement>({ background: 'grey', resizeTo: window, resolution: 1 });
      this.elementRef.nativeElement.appendChild(app.view);

      const backgroundRink = Sprite.from(await Assets.load('../../assets/images/rink.svg'), { multisample: 8 });
      backgroundRink.height = RINK_WIDTH_PX;
      backgroundRink.width = RINK_LENGTH_PX;
      
      app.stage.addChild(backgroundRink);

      const player = Sprite.from('../../assets/images/jersey_red.png');
      app.stage.addChild(player);
      
      player.anchor.set(0.5);
      player.x = RINK_LENGTH_PX / 2;
      player.y = RINK_WIDTH_PX / 2;

      app.ticker.add((delta) => {
        player.rotation += 0.05 * delta;
      });
    });
  }
}
