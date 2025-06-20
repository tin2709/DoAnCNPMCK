package com.example.InvoiceManage.repository;

import com.example.InvoiceManage.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    // Spring Data JPA sẽ tự động tạo câu query để tìm các sản phẩm đang "active"
    List<Product> findByActive(Boolean active);

    // Tìm sản phẩm theo ID của category
    // Cú pháp: findBy[Tên trường trong Entity]_[Tên trường của Entity liên kết]
    List<Product> findByIdCategory_Id(Integer categoryId);
}