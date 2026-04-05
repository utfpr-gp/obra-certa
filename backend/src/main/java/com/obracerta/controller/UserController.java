package com.obracerta.controller;

import com.obracerta.model.dto.UserDTO;
import com.obracerta.model.entity.User;
import com.obracerta.model.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity getAllUsers(){
        List<UserDTO> users = userService.getAllUsers();
        return userService.getAllUsers();
    }

    @PostMapping
    public void createUser(@Valid @RequestBody UserDTO user){
        User newUser = new User(user);

        this.repository.save(newUser);
        return ResponseEntity.ok().build();
    }

    @PutMapping
    public UserDTO updateUser(@Valid @RequestBody UserDTO user){
        return userService.updateUser(user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") String id){
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

}
