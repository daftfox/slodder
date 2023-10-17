import { ComponentRef, Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import {
  FormComponent,
  FormComponentModel,
  IDynamicFormElement,
  IDynamicFormService,
  IFormGroupComponent,
} from '../model';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { isFormAction, isFormGroup, isFormQuestion } from '../util';

@Injectable()
export class DynamicFormService implements IDynamicFormService {
  private formComponentRefs: Map<string, FormComponentModel> = new Map();

  constructor(private formInitialised: Observable<null>) {}

  getFormComponentKeys(): string[] {
    return Array.from(this.formComponentRefs.keys());
  }

  setDisplayedElements(displayedElements: Observable<string[]>) {
    displayedElements
      .pipe(
        tap((displayedElements) => {
          this.getFormComponentKeys().forEach((key) => {
            this.setElementVisibility(key, !displayedElements.includes(key));
          });
        }),
      )
      .subscribe();
  }

  updateFormControl(key: string) {
    const control = this.getFormComponentControl(key);
    if (control) {
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private addFormComponentRef(
    key: string,
    formComponentModel: FormComponentModel,
  ) {
    this.formComponentRefs.set(key, formComponentModel);
  }

  private getFormComponentModel(key: string): FormComponentModel {
    return this.formComponentRefs.get(key);
  }

  private getFormComponentRef(key: string): ComponentRef<FormComponent> {
    return this.getFormComponentModel(key).componentRef;
  }

  getFormComponent(key: string): FormComponent {
    return this.getFormComponentRef(key).instance;
  }

  getFormComponentControl(key: string): AbstractControl {
    return this.getFormComponentModel(key).control;
  }

  destroyFormComponent(key: string) {
    const formComponentModel = this.getFormComponentModel(key);
    formComponentModel.parent.removeFormControlFromForm(key);
    formComponentModel.componentRef.destroy();
    this.deleteFormComponentRef(key);
  }

  setElementVisibility(key: string, isVisible: boolean) {
    if (!isVisible) {
      this.getFormComponentRef(key).location.nativeElement.setAttribute(
        'hidden',
        '',
      );
    } else {
      this.getFormComponentRef(key).location.nativeElement.removeAttribute(
        'hidden',
      );
    }
  }

  addFormElementsToFormGroup(
    formElements: IDynamicFormElement[],
    formGroupKey: string,
  ) {
    const formGroup = this.getFormComponentRef(formGroupKey)
      .instance as IFormGroupComponent;
    formElements.forEach((formElement) =>
      formGroup.appendFormControlToForm(formElement),
    );
    this.updateFormElementComponents(formGroup, formElements);
  }

  removeFormElementsFromFormGroup(
    formElements: IDynamicFormElement[],
    formGroupKey: string,
  ) {
    const formGroup = this.getFormComponentRef(formGroupKey)
      .instance as IFormGroupComponent;
    formElements.forEach(({ key }) => {
      const formComponentModel = this.getFormComponentModel(key);
      if (formComponentModel && formComponentModel.parent === formGroup) {
        this.destroyFormComponent(key);
      }
    });
  }

  /**
   * Parses formGroupComponent element declarations and either adds them to the formGroupComponent or updates their respective components when they
   * have already been added.
   * @param {AbstractFormGroupComponent} formGroupComponent
   * @param {IDynamicFormElement[]} formElements
   * @private
   */
  updateFormElementComponents(
    formGroupComponent: IFormGroupComponent,
    formElements: IDynamicFormElement[],
  ) {
    if (!formElements) {
      return;
    }

    // We should keep track of keys to see if a formerly present component should be removed now
    const formElementKeys: string[] = [];

    for (const formElement of formElements as IDynamicFormElement[]) {
      // Retrieve the component's reference
      let formComponentModel = this.getFormComponentModel(formElement.key);
      formElementKeys.push(formElement.key);

      // If we don't have a reference to the component, it means we haven't instantiated one yet
      if (!formComponentModel) {
        formComponentModel = this.createNewFormComponent(
          formElement,
          formGroupComponent,
        );

        this.addFormComponentRef(formElement.key, formComponentModel);
        this.setFormComponentInputs(formComponentModel, formElement);
        formComponentModel.componentRef.changeDetectorRef.detectChanges();
      }
    }

    // Verify that no formGroupComponent elements have been removed since the last time we parsed them
    const missingKeys = this.getFormComponentKeys().filter(
      (key) => !formElementKeys.includes(key),
    );
    if (missingKeys.length) {
      // Keys were present in the formComponentRef map, but not in the latest set of formGroupComponent elements provided
      missingKeys
        .filter(
          (missingKey) =>
            this.getFormComponentModel(missingKey).parent ===
            formGroupComponent,
        )
        .forEach((missingKey) => {
          // Remove component
          this.destroyFormComponent(missingKey);
        });
    }
  }

  private createNewFormComponent(
    formElement: IDynamicFormElement,
    formGroupComponent: IFormGroupComponent,
  ): FormComponentModel {
    return {
      componentRef: formGroupComponent.createFormComponent(
        formElement.component,
      ),
      parent: formGroupComponent,
      control: formGroupComponent.form.get(formElement.key),
    };
  }

  private deleteFormComponentRef(key: string) {
    this.formComponentRefs.delete(key);
  }

  private setFormComponentInputs(
    { componentRef, parent }: FormComponentModel,
    formElement: IDynamicFormElement,
  ) {
    componentRef.setInput('key', formElement.key);

    // this is an element implementing the IFormQuestion interface
    if (isFormQuestion(formElement)) {
      componentRef.setInput('formInitialised', this.formInitialised);
      componentRef.setInput('validators', formElement.validators);
      componentRef.setInput('asyncValidators', formElement.asyncValidators);
      componentRef.setInput('label', formElement.label);
      componentRef.setInput('value', formElement.value);
      componentRef.setInput('disabled', formElement.disabled);
      componentRef.setInput('linkedElements', formElement.linkedElements);

      if ('maxLength' in formElement) {
        componentRef.setInput('maxLength', formElement['maxLength']);
      }
      if ('additionalValidationMessages' in formElement) {
        componentRef.setInput(
          'additionalValidationMessages',
          formElement['additionalValidationMessages'],
        );
      }
      if ('type' in formElement) {
        componentRef.setInput('type', formElement['type']);
      }
      if ('icon' in formElement) {
        componentRef.setInput('icon', formElement['icon']);
      }
      if ('rows' in formElement) {
        componentRef.setInput('rows', formElement['rows']);
      }

      if ('allowMultiple' in formElement) {
        componentRef.setInput('allowMultiple', formElement['allowMultiple']);
      }
      if ('nullable' in formElement) {
        componentRef.setInput('nullable', formElement['nullable']);
      }
      if ('useSelectAll' in formElement) {
        componentRef.setInput('useSelectAll', formElement['useSelectAll']);
      }
      if ('noEntriesFoundLabel' in formElement) {
        componentRef.setInput(
          'noEntriesFoundLabel',
          formElement['noEntriesFoundLabel'],
        );
      }
      if ('useFilter' in formElement) {
        componentRef.setInput('useFilter', formElement['useFilter']);
      }
      if ('options' in formElement) {
        componentRef.setInput('options', formElement['options']);
      }

      if ('startView' in formElement) {
        componentRef.setInput('startView', formElement['startView']);
      }
      if ('mode' in formElement) {
        componentRef.setInput('mode', formElement['mode']);
      }
    }

    // this is an element implementing the IReactiveFormElement interface

    if ('dataSource' in formElement) {
      componentRef.setInput('dataSource', formElement['dataSource']);
    }
    if ('accumulateArguments' in formElement) {
      componentRef.setInput(
        'accumulateArguments',
        formElement['accumulateArguments'],
      );
    }

    // this is an element implementing the IFormAction interface
    if (isFormAction(formElement)) {
      componentRef.setInput('action', formElement.action);

      if ('color' in formElement) {
        componentRef.setInput('color', formElement['color']);
      }
      if ('icon' in formElement) {
        componentRef.setInput('icon', formElement['icon']);
      }
      if ('raised' in formElement) {
        componentRef.setInput('raised', formElement['raised']);
      }
    }

    // form group
    if (isFormGroup(formElement)) {
      // @fixme
      //   componentRef.setInput(
      //     'formElements',
      //     (formElement as DynamicFormGroup).formElements,
      //   );
      //   componentRef.setInput(
      //     'direction',
      //     (formElement as DynamicFormGroup).direction,
      //   );

      // provide form group
      componentRef.setInput('form', parent.form.get(formElement.key));
    }
  }
}
