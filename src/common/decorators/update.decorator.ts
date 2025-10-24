import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator"

@ValidatorConstraint({name:"check_fields_exist",async:false})
export class CheckIfAnyFieldsAreApplied implements ValidatorConstraintInterface
{
    validate(value: any, args: ValidationArguments)
    {
        return Object.keys(args.object).length > 0 && Object.values(args.object).filter((arg) => arg !== undefined).length > 0;    
    }

    defaultMessage(validationArguments?: ValidationArguments): string
    {
        return "All Update fields are empty";
    }
}

export function ContainField(validationOptions?: ValidationOptions)
{
    return function (constructor: Function)
    {
        registerDecorator({
            target: constructor,
            propertyName: undefined!,
            options: validationOptions,
            constraints: [],
            validator: CheckIfAnyFieldsAreApplied
        })
    }
}
