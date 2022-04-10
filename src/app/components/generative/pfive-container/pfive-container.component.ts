import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import p5 from 'p5';
import { BehaviorSubject, bufferCount, interval, merge, startWith, Subject, switchMap, take } from 'rxjs';
import { share, takeUntil, withLatestFrom } from 'rxjs/operators';
import { GenerativeUtils } from './GenerativeUtils';
import buildCircleItem = GenerativeUtils.buildCircleItem;
import CoordinateGridPoint = GenerativeUtils.CoordinateGridPoint;
import MyGenerator = GenerativeUtils.MyGenerator;

@Component({
  selector: 'app-pfive-container',
  templateUrl: './pfive-container.component.html',
  styleUrls: ['./pfive-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PfiveContainerComponent implements OnInit, OnDestroy {
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

  private currentTime = 0;

  private destroy$ = new Subject<void>();

  private coordinatesGrid$ = new BehaviorSubject<CoordinateGridPoint[]>([]);

  private events = {
    windowResized$: new Subject<{ width: number, height: number }>(),
    pInitialize$: new Subject<{ p: p5 }>()
  }

  constructor() {

  }

  ngOnInit() {
    this.events.pInitialize$
      .pipe(
        switchMap(() => this.interval$),
        withLatestFrom(this.generators$),
        // delay(250)
        takeUntil(this.destroy$)
      )
      .subscribe(([x, generators]) => {
        this.currentTime = x;

        // remove dead generators
        generators = generators.filter(generator => this.currentTime - generator.deathTime < 0);

        // clear canvas
        p.background(0);

        generators.forEach(generator => {
          generator.draw(p, this.currentTime);
        });

        // this.additionalRenderSteps(p);

        this.generators$.next(generators);

      });

    let p: p5;

    p = new p5(p => {
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight)
          .parent('canvas');
        p.noLoop();
        p.frameRate(this.fps);
      };
    });

    this.events.pInitialize$.next({ p });

    // resize canvas on window resize
    p.windowResized = () => this.events.windowResized$.next({ width: p.windowWidth, height: p.windowHeight });

    this.events.windowResized$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(({ width, height }) => {
      p.resizeCanvas(width, height);
    });

    merge(
      this.events.pInitialize$,
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
      GenerativeUtils.dotGridAlgo(this.coordinatesGrid$, this.unit)
    ]);

    // add generator every x seconds
    this.interval$
      .pipe(
        bufferCount(this.secondsToFrames(0.1)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.generators$.next([
          ...this.generators$.value,
          buildCircleItem(this.secondsToFrames(1), this.currentTime, this.coordinatesGrid$.value, this.unit)
        ]);
      });
  }

  private getCoordinatesGrid(p: p5): GenerativeUtils.CoordinateGridPoint[] {
    return GenerativeUtils.createCoordinatesGrid(8, 8, this.getOrigin(p), this.unit);
  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();
  }

  private additionalRenderSteps(p: p5): void {
    p.stroke(255, 255 / 2);
    p.textSize(12);

    // change p font in a monospace font
    p.textFont('monospace');

    // write "frame:" and "fps:" and "windowSize:" in p canvas in the top left corner one below each other with a gap of 2 unit pixels
    p.text(`frame: ${ this.currentTime }`, this.origin.x, this.origin.y + 2 * this.unit);
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

  private getOrigin(p: p5): { x: number, y: number } {
    return {
      x: p.windowWidth / 2,
      y: p.windowHeight / 2
    };
  }

  private secondsToFrames(seconds: number): number {
    return Math.round(this.fps * seconds);
  }

}

function lifeToColor(arg0: number): string {
  const life: number = arg0;
  const lifeColor: number = Math.floor(life * 255);
  return `rgb(${ lifeColor }, ${ lifeColor }, ${ lifeColor })`;
}
