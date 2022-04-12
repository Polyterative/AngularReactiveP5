import p5 from 'p5';
import { Models } from './models';

export namespace Utils {

  import CoordinateGridPoint = Models.CoordinateGridPoint;

  export function buildId(currentTime: number): number {
    return currentTime + Math.floor(Math.random() * 1000000);
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

    // origin is in the middle of the grid
    const xOffset = origin.x - totalGridWidth / 2;
    const yOffset = origin.y - totalGridHeight / 2;

    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        const x = xOffset + i * distanceBetweenPoints;
        const y = yOffset + j * distanceBetweenPoints;
        grid.push({
          x,
          y,
          xId: i,
          yId: j
        })
      }
    }

    return grid;
  }

  export function resetTextColor(p: p5): void {
    p.stroke(255, 0);
    p.fill(255, 255);
  }

  // randomly choose number between 1x, 2x, 4x, 8x 16x of unit size
  export function increaseUnitRandomly(unit: number): number {
    return Math.random() < 0.5 ? unit : Math.random() < 0.5 ? unit * 2 : Math.random() < 0.5 ? unit * 4 : Math.random() < 0.9
      ? unit * 8
      : unit * 16;
  }

  export function getOrigin(p: p5): { x: number, y: number } {
    // return {
    //   x: p.windowWidth / 2,
    //   y: p.windowHeight / 2
    // };
    return {
      x: 0,
      y: 0
    };
  }
}
