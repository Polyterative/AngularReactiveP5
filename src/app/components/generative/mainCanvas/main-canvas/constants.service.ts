import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConstantsService {

  public readonly fps: number = 60;
  private tickCount$ = new BehaviorSubject<number>(0);

  public tick$ = this.tickCount$.asObservable();

  constructor() {
    interval(1000 / this.fps)
      .subscribe(() => {
        this.tickCount$.next(this.tickCount$.value + 1);
      });
  }
}
