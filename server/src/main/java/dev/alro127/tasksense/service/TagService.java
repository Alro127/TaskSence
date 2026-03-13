package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.CreateTagRequest;
import dev.alro127.tasksense.dto.request.UpdateTagRequest;
import dev.alro127.tasksense.dto.response.TagResponse;

import java.util.List;

public interface TagService {

    TagResponse createTag(Long projectId, CreateTagRequest request);

    TagResponse updateTag(Long tagId, UpdateTagRequest request);

    void deleteTag(Long tagId);

    List<TagResponse> getTagsByProject(Long projectId);
}