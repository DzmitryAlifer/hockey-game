import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { BoardPart, PuckShot, PI, PUCK_CLEANUP_RADIUS_PX, PUCK_MAX_SPEED, PUCK_SPEED_DECREASE_RATIO, PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE, PUCK_BOUNCE_MIN_SPEED_DECREASE, RINK_WIDTH_PX, RINK_LENGTH_PX, drawPuck, getBoardBounce, calculatePuckShift } from 'src/utils/render';

let ctx: CanvasRenderingContext2D;
let puckX: number, puckY: number, speed: number, angle: number, angle2: number;

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements OnInit, AfterViewInit {
  @ViewChild('game') canvas!: ElementRef;

  readonly RINK_WIDTH_PX = RINK_WIDTH_PX;
  readonly RINK_LENGTH_PX = RINK_LENGTH_PX;

  readonly formGroup = new FormGroup({
    puckX: new FormControl<number>(RINK_LENGTH_PX / 2, {nonNullable: true}),
    puckY: new FormControl<number>(RINK_WIDTH_PX / 2, { nonNullable: true }),
    speed: new FormControl<number>(PUCK_MAX_SPEED / 2, { nonNullable: true }),
    angle: new FormControl<number>(135, { nonNullable: true }),
  });

  readonly puckShot$ = new Subject<Partial<PuckShot>>();

  ngOnInit(): void {
    this.puckShot$.subscribe(puckShot => {
      puckX = puckShot.puckX!;
      puckY = puckShot.puckY!;
      speed = puckShot.speed!;
      angle = puckShot.angle! * PI / 180;
    });
  }

  ngAfterViewInit(): void {
    ctx = this.canvas.nativeElement.getContext('2d');
    requestAnimationFrame(render);
  }
}

function render() {
  const boardBounce = getBoardBounce({ puckX, puckY, angle, speed });

  if (boardBounce !== null) {
    speed = Math.max(speed - Math.max(speed / 2, PUCK_BOUNCE_MIN_SPEED_DECREASE), 0);
    angle = [BoardPart.Top, BoardPart.Bottom].includes(boardBounce) ? 2 * PI - angle : PI - angle;
  } else if (speed < PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE) {
    speed = Math.max(speed - PUCK_SPEED_DECREASE_RATIO, 0);
  }

  const [puckIncX, puckIncY] = calculatePuckShift(speed, angle);
  puckX += puckIncX;
  puckY += puckIncY;

  ctx.clearRect(-PUCK_CLEANUP_RADIUS_PX, -PUCK_CLEANUP_RADIUS_PX - 1, 2 * PUCK_CLEANUP_RADIUS_PX, 2 * PUCK_CLEANUP_RADIUS_PX);
  ctx.setTransform(1, 0, 0, 1, puckX, puckY);
  drawPuck(ctx);

  requestAnimationFrame(render);
}