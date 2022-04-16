import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';
import { Euler } from 'three';

@Injectable({
  providedIn: 'root'
})
export class ConstantsService {

  public readonly fps: number = 60;
  private tickCount$ = new BehaviorSubject<number>(0);

  public tick$ = this.tickCount$.asObservable();

  public readonly threeUtils = {
    degreesToEuler: (x: number, y: number, z: number) => {

      console.log(new Euler(
        x * Math.PI / 180,
        y * Math.PI / 180,
        z * Math.PI / 180
      ));
      // degrees to radians
      return new Euler(
        x * Math.PI / 180,
        y * Math.PI / 180,
        z * Math.PI / 180
      );
    }
  }

  public readonly threeConstants = {
    angles: {
      standard: new Euler(0, 0, 0),
      top: this.threeUtils.degreesToEuler(270, 0, 0)
    }
  }

  constructor() {
    interval(1000 / this.fps)
      .subscribe(() => {
        this.tickCount$.next(this.tickCount$.value + 1);
      });
  }
}
