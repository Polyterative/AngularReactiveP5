import { BehaviorSubject, merge, Observable, Subject, takeUntil } from 'rxjs';

export class LifetimeManager {

  remainingLifetime$: BehaviorSubject<number> = new BehaviorSubject(0);
  remainingLifetimePercentage$: BehaviorSubject<number> = new BehaviorSubject(0);
  private readonly desiredLifeTime;
  kill$ = new Subject<void>();

  constructor(
    currentTime$: BehaviorSubject<number>,
    birthTime: number,
    desiredLifeTime: number,
    destroy$: Observable<void>
  ) {

    this.desiredLifeTime = desiredLifeTime;

    let destroyers$ = merge(destroy$, this.kill$);

    currentTime$
      .pipe(
        takeUntil(destroyers$)
      )
      .subscribe(currentTime => {
        const remainingLifeTime = this.desiredLifeTime - (currentTime - birthTime);
        this.remainingLifetime$.next(remainingLifeTime);
      });

    destroy$.pipe(
      takeUntil(destroyers$)
    ).subscribe(() => {
      this.kill$.next();
    });

    this.remainingLifetime$
      .pipe(
        takeUntil(destroyers$)
      )
      .subscribe(remainingLifeTime => {
        if (remainingLifeTime <= 0) {
          this.kill$.next();
        }
      });

    this.remainingLifetime$.subscribe(remainingLifeTime => {
      this.remainingLifetimePercentage$.next((remainingLifeTime / this.desiredLifeTime) * 100);
    });

  }

  public getRemainingLifetime(): number {
    return this.remainingLifetime$.getValue();
  }

  public getRemainingLifetimePercentage(): number {
    return this.remainingLifetime$.getValue() / this.desiredLifeTime * 100;
  }

}
