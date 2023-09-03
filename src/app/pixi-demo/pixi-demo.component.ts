import { CommonModule } from '@angular/common'; 
import { AfterViewInit, Component, ElementRef, NgZone } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Application, Assets, BaseTexture, BLEND_MODES, Container, DisplayObject, Graphics, IPointData, Point, Polygon, Rectangle, Sprite, Texture } from 'pixi.js';
import { CORNER_SEGMENT_SIZE_PX, PI, PLAYER_SIZE_PX, PUCK_DRAG_RATIO, PUCK_MIN_SHIFT_PX, PUCK_RADIUS_PX, RINK_LENGTH_PX, RINK_WIDTH_PX, SPEED_TO_SHIFT_RATIO, getRandomInRange } from 'src/utils/render';
import { linePoint } from 'intersects';
import { BoardPart } from 'src/types';

interface Movable {
  speed: number;
  shiftX: number;
  shiftY: number;
  acceleration?: Point;
  mass?: number;
  team?: string;
}

enum Team {
  Red = 'Red',
  Blue = 'Blue',
}

type MovableSprite = Sprite & Movable;
type MovableGraphics = Graphics & Movable;

const sin = Math.sin;
const cos = Math.cos;
const atan2 = Math.atan2;
const abs = Math.abs;
const hypot = Math.hypot;
const playerImpulse = 2;

const TOP_LEFT_SEGMENT = new Graphics().lineStyle(2, '#00f').moveTo(0, CORNER_SEGMENT_SIZE_PX).lineTo(CORNER_SEGMENT_SIZE_PX, 0);
TOP_LEFT_SEGMENT.name = BoardPart.TopLeft;

const TOP_RIGHT_SEGMENT = new Graphics().lineStyle(2, '#00f').moveTo(RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX, 0).lineTo(RINK_LENGTH_PX, CORNER_SEGMENT_SIZE_PX);
TOP_RIGHT_SEGMENT.name = BoardPart.TopRight;

const BOTTOM_RIGHT_SEGMENT = new Graphics().lineStyle(2, '#00f').moveTo(RINK_LENGTH_PX, RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX).lineTo(RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX, RINK_WIDTH_PX);
BOTTOM_RIGHT_SEGMENT.name = BoardPart.BottomRight;

const BOTTOM_LEFT_SEGMENT = new Graphics().lineStyle(2, '#00f').moveTo(CORNER_SEGMENT_SIZE_PX, RINK_WIDTH_PX).lineTo(0, RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX);
BOTTOM_LEFT_SEGMENT.name = BoardPart.BottomLeft;

let playersOnIce: MovableSprite[] = [];
let bouncedBoard: BoardPart | null = null;
let previousBouncedBoard: BoardPart | null = null;
let isPuckCaught = false;
let puck: MovableGraphics;

@Component({
  selector: 'app-pixi-demo',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './pixi-demo.component.html',
  styleUrls: ['./pixi-demo.component.scss'],
})
export class PixiDemoComponent implements AfterViewInit {
  redTeamScore = 0;
  blueTeamScore = 0;

  constructor(private readonly elementRef: ElementRef, private readonly zone: NgZone) {}

  async ngAfterViewInit(): Promise<void> {
      const app = this.getApp();
      const backgroundRink = await getBackgroundRink();
      const rinkBorder = getRinkBorder();
      playersOnIce = getPlayers();
      puck = getPuckRandom();

      app.stage.addChild(backgroundRink, rinkBorder, TOP_RIGHT_SEGMENT, BOTTOM_RIGHT_SEGMENT, BOTTOM_LEFT_SEGMENT, TOP_LEFT_SEGMENT, ...playersOnIce, puck);

      // const mouseCoords = { x: 0, y: 0 };
      // app.stage.eventMode = 'static';
      // app.stage.hitArea = rinkBorder.currentPath;

      // app.stage.on('mousemove', (event) => {
      //   mouseCoords.x = event.global.x;
      //   mouseCoords.y = event.global.y;
      // });

      app.ticker.add((delta) => {
        updatePuckPosition(puck, bouncedBoard);
        
        playersOnIce.forEach(player => {
          updatePlayerPosition(player, puck);
          this.checkPuckCatch(player, puck, app);
        });

        // redPlayer.acceleration?.set(redPlayer.acceleration.x * 0.9, redPlayer.acceleration.y * 0.9);
        // bluePlayer.acceleration?.set(bluePlayer.acceleration.x * 0.9, bluePlayer.acceleration.y * 0.9);

        // if (bluePlayer.x < 0 || bluePlayer.x > RINK_LENGTH_PX) {
        //   bluePlayer.acceleration!.x = -bluePlayer.acceleration!.x;
        // }

        // if (bluePlayer.y < 0 || bluePlayer.y > RINK_WIDTH_PX) {
        //   bluePlayer.acceleration!.y = -bluePlayer.acceleration!.y;
        // }

        // if (RINK_LENGTH_PX > mouseCoords.x || mouseCoords.x > 0 || RINK_WIDTH_PX > mouseCoords.y || mouseCoords.y > 0) {
        //   const redSquareCenterPosition = new Point(redPlayer.x + (redPlayer.width * 0.5), redPlayer.y + (redPlayer.height * 0.5));
        //   const toMouseDirection = new Point(mouseCoords.x - redSquareCenterPosition.x, mouseCoords.y - redSquareCenterPosition.y);
        //   const angleToMouse = Math.atan2(toMouseDirection.y, toMouseDirection.x);
        //   const distMouseRedSquare = distance(mouseCoords, redSquareCenterPosition);
        //   const redSpeed = distMouseRedSquare * playerSpeed;
        //   redPlayer.acceleration?.set(Math.cos(angleToMouse) * redSpeed, Math.sin(angleToMouse) * redSpeed);
        // }

        // if (testForAABB(bluePlayer, redPlayer)) {
        //   const collisionPush = collisionResponse(bluePlayer, redPlayer);
        //   redPlayer.acceleration?.set((collisionPush.x * (bluePlayer.mass ?? 0)), (collisionPush.y * (bluePlayer.mass ?? 0)));
        //   bluePlayer.acceleration?.set(-(collisionPush.x * (redPlayer.mass ?? 0)), -(collisionPush.y * (redPlayer.mass ?? 0)));
        // }

        // bluePlayer.x += bluePlayer.acceleration!.x * delta;
        // bluePlayer.y += bluePlayer.acceleration!.y * delta;
        // redPlayer.x += redPlayer.acceleration!.x * delta;
        // redPlayer.y += redPlayer.acceleration!.y * delta;
      });
  }

  private getApp(): Application {
    const app = new Application<HTMLCanvasElement>({ background: 'white', resizeTo: window, antialias: true });
    this.elementRef.nativeElement.appendChild(app.view);

    return app;
  }

  private checkPuckCatch(player: MovableSprite, currentPuck: MovableGraphics, app: Application): void {
    if (!isPuckCaught && playerToPuckDistance(player, currentPuck) < PLAYER_SIZE_PX / 2) {
      player.speed = currentPuck.speed = 0;
      isPuckCaught = true;
      player.team === Team.Red ? this.redTeamScore++ : this.blueTeamScore++;

      setTimeout(() => {
        app.stage.removeChild(...playersOnIce, currentPuck);
        app.ticker.stop();
      }, 1000);

      setTimeout(() => {
        puck = getPuckRandom();
        playersOnIce = getPlayers();
        app.stage.addChild(...playersOnIce, puck);
        app.ticker.start();
        isPuckCaught = false;
      }, 2000);
    }
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

function getPlayers(): MovableSprite[] {
  return [
    getPlayer(100, RINK_WIDTH_PX / 2, 'jersey_red.png', 'Red', 80, 25),
    getPlayer(600, RINK_WIDTH_PX / 2, 'jersey_blue.png', 'Blue', 70, 22),
  ];
}

function getPlayer(x: number, y: number, imageName: string, team: string, mass: number, speed: number = 0): MovableSprite {
  const player = Sprite.from(`../../assets/images/${imageName}`) as MovableSprite;
  player.anchor.set(0.5);
  player.x = x;
  player.y = y;
  player.shiftX = 0;
  player.shiftY = 0;
  player.width = PLAYER_SIZE_PX;
  player.height = PLAYER_SIZE_PX;
  player.speed = speed;
  player.acceleration = new Point(0);
  player.mass = mass;
  player.team = team;

  return player;
}

function getPuckRandom(): MovableGraphics {
  return getPuck(getRandomInRange(100, 800), getRandomInRange(20, 380), getRandomInRange(0, PI * 2), getRandomInRange(100, 200));
}

function getPuck(x: number, y: number, angle: number, speed: number): MovableGraphics {
  const puck = new Graphics() as MovableGraphics;
  puck.lineStyle(0, '#00f');
  puck.beginFill('#222');
  puck.drawCircle(x, y, PUCK_RADIUS_PX);
  puck.endFill();
  puck.speed = speed;
  const shift = speed / SPEED_TO_SHIFT_RATIO;
  puck.shiftX = shift * cos(angle);
  puck.shiftY = shift * sin(angle);

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

function collisionResponse(object1: MovableSprite, object2: MovableSprite): Point {
  if (!object1 || !object2) return new Point(0);
  const vCollision = new Point(object2.x - object1.x, object2.y - object1.y);
  const distance = Math.sqrt((object2.x - object1.x) * (object2.x - object1.x) + (object2.y - object1.y) * (object2.y - object1.y));
  const vCollisionNorm = new Point(vCollision.x / distance, vCollision.y / distance);
  const vRelativeVelocity = new Point(object1.acceleration!.x - object2.acceleration!.x, object1.acceleration!.y - object2.acceleration!.y);
  const speed = vRelativeVelocity.x * vCollisionNorm.x + vRelativeVelocity.y * vCollisionNorm.y;
  const impulse = playerImpulse * speed / (object1.mass! + object2.mass!);

  return new Point(impulse * vCollisionNorm.x, impulse * vCollisionNorm.y);
}

function playerToPuckDistance(player: MovableSprite, puck: MovableGraphics): number {
  const playerBounds = player.getBounds();
  const puckBounds = puck.getBounds();
  const deltaX = (playerBounds.left + playerBounds.right) / 2 - (puckBounds.left + puckBounds.right) / 2;
  const deltaY = (playerBounds.top + playerBounds.bottom) / 2 - (puckBounds.top + puckBounds.bottom) / 2;

  return hypot(deltaX, deltaY);
}

function pointToSegmentDistance(p: IPointData, a: IPointData, b: IPointData): number {
  const ab = [b.x - a.x, b.y - a.y];
  const pb = [p.x - b.x, p.y - b.y];
  const pa = [p.x - a.x, p.y - a.y];
  const ab_pb = (ab[0] * pb[0] + ab[1] * pb[1]);
  const ab_pa = (ab[0] * pa[0] + ab[1] * pa[1]);
  let reqAns = 0;

  if (ab_pb > 0) {
    const y = p.y - b.y;
    const x = p.x - b.x;
    reqAns = Math.sqrt(x * x + y * y);
  } else if (ab_pa < 0) {
    const y = p.y - a.y;
    const x = p.x - a.x;
    reqAns = Math.sqrt(x * x + y * y);
  } else {
    const x1 = ab[0];
    const y1 = ab[1];
    const x2 = pa[0];
    const y2 = pa[1];
    reqAns = Math.abs(x1 * y2 - y1 * x2) / Math.sqrt(x1 * x1 + y1 * y1);
  }

  return reqAns;
}

function isCornerBounce(puck: MovableGraphics): boolean {
  const { left, top} = puck.getBounds(); 
  const puckDetails: [number, number, number] = [left + PUCK_RADIUS_PX, top + PUCK_RADIUS_PX, PUCK_RADIUS_PX];
  const isTopLeftCorner = linePoint(0 - RINK_LENGTH_PX / 2, CORNER_SEGMENT_SIZE_PX - RINK_WIDTH_PX / 2, CORNER_SEGMENT_SIZE_PX - RINK_LENGTH_PX / 2, 0 - RINK_WIDTH_PX / 2, ...puckDetails);
  const isTopRightCorner = linePoint(RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX - RINK_LENGTH_PX / 2, 0 - RINK_WIDTH_PX / 2, RINK_LENGTH_PX - RINK_LENGTH_PX / 2, CORNER_SEGMENT_SIZE_PX - RINK_WIDTH_PX / 2, ...puckDetails);
  const isBottomRightCorner = linePoint(RINK_LENGTH_PX - RINK_LENGTH_PX / 2, RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX - RINK_WIDTH_PX / 2, RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX - RINK_LENGTH_PX / 2, RINK_WIDTH_PX - RINK_WIDTH_PX / 2, ...puckDetails);
  const isBottomLeftCorner = linePoint(CORNER_SEGMENT_SIZE_PX - RINK_LENGTH_PX / 2, RINK_WIDTH_PX - RINK_WIDTH_PX / 2, 0 - RINK_LENGTH_PX / 2, RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX - RINK_WIDTH_PX / 2, ...puckDetails);
  
  return isTopLeftCorner || isTopRightCorner || isBottomRightCorner || isBottomLeftCorner;
}

function pointToCornerSegmentDistance(puck: Graphics, cornerSegment: Graphics): number {
  const { x, y } = puck.getBounds();
  const { left, right, top, bottom } = cornerSegment.getBounds();
  
  return [BoardPart.TopRight, BoardPart.BottomLeft].includes(cornerSegment.name as BoardPart) ? 
    pointToSegmentDistance({ x: x + PUCK_RADIUS_PX, y: y + PUCK_RADIUS_PX }, { x: left, y: top }, { x: right, y: bottom }) :
    pointToSegmentDistance({ x: x + PUCK_RADIUS_PX, y: y + PUCK_RADIUS_PX }, { x: left, y: bottom }, { x: right, y: top });
}

function updatePuckPosition(puck: MovableGraphics, bouncedBoard: BoardPart | null): void {
  if (abs(puck.shiftX) < PUCK_MIN_SHIFT_PX && abs(puck.shiftY) < PUCK_MIN_SHIFT_PX || puck.speed < 0.5) {
    puck.shiftX = puck.shiftY = puck.speed = 0;
  }

  puck.speed *= PUCK_DRAG_RATIO;
  puck.shiftX *= PUCK_DRAG_RATIO;
  puck.shiftY *= PUCK_DRAG_RATIO;
  puck.x += puck.shiftX;
  puck.y += puck.shiftY;

  const { left, right, top, bottom } = puck.getBounds();

  if (!bouncedBoard) {
    if (left <= PUCK_RADIUS_PX || right >= RINK_LENGTH_PX - PUCK_RADIUS_PX) {
      bouncedBoard = BoardPart.Left; puck.shiftX = -puck.shiftX;
    } else if (top <= PUCK_RADIUS_PX || bottom >= RINK_WIDTH_PX - PUCK_RADIUS_PX) {
      bouncedBoard = BoardPart.Top;
      puck.shiftY = -puck.shiftY;
    } else if (pointToCornerSegmentDistance(puck, TOP_RIGHT_SEGMENT) <= PUCK_RADIUS_PX && previousBouncedBoard !== BoardPart.TopRight) {
      bouncedBoard = previousBouncedBoard = BoardPart.TopRight;
      const temp = puck.shiftX;
      puck.shiftX = puck.shiftY;
      puck.shiftY = temp;
    } else if (pointToCornerSegmentDistance(puck, BOTTOM_RIGHT_SEGMENT) <= PUCK_RADIUS_PX && previousBouncedBoard !== BoardPart.BottomRight) {
      bouncedBoard = previousBouncedBoard = BoardPart.BottomRight;
      const temp = puck.shiftX;
      puck.shiftX = -puck.shiftY;
      puck.shiftY = -temp;
    } else if (pointToCornerSegmentDistance(puck, BOTTOM_LEFT_SEGMENT) <= PUCK_RADIUS_PX && previousBouncedBoard !== BoardPart.BottomLeft) {
      bouncedBoard = previousBouncedBoard = BoardPart.BottomLeft;
      const temp = puck.shiftX;
      puck.shiftX = puck.shiftY;
      puck.shiftY = temp;
    } else if (pointToCornerSegmentDistance(puck, TOP_LEFT_SEGMENT) <= PUCK_RADIUS_PX && previousBouncedBoard !== BoardPart.TopLeft) {
      bouncedBoard = previousBouncedBoard = BoardPart.TopLeft;
      const temp = puck.shiftX;
      puck.shiftX = -puck.shiftY;
      puck.shiftY = -temp;
    }
  } else {
    bouncedBoard = null;
  }
}

function updatePlayerPosition(player: MovableSprite, target: MovableGraphics): void {
  player.x += player.shiftX;
  player.y += player.shiftY;

  const { left, right, top, bottom } = target.getBounds();
  const targetX = (left + right) / 2;
  const targetY = (top + bottom) / 2;
  const shift = player.speed / SPEED_TO_SHIFT_RATIO;
  const angle = atan2(targetY - player.y, targetX - player.x);
  player.shiftX = shift * cos(angle);
  player.shiftY = shift * sin(angle);
}
