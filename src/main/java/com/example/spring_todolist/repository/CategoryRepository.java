package com.example.spring_todolist.repository;

import com.example.spring_todolist.entity.Category;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
}
