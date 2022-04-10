import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PfiveContainerComponent } from './pfive-container/pfive-container.component';

@NgModule({
  declarations: [
    PfiveContainerComponent
  ],
  exports: [
    PfiveContainerComponent
  ],
  imports: [
    CommonModule
  ]
})
export class GenerativeModule {}
