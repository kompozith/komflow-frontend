import { Component, inject } from '@angular/core';
import { IconModule } from 'src/app/icon/icon.module';
import { MaterialModule } from 'src/app/material.module';
import { MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-template-video',
  imports: [MaterialModule,
      IconModule,],
  templateUrl: './template-video.component.html',
  styleUrl: './template-video.component.scss'
})
export class TemplateVideoComponent {
private dialogRef = inject<MatDialogRef<TemplateVideoComponent>>(MatDialogRef);

/** Inserted by Angular inject() migration for backwards compatibility */
constructor(...args: unknown[]);

constructor(){

}
closeDialog(): void {
  this.dialogRef.close(false); // Pass false back to parent
}
}
