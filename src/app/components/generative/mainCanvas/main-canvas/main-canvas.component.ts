import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { GridHelper } from 'three';

@Component({
  selector: 'app-main-canvas',
  templateUrl: './main-canvas.component.html',
  styleUrls: ['./main-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainCanvasComponent implements OnInit {
  window: Window = window;

  constructor() { }

  ngOnInit(): void {
  }

  onGridHelperReady(helper: GridHelper): void {

  }
}
