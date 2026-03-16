package dev.alro127.tasksense.validation;

public interface DtoRuleValidator<T> {

    void validate(T target, ValidationErrors errors);
}
