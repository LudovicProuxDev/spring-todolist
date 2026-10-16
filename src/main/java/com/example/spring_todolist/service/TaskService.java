package com.example.spring_todolist.service;

import java.util.List;

import com.example.spring_todolist.dto.TaskRequest;
import com.example.spring_todolist.dto.TaskResponse;
import com.example.spring_todolist.entity.Category;
import com.example.spring_todolist.entity.Task;
import com.example.spring_todolist.exception.ResourceNotFoundException;
import com.example.spring_todolist.mapper.TaskMapper;
import com.example.spring_todolist.repository.CategoryRepository;
import com.example.spring_todolist.repository.TaskRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;
    private final CategoryRepository categoryRepository;
    private final TaskMapper taskMapper;

    public List<TaskResponse> findAll(Integer categoryId) {
        List<Task> tasks = categoryId != null
                ? taskRepository.findByCategoryId(categoryId)
                : taskRepository.findAll();
        return taskMapper.toResponseList(tasks);
    }

    public TaskResponse findById(Integer id) {
        return taskMapper.toResponse(getOrThrow(id));
    }

    @Transactional
    public TaskResponse create(TaskRequest request) {
        Task task = taskMapper.toEntity(request);
        task.setCategory(resolveCategoryOrNull(request.categoryId()));
        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse update(Integer id, TaskRequest request) {
        Task existing = getOrThrow(id);
        taskMapper.updateEntity(request, existing);
        existing.setCategory(resolveCategoryOrNull(request.categoryId()));
        return taskMapper.toResponse(taskRepository.save(existing));
    }

    @Transactional
    public void delete(Integer id) {
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Tache introuvable : id=" + id);
        }
        taskRepository.deleteById(id);
    }

    private Task getOrThrow(Integer id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tache introuvable : id=" + id));
    }

    private Category resolveCategoryOrNull(Integer categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Categorie introuvable : id=" + categoryId));
    }
}
