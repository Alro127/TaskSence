package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.UserSkillRequest;
import dev.alro127.tasksense.dto.response.UserSkillResponse;

import org.springframework.data.domain.Pageable;

public interface UserSkillService {

    PageResponse<UserSkillResponse> getMySkills(Pageable pageable);

    PageResponse<UserSkillResponse> getSkillsByUserId(Long userId, Pageable pageable);

    UserSkillResponse addSkill(UserSkillRequest request);

    UserSkillResponse updateSkill(Long skillId, UserSkillRequest request);

    void deleteSkill(Long skillId);
}