import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AccessControlService } from '../../services/access-control.service';

@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective {
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private accessControlService: AccessControlService
  ) {}

  @Input() set hasRole(role: string) {
    const hasAccess = this.accessControlService.hasRole(role);
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