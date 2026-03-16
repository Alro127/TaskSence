package dev.alro127.tasksense.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class GenericRulesConstraintValidator implements ConstraintValidator<ValidByRules, Object> {

    private final ApplicationContext applicationContext;
    private DtoRuleValidator<Object> validator;

    public GenericRulesConstraintValidator(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    @Override
    @SuppressWarnings("unchecked")
    public void initialize(ValidByRules constraintAnnotation) {
        Class<? extends DtoRuleValidator<?>> validatorClass = constraintAnnotation.validator();
        this.validator = (DtoRuleValidator<Object>) applicationContext.getBean(validatorClass);
    }

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        ValidationErrors errors = new ValidationErrors();
        validator.validate(value, errors);

        if (!errors.hasErrors()) {
            return true;
        }

        context.disableDefaultConstraintViolation();
        errors.asMap().forEach((field, message) -> context
                .buildConstraintViolationWithTemplate(message)
                .addPropertyNode(field)
                .addConstraintViolation());

        return false;
    }
}
