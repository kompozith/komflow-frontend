
import { Component, inject } from '@angular/core';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { MaterialModule } from '../../../material.module';


@Component({
    selector: 'app-form-toastr',
    templateUrl: './form-toastr.component.html',
    imports: [MaterialModule, ToastrModule],
    providers: [ToastrService]
})
export class AppFormToastrComponent {
  private toastr = inject(ToastrService);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  showSuccess() {
    this.toastr.success('You are awesome!', 'Success!');
  }

  showError() {
    this.toastr.error('This is not good!', 'Oops!');
  }

  showWarning() {
    this.toastr.warning('You are being warned.', 'Alert!');
  }

  showInfo() {
    this.toastr.info('Just some information for you.');
  }
}
