package com.example.thesis.config;

import com.example.thesis.security.CustomUserDetailsService;
import com.example.thesis.security.JwtTokenProvider;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

@Component
public class StompJwtChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    public StompJwtChannelInterceptor(JwtTokenProvider tokenProvider,
                                      CustomUserDetailsService userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = resolveBearer(accessor.getNativeHeader("Authorization"));
            if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
                String username = tokenProvider.getUsernameFromToken(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                accessor.setUser(auth);
            }
            return message;
        }

        if (accessor.getUser() instanceof UsernamePasswordAuthenticationToken auth) {
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        return message;
    }

    @Override
    public void afterSendCompletion(@NonNull Message<?> message, @NonNull MessageChannel channel,
                                    boolean sent, Exception ex) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && !StompCommand.CONNECT.equals(accessor.getCommand())) {
            SecurityContextHolder.clearContext();
        }
    }

    private String resolveBearer(List<String> headers) {
        if (headers == null || headers.isEmpty()) {
            return null;
        }
        String raw = headers.get(0);
        if (!StringUtils.hasText(raw) || !raw.startsWith("Bearer ")) {
            return null;
        }
        return raw.substring(7);
    }
}
