# Guideline: Custom Validation Rule cho DTO

Tai lieu nay huong dan cach tao custom rule validator mo rong duoc, dung lai cho nhieu DTO trong backend.

## 1. Kien truc validation hien tai

Framework dang co san cac thanh phan sau:

- Annotation tong quat: `@ValidByRules`
  - File: `server/src/main/java/dev/alro127/tasksense/validation/ValidByRules.java`
- Rule contract: `DtoRuleValidator<T>`
  - File: `server/src/main/java/dev/alro127/tasksense/validation/DtoRuleValidator.java`
- Error collector: `ValidationErrors`
  - File: `server/src/main/java/dev/alro127/tasksense/validation/ValidationErrors.java`
- Rule engine chung: `GenericRulesConstraintValidator`
  - File: `server/src/main/java/dev/alro127/tasksense/validation/GenericRulesConstraintValidator.java`

DTO chi can gan `@ValidByRules(validator = XyzRulesValidator.class)` la se chay them custom rule ben canh Bean Validation (`@NotBlank`, `@Size`, ...).

## 2. Cach tao custom rule cho DTO moi

Vi du can tao rule cho `CreateProjectRequest`.

### Buoc 1: Tao class validator rieng

Dat file theo convention:

- Thu muc theo domain: `server/src/main/java/dev/alro127/tasksense/validation/<domain>/`
- Ten class: `<DtoName>RulesValidator`

Template:

```java
package dev.alro127.tasksense.validation.project;

import dev.alro127.tasksense.dto.request.CreateProjectRequest;
import dev.alro127.tasksense.validation.DtoRuleValidator;
import dev.alro127.tasksense.validation.ValidationErrors;
import org.springframework.stereotype.Component;

@Component
public class CreateProjectRequestRulesValidator implements DtoRuleValidator<CreateProjectRequest> {

    @Override
    public void validate(CreateProjectRequest target, ValidationErrors errors) {
        if (target.getStartDate() != null && target.getEndDate() != null
                && target.getEndDate().isBefore(target.getStartDate())) {
            errors.reject("endDate", "End date must be after or equal to start date");
        }

        if (target.getMemberIds() != null && target.getMemberIds().stream().distinct().count() != target.getMemberIds().size()) {
            errors.reject("memberIds", "Duplicate member IDs are not allowed");
        }
    }
}
```

### Buoc 2: Gan annotation vao DTO

```java
@ValidByRules(validator = CreateProjectRequestRulesValidator.class)
public class CreateProjectRequest {
    // fields...
}
```

### Buoc 3: Dam bao endpoint da dung @Valid

```java
public ResponseEntity<?> create(@Valid @RequestBody CreateProjectRequest request) {
    // ...
}
```

## 3. Rule nen dat o dau?

Dat trong custom rule khi la:

- Cross-field rule (so sanh nhieu field, vi du dueDate >= startDate)
- Rule list (khong duplicate, id phai > 0)
- Rule nghiep vu nhe de tai su dung cho nhieu endpoint

Giu lai Bean Validation annotation khi la:

- Rule don field: required, max length, pattern, range

Dat trong service khi la:

- Rule can truy cap DB phuc tap
- Rule can context user/quyen/phien dang nhap
- Rule co side effect hoac can transaction context

## 4. Truyen dependency vao custom rule

Custom validator la Spring bean (`@Component`), nen co the inject repository/service qua constructor.

```java
@Component
@RequiredArgsConstructor
public class CreateTaskRequestRulesValidator implements DtoRuleValidator<CreateTaskRequest> {

    private final SprintRepository sprintRepository;

    @Override
    public void validate(CreateTaskRequest target, ValidationErrors errors) {
        if (target.getSprintId() != null && !sprintRepository.existsById(target.getSprintId())) {
            errors.reject("sprintId", "Sprint not found");
        }
    }
}
```

Luu y: voi rule phu thuoc `projectId`, neu DTO khong co field nay thi nen validate tiep trong service, hoac bo sung context validation rieng.

## 5. Quy uoc de custom rule de bao tri

- Moi DTO mot class rule rieng.
- Moi rule check tach ra private method de de test va de mo rong.
- Message loi ro rang, de frontend map hien thi.
- Dung `errors.reject(field, message)` voi `field` dung ten property trong DTO.
- Uu tien fail-fast theo tung field (co the dung `putIfAbsent` nhu hien tai de tranh de message).

## 6. Quy trinh them rule moi

1. Mo class `...RulesValidator` cua DTO.
2. Them private method validate moi.
3. Goi method do trong `validate(...)`.
4. Chay build backend:

```bash
cd server
mvnw.cmd -q -DskipTests compile
```

5. Test API voi payload invalid de xac nhan `errors` tra ve dung field/message.

## 7. Vi du da co san trong du an

- DTO: `CreateTaskRequest`
  - File: `server/src/main/java/dev/alro127/tasksense/dto/request/CreateTaskRequest.java`
- Rule: `CreateTaskRequestRulesValidator`
  - File: `server/src/main/java/dev/alro127/tasksense/validation/task/CreateTaskRequestRulesValidator.java`

Rule hien tai gom:

- `dueDate` khong duoc nho hon `startDate`
- `tagIds` va `assigneeIds` khong cho phep id am/0/null
- `tagIds` va `assigneeIds` khong cho phep duplicate

---

Neu can mo rong tiep cho `UpdateTaskRequest`, co the tao `UpdateTaskRequestRulesValidator` voi chung pattern va gan `@ValidByRules` vao DTO tuong ung.
