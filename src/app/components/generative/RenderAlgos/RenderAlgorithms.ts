import p5 from 'p5';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Constants } from '../container/container.component';
import { LifetimeManager } from '../container/LifetimeManager';
import { Models } from '../container/models';
import { MovementManager } from '../container/MovementManager';
import { Utils } from '../container/utils';
import { Painters } from './painters';

export namespace RenderAlgorithms {
  import CoordinateGridPoint = Models.CoordinateGridPoint;
  import DrawFunction = Models.DrawFunction;
  import ItemGenerator = Models.ItemGenerator;
  import MyGenerator = Models.MyGenerator;
  import secondsToFrames = Utils.secondsToFrames;

  export interface DotGridGenerator extends MyGenerator {
    kind: 'dotgrid';
  }

  export class RendererBuilder {

    constructor(
      public currentTime$: BehaviorSubject<number>,
      protected constants: Constants
    ) {}

    dotGridAlgo(
      points: CoordinateGridPoint[],
      unit: number,
      fps: number,
      destroy$: Observable<void>
    ): DotGridGenerator {

      unit = this.constants.units.distanceBetweenLayers;
      let alpha: number = 244 / 20;

      let mainRenderer: DrawFunction = (p, currentTime) => {
        p.stroke(255, alpha);
        // p.noFill();

        // draw grid as dots using coordinates

        p.translate(0, 0, -unit);

        for (let i = 0; i < points.length; i++) {
          const gridElement = points[i];

          p.stroke(255, alpha);
          p.noFill();
          p.point(gridElement.x, gridElement.y);

          // p.gri

          // add text above dots with xId and  yId
          // p.textSize(8);
          // p.text(`${ gridElement.xId }, ${ gridElement.yId }`, x, y - unit * 4);

          // draw lines between points

        }

        p.translate(0, 0, unit);

        // for (let i = 0; i < 2; i++) {
        //   p.translate(0, 0, i * unit);
        // p.fill(255, 50);
        // p.translate(0, 0, -(i * unit));
        // }

      };
      return {
        drawLayers: [mainRenderer],
        lifetimeManager: new LifetimeManager(
          this.currentTime$,
          Infinity,
          destroy$
        ),
        id: Utils.buildId(this.currentTime$.value),
        kind: 'dotgrid'
      };

    }

    dotGridDelimiter(
      points: CoordinateGridPoint[],
      destroy$: Observable<void>
    ): DotGridGenerator {

      let unit = this.constants.units.distanceBetweenLayers * 8;

      //first point
      let xfirstPoint = points[0];
      // last point of first line if the one with the highest  xId
      let xlastPoint = points.reduce((acc, curr) => curr.xId > acc.xId ? curr : acc);
      // first point of the last line if the one with the highest yId
      let yFirstPoint = points.reduce((acc, curr) => curr.xId == xfirstPoint.xId && curr.yId > curr.yId ? curr : acc)
      // last point
      let yLastPoint = points[points.length - 1];

      let alpha: number = 244 / 20;

      function drawPerimeter(p: p5): void {
        p.rect(xfirstPoint.x, xfirstPoint.y, xlastPoint.x - xfirstPoint.x, yLastPoint.y - xfirstPoint.y);
      }

      let mainRenderer: DrawFunction = (p, currentTime) => {

        // draw line across the outermost points of the grid
        p.stroke(255, alpha);
        p.noFill();

        // flicker alpha 5% of the time slowly as function of time

        alpha = Utils.flicker(currentTime, 0, 255 / 10, 5);

        // draw again with higher z four times
        drawPerimeter(p);
        p.translate(0, 0, unit);
        drawPerimeter(p);
        p.translate(0, 0, -unit);

      };
      return {
        drawLayers: [mainRenderer],
        lifetimeManager: new LifetimeManager(
          this.currentTime$,
          Infinity,
          destroy$
        ),
        id: Utils.buildId(this.currentTime$.value),
        kind: 'dotgrid'
      };

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
      let drawPositionedItem: Models.DrawPositionedItem = Painters.drawBox;

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
        // weakFill(p);

        Painters.drawDestination(p, 8, finalCoordinate);
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
  }

}
