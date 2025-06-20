package com.example.InvoiceManage.repository;

import com.example.InvoiceManage.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {
    // Không cần viết thêm gì
}