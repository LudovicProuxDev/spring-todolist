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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import com.example.spring_todolist.dto.CategoryResponse;
import com.example.spring_todolist.dto.TaskRequest;
import com.example.spring_todolist.dto.TaskResponse;
import com.example.spring_todolist.exception.GlobalExceptionHandler;
import com.example.spring_todolist.exception.ResourceNotFoundException;
import com.example.spring_todolist.service.TaskService;

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
class TaskControllerTest {

    @Mock
    private TaskService taskService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TaskController(taskService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void findAll_withoutCategoryId_shouldReturnAllTasks() throws Exception {
        when(taskService.findAll(null)).thenReturn(List.of(new TaskResponse(1, "A", null, null)));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void findAll_withCategoryId_shouldFilterByCategory() throws Exception {
        when(taskService.findAll(1)).thenReturn(List.of(new TaskResponse(
                1, "A", null, new CategoryResponse(1, "Travail", null))));

        mockMvc.perform(get("/api/tasks").param("categoryId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category.id").value(1));
    }

    @Test
    void findById_whenMissing_shouldReturn404() throws Exception {
        when(taskService.findById(99)).thenThrow(new ResourceNotFoundException("introuvable"));

        mockMvc.perform(get("/api/tasks/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_withValidPayload_shouldReturn201() throws Exception {
        when(taskService.create(any(TaskRequest.class)))
                .thenReturn(new TaskResponse(1, "Faire les courses", null, null));

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TaskRequest("Faire les courses", null))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("Faire les courses"));
    }

    @Test
    void create_withInvalidCategoryId_shouldReturn404() throws Exception {
        when(taskService.create(any(TaskRequest.class))).thenThrow(new ResourceNotFoundException("introuvable"));

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TaskRequest("Rapport", 99))))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_withBlankDescription_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TaskRequest(" ", null))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_whenExists_shouldReturn200() throws Exception {
        when(taskService.update(eq(1), any(TaskRequest.class)))
                .thenReturn(new TaskResponse(1, "Nouvelle", null, null));

        mockMvc.perform(put("/api/tasks/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TaskRequest("Nouvelle", null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Nouvelle"));
    }

    @Test
    void delete_whenExists_shouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/tasks/1"))
                .andExpect(status().isNoContent());

        verify(taskService).delete(1);
    }
}
