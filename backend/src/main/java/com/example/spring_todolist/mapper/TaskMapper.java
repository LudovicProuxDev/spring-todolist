package com.example.spring_todolist.mapper;

import java.util.List;

import com.example.spring_todolist.dto.TaskRequest;
import com.example.spring_todolist.dto.TaskResponse;
import com.example.spring_todolist.entity.Task;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TaskMapper {

    private final CategoryMapper categoryMapper;

    public Task toEntity(TaskRequest request) {
        // La resolution de categoryId vers une Category (acces repository) est
        // a la charge du service : le mapper reste sans dependance a un repository.
        return Task.builder()
                .description(request.description())
                .build();
    }

    public void updateEntity(TaskRequest request, Task task) {
        task.setDescription(request.description());
    }

    public TaskResponse toResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getDescription(),
                task.getCreatedAt(),
                categoryMapper.toResponse(task.getCategory()));
    }

    public List<TaskResponse> toResponseList(List<Task> tasks) {
        return tasks.stream().map(this::toResponse).toList();
    }
}
