import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PASSWORD_SPECIAL_CHARS } from '../../utils/password-validation';

interface PasswordRule {
  label: string;
  met: boolean;
}

@Component({
  selector: 'app-password-rules',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-rules.component.html',
})
export class PasswordRulesComponent {
  hasMinLength = input(false);
  hasLowercase = input(false);
  hasUppercase = input(false);
  hasDigit = input(false);
  hasSpecialChar = input(false);

  rules = computed<PasswordRule[]>(() => [
    { label: 'Au moins 8 caractères', met: this.hasMinLength() },
    { label: 'Une lettre minuscule', met: this.hasLowercase() },
    { label: 'Une lettre majuscule', met: this.hasUppercase() },
    { label: 'Un chiffre', met: this.hasDigit() },
    {
      label: `Un caractère spécial (${PASSWORD_SPECIAL_CHARS.replace(/\\/g, '')})`,
      met: this.hasSpecialChar(),
    },
  ]);
}
