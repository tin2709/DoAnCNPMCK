package com.example.InvoiceManage.service;

import com.example.InvoiceManage.DTO.Invoice;
import com.example.InvoiceManage.DTO.response.ProductResponse;
import com.example.InvoiceManage.entity.Product;
import com.example.InvoiceManage.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    // Sử dụng constructor injection là best practice
    @Autowired
    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // Lấy tất cả sản phẩm
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::convertToDto) // Chuyển đổi mỗi Product thành ProductDTO
                .collect(Collectors.toList());
    }

    // Lấy các sản phẩm đang hoạt động (active = true)
    public List<ProductResponse> getActiveProducts() {
        return productRepository.findByActive(true)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Lấy sản phẩm theo category
    public List<ProductResponse> getProductsByCategoryId(Integer categoryId) {
        return productRepository.findByIdCategory_Id(categoryId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Hàm tiện ích để chuyển đổi từ Entity sang DTO
    private ProductResponse convertToDto(Product product) {
        ProductResponse dto = new ProductResponse();
        dto.setId(product.getId());
        dto.setProductName(product.getProductName());
        dto.setImage(product.getImage());
        dto.setPrice(product.getPrice());
        dto.setDes(product.getDes());
        dto.setQuantity(product.getQuantity());

        // Xử lý để lấy tên Category, tránh lỗi NullPointerException nếu category null
        if (product.getIdCategory() != null) {
            dto.setCategoryName(product.getIdCategory().getName());
        }

        return dto;
    }
}