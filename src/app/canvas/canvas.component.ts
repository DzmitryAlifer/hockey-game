import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { interval, tap } from 'rxjs';
import { PI, PUCK_MAX_SPEED, PUCK_SPEED_DECREASE_RATIO, PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE, PUCK_BOUNCE_MIN_SPEED_DOWN, RINK_WIDTH, RINK_LENGTH, drawPuck, getBoardBounce, calculatePuckShift, getRandomInRange } from 'src/utils/render';

const RINK_IMG = new Image();
RINK_IMG.src = 'assets/images/rink.svg';

let ctx: CanvasRenderingContext2D;
let puckX = RINK_LENGTH / 2;
let puckY = RINK_WIDTH / 2;
let puckInfo = '';
let speed = getRandomInRange(20, PUCK_MAX_SPEED);
let angle = Math.random() * 2 * PI;

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('game') canvas!: ElementRef;

  readonly RINK_WIDTH = RINK_WIDTH;
  readonly RINK_LENGTH = RINK_LENGTH;

  private readonly puckInfo$ = interval(100).pipe(tap(number => {
    puckInfo = Math.round(speed) + ' kph';
  }));

  ngAfterViewInit() {
    ctx = this.canvas.nativeElement.getContext('2d');
    ctx.font = '12px Arial';
    requestAnimationFrame(render);
    this.puckInfo$.subscribe();
  }
}

function render() {
  const boardBounce = getBoardBounce(puckX, puckY);

  if (boardBounce) {
    speed = Math.max(speed - Math.max(speed / 2, PUCK_BOUNCE_MIN_SPEED_DOWN), 0);
    angle = boardBounce === 'x' ? -angle : PI - angle;
  } else if (speed < PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE) {
    speed = Math.max(speed - PUCK_SPEED_DECREASE_RATIO, 0);
  }

  const [puckIncX, puckIncY] = calculatePuckShift(speed, angle);

  ctx.drawImage(RINK_IMG, -puckX, -puckY, RINK_LENGTH, RINK_WIDTH);
  ctx.setTransform(1, 0, 0, 1, puckX, puckY);
  
  ctx.fillText(puckInfo, -20, -10);
  puckX += puckIncX;
  puckY += puckIncY;
  drawPuck(ctx);

  requestAnimationFrame(render);
}