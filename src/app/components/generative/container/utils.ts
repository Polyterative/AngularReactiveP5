import p5 from 'p5';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { LifetimeManager } from './LifetimeManager';
import { DotGridGenerator, Models } from './models';

export namespace Utils {

  import CoordinateGridPoint = Models.CoordinateGridPoint;
  import ItemGenerator = Models.ItemGenerator;

  function buildId(currentTime: number): number {
    return currentTime + Math.floor(Math.random() * 1000000);
  }

  export function dotGridAlgo(
    gridPoints$: BehaviorSubject<CoordinateGridPoint[]>,
    unit: number,
    currentTime$: BehaviorSubject<number>,
    fps: number,
    destroy$: Observable<void>
  ): DotGridGenerator {
    return {
      draw: (p, currentTime) => {
        p.stroke(255, 100);
        p.noFill();

        // draw grid as dots using coordinates
        let points = gridPoints$.value;

        for (let i = 0; i < points.length; i++) {
          const gridElement = points[i];
          const x = gridElement.x;
          const y = gridElement.y;

          p.fill(255, 50);
          p.point(x, y);

          // add text above dots with xId and  yId
          // p.textSize(8);
          // p.text(`${ gridElement.xId }, ${ gridElement.yId }`, x, y - unit * 4);

          // draw lines between points

        }

      },
      lifetimeManager: new LifetimeManager(
        currentTime$,
        currentTime$.value,
        Infinity,
        destroy$
      ),
      id: buildId(currentTime$.value),
      kind: 'dotgrid'
    };

  }

  export function secondsToFrames(seconds: number, fps: number): number {
    return Math.round(fps * seconds);
  }

  export function createCoordinatesGrid(
    columns: number,
    rows: number, origin: { x: number; y: number },
    unit: number
  ): CoordinateGridPoint[] {

    const distanceBetweenPoints: number = unit * 8;

    // create columns x rows points grid, with grid to be equally distant from origin
    const grid: CoordinateGridPoint[] = [];

    const totalGridWidth = columns * distanceBetweenPoints;
    const totalGridHeight = rows * distanceBetweenPoints;

    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        const x = ((distanceBetweenPoints / 2) + origin.x - totalGridWidth + (totalGridWidth / 2)) + (i * distanceBetweenPoints);
        const y = ((distanceBetweenPoints / 2) + origin.y - totalGridHeight + (totalGridHeight / 2)) + (j * distanceBetweenPoints);

        grid.push({
          x,
          y,
          xId: i,
          yId: j
        });
      }
    }

    return grid;
  }

  function drawX(p: p5, coordinate: CoordinateGridPoint, unit: number): void {
    p.line(coordinate.x - unit, coordinate.y - unit, coordinate.x + unit, coordinate.y + unit);
    p.line(coordinate.x + unit, coordinate.y - unit, coordinate.x - unit, coordinate.y + unit);
  }

  function drawTriangle(p: p5, coordinate: CoordinateGridPoint, unit: number): void {
    p.triangle(
      coordinate.x - unit, coordinate.y - unit,
      coordinate.x + unit, coordinate.y + unit,
      coordinate.x - unit, coordinate.y + unit
    );

  }

  function drawCircle(p: p5, coordinate: CoordinateGridPoint, unit: number): void {
    p.ellipse(coordinate.x, coordinate.y, unit * 2, unit * 2);
  }

  function drawBox(p: p5, coordinate: CoordinateGridPoint, unit: number): void {
    p.rect(coordinate.x - unit, coordinate.y - unit, unit * 2, unit * 2);
  }

  function drawRemainingLife(p: p5, remainingLife: number, coordinate: Models.CoordinateGridPoint, unit: number): void {
    p.fill(255, 10);
    p.textFont('monospace');
    p.textSize(8);
    p.text(`${ Math.round(remainingLife) }`, coordinate.x, coordinate.y - unit * 2);
  }

  function drawUnitSize(p: p5, coordinate: Models.CoordinateGridPoint, unit: number): void {
    // draw unit size monospaced text, text in full opacity in the middle of the unit
    p.fill(255, 255);
    p.textFont('monospace');
    p.textSize(8);
    p.text(`${ unit }`, coordinate.x, coordinate.y);
  }

  export function buildItem(
    availablePoints: CoordinateGridPoint[],
    unit: number,
    currentTime$: BehaviorSubject<number>,
    fps: number,
    destroy$: Subject<void>,
    otherCircles: ItemGenerator[]
  ): ItemGenerator {

    // randomly choose number between 1x, 2x, 4x, 8x 16x of unit size
    unit = Math.random() < 0.5 ? unit : Math.random() < 0.5 ? unit * 2 : Math.random() < 0.5 ? unit * 4 : Math.random() < 0.9
      ? unit * 8
      : unit * 16;

    // filter out points that are already taken
    availablePoints = availablePoints.filter(point => {
      return !otherCircles.some(circle => circle.coordinates.starting.x === point.x && circle.coordinates.starting.y === point.y);
    });

    // chose a random x and y coordinate from coordinates grid
    const coordinate = availablePoints[Math.floor(Math.random() * availablePoints.length)];

    let lifeDuration = secondsToFrames(4, fps);
    let lifetimeManager: LifetimeManager = new LifetimeManager(
      currentTime$,
      currentTime$.value,
      lifeDuration,
      destroy$
    );

    // randomly choose between drawing a circle or a box or a line or a triangle
    const drawFunction = Math.random() < 0.5 ? drawCircle : Math.random() < 0.5 ? drawBox : Math.random() < 0.5 ? drawTriangle : drawX;
    // const drawFunction = drawBox ;

    return {
      draw: (p, currentTime) => {

        p.stroke(255, 10);
        const remainingLife: number = lifetimeManager.getRemainingLifetime();

        // decrease fill opacity based on remaining life starting from full to 0
        const fillOpacity = Math.round(remainingLife / lifeDuration * 255);

        // flicker opacity when life is less than half of the duration with more flicker when close to 0
        const flickerOpacity = Math.round(remainingLife / lifeDuration * 255 * (1 - (remainingLife / lifeDuration)));

        // fill black

        // flicker stroke when close to dying only in the last 10% of life
        if (remainingLife < lifeDuration * 0.9) {
          p.stroke(255, flickerOpacity * 0.5);
        } else {
          p.stroke(255, fillOpacity * 0.5);
        }

        // p.stroke(255, flickerOpacity);
        p.stroke(255);

        // p.fill(255, flicker);

        // reduce unit size by half when life is less than half of the duration
        // unit = remainingLife < lifeDuration * 0.5 ? unit / 2 : unit;

        p.fill(0);
        drawFunction(p, coordinate, unit);

        drawRemainingLife(p, lifetimeManager.remainingLifetimePercentage$.value, coordinate, unit);
        // drawUnitSize(p, coordinate, unit);

      },
      coordinates: {
        current: {
          x: new BehaviorSubject<number>(coordinate.x),
          y: new BehaviorSubject<number>(coordinate.y)
        },
        starting: {
          x: coordinate.x,
          y: coordinate.y
        },
        final: {
          x: coordinate.x,
          y: coordinate.y
        }
      },
      lifetimeManager,
      id: buildId(currentTime$.value),
      kind: 'item'
    };
  }

  export function getOrigin(p: p5): { x: number, y: number } {
    return {
      x: p.windowWidth / 2,
      y: p.windowHeight / 2
    };
  }
}
