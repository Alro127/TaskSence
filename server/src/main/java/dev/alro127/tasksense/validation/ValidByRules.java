package dev.alro127.tasksense.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = GenericRulesConstraintValidator.class)
public @interface ValidByRules {

    String message() default "Request data is invalid";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    Class<? extends DtoRuleValidator<?>> validator();
}
