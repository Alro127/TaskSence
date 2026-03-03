package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.UserSkillRequest;
import dev.alro127.tasksense.dto.response.UserSkillResponse;

import java.util.List;

public interface UserSkillService {

    List<UserSkillResponse> getMySkills();

    List<UserSkillResponse> getSkillsByUserId(Long userId);

    UserSkillResponse addSkill(UserSkillRequest request);

    UserSkillResponse updateSkill(Long skillId, UserSkillRequest request);

    void deleteSkill(Long skillId);
}