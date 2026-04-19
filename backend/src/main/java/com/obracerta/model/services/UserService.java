package com.obracerta.model.services;

import com.obracerta.model.dto.UserDTO;
import com.obracerta.model.entity.User;
import com.obracerta.model.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public void deleteUser(String id){
        User userEntity = userRepository.findById(id).get();
        userRepository.delete(userEntity);
    }

    public UserDTO getUserById(String id){
        return new UserDTO(userRepository.findById(id).get());
    }

    // public UserDTO getUserByEmail(String email){
    //     return new UserDTO(userRepository.findByEmail(email).get());
    // }

}
