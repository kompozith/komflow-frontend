import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HasRoleDirective } from './has-role.directive';
import { CanAccessDirective } from './can-access.directive';
import {HasPermissionDirective} from "../shared/directives/has-permission.directive";

@NgModule({
  declarations: [
    HasRoleDirective,
    HasPermissionDirective,
    CanAccessDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    HasRoleDirective,
    HasPermissionDirective,
    CanAccessDirective
  ]
})
export class AuthzDirectivesModule { }
