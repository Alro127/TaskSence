package dev.alro127.tasksense.service.subcriber;

import com.fasterxml.jackson.databind.ObjectMapper;

import dev.alro127.tasksense.domain.enums.EmailType;
import dev.alro127.tasksense.dto.message.EmailMessage;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
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

        System.out.println("EmailSubscriber received message");

        try {

            String body = new String(message.getBody());

            EmailMessage emailMessage = objectMapper.readValue(body, EmailMessage.class);

            switch (emailMessage.getType()) {

                case AUTH_VERIFY -> sendVerifyEmail(emailMessage);

                case AUTH_RESET_PASSWORD -> sendResetPasswordEmail(emailMessage);

                case NOTIFICATION -> sendNotificationEmail(emailMessage);

                case SIMPLE -> sendSimpleEmail(emailMessage);
                default -> throw new IllegalStateException("Unexpected value: " + emailMessage.getType());
            }

        } catch (Exception e) {
            System.err.println("Failed to process email message: " + e.getMessage());
        }
    }

    private void sendSimpleEmail(EmailMessage emailMessage) throws Exception {

        MimeMessage mimeMessage = mailSender.createMimeMessage();

        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        helper.setTo(emailMessage.getTo());
        helper.setSubject(emailMessage.getSubject());
        helper.setText(emailMessage.getContent(), true);

        mailSender.send(mimeMessage);
    }

    private void sendVerifyEmail(EmailMessage message) throws Exception {
        sendSimpleEmail(message);
    }

    private void sendResetPasswordEmail(EmailMessage message) throws Exception {
        sendSimpleEmail(message);
    }

    private void sendNotificationEmail(EmailMessage message) throws Exception {
        sendSimpleEmail(message);
    }
}