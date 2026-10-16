package com.example.spring_todolist.service;

import java.util.List;

import com.example.spring_todolist.dto.UserCreateRequest;
import com.example.spring_todolist.dto.UserResponse;
import com.example.spring_todolist.dto.UserUpdateRequest;
import com.example.spring_todolist.entity.User;
import com.example.spring_todolist.exception.DuplicateResourceException;
import com.example.spring_todolist.exception.ResourceNotFoundException;
import com.example.spring_todolist.mapper.UserMapper;
import com.example.spring_todolist.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private static final String DEFAULT_ROLE = "ROLE_USER";

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse register(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Ce nom d'utilisateur est deja pris : " + request.username());
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Cette adresse email est deja utilisee : " + request.email());
        }

        User user = userMapper.toEntity(request);
        user.setRoles(List.of(DEFAULT_ROLE));
        hashPendingPlainPassword(user);

        return userMapper.toResponse(userRepository.save(user));
    }

    public List<UserResponse> findAll() {
        return userMapper.toResponseList(userRepository.findAll());
    }

    public UserResponse findById(Integer id) {
        return userMapper.toResponse(getOrThrow(id));
    }

    @Transactional
    public UserResponse update(Integer id, UserUpdateRequest request) {
        User existing = getOrThrow(id);
        userMapper.updateEntity(request, existing);
        hashPendingPlainPassword(existing);
        return userMapper.toResponse(userRepository.save(existing));
    }

    @Transactional
    public void delete(Integer id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Utilisateur introuvable : id=" + id);
        }
        userRepository.deleteById(id);
    }

    /**
     * Utilise par la couche authentification pour charger un utilisateur
     * avec son mot de passe hache et ses roles.
     */
    public User findEntityByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : username=" + username));
    }

    /** Utilise par GET /api/users/me : le profil de l'utilisateur authentifie. */
    public UserResponse findByUsername(String username) {
        return userMapper.toResponse(findEntityByUsername(username));
    }

    private User getOrThrow(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : id=" + id));
    }

    /**
     * Hache plainPassword vers password puis efface plainPassword, s'il y a
     * un mot de passe en attente de hachage (inscription, ou changement de
     * mot de passe lors d'une mise a jour).
     */
    private void hashPendingPlainPassword(User user) {
        if (user.getPlainPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPlainPassword()));
            user.setPlainPassword(null);
        }
    }
}
