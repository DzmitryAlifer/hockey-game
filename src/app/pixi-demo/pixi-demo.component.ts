import { AfterViewInit, Component, ElementRef, NgZone } from '@angular/core';
import * as PIXI from 'pixi.js';
import { Application } from '@pixi/app';
import { Sprite } from '@pixi/sprite';

@Component({
  selector: 'app-pixi-demo',
  standalone: true,
  template: '<h1>game</h1>',
})
export class PixiDemoComponent implements AfterViewInit {
  public boxSize: number = 3;
  constructor(public elRef: ElementRef, private zone: NgZone) {
    // The application will create a canvas element for you that you
    // can then insert into the DOM.
    console.log(PIXI.VERSION);
  }

  public ngAfterViewInit(): void {
    this.zone.runOutsideAngular(
      (): void => {
        const app: Application = new Application({
          //view: this.myCanvas.nativeElement,
        });
        this.elRef.nativeElement.appendChild(app.view);
        console.log('Plugins', app.renderer.plugins);
        const sprite: Sprite = Sprite.from('https://avatars.githubusercontent.com/in/2740?s=64&v=4');
        app.stage.addChild(sprite);
        app.render();
      }
    );
  }
}
