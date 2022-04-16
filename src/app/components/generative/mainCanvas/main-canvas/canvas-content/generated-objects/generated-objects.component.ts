import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { bufferCount, map } from 'rxjs';
import { Vector3 } from 'three';
import { CameraService } from '../../camera.service';
import { ConstantsService } from '../../constants.service';
import { Models } from './Models';

@Component({
  selector: 'app-generated-objects',
  templateUrl: './generated-objects.component.html',
  styleUrls: ['./generated-objects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratedObjectsComponent implements OnInit {

  objects: Models.PositionedObject[] = [];

  constructor(
    public cameraService: CameraService,
    public constantsService: ConstantsService,
    private changeDetector: ChangeDetectorRef
  ) {

    this.constantsService.tick$
      .pipe(
        bufferCount(this.constantsService.fps / 2),
        map((x) => (x[x.length - 1]))
      )
      .subscribe((x) => {
        // add new objects to the array
        this.objects.push({
          position: new Vector3(
            0,
            1,
            ((x / this.cameraService.speedDivider) + 20)
          ),
          rotation: new Vector3(
            0,
            0,
            0
          )
        });

        // move x to the right or to the left at max 10 at random
        // this.objects.forEach((object) => {
        //   object.position.x = object.position.x + (Math.random() * 20) - 5;
        // });

        this.changeDetector.markForCheck();
        this.changeDetector.detectChanges();
      });

    //remove objects from the array that are too far away from the camera
    this.constantsService.tick$
      .pipe(
        bufferCount(this.constantsService.fps),
        map((x) => (x[x.length - 1]))
      )
      .subscribe((x) => {
        let cameraPosition: Vector3 = this.cameraService.options.position;

        this.objects = this.objects.filter((object) => {
          let distance: number = object.position.distanceTo(cameraPosition);
          return distance < 50;
        });

      });
  }

  ngOnInit(): void {

  }

}
