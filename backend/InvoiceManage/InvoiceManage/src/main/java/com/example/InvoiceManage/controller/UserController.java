package com.example.InvoiceManage.controller;

import com.example.InvoiceManage.entity.User;
import com.example.InvoiceManage.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService userService;
    @GetMapping
    List<User> getUsers() { return userService.getUsers(); }
}
