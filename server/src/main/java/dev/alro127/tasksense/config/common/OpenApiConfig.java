package dev.alro127.tasksense.config.common;

import dev.alro127.tasksense.config.security.HostConfig;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class OpenApiConfig {
    private final HostConfig config;
    @Bean
    public OpenAPI openAPI() {
        List<Server> serverList = getServerList();

        Contact contact = new Contact()
                .name(" Development Team")
                .email("dev@tasksense.com")
                .url("https://tasksense.trade");

        License license = new License()
                .name("MIT License")
                .url("https://opensource.org/licenses/MIT");

        Info info = new Info()
                .title("TaskSense API")
                .version("1.0.0")
                .description("""
                TaskSense - Smart Task & Project Management Platform API
                
                ## Authentication
                This API supports the following authentication methods:
                
                1. **Bearer Token (JWT)**
                   Use the `Authorization` header with the format:
                   `Bearer <your-access-token>`
                
                2. **Cookie Authentication**  
                   Use the `ACCESS_TOKEN` cookie (automatically set after login).
                
                ## Getting Started
                
                1. Register a new account using `/auth/register`
                2. Login via `/auth/login` to receive your access token
                3. Include the token in the Authorization header or rely on the cookie
                   to access protected endpoints
                
                ## Notes
                - Access tokens are required for all secured APIs.
                - Make sure your token is valid and not expired.
                """)
                .contact(contact)
                .license(license);

        Components components = new Components()
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("""
                        JWT Bearer Authentication
                        
                        Enter your JWT token only (without the word 'Bearer').
                        Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                        
                        You can obtain this token from the `/auth/login` endpoint.
                        """))
                .addSecuritySchemes("cookieAuth", new SecurityScheme()
                        .type(SecurityScheme.Type.APIKEY)
                        .in(SecurityScheme.In.COOKIE)
                        .name("ACCESS_TOKEN")
                        .description("""
                        Cookie-based Authentication
                        
                        The `ACCESS_TOKEN` cookie is automatically set
                        after a successful login and used for authenticated requests.
                        """));

        List<SecurityRequirement> securityRequirements = new ArrayList<>();
        securityRequirements.add(new SecurityRequirement().addList("bearerAuth"));
        securityRequirements.add(new SecurityRequirement().addList("cookieAuth"));

        return new OpenAPI()
                .info(info)
                .servers(serverList)
                .components(components)
                .security(securityRequirements);
    }

    private List<Server> getServerList() {
        List<Server> serverList = new ArrayList<>();
        var localServer = new Server();
        localServer.setUrl(String.format("http://localhost:%s%s", config.getPort(), config.getServlet().getContextPath()));
        localServer.setDescription("Local Development Server");
        serverList.add(localServer);
        return serverList;
    }
}
