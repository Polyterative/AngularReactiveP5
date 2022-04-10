import p5 from 'p5';
import { BehaviorSubject, Subject } from 'rxjs';

export namespace GenerativeUtils {
  export function dotGridAlgo(gridPoints$: BehaviorSubject<CoordinateGridPoint[]>, unit: number): MyGenerator {
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
          p.textSize(8);
          p.text(`${ gridElement.xId }, ${ gridElement.yId }`, x, y - unit * 4);

          // draw lines between points

        }

      },
      deathTime: Infinity,
      kill$: new Subject<void>()
    };
  }

  export interface MyGenerator {
    deathTime: number;
    kill$: Subject<void>;

    draw(p: p5, time: number): void;
  }

  export interface CircleGenerator extends MyGenerator {
    coordinates: {
      current: ObservableCoordinates;
      starting: Coordinates,
      final: Coordinates
    };
  }

  interface ObservableCoordinates {
    x: BehaviorSubject<number>;
    y: BehaviorSubject<number>;
  }

  interface Coordinates {
    x: number;
    y: number;
  }

  export interface CoordinateGridPoint {
    x: number;
    y: number;
    xId: number;
    yId: number;
  }

  export function createCoordinatesGrid(
    columns: number,
    rows: number, origin: { x: number; y: number },
    unit: number
  ): GenerativeUtils.CoordinateGridPoint[] {

    const distanceBetweenPoints: number = unit * 8;

    // create columns x rows points grid, with grid to be equally distant from origin
    const grid: GenerativeUtils.CoordinateGridPoint[] = [];

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
    lifeDuration: number,
    startingTime: number,
    availablePoints: GenerativeUtils.CoordinateGridPoint[],
    unit: number
  ): CircleGenerator {

    const deathTime = startingTime + lifeDuration;

    // chose a random x and y coordinate from coordinates  grid
    const coordinate = availablePoints[Math.floor(Math.random() * availablePoints.length)];

    return {
      draw: (p, currentTime) => {
        const remainingLife: number = deathTime - currentTime;

        // decrease fill opacity based on remaining life starting from full to 0
        const fillOpacity = Math.round(remainingLife / lifeDuration * 255);
        p.stroke(255, fillOpacity);

        p.noFill();
        p.circle(coordinate.x, coordinate.y, unit * 4);

      },
      deathTime,
      kill$: new Subject<void>(),
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
      }
    };
  }
}
