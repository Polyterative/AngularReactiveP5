import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import p5 from 'p5';
import { BehaviorSubject, bufferCount, from, interval, merge, startWith, Subject, switchMap, take } from 'rxjs';
import { map, share, takeUntil } from 'rxjs/operators';
import { WebMidi } from 'webmidi';
import { DotGridGenerator } from '../RenderAlgos/DotGridAlgo';
import { RendererContainer } from '../RenderAlgos/RendererContainer';
import { Models } from './models';
import { Utils } from './utils';
import Coordinates = Models.Coordinates;
import DrawFunction = Models.DrawFunction;
import createCoordinatesGrid = Utils.createCoordinatesGrid;
import getOrigin = Utils.getOrigin;
import secondsToFrames = Utils.secondsToFrames;

export interface Constants {units: { distanceBetweenLayers: number };}

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

  private unit = 8;

  private generators: Models.ItemGenerator[] = [];
  private permanentRenderers: Models.PiGenerator[] = [];

  private addItemGenerators$ = new Subject<Models.ItemGenerator[]>();

  private removeGenerator$ = new Subject<Models.PiGenerator>();

  private currentTime$ = new BehaviorSubject<number>(0);

  private destroy$ = new Subject<void>();

  private constants: Constants = {
    units: {
      distanceBetweenLayers: this.unit * 4
    }
  }

  private coordinatesGrid$ = new BehaviorSubject<Models.CoordinateGridPoint[]>([]);

  private events = {
    windowResized$: new Subject<{ width: number, height: number }>(),
    pInitialized$: new Subject<{ p: p5 }>()
  }

  private rendererContainer: RendererContainer = new RendererContainer(this.currentTime$, this.constants);

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
        takeUntil(this.destroy$)
      )
      .subscribe(_ => {
        if (this.rendererContainer) {
          let algo: DotGridGenerator = this.rendererContainer.dotGridAlgo.gridDelimiter(
            this.coordinatesGrid$.value, this.destroy$);
          this.permanentRenderers.push(algo);
        }
      });

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    this.events.pInitialized$
      .pipe(
        switchMap(() => this.currentTime$),
        // filter(x => p.setupDone),
        // delay(250)
        // throttleTime(1000/24),
        takeUntil(this.destroy$)
      )
      .subscribe((time) => this.renderFrame(p, time));

    let p: p5;

    p = new p5((p: p5) => {
      let font: p5.Font;

      p.preload = () => {
        font = p.loadFont('assets/SpaceMono-Regular.ttf');
      };
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL).parent('canvas');
        // p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        p.noLoop();
        p.frameRate(this.fps);

        // apply font
        p.textFont(font);

        //
        // p.orbitControl();

        // this.defaultCamera(p)

        // p.ortho()
        // change p5 render depth

        this.rendererContainer = new RendererContainer(this.currentTime$, this.constants);
        this.events.pInitialized$.next({ p });
      };
    });

    // resize canvas on window resize
    p.windowResized = () => this.events.windowResized$.next({ width: p.windowWidth, height: p.windowHeight });

    // kill generators on window resize
    this.events.windowResized$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe((_) => this.generators.forEach(generator => generator.lifetimeManager.kill$.next()));

    // clear generators on window resize
    this.events.windowResized$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe((_) => {
        this.generators = [];
        this.permanentRenderers = [];
      });

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

    // add generator every x seconds
    this.addGenerators();

    this.removeGenerator$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(generator => {
      let generators: Models.PiGenerator[] = this.generators;

      // remove generator from array dynamic programming style so it's faster
      let index = generators.findIndex(x => x.id === generator.id);
      if (index > -1) {
        generators.splice(index, 1);
      }
    });

    this.events.pInitialized$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {

      let canvas: HTMLCanvasElement;
      // get canvas element from html with id 'canvas'
      canvas = document.getElementById('defaultCanvas0') as HTMLCanvasElement;

      // console.log(canvas);
      // let canvasRecorder = new PolyCanvasRecorder(canvas);

      // canvasRecorder.start();
    });
  }

  private renderFrame(p: p5, time: number): void {
    // clear webgl canvas

    p.background(0);
    p.clear(0, 0, 0, 0);

    // draw p5 frametime
    p.fill(255);
    p.textSize(32);

    // this.defaultCamera(p);
    this.moveCamera(time, p);

    this.drawLinesBetweenItems(p, this.generators);

    if (this.generators.length === 3) { this.drawShapeBetweenItems(p, this.generators);}

    this.renderGenerators(
      p, time, [
        ...this.generators
        // ...this.permanentRenderers
      ]);
    //
    this.additionalRenderSteps(p, window, getOrigin(p), this.getCurrentTime());
  }

  private moveCamera(time: number, p: p5): void {
    // rotate camera time function of sin
    const sin = Math.sin(time / this.fps / 5);

    // draw as text
    p.translate(0, 0, -128);
    p.text(`${ sin.toFixed(4) }`, 0, 0);
    p.translate(0, 0, 128);
    // p.camera(0, 0, (p.height / 2) / p.tan(3.14 / 6), 0, 0, 0, 0, 1, 0);
    let moved: number = (sin * p.height);
    let translationSpeed: number = 0.1;
    let lateralTranslate: number = moved * translationSpeed;

    // default camera position
    // p.camera(0, 0, (p.height / 2) / p.tan(3.14 / 6), 0, 0, 0, 0, 1, 0);

    let inclinationConstant: number = p.height / 2;
    let distance: number = 1.15;
    let inclination: number = inclinationConstant * distance;
    p.camera(lateralTranslate, inclination, inclination, lateralTranslate, 0, 0, 0, 1, 0);
  }

  private defaultCamera(p: p5): void {
    // default camera position a bit higher in z
    p.camera(0, 0, (p.height / 2) / p.tan(3.14 / 6) * 2, 0, 0, 0, 0, 1, 0);

    // change camera fov equivalent to 135mm zoom lens

    // move camera further in z
  }

  private renderGenerators(p: p5, time: number, generators: Models.PiGenerator[]): void {
    // find the highest layer index
    let xTranslation: number = 0;
    let yTranslation: number = 0;

    const highestLayerIndex = generators.reduce((acc, x) => Math.max(acc, x.drawLayers.length), xTranslation);

    // draw all layers
    p.translate(xTranslation, yTranslation, this.constants.units.distanceBetweenLayers);

    let heightDisplacement: number;
    for (let i = xTranslation; i < highestLayerIndex; i++) {
      heightDisplacement = i * this.constants.units.distanceBetweenLayers;
      p.translate(xTranslation, yTranslation, heightDisplacement);

      let drawFunctions: (DrawFunction | undefined)[] = generators.map(x => x.drawLayers[i]);
      drawFunctions.forEach(draw => { if (draw) {draw(p, time);} });

      p.translate(xTranslation, yTranslation, -heightDisplacement);
    }

    p.translate(xTranslation, yTranslation, -(this.constants.units.distanceBetweenLayers));
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

  private drawLinesBetweenItems(p: p5, items: Models.ItemGenerator[]): void {

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
        bufferCount(secondsToFrames(0.5, this.fps)),
        take(3),
        map((_) => this.rendererContainer.itemAlgo.buildFastStander(
          this.coordinatesGrid$.value, this.unit, this.currentTime$, this.fps, this.destroy$,
          this.generators
            .filter(x => x.kind === 'item')
            .map(x => x as Models.ItemGenerator),
          2
        ))
      );

    let flickers$ = this.interval$
      .pipe(
        bufferCount(secondsToFrames(0.14, this.fps)),
        // bufferCount(secondsToFrames(0.01, this.fps)),
        // take(this.fps * 2),
        map((_) => this.rendererContainer.itemAlgo.buildFlicker(
          this.coordinatesGrid$.value, this.unit, this.currentTime$, this.fps, this.destroy$
        ))
      );

    // this.setupMidiInterators();

    merge(
      this.interval$
        .pipe(
          bufferCount(secondsToFrames(5, this.fps)),
          startWith('init'),
          switchMap(() => merge(
              movers$,
              flickers$
            ).pipe(
              map(x => ([x]))
            )
          )
        ),
      this.addItemGenerators$
    )
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe((toAddItems) => {

        this.generators.push(...toAddItems);

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
            // this.addItemGenerators$.next(
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
    return createCoordinatesGrid(8, 8, getOrigin(p), this.unit);
  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();
  }

  private additionalRenderSteps(p: p5, window: Window, origin: Coordinates, currentTime: number): void {
    Utils.resetTextColor(p);

    let translateZ: number = this.unit * 24;
    p.translate(0, 0, translateZ);
    p.rotateX(p.radians(-90));

    let distance = 8;

    p.fill(255, 255 / 2);
    p.textSize(16);

    // write "frame:" and "fps:" and "windowSize:" in p canvas in the top left corner one below each other with a gap of 2 distance pixels
    // p.text(`frame: ${ currentTime }`, origin.x, origin.y + 2 * distance);
    // p.text(`fps: ${ this.fps }`, origin.x, origin.y + 4 * distance);
    // p.text(`windowSize: ${ window.innerWidth }x${ window.innerHeight }`, origin.x, origin.y + 6 * distance);
    p.text(`© POLYTERATIVE`, origin.x, origin.y + 8 * distance);

    p.translate(0, 0, -translateZ);
    p.rotateX(p.radians(90));

  }

  ngOnInit(): void {
  }

}

function lifeToColor(arg0: number): string {
  const life: number = arg0;
  const lifeColor: number = Math.floor(life * 255);
  return `rgb(${ lifeColor }, ${ lifeColor }, ${ lifeColor })`;
}
