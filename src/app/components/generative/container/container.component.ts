import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import p5 from 'p5';
import { BehaviorSubject, bufferCount, from, interval, merge, startWith, Subject, switchMap, take } from 'rxjs';
import { map, share, takeUntil, withLatestFrom } from 'rxjs/operators';
import { WebMidi } from 'webmidi';
import { PolyCanvasRecorder } from './CanvasRecorder';
import { Models } from './models';
import { Utils } from './utils';
import Coordinates = Models.Coordinates;
import DrawFunction = Models.DrawFunction;
import buildFlicker = Utils.buildFlicker;
import buildItem = Utils.buildSlowMover;
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
  fps = 60;

  // rxjs clock
  interval$ = interval(1000 / this.fps)
    .pipe(share());

  private origin = {
    x: 0,
    y: 0
  };
  private unit = 16;

  private generators$ = new BehaviorSubject<Models.PiGenerator[]>([]);

  private addGenerators$ = new Subject<Models.PiGenerator[]>();

  private removeGenerator$ = new Subject<Models.PiGenerator>();

  private currentTime$ = new BehaviorSubject<number>(0);

  private destroy$ = new Subject<void>();

  private coordinatesGrid$ = new BehaviorSubject<Models.CoordinateGridPoint[]>([]);

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

        let items: Models.ItemGenerator[] = generators
          .filter(x => x.kind === 'item')
          .map(x => x as Models.ItemGenerator);

        this.drawLinesBetweenItems(p, generators, items);

        if (items.length === 3) { this.drawShapeBetweenItems(p, items);}

        this.renderGenerators(p, time, generators);

        this.additionalRenderSteps(p, window, this.origin, this.getCurrentTime());

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
    ).subscribe(generator => {
      let generators: Models.PiGenerator[] = this.generators$.value;
      // remove generator from array dynamic programming style so it's faster
      let index = generators.findIndex(x => x.id === generator.id);
      if (index > -1) {
        generators.splice(index, 1);
      }
      this.generators$.next(generators);
    });

    this.events.pInitialized$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {

      let canvas: HTMLCanvasElement;
      // get canvas element from html with id 'canvas'
      canvas = document.getElementById('defaultCanvas0') as HTMLCanvasElement;

      console.log(canvas);
      let canvasRecorder = new PolyCanvasRecorder(canvas);

      canvasRecorder.start();
    });
  }

  private renderGenerators(p: p5, time: number, generators: Models.PiGenerator[]): void {
    // find the highest layer index
    const highestLayerIndex = generators.reduce((acc, x) => Math.max(acc, x.drawLayers.length), 0);

    // draw all layers
    for (let i = 0; i < highestLayerIndex; i++) {
      let drawFunctions: (DrawFunction | undefined)[] = generators.map(x => x.drawLayers[i]);
      let cleanFunctions: DrawFunction[] = drawFunctions.filter(x => x !== undefined) as DrawFunction[];
      //draw
      cleanFunctions.forEach(x => x(p, time));
    }
  }

  private drawShapeBetweenItems(p: p5, items: Models.ItemGenerator[]): void {
    // fill shape between items with a polygon between all the points
    let points = items.map(x => x.movementManager.getCurrentCoordinates())

    // draw polygon between all the points

    //flicker alpharandomly when items are close to dying
    let alpha = 255 / 20;
    let lifeInPerc = items[0].lifetimeManager.getRemainingLifetimePercentage();
    if (lifeInPerc < 5 || lifeInPerc > 90) {
      alpha = p.map(p.random(0, 100 - lifeInPerc) - lifeInPerc, 0, 100, 0, 255 / 50);
    }
    p.fill(255, alpha);
    p.beginShape();
    points.forEach(point => {
      p.vertex(point.x, point.y);
    });
    p.endShape(p.CLOSE);
  }

  private drawLinesBetweenItems(p: p5, myGenerators: Models.PiGenerator[], items: Models.ItemGenerator[]): void {

    //draw dots between items
    items.forEach((item, index) => {
      let aCord = item.movementManager.getCurrentCoordinates();
      let ax: number = aCord.x;
      let ay: number = aCord.y;

      items.forEach((item2, index2) => {
          if (index !== index2) {
            // alpha inverse proportional to distance

            let bCord = item2.movementManager.getCurrentCoordinates();
            let bx: number = bCord.x;
            let by: number = bCord.y;

            let distance: number = p.dist(ax, ay, bx, by);
            // alpha proportional to distance (0-100) with further distance = less alpha
            let alpha: number = p.map(distance, 0, p.width, 0, 100);

            // round alpha to nearest integer
            alpha = Math.round(alpha);

            // half alpha
            alpha = alpha / 2;

            // flicker alpha slightly
            let life = item.lifetimeManager.remainingLifetimePercentage$.value;
            if (life < 10 || life > 90) {
              alpha = p.random(0, alpha);
            }

            p.stroke(255, alpha);
            p.line(ax, ay, bx, by);

            p.stroke(255, 0);
            p.fill(255, alpha);

            p.textSize(8);
            // draw text in the middle of the line between items (not exactly in the middle) to make it easier to read the lines
            p.text(Math.round(distance), (ax + bx) / 2, (ay + by) / 2);

          }
          }
        );
      }
    );

  }

  private addGenerators(): void {
    let movers$ = this.interval$
      .pipe(
        bufferCount(secondsToFrames(0.1, this.fps)),
        take(3),
        withLatestFrom(this.generators$),
        map(([_, generators]) => generators),
        map((generators) => buildItem(
          this.coordinatesGrid$.value, this.unit, this.currentTime$, this.fps, this.destroy$,
          generators
            .filter(x => x.kind === 'item')
            .map(x => x as Models.ItemGenerator),
          3
        ))
      );

    let flickers$ = this.interval$
      .pipe(
        bufferCount(secondsToFrames(0.05, this.fps)),
        // bufferCount(secondsToFrames(0.01, this.fps)),
        take(this.fps * 2),
        withLatestFrom(this.generators$),
        map(([_, generators]) => generators),
        map((generators) => buildFlicker(
          this.coordinatesGrid$.value, this.unit, this.currentTime$, this.fps, this.destroy$
        ))
      );

    // this.setupMidiInterators();

    merge(
      this.interval$
        .pipe(
          bufferCount(secondsToFrames(4, this.fps)),
          startWith('init'),
          switchMap(() => merge(
              // movers$
              flickers$
            ).pipe(
              map(x => ([x]))
            )
          )
        ),
      this.addGenerators$
    )
      .pipe(
        withLatestFrom(this.generators$),
        takeUntil(this.destroy$)
      )
      .subscribe(([toAddItems, generators]) => {

        this.generators$.next([
          ...generators,
          ...toAddItems
        ]);

        //destroy toAddItems when killed
        toAddItems.forEach(x => x.lifetimeManager.addOnDeath(() => this.removeGenerator$.next(x)));
      });
  }

  private setupMidiInterators(): void {
    from(WebMidi.enable({}))
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // listen to midi input
        WebMidi.inputs.forEach(input => {
          // @ts-ignore
          input.addListener('noteon', 'all', (e) => {
            console.log(e);

            // let item = buildFlicker(
            //   this.coordinatesGrid$.value, this.unit, this.currentTime$, this.fps, this.destroy$
            // );
            // this.addGenerators$.next(
            //   item
            // )
            //
            // //destroy item when killed
            // item.lifetimeManager.addOnDeath(() => this.removeGenerator$.next(item));
          });
        });

        // listen to midi events
      });
  }

  private getCurrentTime(): number {
    return this.currentTime$.value;
  }

  private buildCoordinatesGrid(p: p5): Models.CoordinateGridPoint[] {
    return createCoordinatesGrid(12, 8, getOrigin(p), this.unit);
  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();
  }

  private additionalRenderSteps(p: p5, window: Window, origin: Coordinates, currentTime: number): void {
    Utils.setMonospacedText(p);

    let distance = 8;

    p.stroke(255, 255 / 2);
    p.textSize(16);

    // write "frame:" and "fps:" and "windowSize:" in p canvas in the top left corner one below each other with a gap of 2 distance pixels
    p.text(`frame: ${ currentTime }`, origin.x, origin.y + 2 * distance);
    p.text(`fps: ${ this.fps }`, origin.x, origin.y + 4 * distance);
    p.text(`windowSize: ${ window.innerWidth }x${ window.innerHeight }`, origin.x, origin.y + 6 * distance);

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
