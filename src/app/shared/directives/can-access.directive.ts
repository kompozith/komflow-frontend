import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AccessControlService } from '../../services/access-control.service';

@Directive({
  selector: '[canAccess]',
  standalone: true
})
export class CanAccessDirective {
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private accessControlService: AccessControlService
  ) {}

  @Input() set canAccess(config: { roles?: string[], permissions?: string[] }) {
    const hasAccess = this.accessControlService.canAccess(config);
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