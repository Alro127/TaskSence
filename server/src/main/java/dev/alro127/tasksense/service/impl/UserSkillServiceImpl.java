package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.UserSkillEntity;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.UserSkillRequest;
import dev.alro127.tasksense.dto.response.UserSkillResponse;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.repository.jpa.UserSkillRepository;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.UserSkillService;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserSkillServiceImpl implements UserSkillService {

    private final UserSkillRepository userSkillRepository;
    private final UserRepository userRepository;
    private final SecurityService securityService;

    @Override
    public PageResponse<UserSkillResponse> getMySkills(Pageable pageable) {
        Long userId = securityService.getCurrentUserId();

        Page<UserSkillResponse> responsePage = userSkillRepository.findByUserId(userId, pageable)
                .map(UserSkillResponse::mapToResponse);

        return new PageResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages());
    }

    @Override
    public PageResponse<UserSkillResponse> getSkillsByUserId(Long userId, Pageable pageable) {
        Page<UserSkillResponse> responsePage = userSkillRepository.findByUserId(userId, pageable)
                .map(UserSkillResponse::mapToResponse);

        return new PageResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages());
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

        return UserSkillResponse.mapToResponse(userSkillRepository.save(skill));
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

        return UserSkillResponse.mapToResponse(userSkillRepository.save(skill));
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

}