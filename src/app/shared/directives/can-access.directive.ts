import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AccessControlService } from '../../services/access-control.service';

@Directive({
  selector: '[canAccess]',
  standalone: true
})
export class CanAccessDirective {
  private templateRef = inject<TemplateRef<any>>(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private accessControlService = inject(AccessControlService);

  private hasView = false;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

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