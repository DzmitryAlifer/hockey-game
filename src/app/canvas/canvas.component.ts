import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { Player, Puck } from '../../types';
import { PI, PUCK_MAX_SPEED, PUCK_SPEED_DECREASE_RATIO, PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE, PUCK_BOUNCE_MIN_SPEED_DECREASE, RINK_WIDTH_PX, RINK_LENGTH_PX, drawPuck, getBounceBoardPart, calculatePuckShift, getDeflectedAngle, drawPlayer } from 'src/utils/render';

let puck: Puck, player: Player, ctx: CanvasRenderingContext2D, jerseyImage: HTMLImageElement;

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

  readonly puckInput = new FormGroup({
    x: new FormControl<number>(RINK_LENGTH_PX / 2,  {nonNullable: true }),
    y: new FormControl<number>(RINK_WIDTH_PX / 2, { nonNullable: true }),
    speed: new FormControl<number>(PUCK_MAX_SPEED / 2, { nonNullable: true }),
    angle: new FormControl<number>(135, { nonNullable: true }),
  });

  readonly playerInput = new FormGroup({
    x: new FormControl<number>(RINK_LENGTH_PX / 2, { nonNullable: true }),
    y: new FormControl<number>(RINK_WIDTH_PX / 2, { nonNullable: true }),
    speed: new FormControl<number>(30, { nonNullable: true }),
    angle: new FormControl<number>(135, { nonNullable: true }),
    number: new FormControl<number>(88, { nonNullable: true }),
  });

  readonly puck$ = new Subject<any>();
  readonly player$ = new Subject<any>();

  ngOnInit(): void {
    this.puck$.subscribe(({ x, y, speed, angle }) => {
      puck = { 
        point: {x, y},
        speed,
        angle: angle! * PI / 180,
      } as Puck;
    });
    
    this.player$.subscribe(({ x, y, speed, angle, number }) => {
      player = { 
        point: { x, y },
        speed,
        angle: angle! * PI / 180,
        number,
       } as Player;
    });
  }

  ngAfterViewInit(): void {
    ctx = this.canvas.nativeElement.getContext('2d');
    jerseyImage = document.getElementById('jersey') as HTMLImageElement;
    requestAnimationFrame(render);
  }
}

function render() {
  ctx.clearRect(0, 0, RINK_LENGTH_PX, RINK_WIDTH_PX);

  if (player) {
    drawMovingPlayer(player);
  }

  if (puck) {
    drawMovingPuck(puck);
  }

  requestAnimationFrame(render);
}

function drawMovingPuck(puck: Puck): void {
  const boardBounce = getBounceBoardPart(puck);

  if (boardBounce !== null) {
    puck.speed = Math.max(puck.speed! - Math.max(puck.speed! / 2, PUCK_BOUNCE_MIN_SPEED_DECREASE), 0);
    puck.angle = getDeflectedAngle(boardBounce, puck.angle!);
  } else if (puck.speed! < PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE) {
    puck.speed = Math.max(puck.speed! - PUCK_SPEED_DECREASE_RATIO, 0);
  }

  const [puckIncX, puckIncY] = calculatePuckShift(puck.speed!, puck.angle!);
  puck.point.x += puckIncX;
  puck.point.y += puckIncY;

  ctx.setTransform(1, 0, 0, 1, puck.point.x, puck.point.y);
  drawPuck(ctx);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawMovingPlayer(player: Player): void {
  player.point.x--;
  player.point.y++;

  drawPlayer(ctx, jerseyImage, player);
}