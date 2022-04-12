import p5 from 'p5';
import { LifetimeManager } from '../container/LifetimeManager';
import { Models } from '../container/models';
import { Utils } from '../container/utils';

export namespace Painters {

  import Coordinates = Models.Coordinates;

  import resetTextColor = Utils.resetTextColor;

  export function drawX(p: p5, coordinate: Coordinates, unit: number): void {
    p.line(coordinate.x - unit, coordinate.y - unit, coordinate.x + unit, coordinate.y + unit);
    p.line(coordinate.x + unit, coordinate.y - unit, coordinate.x - unit, coordinate.y + unit);
  }

  export function drawTriangle(p: p5, coordinate: Coordinates, unit: number): void {
    // equilateral triangle pointing down

    p.triangle(
      coordinate.x - unit, coordinate.y + unit,
      coordinate.x, coordinate.y - unit,
      coordinate.x + unit, coordinate.y + unit
    );

  }

  export function drawCircle(p: p5, coordinate: Coordinates, unit: number): void {
    p.ellipse(coordinate.x, coordinate.y, unit * 2, unit * 2);
  }

  export function drawBox(p: p5, coordinate: Coordinates, unit: number): void {
    p.rect(coordinate.x - unit, coordinate.y - unit, unit * 2, unit * 2);
  }

  export function drawRemainingLife(p: p5, remainingLife: number, coordinates: Coordinates, unit: number): void {
    resetTextColor(p);
    p.fill(255, 10);
    p.textSize(8);
    p.text(`${ Math.round(remainingLife) }`, coordinates.x, coordinates.y - unit * 2);
  }

  export function drawUnitSize(p: p5, coordinate: Models.CoordinateGridPoint, unit: number): void {
    // draw unit size monospaced text, text in full opacity in the middle of the unit
    resetTextColor(p);
    p.textSize(8);
    p.text(`${ unit }`, coordinate.x, coordinate.y);
  }

  export function drawDestination(p: p5, dimension: number, finalCoordinate: Models.Coordinates) {
    // draw single cross at finalCoordinate
    p.line(finalCoordinate.x - dimension, finalCoordinate.y, finalCoordinate.x + dimension, finalCoordinate.y);
    p.line(finalCoordinate.x, finalCoordinate.y - dimension, finalCoordinate.x, finalCoordinate.y + dimension);

  }

  // draw line to finalCoordinate with appropriate angle
  export function drawArrow(p: p5, currentCoordinates: Models.Coordinates, finalCoordinate: Models.Coordinates, dimension: number): void {

    const angle = Math.atan2(finalCoordinate.y - currentCoordinates.y, finalCoordinate.x - currentCoordinates.x);

    p.stroke(255, 255 / 25);
    p.line(currentCoordinates.x, currentCoordinates.y, finalCoordinate.x, finalCoordinate.y);

    // p.stroke(255, 255 / 4);
    // p.line(finalCoordinate.x, finalCoordinate.y, finalCoordinate.x + dimension * Math.cos(angle), finalCoordinate.y + dimension *
    // Math.sin(angle));

  }

  export function weakFill(p: p5): void {
    p.fill(255, 255 / 10);
  }

// draw position statistics as text in 3 lines
  export function drawPositionStatistics(p: p5, currentCoordinates: Models.Coordinates, finalCoordinate: Models.Coordinates, dimension: number): void {

    const angle = Math.atan2(finalCoordinate.y - currentCoordinates.y, finalCoordinate.x - currentCoordinates.x);
    resetTextColor(p);
    p.textSize(12);
    weakFill(p);
    p.text(
      `${ Math.round(currentCoordinates.x) },${ Math.round(currentCoordinates.y) }`,
      currentCoordinates.x, currentCoordinates.y
    );

  }

  export function setupLifelikeStroke(lifetimeManager: LifetimeManager, p: p5): void {
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

}
