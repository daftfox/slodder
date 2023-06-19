import { AbstractControl, ValidatorFn } from '@angular/forms';
import { LinkedQuestion } from '../model/abstract-form-question';

export const validateIsAtLeastOneSet =
  (controls: LinkedQuestion[]): ValidatorFn =>
  (control: AbstractControl) => {
    if (
      !control.parent // parent doesn't exist
    )
      return null;

    const controlValidity = controls.map(({ key }) => {
      return {
        key,
        valid: !(
          !control.parent.get(key) || // other control doesn't exist
          control.parent.get(key).value === undefined || // other control value is undefined
          control.parent.get(key).value === null || // other control value is null
          control.value === undefined || // current control value is undefined
          control.value === null || // current control value is null
          (Array.isArray(control.parent.get(key).value) && control.parent.get(key).value.length === 0)
        ),
      };
    });

    return controlValidity.filter(({ valid }) => valid).length >= 1
      ? null
      : { atLeastOneMustBeSet: formatSummary(controls.map(({ label }) => label)) };
  };

const formatSummary = (strings: string[]) => {
  return strings.reduce((acc, curr, index) => {
    if (index === strings.length - 1) {
      acc += ` or ${curr}`;
    } else {
      acc += `${curr},`;
    }

    return acc;
  }, '');
};
