import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RINK_WIDTH, RINK_LENGTH, drawPuck, isOutsideField } from 'src/utils/render';

const RINK_IMG = new Image();
RINK_IMG.src = 'assets/images/rink.svg';

let ctx: CanvasRenderingContext2D;
let puckX = RINK_LENGTH / 2;
let puckY = RINK_WIDTH / 2;

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
  if (isOutsideField(puckX, puckY)) return;

  const puckIncX = -8;
  const puckIncY = -4;
  ctx.drawImage(RINK_IMG, -puckX - 4, -puckY - 4, RINK_LENGTH - 4, RINK_WIDTH);
  ctx.setTransform(1, 0, 0, 1, puckX, puckY);
  puckX += puckIncX;
  puckY += puckIncY;
  drawPuck(ctx);

  requestAnimationFrame(render);
}