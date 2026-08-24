import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Special characters are restricted to this fixed allow-list — rather than
 * "any non-alphanumeric character" — to keep quotes, semicolons, and
 * backslashes out of password input on principle. This is a defense-in-depth
 * convention, not the actual SQL-injection defense: that must always be
 * parameterized queries / prepared statements on the backend, never input
 * character filtering.
 */
export const PASSWORD_SPECIAL_CHARS = '@_#$%\\-^*()!';
const SPECIAL_CHAR_CLASS = `[${PASSWORD_SPECIAL_CHARS}]`;

export const PASSWORD_POLICY_PATTERN = new RegExp(
  `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*${SPECIAL_CHAR_CLASS}).{8,}$`,
);

export function hasPasswordMinLength(value: string): boolean {
  return value.length >= 8;
}

export function hasPasswordLowercase(value: string): boolean {
  return /[a-z]/.test(value);
}

export function hasPasswordUppercase(value: string): boolean {
  return /[A-Z]/.test(value);
}

export function hasPasswordDigit(value: string): boolean {
  return /\d/.test(value);
}

export function hasPasswordSpecialChar(value: string): boolean {
  return new RegExp(SPECIAL_CHAR_CLASS).test(value);
}

export function passwordPolicyValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) {
    return null;
  }
  return PASSWORD_POLICY_PATTERN.test(value) ? null : { passwordPolicy: true };
}

export function createPasswordMatchValidator(
  passwordControlName: string,
  confirmPasswordControlName: string,
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordControlName)?.value;
    const confirmPassword = group.get(confirmPasswordControlName)?.value;
    if (!password || !confirmPassword) {
      return null;
    }
    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}
