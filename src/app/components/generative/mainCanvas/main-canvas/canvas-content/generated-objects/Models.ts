import { Vector3 } from 'three';

export namespace Models {

  // export interface Position {
  //   x: number;
  //   y: number;
  //   z: number;
  // }
  //
  // export interface Rotation {
  //   x: number;
  //   y: number;
  //   z: number;
  // }

  export interface PositionedObject {
    position: Vector3;
    rotation: Vector3;
  }

}
