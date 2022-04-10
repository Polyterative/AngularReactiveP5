import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { GenerativeModule } from './components/generative/generative.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    RouterModule,
    GenerativeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
