package com.example.spring_todolist.service;

import java.util.List;

import com.example.spring_todolist.dto.CategoryRequest;
import com.example.spring_todolist.dto.CategoryResponse;
import com.example.spring_todolist.entity.Category;
import com.example.spring_todolist.exception.ResourceInUseException;
import com.example.spring_todolist.exception.ResourceNotFoundException;
import com.example.spring_todolist.mapper.CategoryMapper;
import com.example.spring_todolist.repository.CategoryRepository;
import com.example.spring_todolist.repository.TaskRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TaskRepository taskRepository;
    private final CategoryMapper categoryMapper;

    public List<CategoryResponse> findAll() {
        return categoryMapper.toResponseList(categoryRepository.findAll());
    }

    public CategoryResponse findById(Integer id) {
        return categoryMapper.toResponse(getOrThrow(id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        Category saved = categoryRepository.save(categoryMapper.toEntity(request));
        return categoryMapper.toResponse(saved);
    }

    @Transactional
    public CategoryResponse update(Integer id, CategoryRequest request) {
        Category existing = getOrThrow(id);
        categoryMapper.updateEntity(request, existing);
        return categoryMapper.toResponse(categoryRepository.save(existing));
    }

    @Transactional
    public void delete(Integer id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Categorie introuvable : id=" + id);
        }
        // Verifie explicitement plutot que de laisser la cle etrangere task.category_id
        // faire echouer la suppression en base (erreur 500 peu parlante).
        if (taskRepository.existsByCategoryId(id)) {
            throw new ResourceInUseException("Categorie utilisee par au moins une tache : id=" + id
                    + ". Reaffectez ou supprimez ces taches avant de supprimer la categorie.");
        }
        categoryRepository.deleteById(id);
    }

    private Category getOrThrow(Integer id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categorie introuvable : id=" + id));
    }
}
