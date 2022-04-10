import p5 from 'p5';
import { BehaviorSubject } from 'rxjs';
import { LifetimeManager } from './LifetimeManager';
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

  export type Generators = ItemGenerator | DotGridGenerator;

  export interface ItemGenerator extends MyGenerator {
    coordinates: {
      current: ObservableCoordinates;
      starting: Coordinates,
      final: Coordinates
    };
    kind: 'item';
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

  export function getOrigin(p: p5): { x: number, y: number } {
    return {
      x: p.windowWidth / 2,
      y: p.windowHeight / 2
    };
  }
}
