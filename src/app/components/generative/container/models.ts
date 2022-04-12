import p5 from 'p5';
import { BehaviorSubject } from 'rxjs';
import { RenderAlgorithms } from '../RenderAlgos/RenderAlgorithms';
import { LifetimeManager } from './LifetimeManager';
import { MovementManager } from './MovementManager';

export namespace Models {

  export type DrawFunction = (p: p5, currentTime: number) => void;
  export type DrawPositionedItem = (p: p5, coordinate: Coordinates, unit: number) => void;

  export interface MyGenerator {
    id: number;
    lifetimeManager: LifetimeManager;
    kind: 'item' | 'dotgrid';

    drawLayers: (DrawFunction)[];

  }

  export type PiGenerator = ItemGenerator | RenderAlgorithms.DotGridGenerator;

  export class ItemGenerator implements MyGenerator {
    kind: 'item' = 'item';
    id: number;
    lifetimeManager: LifetimeManager;
    movementManager: MovementManager;
    drawLayers: (DrawFunction)[] = [];

    constructor(
      id: number,
      lifetimeManager: LifetimeManager,
      movementManager: MovementManager,
      drawLayers: (DrawFunction)[] = []
    ) {
      this.id = id;
      this.lifetimeManager = lifetimeManager;
      this.movementManager = movementManager;
      this.drawLayers = drawLayers;
    }

  }

  export interface Positionable {
    coordinates: {
      current: ObservableCoordinates;
      progress: BehaviorSubject<number>; // number between 0 and 100
      starting: Coordinates,
      final: Coordinates
    };
  }

  export interface ObservableCoordinates {
    x: BehaviorSubject<number>;
    y: BehaviorSubject<number>;
  }

  export interface Coordinates {
    x: number;
    y: number;
  }

  export interface CoordinateGridPoint {
    x: number;
    y: number;
    xId: number;
    yId: number;
  }

  export function getOrigin(p: p5): { x: number, y: number } {
    return {
      x: p.windowWidth / 2,
      y: p.windowHeight / 2
    };
  }
}
