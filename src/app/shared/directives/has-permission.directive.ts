import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AccessControlService } from '../../services/access-control.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private accessControlService: AccessControlService
  ) {}

  @Input() set hasPermission(permission: string) {
    const hasAccess = this.accessControlService.hasPermission(permission);
    this.updateView(hasAccess);
  }

  private updateView(hasAccess: boolean): void {
    if (hasAccess && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
