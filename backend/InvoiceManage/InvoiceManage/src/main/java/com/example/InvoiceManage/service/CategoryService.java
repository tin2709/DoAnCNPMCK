package com.example.InvoiceManage.service;

import com.example.InvoiceManage.entity.Category;
import com.example.InvoiceManage.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service // Đánh dấu đây là một Bean của Spring
public class CategoryService {
    @Autowired
    private CategoryRepository categoryRepository;



    /**
     * Lấy tất cả các danh mục từ cơ sở dữ liệu.
     * @return một danh sách các Entity Category.
     */
    public List<Category> getAllCategories() {
        // Gọi repository để lấy và trả về trực tiếp danh sách các Entity
        return categoryRepository.findAll();
    }
}