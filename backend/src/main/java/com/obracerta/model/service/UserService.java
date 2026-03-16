package com.obracerta.model.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.obracerta.model.dto.UserDTO;
import com.obracerta.model.entity.User;
import com.obracerta.model.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<UserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream().map(UserDTO::new).toList();
    }

    public void createUser(UserDTO user) {
        User userEntity = new User(user);
        userRepository.save(userEntity);
    }

    public UserDTO updateUser(UserDTO user){
        User userEntity = new User(user);
        return new UserDTO(userRepository.save(userEntity));
    }

    public void deleteUser(Long id){
        User userEntity = userRepository.findById(id).get();
        userRepository.delete(userEntity);
    }

    public UserDTO getUserById(Long id){
        return new UserDTO(userRepository.findById(id).get());
    }

    // public UserDTO getUserByEmail(String email){
    //     return new UserDTO(userRepository.findByEmail(email).get());
    // }

}
