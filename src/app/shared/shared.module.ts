import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {HasPermissionDirective} from "./directives/has-permission.directive";

@NgModule({
  declarations: [HasPermissionDirective],
  imports: [CommonModule],
  exports: [HasPermissionDirective]
})
export class SharedModule { }
