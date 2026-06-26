package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.TagEntity;
import dev.alro127.tasksense.dto.request.CreateTagRequest;
import dev.alro127.tasksense.dto.request.UpdateTagRequest;
import dev.alro127.tasksense.dto.response.TagResponse;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.repository.jpa.TagRepository;
import dev.alro127.tasksense.service.TagService;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;
    private final ProjectRepository projectRepository;

    @Override
    public TagResponse createTag(Long projectId, CreateTagRequest request) {

        return tagRepository.findByNameIncludingDeleted(projectId, request.getName())
                .map(existingTag -> {
                    if (existingTag.getDeletedAt() == null) {
                        throw new IllegalArgumentException("Tag name already exists in project");
                    }
                    // Reactivate soft-deleted tag
                    existingTag.setDeletedAt(null);
                    existingTag.setColor(request.getColor());
                    tagRepository.save(existingTag);
                    return TagResponse.mapToResponse(existingTag);
                })
                .orElseGet(() -> {
                    ProjectEntity project = projectRepository.findById(projectId)
                            .orElseThrow(() -> new EntityNotFoundException("Project not found"));

                    TagEntity tag = TagEntity.builder()
                            .name(request.getName())
                            .color(request.getColor())
                            .project(project)
                            .build();

                    tagRepository.save(tag);

                    return TagResponse.mapToResponse(tag);
                });
    }

    @Override
    public TagResponse updateTag(Long projectId, Long tagId, UpdateTagRequest request) {

        TagEntity tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new EntityNotFoundException("Tag not found"));

        if (!tag.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("Tag not found");
        }

        // Check if new name conflicts with another tag (active or deleted)
        tagRepository.findByNameIncludingDeleted(projectId, request.getName())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(tagId)) {
                        throw new IllegalArgumentException("Tag name already exists in project");
                    }
                });

        tag.setName(request.getName());
        tag.setColor(request.getColor());

        tagRepository.save(tag);

        return TagResponse.mapToResponse(tag);
    }

    @Override
    public void deleteTag(Long projectId, Long tagId) {

        TagEntity tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new EntityNotFoundException("Tag not found"));

        if (!tag.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("Tag not found");
        }

        tag.setDeletedAt(OffsetDateTime.now());

        tagRepository.save(tag);
    }

    @Override
    public List<TagResponse> getTagsByProject(Long projectId) {

        return tagRepository.findByProjectId(projectId)
                .stream()
                .map(TagResponse::mapToResponse)
                .toList();
    }

}