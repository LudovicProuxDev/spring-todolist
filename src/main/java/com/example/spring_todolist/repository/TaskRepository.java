package com.example.spring_todolist.repository;

import java.util.List;

import com.example.spring_todolist.entity.Task;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Integer> {

    List<Task> findByCategoryId(Integer categoryId);
}
