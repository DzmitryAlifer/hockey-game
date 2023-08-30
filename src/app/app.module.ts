import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CanvasComponent } from './canvas/canvas.component';
import { ThreeDemoComponent } from './three-demo/three-demo.component';
import { PixiDemoComponent } from './pixi-demo/pixi-demo.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    CanvasComponent,
    PixiDemoComponent,
    ThreeDemoComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
