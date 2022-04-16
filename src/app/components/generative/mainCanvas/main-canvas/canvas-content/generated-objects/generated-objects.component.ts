import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ConstantsService } from '../../constants.service';

@Component({
  selector: 'app-generated-objects',
  templateUrl: './generated-objects.component.html',
  styleUrls: ['./generated-objects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratedObjectsComponent implements OnInit {

  constructor(
    public constantsService: ConstantsService
  ) { }

  ngOnInit(): void {
  }

}
