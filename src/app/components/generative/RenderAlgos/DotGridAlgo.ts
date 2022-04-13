import p5 from 'p5';
import { BehaviorSubject, Observable } from 'rxjs';
import { Constants } from '../container/container.component';
import { LifetimeManager } from '../container/LifetimeManager';
import { Models } from '../container/models';
import { Utils } from '../container/utils';
import { RenderAlgoBase } from './RenderAlgoBase';
import CoordinateGridPoint = Models.CoordinateGridPoint;
import DrawFunction = Models.DrawFunction;
import MyGenerator = Models.MyGenerator;

export interface DotGridGenerator extends MyGenerator {
  kind: 'dotgrid';
}

export class DotGridAlgo extends RenderAlgoBase {

  constructor(
    protected override currentTime$: BehaviorSubject<number>,
    protected override constants: Constants
  ) {
    super(
      currentTime$,
      constants
    );
  }

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

  gridDelimiter(
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

      alpha = Utils.flicker(currentTime, 25, 255 / 5, 50);

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

}
