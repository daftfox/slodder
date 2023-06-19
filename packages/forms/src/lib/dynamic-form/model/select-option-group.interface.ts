import { SelectOption, SelectOptionValueType } from './select-option.interface';

export interface SelectOptionGroup<T = SelectOptionValueType> {
  label: string;
  options: SelectOption<T>[];
  disabled?: boolean;
}
