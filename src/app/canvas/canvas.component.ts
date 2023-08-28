import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { Player, Puck } from '../../types';
import { PI, PUCK_SPEED_DECREASE_RATIO, PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE, PUCK_BOUNCE_MIN_SPEED_DECREASE, RINK_WIDTH_PX, RINK_LENGTH_PX, drawPuck, getBounceBoardPart, calculateShift, getDeflectedAngle, calculatePlayerShift, PLAYER_SIZE_PX } from 'src/utils/render';

let puck: Puck, player1: Player, player2: Player, ctx: CanvasRenderingContext2D, player1Image: HTMLImageElement, player2Image: HTMLImageElement;

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [MatButtonModule, MatInputModule, ReactiveFormsModule],
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
    speed: new FormControl<number>(50, { nonNullable: true }),
    angle: new FormControl<number>(135, { nonNullable: true }),
  });

  readonly player1Input = new FormGroup({
    x: new FormControl<number>(RINK_LENGTH_PX / 2 - 50, { nonNullable: true }),
    y: new FormControl<number>(RINK_WIDTH_PX / 2, { nonNullable: true }),
    speed: new FormControl<number>(30, { nonNullable: true }),
    destinationX: new FormControl<number>(343, { nonNullable: true }),
    destinationY: new FormControl<number>(300, { nonNullable: true }),
    color: new FormControl<string>('#0c0', { nonNullable: true }),
    number: new FormControl<number>(11, { nonNullable: true }),
  });

  readonly player2Input = new FormGroup({
    x: new FormControl<number>(RINK_LENGTH_PX / 2 + 50, { nonNullable: true }),
    y: new FormControl<number>(RINK_WIDTH_PX / 2, { nonNullable: true }),
    speed: new FormControl<number>(20, { nonNullable: true }),
    destinationX: new FormControl<number>(343, { nonNullable: true }),
    destinationY: new FormControl<number>(300, { nonNullable: true }),
    color: new FormControl<string>('#00c', { nonNullable: true }),
    number: new FormControl<number>(22, { nonNullable: true }),
  });

  readonly puck$ = new Subject<any>();
  readonly player1$ = new Subject<any>();
  readonly player2$ = new Subject<any>();

  ngOnInit(): void {
    this.puck$.subscribe(({ x, y, speed, angle }) => {
      puck = { 
        point: { x, y },
        speed,
        angle: angle! * PI / 180,
      } as Puck;
    });
    
    this.player1$.subscribe(({ x, y, speed, destinationX, destinationY, color, number }) => {
      player1 = { 
        point: { x, y },
        speed,
        destination: { x: destinationX, y: destinationY },
        color,
        number,
       } as Player;
    });

    this.player2$.subscribe(({ x, y, speed, destinationX, destinationY, color, number }) => {
      player2 = {
        point: { x, y },
        speed,
        destination: { x: destinationX, y: destinationY },
        color,
        number,
      } as Player;
    });
  }

  ngAfterViewInit(): void {
    ctx = this.canvas.nativeElement.getContext('2d');
    player1Image = document.getElementById('jersey-red') as HTMLImageElement;
    player2Image = document.getElementById('jersey-blue') as HTMLImageElement;
    requestAnimationFrame(render);
  }
}

function render() {
  ctx.clearRect(0, 0, RINK_LENGTH_PX, RINK_WIDTH_PX);

  if (player1 && player2) {
    drawMovingPlayers([player1, player2], [player1Image, player2Image]);
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

  const puckShift = calculateShift(puck.speed!, puck.angle!);
  puck.point.x += puckShift.x;
  puck.point.y += puckShift.y;

  ctx.setTransform(1, 0, 0, 1, puck.point.x, puck.point.y);
  drawPuck(ctx);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawMovingPlayers(players: Player[], images: HTMLImageElement[]): void {
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const playerShift = calculatePlayerShift(player);
    player.point.x += playerShift.x;
    player.point.y += playerShift.y;

    // Draw colored jersey
    ctx.drawImage(images[i]!, player.point.x - PLAYER_SIZE_PX / 2, player.point.y - PLAYER_SIZE_PX / 2, PLAYER_SIZE_PX, PLAYER_SIZE_PX);
    ctx.globalCompositeOperation = 'source-over';

    // Draw number
    ctx.fillStyle = 'white';
    ctx.font = 'bold ' + PLAYER_SIZE_PX / 3.5 + 'pt Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(player.number), player.point.x, player.point.y);

    player.destination = puck.point;
  }
}