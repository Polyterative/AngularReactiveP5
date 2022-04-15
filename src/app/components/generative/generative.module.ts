import { NgtColorPipeModule, NgtCoreModule, NgtFogPipeModule, NgtObjectInputsControllerModule } from '@angular-three/core';
import { NgtBoxGeometryModule, NgtConeGeometryModule } from '@angular-three/core/geometries';
import { NgtBoxHelperModule, NgtGridHelperModule } from '@angular-three/core/helpers';
import { NgtAmbientLightModule, NgtDirectionalLightModule, NgtHemisphereLightModule } from '@angular-three/core/lights';
import {
  NgtLineBasicMaterialModule, NgtMeshBasicMaterialModule, NgtMeshPhongMaterialModule, NgtMeshPhysicalMaterialModule,
  NgtMeshStandardMaterialModule
} from '@angular-three/core/materials';
import { NgtMeshModule } from '@angular-three/core/meshes';
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
    ThreeObjectsModule,
    SimpleCubeComponentModule
  ]
})
export class GenerativeModule {}
