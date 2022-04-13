import p5 from 'p5';
import { BehaviorSubject, Subject } from 'rxjs';
import { Constants } from '../container/container.component';
import { LifetimeManager } from '../container/LifetimeManager';
import { Models } from '../container/models';
import { MovementManager } from '../container/MovementManager';
import { Utils } from '../container/utils';
import { Painters } from './painters';
import { RenderAlgoBase } from './RenderAlgoBase';
import CoordinateGridPoint = Models.CoordinateGridPoint;
import DrawFunction = Models.DrawFunction;
import ItemGenerator = Models.ItemGenerator;
import secondsToFrames = Utils.secondsToFrames;

export class ItemAlgo extends RenderAlgoBase {

  constructor(
    protected override currentTime$: BehaviorSubject<number>,
    protected override constants: Constants
  ) {
    super(
      currentTime$,
      constants
    );
  }

  buildFastStander(
    availablePoints: CoordinateGridPoint[],
    unit: number,
    currentTime$: BehaviorSubject<number>,
    fps: number,
    destroy$: Subject<void>,
    otherCircles: ItemGenerator[],
    duration: number
  ): ItemGenerator {

    // randomly choose number between 1x, 2x, 4x, 8x 16x of unit size
    unit = Utils.increaseUnitRandomly(unit);

    function getRandomCoordinateGridPoint(): CoordinateGridPoint {
      return availablePoints[Math.floor(Math.random() * availablePoints.length)];
    }

    // chose a random x and y coordinate from coordinates grid
    const startingCoordinates = getRandomCoordinateGridPoint();

    let lifeDuration = secondsToFrames(duration, fps);
    let lifetimeManager: LifetimeManager = new LifetimeManager(
      currentTime$,
      lifeDuration,
      destroy$
    );

    let finalCoordinate: Models.Coordinates = startingCoordinates;
    let animationDuration: number = lifeDuration;

    // randomly choose between drawing a circle or a box or a line or a triangle
    let drawPositionedItem: Models.DrawPositionedItem = Math.random() < 0.5 ? Painters.drawCircle : Math.random() < 0.5
      ? Painters.drawBox
      : Math.random() < 0.5 ? Painters.drawTriangle : Painters.drawX;

    return this.buildItemGenObject(
      currentTime$, startingCoordinates, finalCoordinate, animationDuration, lifetimeManager, drawPositionedItem, unit, destroy$);

  }

  buildFlicker(
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
      lifeDuration,
      destroy$
    );
    let drawPositionedItem: Models.DrawPositionedItem = Painters.drawSmallX;

    let animationDuration: number = lifeDuration;

    return this.buildItemGenObject(
      currentTime$, startingCoordinates, startingCoordinates, animationDuration, lifetimeManager, drawPositionedItem, unit, destroy$, {
        render: {
          item: true,
          statistics: false,
          destination: false
        }
      }
    );

  }

  buildSlowMover(
    availablePoints: CoordinateGridPoint[],
    unit: number,
    currentTime$: BehaviorSubject<number>,
    fps: number,
    destroy$: Subject<void>,
    otherCircles: ItemGenerator[],
    duration: number
  ): ItemGenerator {

    // randomly choose number between 1x, 2x, 4x, 8x 16x of unit size
    unit = Utils.increaseUnitRandomly(unit);

    function getRandomCoordinateGridPoint(): CoordinateGridPoint {
      return availablePoints[Math.floor(Math.random() * availablePoints.length)];
    }

    // chose a random x and y coordinate from coordinates grid
    const startingCoordinates = getRandomCoordinateGridPoint();

    let lifeDuration = secondsToFrames(duration, fps);
    let lifetimeManager: LifetimeManager = new LifetimeManager(
      currentTime$,
      lifeDuration,
      destroy$
    );

    let finalCoordinate: Models.Coordinates = getRandomCoordinateGridPoint();
    let animationDuration: number = lifeDuration;

    // randomly choose between drawing a circle or a box or a line or a triangle
    let drawPositionedItem: Models.DrawPositionedItem = Math.random() < 0.5 ? Painters.drawCircle : Math.random() < 0.5
      ? Painters.drawBox
      : Math.random() < 0.5 ? Painters.drawTriangle : Painters.drawX;

    return this.buildItemGenObject(
      currentTime$, startingCoordinates, finalCoordinate, animationDuration, lifetimeManager, drawPositionedItem, unit, destroy$);

  }

  buildItemGenObject(
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
      Painters.drawPositionStatistics(p, movementManager.getCurrentCoordinates(), finalCoordinate, 32);
      // }

    };
    let renderItem: DrawFunction = (p: p5, currentTime: number) => {

      p.fill(0);

      let currentCoordinates: Models.Coordinates = movementManager.getCurrentCoordinates();

      Painters.setupLifelikeStroke(lifetimeManager, p);
      // p.stroke(255, 255 - (remainingLifetimePercentage * 2.55));
      drawFunction(p, currentCoordinates, unit);

    };

    let renderDestination: DrawFunction = (p: p5, currentTime: number) => {
      Painters.setupLifelikeStroke(lifetimeManager, p);
      Painters.weakFill(p);

      Painters.drawDestination(p, 16, finalCoordinate);
      Painters.drawArrow(p, movementManager.getCurrentCoordinates(), finalCoordinate, 32);

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
      Utils.buildId(currentTime$.value),
      lifetimeManager, movementManager,
      renderLayers
    );
  }

}
