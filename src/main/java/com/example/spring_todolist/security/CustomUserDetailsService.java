package com.example.spring_todolist.security;

import com.example.spring_todolist.entity.User;
import com.example.spring_todolist.exception.ResourceNotFoundException;
import com.example.spring_todolist.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserService userService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user;
        try {
            user = userService.findEntityByUsername(username);
        } catch (ResourceNotFoundException e) {
            throw new UsernameNotFoundException("Utilisateur introuvable : " + username, e);
        }

        return new AppUserDetails(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                user.getRoles().stream().map(role -> new SimpleGrantedAuthority(role.name())).toList());
    }
}
