import { DynamicFormElementValueType, MutatorFn } from '../model';
import { IDynamicFormService } from '../model/service/dynamic-form.service.interface';

export const disableIfTrue: MutatorFn = (
  originKey: string,
  targetKey: string,
  service: IDynamicFormService,
  value: DynamicFormElementValueType,
) => {
  const linkedElementControl = service.getFormComponentControl(targetKey);

  if (value === true) {
    linkedElementControl.disable();
  } else {
    linkedElementControl.enable();
  }
};
