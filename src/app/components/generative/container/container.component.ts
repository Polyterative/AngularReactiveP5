import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import p5 from 'p5';
import { BehaviorSubject, bufferCount, interval, merge, startWith, Subject, switchMap, take } from 'rxjs';
import { share, takeUntil, withLatestFrom } from 'rxjs/operators';
import { Models } from './models';
import { Utils } from './utils';
import CoordinateGridPoint = Models.CoordinateGridPoint;
import Generators = Models.Generators;
import MyGenerator = Models.MyGenerator;
import buildItem = Utils.buildItem;
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
  private unit = 16;

  private generators$ = new BehaviorSubject<Generators[]>([]);

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
      .subscribe(([time, generators]) => {
        // clear canvas
        p.background(0);

        let myGenerators = this.generators$.value;

        let items: Models.ItemGenerator[] = myGenerators
          .filter(x => x.kind === 'item' && x.coordinates !== undefined)
          .map(x => x as Models.ItemGenerator);

        //draw dots between items
        items.forEach(
          (item, index) => {
            items.forEach(
              (item2, index2) => {
                if (index !== index2) {
                  // alpha inverse proportional to distance
                  let bx: number = item2.coordinates.current.x.value;
                  let by: number = item2.coordinates.current.y.value;
                  let ax: number = item.coordinates.current.x.value;
                  let ay: number = item.coordinates.current.y.value;

                  let distance: number = p.dist(ax, ay, bx, by);
                  // alpha proportional to distance (0-100) with further distance = less alpha
                  let alpha: number = p.map(distance, 0, p.width, 0, 100);

                  // round alpha to nearest integer
                  alpha = Math.round(alpha);

                  // half alpha
                  alpha = alpha / 2;

                  // flicker alpha slightly if remaining time is less than 20%
                  let life = item.lifetimeManager.remainingLifetimePercentage$.value;
                  if (life < 10 || life > 90) {
                    alpha = p.random(0, alpha);
                  }
                  // alpha = alpha + p.random(-10, 10);

                  p.stroke(255, alpha);
                  // write distance between items
                  p.line(
                    ax, ay, bx,
                    by
                  );
                  p.textSize(8);
                  p.text(Math.round(distance), (ax + bx) / 2,
                    (ay + by) / 2
                  );

                  p.strokeWeight(1);
                  p.line(
                    ax, ay, bx,
                    by
                  );
                }
              }
            );
          }
        );

        generators.forEach(generator => {
          generator.draw(p, time);
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
      this.coordinatesGrid$.next(this.buildCoordinatesGrid(p));
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
        bufferCount(secondsToFrames(6, this.fps)),
        startWith('init'),
        switchMap(() => this.interval$
          .pipe(
            bufferCount(secondsToFrames(0.1, this.fps)),
            take(8)
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        let myGenerators = this.generators$.value;

        let item = buildItem(
          this.coordinatesGrid$.value, this.unit, this.currentTime$, this.fps, this.destroy$,
          myGenerators
            .filter(x => x.kind === 'item' && x.coordinates !== undefined)
            .map(x => x as Models.ItemGenerator)
        );

        this.generators$.next([
          ...myGenerators,
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

  private buildCoordinatesGrid(p: p5): CoordinateGridPoint[] {
    return createCoordinatesGrid(12, 8, getOrigin(p), this.unit);
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

    // this.drawMouseToOrigin(p);

  }

  private drawMouseToOrigin(p: p5): void {
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
  }

  ngOnInit(): void {
  }

}

function lifeToColor(arg0: number): string {
  const life: number = arg0;
  const lifeColor: number = Math.floor(life * 255);
  return `rgb(${ lifeColor }, ${ lifeColor }, ${ lifeColor })`;
}
