import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { GridHelper } from 'three';

@Component({
  selector: 'app-canvas-content',
  templateUrl: './canvas-content.component.html',
  styleUrls: ['./canvas-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CanvasContentComponent implements OnInit {

  onGridHelperReady(
    helper: GridHelper): void {

  }

  constructor() { }

  ngOnInit(): void {
  }

}
