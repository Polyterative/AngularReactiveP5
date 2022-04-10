import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import p5 from 'p5';
import { BehaviorSubject, bufferCount, interval, merge, startWith, Subject, switchMap, take } from 'rxjs';
import { share, takeUntil, withLatestFrom } from 'rxjs/operators';
import { Models } from './models';
import { Utils } from './utils';
import CoordinateGridPoint = Models.CoordinateGridPoint;
import MyGenerator = Models.MyGenerator;
import buildCircleItem = Utils.buildCircleItem;
import createCoordinatesGrid = Utils.createCoordinatesGrid;
import dotGridAlgo = Utils.dotGridAlgo;
import getOrigin = Utils.getOrigin;
import secondsToFrames = Utils.secondsToFrames;

@Component({
  selector: 'app-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContainerComponent implements OnInit, AfterViewInit, OnDestroy {
  fps = 144;

  // rxjs clock
  interval$ = interval(1000 / this.fps)
    .pipe(share());

  private origin = {
    x: 0,
    y: 0
  };
  private unit = 8;

  private generators$ = new BehaviorSubject<MyGenerator[]>([]);

  private removeGenerator$ = new Subject<MyGenerator>();

  private currentTime$ = new BehaviorSubject<number>(0);

  private destroy$ = new Subject<void>();

  private coordinatesGrid$ = new BehaviorSubject<CoordinateGridPoint[]>([]);

  private events = {
    windowResized$: new Subject<{ width: number, height: number }>(),
    pInitialized$: new Subject<{ p: p5 }>()
  }

  constructor() {

  }

  ngAfterViewInit() {

    this.events.pInitialized$
      .pipe(
        switchMap(x => this.interval$),
        takeUntil(this.destroy$)
      )
      .subscribe(value => this.currentTime$.next(value));

    this.events.pInitialized$
      .pipe(
        switchMap(() => this.currentTime$),
        // filter(x => p.setupDone),
        withLatestFrom(this.generators$),
        // delay(250)
        takeUntil(this.destroy$)
      )
      .subscribe(([x, generators]) => {
        // clear canvas
        p.background(0);

        generators.forEach(generator => {
          generator.draw(p, this.getCurrentTime());
        });

        this.additionalRenderSteps(p);

      });

    let p: p5;

    p = new p5((p: p5) => {
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight)
          .parent('canvas');
        p.noLoop();
        p.frameRate(this.fps);

        this.events.pInitialized$.next({ p });
      };
    });

    // resize canvas on window resize
    p.windowResized = () => this.events.windowResized$.next({ width: p.windowWidth, height: p.windowHeight });

    // kill generators on window resize
    this.events.windowResized$
      .pipe(
        withLatestFrom(this.generators$),
        takeUntil(this.destroy$)
      )
      .subscribe(([_, generators]) => generators.forEach(generator => generator.lifetimeManager.kill$.next()));

    // resize canvas on window resize
    this.events.windowResized$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(({ width, height }) => p.resizeCanvas(width, height));

    // update coordinates grid on window resize and init
    merge(
      this.events.pInitialized$,
      this.events.windowResized$
    )
      .pipe(
        startWith('init'),
        takeUntil(this.destroy$)
      ).subscribe(() => {
      this.coordinatesGrid$.next(this.getCoordinatesGrid(p));
    });

    this.destroy$
      .pipe(take(1))
      .subscribe(() => {
        p.remove();
      });

    this.generators$.next([
      dotGridAlgo(this.coordinatesGrid$, this.unit, this.currentTime$, this.fps, this.destroy$)
    ]);

    // add generator every x seconds
    this.addGenerators();

    this.removeGenerator$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(generator => this.generators$.next(this.generators$.value.filter(g => g.id !== generator.id)));
  }

  private addGenerators(): void {
    this.interval$
      .pipe(
        bufferCount(secondsToFrames(0.01, this.fps)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        let item = buildCircleItem(this.coordinatesGrid$.value, this.unit, this.currentTime$, this.fps, this.destroy$);

        this.generators$.next([
          ...this.generators$.value,
          item
        ]);

        item.lifetimeManager.kill$.pipe(
          takeUntil(this.destroy$),
          take(1)
        ).subscribe(() => {
          this.removeGenerator$.next(item);
        });
      });
  }

  private getCurrentTime(): number {
    return this.currentTime$.value;
  }

  private getCoordinatesGrid(p: p5): CoordinateGridPoint[] {
    return createCoordinatesGrid(8, 8, getOrigin(p), this.unit);
  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();
  }

  private additionalRenderSteps(p: p5): void {
    p.textFont('monospace');
    p.stroke(255, 255 / 2);
    p.textSize(12);

    // write "frame:" and "fps:" and "windowSize:" in p canvas in the top left corner one below each other with a gap of 2 unit pixels
    p.text(`frame: ${ this.getCurrentTime() }`, this.origin.x, this.origin.y + 2 * this.unit);
    p.text(`fps: ${ this.fps }`, this.origin.x, this.origin.y + 4 * this.unit);
    p.text(`windowSize: ${ window.innerWidth }x${ window.innerHeight }`, this.origin.x, this.origin.y + 6 * this.unit);

    // draw mouse position coordinates following the mouse
    p.textSize(16);

    let textAbovePointer = `${ p.mouseX }, ${ p.mouseY }`;
    // add distance to center rounded to 2 decimals
    textAbovePointer += `, ${ Math.round(
      p.dist(p.mouseX, p.mouseY, p.width / 2, p.height / 2) * 100) / 100 }`;

    // write textAbovePointer in canvas in semi-transparent white
    p.text(textAbovePointer, p.mouseX, p.mouseY - this.unit);

    // draw line between mouse position and center of canvas
    p.line(p.mouseX, p.mouseY, p.width / 2, p.height / 2);

    // draw grid coordinates  outer border
    // this.p.stroke(255);
    // this.p.line(this.origin.x, this.origin.y, this.origin.x + this.p.width, this.origin.y);
    // this.p.line(this.origin.x, this.origin.y, this.origin.x, this.origin.y + this.p.height);
    // this.p.line(this.origin.x + this.p.width, this.origin.y, this.origin.x + this.p.width, this.origin.y + this.p.height);
    // this.p.line(this.origin.x, this.origin.y + this.p.height, this.origin.x + this.p.width, this.origin.y + this.p.height);

  }

  ngOnInit(): void {
  }

}

function lifeToColor(arg0: number): string {
  const life: number = arg0;
  const lifeColor: number = Math.floor(life * 255);
  return `rgb(${ lifeColor }, ${ lifeColor }, ${ lifeColor })`;
}
