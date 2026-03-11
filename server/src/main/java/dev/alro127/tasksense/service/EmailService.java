package dev.alro127.tasksense.service;

import dev.alro127.tasksense.config.common.AppConfig;
import dev.alro127.tasksense.domain.enums.EmailType;
import dev.alro127.tasksense.domain.enums.OutboxEventType;
import dev.alro127.tasksense.dto.message.EmailMessage;
import dev.alro127.tasksense.service.publisher.EmailPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final EmailPublisher publisher;
    private final AppConfig appConfig;
    private final OutboxEventService outboxEventService;

    private void dispatchEmail(EmailMessage message) {

        Long outboxId = outboxEventService.publishEvent(
                OutboxEventType.EMAIL,
                null,
                null,
                message
        );

        try {

            publisher.publish(message);
            outboxEventService.markSuccess(outboxId);

        } catch (Exception e) {
            System.out.println("Realtime publish failed, worker will retry");
        }
    }

    public void sendWorkspaceInviteEmail(String to, String rawToken) {

        String invitationLink = appConfig.getFrontendUrl() + "/workspaces/invitation?token=" + rawToken;

        String htmlContent = """
                <div style="font-family: Arial, sans-serif;">
                    <h2>Workspace Invitation</h2>
                    <p>You have been invited to join a workspace.</p>
                    <p>Click the button below to accept the invitation:</p>

                    <div style="text-align:center; margin:20px 0;">
                        <a href="%s"
                           style="
                             background-color:#4CAF50;
                             color:white;
                             padding:12px 24px;
                             text-decoration:none;
                             border-radius:6px;
                             display:inline-block;
                             font-weight:bold;">
                           Join Workspace
                        </a>
                    </div>

                    <p>If the button doesn’t work, copy this link:</p>
                    <p>%s</p>

                    <p>This link will expire in 15 minutes.</p>
                </div>
                """.formatted(invitationLink, invitationLink);

        EmailMessage message = EmailMessage.builder()
                .type(EmailType.NOTIFICATION)
                .to(to)
                .subject("Workspace Invitation")
                .content(htmlContent)
                .build();

        dispatchEmail(message);
    }

    public void sendVerifyEmail(String to, String otp) {

        EmailMessage message = EmailMessage.builder()
                .type(EmailType.AUTH_VERIFY)
                .to(to)
                .subject("Your OTP Code")
                .content("Your OTP is: " + otp)
                .build();

        dispatchEmail(message);
    }

    public void sendResetPasswordEmail(String to, String rawToken) {
        String resetLink = appConfig.getFrontendUrl() + "/auth/reset-password?token=" + rawToken;

        String htmlContent = """
                <div style="font-family: Arial, sans-serif;">
                    <h2>Password Reset Request</h2>
                    <p>We received a request to reset your password.</p>
                    <p>Click the button below to reset it:</p>

                    <div style="text-align:center; margin:20px 0;">
                        <a href="%s"
                           style="
                             background-color:#4CAF50;
                             color:white;
                             padding:12px 24px;
                             text-decoration:none;
                             border-radius:6px;
                             display:inline-block;
                             font-weight:bold;">
                           Reset Your Password
                        </a>
                    </div>

                    <p>If the button doesn’t work, copy this link:</p>
                    <p>%s</p>

                    <p>This link will expire in 15 minutes.</p>
                </div>
                """.formatted(resetLink, resetLink);

        EmailMessage message = EmailMessage.builder()
                .type(EmailType.AUTH_RESET_PASSWORD)
                .to(to)
                .subject("Reset Your Password")
                .content(htmlContent)
                .build();

        dispatchEmail(message);
    }
}
