import p5 from 'p5';
import { BehaviorSubject } from 'rxjs';
import { LifetimeManager } from './LifetimeManager';
import { MovementManager } from './MovementManager';
import MyGenerator = Models.MyGenerator;

export interface DotGridGenerator extends MyGenerator {
  kind: 'dotgrid';
}

export namespace Models {

  export interface MyGenerator {
    id: number;
    lifetimeManager: LifetimeManager;
    kind: 'item' | 'dotgrid';

    draw(p: p5, time: number): void;
  }

  export type PiGenerator = ItemGenerator | DotGridGenerator;

  export class ItemGenerator implements MyGenerator {
    kind: 'item' = 'item';
    id: number;
    lifetimeManager: LifetimeManager;
    movementManager: MovementManager;
    draw: (p: p5, time: number) => void;

    constructor(
      id: number,
      lifetimeManager: LifetimeManager,
      movementManager: MovementManager,
      draw: (p: p5, time: number) => void
    ) {
      this.id = id;
      this.lifetimeManager = lifetimeManager;
      this.movementManager = movementManager;
      this.draw = draw;
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
