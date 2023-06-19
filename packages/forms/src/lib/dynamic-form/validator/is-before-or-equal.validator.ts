// import { AbstractControl, ValidatorFn } from '@angular/forms';
// import { isBeforeOrEqual } from '../../../utilities';
// import { format } from 'date-fns';
//
// export const validateIsBeforeOrEqual =
//   (controlKey: string): ValidatorFn =>
//   (control: AbstractControl) => {
//     if (
//       !control.parent || // parent doesn't exist
//       !control.parent.get(controlKey) || // other control doesn't exist
//       control.parent.get(controlKey).value === undefined || // other control value is undefined
//       control.parent.get(controlKey).value === null || // other control value is null
//       control.value === undefined || // current control value is undefined
//       control.value === null // current control value is null
//     )
//       return null;
//     return isBeforeOrEqual(control.value, control.parent.get(controlKey).value)
//       ? null
//       : { dateIsNotOnOrBefore: format(control.parent.get(controlKey).value, 'dd/MM/yyyy') };
//   };
