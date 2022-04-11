import p5 from 'p5';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { LifetimeManager } from './LifetimeManager';
import { DotGridGenerator, Models } from './models';
import { MovementManager } from './MovementManager';

export namespace Utils {

  import CoordinateGridPoint = Models.CoordinateGridPoint;
  import Coordinates = Models.Coordinates;
  import DrawFunction = Models.DrawFunction;
  import ItemGenerator = Models.ItemGenerator;

  function buildId(currentTime: number): number {
    return currentTime + Math.floor(Math.random() * 1000000);
  }

  export function dotGridAlgo(
    points: CoordinateGridPoint[],
    unit: number,
    currentTime$: BehaviorSubject<number>,
    fps: number,
    destroy$: Observable<void>
  ): DotGridGenerator {

    unit = unit * 4;

    let mainRenderer: DrawFunction = (p, currentTime) => {
      p.stroke(255, 100);
      p.noFill();

      // draw grid as dots using coordinates
      function drawDots(): void {
        for (let i = 0; i < points.length; i++) {
          const gridElement = points[i];

          p.point(gridElement.x, gridElement.y);

          // p.gri

          // add text above dots with xId and  yId
          // p.textSize(8);
          // p.text(`${ gridElement.xId }, ${ gridElement.yId }`, x, y - unit * 4);

          // draw lines between points

        }
      }

      // for (let i = 0; i < 2; i++) {
      //   p.translate(0, 0, i * unit);
      // p.fill(255, 50);
      drawDots();
      // p.translate(0, 0, -(i * unit));
      // }

    };
    return {
      drawLayers: [mainRenderer],
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

  function drawX(p: p5, coordinate: Coordinates, unit: number): void {
    p.line(coordinate.x - unit, coordinate.y - unit, coordinate.x + unit, coordinate.y + unit);
    p.line(coordinate.x + unit, coordinate.y - unit, coordinate.x - unit, coordinate.y + unit);
  }

  function drawTriangle(p: p5, coordinate: Coordinates, unit: number): void {
    // equilateral triangle pointing down

    p.triangle(
      coordinate.x - unit, coordinate.y + unit,
      coordinate.x, coordinate.y - unit,
      coordinate.x + unit, coordinate.y + unit
    );

  }

  function drawCircle(p: p5, coordinate: Coordinates, unit: number): void {
    p.ellipse(coordinate.x, coordinate.y, unit * 2, unit * 2);
  }

  function drawBox(p: p5, coordinate: Coordinates, unit: number): void {
    p.rect(coordinate.x - unit, coordinate.y - unit, unit * 2, unit * 2);
  }

  function drawRemainingLife(p: p5, remainingLife: number, coordinates: Coordinates, unit: number): void {
    resetTextColor(p);
    p.fill(255, 10);
    p.textSize(8);
    p.text(`${ Math.round(remainingLife) }`, coordinates.x, coordinates.y - unit * 2);
  }

  function drawUnitSize(p: p5, coordinate: Models.CoordinateGridPoint, unit: number): void {
    // draw unit size monospaced text, text in full opacity in the middle of the unit
    resetTextColor(p);
    p.textSize(8);
    p.text(`${ unit }`, coordinate.x, coordinate.y);
  }

  function drawDestination(p: p5, dimension: number, finalCoordinate: Models.Coordinates) {
    // draw single cross at finalCoordinate
    p.line(finalCoordinate.x - dimension, finalCoordinate.y, finalCoordinate.x + dimension, finalCoordinate.y);
    p.line(finalCoordinate.x, finalCoordinate.y - dimension, finalCoordinate.x, finalCoordinate.y + dimension);

  }

  // draw line to finalCoordinate with appropriate angle
  function drawArrow(p: p5, currentCoordinates: Models.Coordinates, finalCoordinate: Models.Coordinates, dimension: number): void {

    const angle = Math.atan2(finalCoordinate.y - currentCoordinates.y, finalCoordinate.x - currentCoordinates.x);

    p.stroke(255, 255 / 25);
    p.line(currentCoordinates.x, currentCoordinates.y, finalCoordinate.x, finalCoordinate.y);

    // p.stroke(255, 255 / 4);
    // p.line(finalCoordinate.x, finalCoordinate.y, finalCoordinate.x + dimension * Math.cos(angle), finalCoordinate.y + dimension *
    // Math.sin(angle));

  }

  export function resetTextColor(p: p5): void {
    p.stroke(255, 0);
    p.fill(255, 255);
    // p.textFont('monospace');
  }

  function weakFill(p: p5): void {
    p.fill(255, 255 / 10);
  }

// draw position statistics as text in 3 lines
  function drawPositionStatistics(p: p5, currentCoordinates: Models.Coordinates, finalCoordinate: Models.Coordinates, dimension: number): void {

    const angle = Math.atan2(finalCoordinate.y - currentCoordinates.y, finalCoordinate.x - currentCoordinates.x);
    resetTextColor(p);
    p.textSize(12);
    weakFill(p);
    p.text(
      `${ Math.round(currentCoordinates.x) },${ Math.round(currentCoordinates.y) }`,
      currentCoordinates.x, currentCoordinates.y
    );

  }

  function setupLifelikeStroke(lifetimeManager: LifetimeManager, p: p5): void {
    let remainingLifetimePercentage: number = lifetimeManager.getRemainingLifetimePercentage();

    // flicker stroke randomly when remaining life percentage is less than 10%
    let thresholdPercentage = 5;

    if (remainingLifetimePercentage < thresholdPercentage) {
      let randomAlpha: number;
      // more the more close to 0 remaining life percentage, the more random the alpha value
      randomAlpha = Math.floor(Math.random() * (remainingLifetimePercentage / thresholdPercentage) * 255);
      p.stroke(255, randomAlpha);
    } else {
      // fade in remaining life percentage is still close to 100%
      p.stroke(255, 255 - (remainingLifetimePercentage * 2.55));

    }

  }

  // randomly choose number between 1x, 2x, 4x, 8x 16x of unit size
  function increaseUnitRandomly(unit: number): number {
    return Math.random() < 0.5 ? unit : Math.random() < 0.5 ? unit * 2 : Math.random() < 0.5 ? unit * 4 : Math.random() < 0.9
      ? unit * 8
      : unit * 16;
  }

  function buildItemGenObject(
    currentTime$: BehaviorSubject<number>,
    startingCoordinates: Models.CoordinateGridPoint,
    finalCoordinate: Models.Coordinates,
    animationDuration: number,
    lifetimeManager: LifetimeManager,
    drawFunction: Models.DrawPositionedItem,
    unit: number,
    destroy$: Subject<void>,
    configuration: {
      render: {
        destination: boolean,
        statistics: boolean,
        item: boolean,
      }
    } = {
      render: {
        destination: true,
        statistics: true,
        item: true
      }
    }
  ): Models.ItemGenerator {
    let movementManager: MovementManager = new MovementManager(
      destroy$,
      currentTime$,
      animationDuration,
      startingCoordinates,
      finalCoordinate
    );

    let shouldRenderPosition: boolean = Math.random() < 0.01;

    let renderItemStatistics: DrawFunction = (p: p5, currentTime: number) => {

      // if (shouldRenderPosition) {
      drawPositionStatistics(p, movementManager.getCurrentCoordinates(), finalCoordinate, 32);
      // }

    };
    let renderItem: DrawFunction = (p: p5, currentTime: number) => {

      p.fill(0);

      let currentCoordinates: Models.Coordinates = movementManager.getCurrentCoordinates();

      setupLifelikeStroke(lifetimeManager, p);
      // p.stroke(255, 255 - (remainingLifetimePercentage * 2.55));
      drawFunction(p, currentCoordinates, unit);

    };

    let renderDestination: DrawFunction = (p: p5, currentTime: number) => {
      setupLifelikeStroke(lifetimeManager, p);
      // weakFill(p);

      drawDestination(p, 8, finalCoordinate);
      drawArrow(p, movementManager.getCurrentCoordinates(), finalCoordinate, 32);

    };

    // render layers following configuration
    let renderLayers: DrawFunction[] = [];
    if (configuration.render.destination) {
      renderLayers.push(renderDestination);
    }
    if (configuration.render.item) {
      renderLayers.push(renderItem);
    }
    if (configuration.render.statistics) {
      renderLayers.push(renderItemStatistics);
    }

    return new ItemGenerator(
      buildId(currentTime$.value),
      lifetimeManager, movementManager,
      renderLayers
    );
  }

  export function buildSlowMover(
    availablePoints: CoordinateGridPoint[],
    unit: number,
    currentTime$: BehaviorSubject<number>,
    fps: number,
    destroy$: Subject<void>,
    otherCircles: ItemGenerator[],
    duration: number
  ): ItemGenerator {

    // randomly choose number between 1x, 2x, 4x, 8x 16x of unit size
    unit = increaseUnitRandomly(unit);

    function getRandomCoordinateGridPoint(): CoordinateGridPoint {
      return availablePoints[Math.floor(Math.random() * availablePoints.length)];
    }

    // chose a random x and y coordinate from coordinates grid
    const startingCoordinates = getRandomCoordinateGridPoint();

    let lifeDuration = secondsToFrames(duration, fps);
    let lifetimeManager: LifetimeManager = new LifetimeManager(
      currentTime$,
      currentTime$.value,
      lifeDuration,
      destroy$
    );

    let finalCoordinate: Models.Coordinates = startingCoordinates;
    let animationDuration: number = lifeDuration / 1;

    // randomly choose between drawing a circle or a box or a line or a triangle
    let drawPositionedItem: Models.DrawPositionedItem = Math.random() < 0.5 ? drawCircle : Math.random() < 0.5
      ? drawBox
      : Math.random() < 0.5 ? drawTriangle : drawX;

    return buildItemGenObject(
      currentTime$, startingCoordinates, finalCoordinate, animationDuration, lifetimeManager, drawPositionedItem, unit, destroy$);

  }

  export function buildFlicker(
    availablePoints: CoordinateGridPoint[],
    unit: number,
    currentTime$: BehaviorSubject<number>,
    fps: number,
    destroy$: Subject<void>
  ): ItemGenerator {

    function getRandomCoordinateGridPoint(): CoordinateGridPoint {
      return availablePoints[Math.floor(Math.random() * availablePoints.length)];
    }

    // chose a random x and y coordinate from coordinates grid
    const startingCoordinates = getRandomCoordinateGridPoint();

    let lifeDuration = secondsToFrames(.5, fps);
    let lifetimeManager: LifetimeManager = new LifetimeManager(
      currentTime$,
      currentTime$.value,
      lifeDuration,
      destroy$
    );
    let drawPositionedItem: Models.DrawPositionedItem = drawBox;

    let animationDuration: number = lifeDuration;
    return buildItemGenObject(
      currentTime$, startingCoordinates, startingCoordinates, animationDuration, lifetimeManager, drawPositionedItem, unit, destroy$, {
        render: {
          item: true,
          statistics: false,
          destination: false
        }
      }
    );

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
