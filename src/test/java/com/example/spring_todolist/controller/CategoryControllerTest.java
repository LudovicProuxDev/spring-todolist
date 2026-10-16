package com.example.spring_todolist.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import com.example.spring_todolist.dto.CategoryRequest;
import com.example.spring_todolist.dto.CategoryResponse;
import com.example.spring_todolist.exception.GlobalExceptionHandler;
import com.example.spring_todolist.exception.ResourceNotFoundException;
import com.example.spring_todolist.service.CategoryService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    @Mock
    private CategoryService categoryService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new CategoryController(categoryService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void findAll_shouldReturn200WithList() throws Exception {
        when(categoryService.findAll()).thenReturn(List.of(new CategoryResponse(1, "Urgent", "#FF0000")));

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].label").value("Urgent"));
    }

    @Test
    void findById_whenExists_shouldReturn200() throws Exception {
        when(categoryService.findById(1)).thenReturn(new CategoryResponse(1, "Urgent", "#FF0000"));

        mockMvc.perform(get("/api/categories/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("Urgent"));
    }

    @Test
    void findById_whenMissing_shouldReturn404() throws Exception {
        when(categoryService.findById(99)).thenThrow(new ResourceNotFoundException("introuvable"));

        mockMvc.perform(get("/api/categories/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_withValidPayload_shouldReturn201() throws Exception {
        when(categoryService.create(any(CategoryRequest.class)))
                .thenReturn(new CategoryResponse(1, "Urgent", "#FF0000"));

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CategoryRequest("Urgent", "#FF0000"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void create_withBlankLabel_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CategoryRequest(" ", null))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_whenExists_shouldReturn200() throws Exception {
        when(categoryService.update(eq(1), any(CategoryRequest.class)))
                .thenReturn(new CategoryResponse(1, "Nouveau", "#FFFFFF"));

        mockMvc.perform(put("/api/categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CategoryRequest("Nouveau", "#FFFFFF"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("Nouveau"));
    }

    @Test
    void delete_whenExists_shouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/categories/1"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        verify(categoryService).delete(1);
    }

    @Test
    void delete_whenMissing_shouldReturn404() throws Exception {
        org.mockito.Mockito.doThrow(new ResourceNotFoundException("introuvable"))
                .when(categoryService).delete(99);

        mockMvc.perform(delete("/api/categories/99"))
                .andExpect(status().isNotFound());
    }
}
