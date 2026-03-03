package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.UserSkillEntity;
import dev.alro127.tasksense.dto.request.UserSkillRequest;
import dev.alro127.tasksense.dto.response.UserSkillResponse;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.repository.jpa.UserSkillRepository;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.UserSkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserSkillServiceImpl implements UserSkillService {

    private final UserSkillRepository userSkillRepository;
    private final UserRepository userRepository;
    private final SecurityService securityService;

    @Override
    public List<UserSkillResponse> getMySkills() {
        Long userId = securityService.getCurrentUserId();

        return userSkillRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserSkillResponse> getSkillsByUserId(Long userId) {
        return userSkillRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserSkillResponse addSkill(UserSkillRequest request) {

        Long userId = securityService.getCurrentUserId();

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserSkillEntity skill = UserSkillEntity.builder()
                .user(user)
                .skillName(request.getSkillName())
                .level(request.getLevel())
                .build();

        return mapToResponse(userSkillRepository.save(skill));
    }

    @Override
    public UserSkillResponse updateSkill(Long skillId, UserSkillRequest request) {

        Long currentUserId = securityService.getCurrentUserId();

        UserSkillEntity skill = userSkillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));

        if (!skill.getUser().getId().equals(currentUserId)) {
            throw new UnauthorizedException("You cannot modify this skill");
        }

        skill.setSkillName(request.getSkillName());
        skill.setLevel(request.getLevel());

        return mapToResponse(userSkillRepository.save(skill));
    }

    @Override
    public void deleteSkill(Long skillId) {

        Long currentUserId = securityService.getCurrentUserId();

        UserSkillEntity skill = userSkillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));

        if (!skill.getUser().getId().equals(currentUserId)) {
            throw new UnauthorizedException("You cannot delete this skill");
        }

        userSkillRepository.delete(skill);
    }

    private UserSkillResponse mapToResponse(UserSkillEntity entity) {
        return UserSkillResponse.builder()
                .id(entity.getId())
                .skillName(entity.getSkillName())
                .level(entity.getLevel())
                .build();
    }
}