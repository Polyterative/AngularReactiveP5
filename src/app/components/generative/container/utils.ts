import p5 from 'p5';
import { BehaviorSubject, Observable } from 'rxjs';
import { LifetimeManager } from './LifetimeManager';
import { Models } from './models';

export namespace Utils {
  import CircleGenerator = Models.CircleGenerator;
  import CoordinateGridPoint = Models.CoordinateGridPoint;
  import MyGenerator = Models.MyGenerator;

  function buildId(currentTime: number): number {
    return currentTime + Math.floor(Math.random() * 1000000);
  }

  export function dotGridAlgo(
    gridPoints$: BehaviorSubject<CoordinateGridPoint[]>,
    unit: number,
    currentTime$: BehaviorSubject<number>,
    fps: number,
    destroy$: Observable<void>
  ): MyGenerator {
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
      id: buildId(currentTime$.value)
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

  export function buildCircleItem(
    availablePoints: CoordinateGridPoint[],
    unit: number,
    currentTime$: BehaviorSubject<number>,
    fps: number,
    destroy$: Observable<void>
  ): CircleGenerator {

    // chose a random x and y coordinate from coordinates  grid
    const coordinate = availablePoints[Math.floor(Math.random() * availablePoints.length)];

    let lifeDuration = secondsToFrames(1, fps);
    let lifetimeManager: LifetimeManager = new LifetimeManager(
      currentTime$,
      currentTime$.value,
      lifeDuration,
      destroy$
    );
    return {
      draw: (p, currentTime) => {
        const remainingLife: number = lifetimeManager.getRemainingLifetime();

        // decrease fill opacity based on remaining life starting from full to 0
        const fillOpacity = Math.round(remainingLife / lifeDuration * 255);
        p.stroke(255, fillOpacity);

        p.noFill();
        p.circle(coordinate.x, coordinate.y, unit * 4);

        // draw remaining life monospaced text
        p.textFont('monospace');
        p.textSize(8);
        p.text(`${ remainingLife }`, coordinate.x, coordinate.y - unit * 4);

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
      id: buildId(currentTime$.value)
    };
  }

  export function getOrigin(p: p5): { x: number, y: number } {
    return {
      x: p.windowWidth / 2,
      y: p.windowHeight / 2
    };
  }
}
