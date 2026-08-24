import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';

/**
 * Design-system text field: label + input + error message, wired directly to
 * a FormControl passed in as an input. Owns the "hide error while typing,
 * show it again on blur" interaction itself, so pages no longer need their
 * own onFieldInput/onFieldBlur pair per field — that logic was previously
 * copy-pasted across every auth page.
 *
 * Error messages are supplied as a map of Validators error-key -> message,
 * so each page only states what error text it wants, not how/when to show it.
 */
@Component({
  selector: 'ds-text-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TablerIconsModule],
  templateUrl: './ds-text-field.component.html',
})
export class DsTextFieldComponent {
  control = input.required<FormControl>();
  label = input<string>('');
  type = input<'text' | 'email' | 'password'>('text');
  placeholder = input<string>('');
  autocomplete = input<string>('off');
  errorMessages = input<Record<string, string>>({});
  hint = input<string>('');
  inputId = input<string>(`ds-text-field-${++DsTextFieldComponent.nextId}`);

  private static nextId = 0;

  /** True while the user is actively editing — suppresses the error message. */
  private isEditing = signal(false);

  /** Bumped on every statusChanges emission, to force showError()/errorText() to recompute. */
  private statusVersion = signal(0);

  passwordVisible = signal(false);

  constructor() {
    effect((onCleanup) => {
      const control = this.control();
      const subscription = control.statusChanges.subscribe(() => {
        this.statusVersion.update((v) => v + 1);
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  resolvedType = computed(() => {
    if (this.type() !== 'password') {
      return this.type();
    }
    return this.passwordVisible() ? 'text' : 'password';
  });

  showError = computed(() => {
    this.statusVersion();
    const control = this.control();
    return control.touched && control.invalid && !this.isEditing();
  });

  errorText = computed(() => {
    this.statusVersion();
    const control = this.control();
    const errors = control.errors;
    if (!errors) {
      return '';
    }
    const messages = this.errorMessages();
    const firstKey = Object.keys(errors).find((key) => messages[key]);
    return firstKey ? messages[firstKey] : '';
  });

  onInput(): void {
    this.isEditing.set(true);
  }

  onBlur(): void {
    this.isEditing.set(false);
    this.control().markAsTouched();
    this.control().updateValueAndValidity();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }
}
