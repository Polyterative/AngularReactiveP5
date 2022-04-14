import { NgtColorPipeModule, NgtCoreModule, NgtFogPipeModule, NgtObjectInputsControllerModule } from '@angular-three/core';
import { NgtBoxGeometryModule, NgtConeGeometryModule } from '@angular-three/core/geometries';
import { NgtBoxHelperModule, NgtGridHelperModule } from '@angular-three/core/helpers';
import { NgtDirectionalLightModule, NgtHemisphereLightModule } from '@angular-three/core/lights';
import {
  NgtLineBasicMaterialModule, NgtMeshBasicMaterialModule, NgtMeshPhongMaterialModule, NgtMeshPhysicalMaterialModule,
  NgtMeshStandardMaterialModule
} from '@angular-three/core/materials';
import { NgtStatsModule } from '@angular-three/core/stats';
import { NgtSobaOrbitControlsModule } from '@angular-three/soba/controls';
import { NgtSobaStarsModule } from '@angular-three/soba/staging';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ContainerComponent } from './container/container.component';
import { SimpleCubeComponentModule } from './container/objects/three-objects/simpleCube';
import { ThreeObjectsModule } from './container/objects/three-objects/three-objects.module';

@NgModule({
  declarations: [
    ContainerComponent
  ],
  exports: [
    ContainerComponent
  ],
  imports: [
    CommonModule,
    NgtCoreModule,
    NgtObjectInputsControllerModule,
    NgtBoxGeometryModule,
    NgtMeshStandardMaterialModule,
    ThreeObjectsModule,
    NgtBoxHelperModule,
    NgtStatsModule,
    SimpleCubeComponentModule,
    NgtMeshPhongMaterialModule,
    NgtSobaStarsModule,
    NgtGridHelperModule,
    NgtColorPipeModule,
    NgtFogPipeModule,
    NgtHemisphereLightModule,
    NgtDirectionalLightModule,
    NgtSobaOrbitControlsModule,
    NgtConeGeometryModule,
    NgtMeshBasicMaterialModule,
    NgtLineBasicMaterialModule,
    NgtMeshPhysicalMaterialModule
  ]
})
export class GenerativeModule {}
