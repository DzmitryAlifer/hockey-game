import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject, map, startWith, withLatestFrom } from 'rxjs';
import { PI, PUCK_CLEANUP_RADIUS, PUCK_MAX_SPEED, PUCK_SPEED_DECREASE_RATIO, PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE, PUCK_BOUNCE_MIN_SPEED_DOWN, RINK_WIDTH, RINK_LENGTH, drawPuck, getBoardBounce, calculatePuckShift, getRandomInRange } from 'src/utils/render';

interface PuckShot {
  puckX: number;
  puckY: number;
  speed: number;
  angle: number;
}

let ctx: CanvasRenderingContext2D;
let puckX: number, puckY: number, speed: number, angle: number;

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements OnInit, AfterViewInit {
  @ViewChild('game') canvas!: ElementRef;

  readonly RINK_WIDTH = RINK_WIDTH;
  readonly RINK_LENGTH = RINK_LENGTH;

  readonly formGroup = new FormGroup({
    puckX: new FormControl<number>(RINK_LENGTH / 2, {nonNullable: true}),
    puckY: new FormControl<number>(RINK_WIDTH / 2, { nonNullable: true }),
    speed: new FormControl<number>(PUCK_MAX_SPEED / 2, { nonNullable: true }),
    angle: new FormControl<number>(45, { nonNullable: true }),
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