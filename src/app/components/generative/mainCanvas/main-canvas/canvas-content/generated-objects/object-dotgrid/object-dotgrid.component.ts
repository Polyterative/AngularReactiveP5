import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Models } from '../Models';

@Component({
  selector: 'app-object-dotgrid',
  templateUrl: './object-dotgrid.component.html',
  styleUrls: ['./object-dotgrid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ObjectDotgridComponent implements OnInit {

  @Input() item!: Models.PositionedObject

  constructor() { }

  ngOnInit(): void {
  }

}
