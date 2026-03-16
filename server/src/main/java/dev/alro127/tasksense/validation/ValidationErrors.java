package dev.alro127.tasksense.validation;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public class ValidationErrors {

    private final Map<String, String> errors = new LinkedHashMap<>();

    public void reject(String field, String message) {
        if (field == null || field.isBlank() || message == null || message.isBlank()) {
            return;
        }

        errors.putIfAbsent(field, message);
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }

    public Map<String, String> asMap() {
        return Collections.unmodifiableMap(errors);
    }
}
