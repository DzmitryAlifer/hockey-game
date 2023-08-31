import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Application, Assets, BaseTexture, BLEND_MODES, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { CORNER_SEGMENT_SIZE_PX, PLAYER_SIZE_PX, PUCK_RADIUS_PX, RINK_LENGTH_PX, RINK_WIDTH_PX } from 'src/utils/render';
import {
  b2EdgeShape,
  b2Vec2,
  b2FixtureDef,
  b2PolygonShape,
  b2BodyType,
  b2RandomFloat,
  b2CircleShape,
  b2Body,
} from "@box2d/core";

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
      const app = this.getApp();
      const player = getPlayer();
      let puck = getPuck(RINK_LENGTH_PX / 2, RINK_WIDTH_PX / 2);

      app.stage.addChild(await getBackgroundRink());
      app.stage.addChild(getRinkBorder());
      // app.stage.addChild(player);
      app.stage.addChild(puck);
      
      app.ticker.add((delta) => {
        // player.rotation += 0.03 * delta;
        puck.transform.position.x += 1;
      });
    });
  }

  getApp(): Application {
    const app = new Application<HTMLCanvasElement>({ background: 'white', resizeTo: window, antialias: true });
    this.elementRef.nativeElement.appendChild(app.view);

    return app;
  }
}

async function getBackgroundRink(): Promise<Sprite> {
  const backgroundRinkSprite = Sprite.from(await Assets.load('../../assets/images/rink.jpg'));
  backgroundRinkSprite.height = RINK_WIDTH_PX;
  backgroundRinkSprite.width = RINK_LENGTH_PX;
  backgroundRinkSprite.alpha = 0.05;

  return backgroundRinkSprite;
}

function getRinkBorder(): Graphics {
  const rinkBorder = new Graphics();
  rinkBorder.lineStyle(2, 'green');
  rinkBorder.drawPolygon(
    CORNER_SEGMENT_SIZE_PX, 0,
    RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX, 0,
    RINK_LENGTH_PX, CORNER_SEGMENT_SIZE_PX,
    RINK_LENGTH_PX, RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX,
    RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX, RINK_WIDTH_PX,
    CORNER_SEGMENT_SIZE_PX, RINK_WIDTH_PX,
    0, RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX,
    0, CORNER_SEGMENT_SIZE_PX,
  );

  return rinkBorder;
}

function getPlayer(): Sprite {
  const player = Sprite.from('../../assets/images/jersey_red.png');
  player.anchor.set(0.5);
  player.x = RINK_LENGTH_PX / 2 - PLAYER_SIZE_PX * 2;
  player.y = RINK_WIDTH_PX / 2;

  return player;
}

function getPuck(x: number, y: number): Graphics {
  const puck = new Graphics();
  puck.lineStyle(1, '#666');
  puck.beginFill('#222');
  puck.drawCircle(x, y, PUCK_RADIUS_PX);
  puck.endFill();

  return puck;
}