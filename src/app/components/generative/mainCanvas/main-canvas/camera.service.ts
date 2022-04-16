import { Injectable } from '@angular/core';
import { BehaviorSubject, merge } from 'rxjs';
import { PerspectiveCamera, Vector3 } from 'three';
import { ConstantsService } from './constants.service';

@Injectable()
export class CameraService {

  public options$: BehaviorSubject<PerspectiveCamera> = new BehaviorSubject<PerspectiveCamera>(
    new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000)
  );

  constructor(
    private constantsService: ConstantsService
  ) {
    let camera = this.options$.value;
    camera.position.add(new Vector3(0, 5, 0));
    this.options$.next(camera);

    merge(
      this.constantsService.tick$
    )
      .pipe(

      )
      .subscribe(() => {
        this.options$.value.position.add(new Vector3(0, 0, -(1 / 50)));
      });

  }

  // focalLenghtToFov(focalLength: number) {
  //   // consider 35mm film camera as a reference with no regard to the window size
  //   let fov: number = 2 * Math.atan(window.innerHeight / (2 * focalLength)) * 180 / Math.PI;
  //   console.log(fov);
  //   return fov;
  // }

}
