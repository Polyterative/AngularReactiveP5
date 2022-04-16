import { NgtColorPipeModule, NgtCoreModule, NgtFogPipeModule, NgtObjectInputsControllerModule } from '@angular-three/core';
import { NgtBoxGeometryModule, NgtCircleGeometryModule, NgtConeGeometryModule } from '@angular-three/core/geometries';
import { NgtBoxHelperModule, NgtGridHelperModule } from '@angular-three/core/helpers';
import { NgtAmbientLightModule, NgtDirectionalLightModule, NgtHemisphereLightModule } from '@angular-three/core/lights';
import {
  NgtLineBasicMaterialModule, NgtLineDashedMaterialModule, NgtMeshBasicMaterialModule, NgtMeshPhongMaterialModule,
  NgtMeshPhysicalMaterialModule, NgtMeshStandardMaterialModule
} from '@angular-three/core/materials';
import { NgtMeshModule } from '@angular-three/core/meshes';
import { NgtStatsModule } from '@angular-three/core/stats';
import { NgtSobaOrbitControlsModule } from '@angular-three/soba/controls';
import { NgtSobaStarsModule } from '@angular-three/soba/staging';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CanvasContentComponent } from './canvas-content/canvas-content.component';
import { GeneratedObjectsComponent } from './canvas-content/generated-objects/generated-objects.component';
import { MainCanvasComponent } from './main-canvas.component';

@NgModule({
  declarations: [
    MainCanvasComponent,
    CanvasContentComponent,
    GeneratedObjectsComponent
  ],
  exports: [
    MainCanvasComponent,
    CanvasContentComponent,
    GeneratedObjectsComponent
  ],
  imports: [
    CommonModule,
//
    NgtCoreModule,
    NgtStatsModule,
    NgtColorPipeModule,
    NgtFogPipeModule,
//
    NgtMeshModule,
//
    NgtObjectInputsControllerModule,
//
    NgtBoxGeometryModule,
    NgtConeGeometryModule,
//
    NgtAmbientLightModule,
    NgtHemisphereLightModule,
    NgtDirectionalLightModule,
//
    NgtBoxHelperModule,
    NgtGridHelperModule,
//
    NgtMeshBasicMaterialModule,
    NgtMeshPhongMaterialModule,
    NgtLineBasicMaterialModule,
    NgtMeshPhysicalMaterialModule,
    NgtMeshStandardMaterialModule,
//
    NgtSobaStarsModule,
//
    NgtSobaOrbitControlsModule,
//
    NgtCircleGeometryModule,
    NgtLineDashedMaterialModule
  ]
})
export class MainCanvasModule {}
