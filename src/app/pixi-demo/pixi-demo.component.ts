import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Application, Assets, BaseTexture, BLEND_MODES, Container, Graphics, IPointData, Point, Polygon, Rectangle, Sprite, Texture } from 'pixi.js';
import { CORNER_SEGMENT_SIZE_PX, PLAYER_SIZE_PX, PUCK_RADIUS_PX, RINK_LENGTH_PX, RINK_WIDTH_PX } from 'src/utils/render';

interface CollidedSprite extends Sprite {
  acceleration?: Point;
  mass?: number;
}

const movementSpeed = 0.05;
const impulsePower = 1;

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
      const backgroundRink = await getBackgroundRink();
      const rinkBorder = getRinkBorder();
      const redPlayer = getPlayer(0, 0, 'jersey_red.png', 2);
      const bluePlayer =  getPlayer(RINK_LENGTH_PX / 2 + PLAYER_SIZE_PX * 2, RINK_WIDTH_PX / 2, 'jersey_blue.png', 3);
      let puck = getPuck(RINK_LENGTH_PX / 2, RINK_WIDTH_PX / 2);

      app.stage.addChild(backgroundRink, rinkBorder, redPlayer, bluePlayer, puck);

      const mouseCoords = { x: 0, y: 0 };
      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;

      app.stage.on('mousemove', (event) => {
        mouseCoords.x = event.global.x;
        mouseCoords.y = event.global.y;
      });

      app.ticker.add((delta) => {
        // bluePlayer.rotation += 0.03 * delta;
        // puck.transform.position.x += 1;
        redPlayer.acceleration?.set(redPlayer.acceleration.x * 0.99, redPlayer.acceleration.y * 0.99);
        bluePlayer.acceleration?.set(bluePlayer.acceleration.x * 0.99, bluePlayer.acceleration.y * 0.99);

        if (bluePlayer.x < 0 || bluePlayer.x > (app.screen.width - 100)) {
          bluePlayer.acceleration!.x = -bluePlayer.acceleration!.x;
        }

        if (bluePlayer.y < 0 || bluePlayer.y > (app.screen.height - 100)) {
          bluePlayer.acceleration!.y = -bluePlayer.acceleration!.y;
        }

        if ((bluePlayer.x < -30 || bluePlayer.x > (app.screen.width + 30)) || bluePlayer.y < -30 || bluePlayer.y > (app.screen.height + 30)) {
          bluePlayer.position.set((app.screen.width - 100) / 2, (app.screen.height - 100) / 2);
        }

        if (app.screen.width > mouseCoords.x || mouseCoords.x > 0 || app.screen.height > mouseCoords.y || mouseCoords.y > 0) {
          const redSquareCenterPosition = new Point(redPlayer.x + (redPlayer.width * 0.5), redPlayer.y + (redPlayer.height * 0.5));
          const toMouseDirection = new Point(mouseCoords.x - redSquareCenterPosition.x, mouseCoords.y - redSquareCenterPosition.y);
          const angleToMouse = Math.atan2(toMouseDirection.y, toMouseDirection.x);
          const distMouseRedSquare = distance(mouseCoords, redSquareCenterPosition);
          const redSpeed = distMouseRedSquare * movementSpeed;
          redPlayer.acceleration?.set(Math.cos(angleToMouse) * redSpeed, Math.sin(angleToMouse) * redSpeed);
        }

        if (testForAABB(bluePlayer, redPlayer)) {
          const collisionPush = collisionResponse(bluePlayer, redPlayer);
          redPlayer.acceleration?.set((collisionPush.x * (bluePlayer.mass ?? 0)), (collisionPush.y * (bluePlayer.mass ?? 0)));
          bluePlayer.acceleration?.set(-(collisionPush.x * (redPlayer.mass ?? 0)), -(collisionPush.y * (redPlayer.mass ?? 0)));
        }

        bluePlayer.x += bluePlayer.acceleration!.x * delta;
        bluePlayer.y += bluePlayer.acceleration!.y * delta;
        redPlayer.x += redPlayer.acceleration!.x * delta;
        redPlayer.y += redPlayer.acceleration!.y * delta;
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

function getPlayer(x: number, y: number, imageName?: string, mass?: number): CollidedSprite {
  const player: CollidedSprite = Sprite.from(`../../assets/images/${imageName}`);
  player.anchor.set(0.5);
  player.x = x;
  player.y = y;
  player.width = PLAYER_SIZE_PX;
  player.height = PLAYER_SIZE_PX;
  player.acceleration = new Point(0);
  player.mass = 3;

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

function testForAABB(object1: Sprite, object2: Sprite): boolean {
  const bounds1 = object1.getBounds();
  const bounds2 = object2.getBounds();

  return bounds1.x < bounds2.x + bounds2.width
      && bounds1.x + bounds1.width > bounds2.x
      && bounds1.y < bounds2.y + bounds2.height
      && bounds1.y + bounds1.height > bounds2.y;
}

function collisionResponse(object1: CollidedSprite, object2: CollidedSprite): Point {
  if (!object1 || !object2) return new Point(0);
  const vCollision = new Point(object2.x - object1.x, object2.y - object1.y);
  const distance = Math.sqrt((object2.x - object1.x) * (object2.x - object1.x) + (object2.y - object1.y) * (object2.y - object1.y));
  const vCollisionNorm = new Point(vCollision.x / distance, vCollision.y / distance);
  const vRelativeVelocity = new Point(object1.acceleration!.x - object2.acceleration!.x, object1.acceleration!.y - object2.acceleration!.y);
  const speed = vRelativeVelocity.x * vCollisionNorm.x + vRelativeVelocity.y * vCollisionNorm.y;
  const impulse = impulsePower * speed / (object1.mass! + object2.mass!);

  return new Point(impulse * vCollisionNorm.x, impulse * vCollisionNorm.y);
}

function distance(point1: IPointData, point2: IPointData): number {
  return Math.hypot(point1.x - point2.x, point1.y - point2.y);
}