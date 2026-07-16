package com.obracerta.services;

import com.obracerta.enums.UserRole;
import com.obracerta.model.dto.UserDTO;
import com.obracerta.model.entity.User;
import com.obracerta.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

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
        User userEntity = userRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Usuário não encontrado com o id: " + id));
        userRepository.delete(userEntity);
    }

    public UserDTO getUserById(String id){
        return new UserDTO(userRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Usuário não encontrado com o id: " + id)));
    }

    public void updateRole(String id, UserRole role){
        User userEntity = userRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Usuário não encontrado com o id: " + id));
        userEntity.setUserRole(role);
        userRepository.save(userEntity);
    }

    // public UserDTO getUserByEmail(String email){
    //     return new UserDTO(userRepository.findByEmail(email).orElseThrow(() -> new NoSuchElementException("Usuário não encontrado com o e-mail: " + email)));
    // }

}
