import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { PI, PUCK_CLEANUP_RADIUS, PUCK_MAX_SPEED, PUCK_SPEED_DECREASE_RATIO, PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE, PUCK_BOUNCE_MIN_SPEED_DOWN, RINK_WIDTH, RINK_LENGTH, drawPuck, getBoardBounce, calculatePuckShift, getRandomInRange } from 'src/utils/render';

let ctx: CanvasRenderingContext2D;
let puckX = RINK_LENGTH / 2;
let puckY = RINK_WIDTH / 2;
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

  ngAfterViewInit() {
    ctx = this.canvas.nativeElement.getContext('2d');
    requestAnimationFrame(render);
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
  puckX += puckIncX;
  puckY += puckIncY;

  ctx.clearRect(-PUCK_CLEANUP_RADIUS, -PUCK_CLEANUP_RADIUS - 1, 2 * PUCK_CLEANUP_RADIUS, 2 * PUCK_CLEANUP_RADIUS);
  ctx.setTransform(1, 0, 0, 1, puckX, puckY);
  drawPuck(ctx);

  requestAnimationFrame(render);
}