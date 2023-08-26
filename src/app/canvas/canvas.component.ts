import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { BoardPart, Movable, Puck } from '../../types';
import { PI, PUCK_CLEANUP_RADIUS_PX, PUCK_MAX_SPEED, PUCK_SPEED_DECREASE_RATIO, PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE, PUCK_BOUNCE_MIN_SPEED_DECREASE, RINK_WIDTH_PX, RINK_LENGTH_PX, drawPuck, getBounceBoardPart, calculatePuckShift, getDeflectedAngle } from 'src/utils/render';

let ctx: CanvasRenderingContext2D;
let x: number, y: number, speed: number, angle: number;

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
    x: new FormControl<number>(RINK_LENGTH_PX / 2, {nonNullable: true}),
    y: new FormControl<number>(RINK_WIDTH_PX / 2, { nonNullable: true }),
    speed: new FormControl<number>(PUCK_MAX_SPEED / 2, { nonNullable: true }),
    angle: new FormControl<number>(135, { nonNullable: true }),
  });

  readonly puck$ = new Subject<Partial<Puck>>();

  ngOnInit(): void {
    this.puck$.subscribe(puck => {
      x = puck.x!;
      y = puck.y!;
      speed = puck.speed!;
      angle = puck.angle! * PI / 180;
    });
  }

  ngAfterViewInit(): void {
    ctx = this.canvas.nativeElement.getContext('2d');
    requestAnimationFrame(render);
  }
}

function render() {
  const boardBounce = getBounceBoardPart({ x, y, angle, speed });

  if (boardBounce !== null) {
    speed = Math.max(speed - Math.max(speed / 2, PUCK_BOUNCE_MIN_SPEED_DECREASE), 0);
    angle = getDeflectedAngle(boardBounce, angle);
  } else if (speed < PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE) {
    speed = Math.max(speed - PUCK_SPEED_DECREASE_RATIO, 0);
  }

  const [puckIncX, puckIncY] = calculatePuckShift(speed, angle);
  x += puckIncX;
  y += puckIncY;

  ctx.clearRect(-PUCK_CLEANUP_RADIUS_PX, -PUCK_CLEANUP_RADIUS_PX - 1, 2 * PUCK_CLEANUP_RADIUS_PX, 2 * PUCK_CLEANUP_RADIUS_PX);
  ctx.setTransform(1, 0, 0, 1, x, y);
  drawPuck(ctx);

  requestAnimationFrame(render);
}