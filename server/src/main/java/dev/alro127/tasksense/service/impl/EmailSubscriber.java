package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.dto.message.EmailMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailSubscriber implements MessageListener {

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(@NonNull Message message, byte[] pattern) {

        try {
            String body = new String(message.getBody());

            EmailMessage emailMessage =
                    objectMapper.readValue(body, EmailMessage.class);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(emailMessage.getTo());
            helper.setSubject(emailMessage.getSubject());
            helper.setText(emailMessage.getContent(), true); // true = HTML

            mailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("Failed to process email message: " + e.getMessage());
        }
    }
}
