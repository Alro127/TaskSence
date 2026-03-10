-- ============================================================
-- TaskSense Seed Data
-- Password for ALL users: "password"
-- BCrypt hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- ============================================================

-- ==================== USERS ====================
INSERT INTO users (id, email, password_hash, full_name, is_active, avatar_url, phone, gender, dob, bio) VALUES
    (1, 'alice@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alice Nguyen', TRUE, 'https://i.pravatar.cc/150?u=alice', '+84901000001', 'FEMALE', '1995-03-15', 'Full-stack developer & tech lead.'),
    (2, 'bob@example.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bob Tran',     TRUE, 'https://i.pravatar.cc/150?u=bob',   '+84901000002', 'MALE',   '1993-07-22', 'Project manager with 5 years of experience.'),
    (3, 'carol@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carol Le',     TRUE, 'https://i.pravatar.cc/150?u=carol', '+84901000003', 'FEMALE', '1997-11-08', 'Frontend developer passionate about UI/UX.'),
    (4, 'dave@example.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dave Pham',    TRUE, 'https://i.pravatar.cc/150?u=dave',  '+84901000004', 'MALE',   '1996-05-30', 'Backend developer focused on Java & Spring Boot.'),
    (5, 'eve@example.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Eve Hoang',    TRUE, 'https://i.pravatar.cc/150?u=eve',   '+84901000005', 'FEMALE', '1998-02-14', 'QA engineer and product designer.')
ON CONFLICT DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ==================== USER SKILLS ====================
INSERT INTO user_skills (id, user_id, skill_name, level) VALUES
    (1,  1, 'Java',        5),
    (2,  1, 'React',       4),
    (3,  1, 'PostgreSQL',  4),
    (4,  2, 'Scrum',       5),
    (5,  2, 'Jira',        4),
    (6,  3, 'React',       5),
    (7,  3, 'TypeScript',  5),
    (8,  3, 'CSS',         4),
    (9,  4, 'Java',        5),
    (10, 4, 'Spring Boot', 5),
    (11, 4, 'Docker',      3),
    (12, 5, 'Testing',     4),
    (13, 5, 'Figma',       3)
ON CONFLICT DO NOTHING;

SELECT setval('user_skills_id_seq', (SELECT MAX(id) FROM user_skills));

-- ==================== TEAM TEMPLATES ====================
INSERT INTO team_templates (id, owner_id, name, description) VALUES
    (1, 1, 'Frontend Team', 'Standard frontend development team'),
    (2, 1, 'Backend Team',  'Standard backend development team')
ON CONFLICT DO NOTHING;

SELECT setval('team_templates_id_seq', (SELECT MAX(id) FROM team_templates));

INSERT INTO team_member_templates (team_template_id, user_id) VALUES
    (1, 1), (1, 3), (1, 5),
    (2, 1), (2, 4)
ON CONFLICT DO NOTHING;

-- ==================== WORKSPACES ====================
INSERT INTO workspaces (id, name, description, owner_id, is_public) VALUES
    (1, 'TechCorp', 'Main workspace for TechCorp development teams',  1, TRUE),
    (2, 'StartupX', 'Private workspace for StartupX product teams',   2, FALSE)
ON CONFLICT DO NOTHING;

SELECT setval('workspaces_id_seq', (SELECT MAX(id) FROM workspaces));

-- ==================== WORKSPACE MEMBERS ====================
INSERT INTO workspace_members (workspace_id, user_id, role) VALUES
    (1, 1, 'OWNER'),
    (1, 2, 'MANAGER'),
    (1, 3, 'MEMBER'),
    (1, 4, 'MEMBER'),
    (1, 5, 'VIEWER'),
    (2, 2, 'OWNER'),
    (2, 3, 'MEMBER'),
    (2, 4, 'MEMBER')
ON CONFLICT DO NOTHING;

-- ==================== WORKSPACE JOIN REQUESTS ====================
INSERT INTO workspace_join_requests (id, workspace_id, user_id, status, message, reviewed_by, reviewed_at) VALUES
    (1, 1, 5, 'APPROVED', 'Hi, I would like to join TechCorp as a QA reviewer.', 1, '2026-01-05 10:00:00+07')
ON CONFLICT DO NOTHING;

SELECT setval('workspace_join_requests_id_seq', (SELECT MAX(id) FROM workspace_join_requests));

-- ==================== WORKSPACE INVITES ====================
INSERT INTO workspace_invites (workspace_id, email, role, token, status, invited_by, invited_at, expired_at) VALUES
    (1, 'frank@example.com', 'MEMBER', 'inv_tc_frank_abc123xyz', 'PENDING', 1, '2026-03-01 09:00:00+07', '2026-03-08 09:00:00+07'),
    (2, 'grace@example.com', 'MEMBER', 'inv_sx_grace_def456uvw', 'PENDING', 2, '2026-03-05 14:00:00+07', '2026-03-12 14:00:00+07')
ON CONFLICT DO NOTHING;

-- ==================== PROJECTS ====================
INSERT INTO projects (id, workspace_id, name, description, status, start_date, end_date) VALUES
    (1, 1, 'Website Redesign', 'Complete redesign of the company website',         'ACTIVE',  '2026-01-01', '2026-06-30'),
    (2, 1, 'Mobile App',       'Build a cross-platform mobile application',        'ACTIVE',  '2026-02-01', '2026-09-30'),
    (3, 2, 'MVP Development',  'Develop the minimum viable product for StartupX',  'ACTIVE',  '2026-01-15', '2026-05-31'),
    (4, 2, 'Marketing Site',   'Landing page and marketing website',               'ON_HOLD', '2026-03-01', '2026-04-30')
ON CONFLICT DO NOTHING;

SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));

-- ==================== PROJECT MEMBERS ====================
INSERT INTO project_members (project_id, user_id, role) VALUES
    (1, 1, 'MANAGER'),
    (1, 3, 'MEMBER'),
    (1, 5, 'VIEWER'),
    (2, 1, 'MANAGER'),
    (2, 3, 'MEMBER'),
    (2, 4, 'MEMBER'),
    (3, 2, 'MANAGER'),
    (3, 4, 'MEMBER'),
    (3, 3, 'MEMBER'),
    (4, 2, 'MANAGER'),
    (4, 3, 'MEMBER')
ON CONFLICT DO NOTHING;

-- ==================== PROJECT JOIN REQUESTS ====================
INSERT INTO project_join_requests (project_id, user_id, status, message) VALUES
    (3, 5, 'PENDING', 'I have experience in QA and would love to contribute to the MVP.')
ON CONFLICT DO NOTHING;

-- ==================== SPRINTS ====================
INSERT INTO sprints (id, project_id, name, goal, status, start_date, end_date, created_by) VALUES
    (1, 1, 'Sprint 1', 'Set up project structure and design system',    'COMPLETED', '2026-01-01', '2026-01-14', 1),
    (2, 1, 'Sprint 2', 'Implement homepage, about and contact pages',   'ACTIVE',    '2026-01-15', '2026-01-28', 1),
    (3, 1, 'Sprint 3', 'Implement blog section and SEO optimization',   'PLANNING',  '2026-01-29', '2026-02-11', 1),
    (4, 2, 'Sprint 1', 'Mobile app scaffold and authentication flows',  'ACTIVE',    '2026-02-01', '2026-02-14', 1),
    (5, 3, 'Sprint 1', 'Core feature implementation for MVP',           'ACTIVE',    '2026-01-15', '2026-01-31', 2),
    (6, 3, 'Sprint 2', 'User testing and feedback integration',         'PLANNING',  '2026-02-01', '2026-02-14', 2)
ON CONFLICT DO NOTHING;

SELECT setval('sprints_id_seq', (SELECT MAX(id) FROM sprints));

-- ==================== TAGS ====================
INSERT INTO tags (id, project_id, name, color) VALUES
    (1,  1, 'Bug',      '#EF4444'),
    (2,  1, 'Feature',  '#3B82F6'),
    (3,  1, 'Design',   '#A855F7'),
    (4,  1, 'Docs',     '#10B981'),
    (5,  2, 'Bug',      '#EF4444'),
    (6,  2, 'Feature',  '#3B82F6'),
    (7,  2, 'Mobile',   '#F59E0B'),
    (8,  3, 'Bug',      '#EF4444'),
    (9,  3, 'Feature',  '#3B82F6'),
    (10, 3, 'Backend',  '#6366F1'),
    (11, 4, 'Content',  '#10B981'),
    (12, 4, 'Design',   '#A855F7')
ON CONFLICT DO NOTHING;

SELECT setval('tags_id_seq', (SELECT MAX(id) FROM tags));

-- ==================== TASKS ====================

-- Project 1 - Website Redesign | Sprint 1 (COMPLETED)
INSERT INTO tasks (id, project_id, sprint_id, title, description, priority, status, start_date, due_date, completed_at, position, created_by) VALUES
    (1,  1, 1, 'Set up Git repository & CI/CD pipeline',     'Initialize monorepo and configure GitHub Actions',   'HIGH',   'DONE', '2026-01-01', '2026-01-03', '2026-01-03 10:00:00+07', 1, 1),
    (2,  1, 1, 'Design system setup (colors, typography)',   'Define design tokens in Figma and CSS variables',    'HIGH',   'DONE', '2026-01-01', '2026-01-05', '2026-01-05 15:00:00+07', 2, 1),
    (3,  1, 1, 'Create component library skeleton',          'Scaffold shadcn/ui components and storybook setup',  'MEDIUM', 'DONE', '2026-01-05', '2026-01-10', '2026-01-10 11:00:00+07', 3, 3)
ON CONFLICT DO NOTHING;

-- Project 1 - Website Redesign | Sprint 2 (ACTIVE)
INSERT INTO tasks (id, project_id, sprint_id, title, description, priority, status, start_date, due_date, completed_at, position, created_by) VALUES
    (4,  1, 2, 'Build homepage hero section',     'Animated hero banner with CTA buttons using Framer Motion', 'HIGH',   'IN_PROGRESS', '2026-01-15', '2026-01-20', NULL, 1, 3),
    (5,  1, 2, 'Build navigation bar',            'Responsive navigation with desktop and mobile menu',       'HIGH',   'DONE',        '2026-01-15', '2026-01-17', '2026-01-17 16:00:00+07', 2, 3),
    (6,  1, 2, 'About page layout',               'Team section, mission statement and timeline',             'MEDIUM', 'TODO',        '2026-01-18', '2026-01-22', NULL, 3, 1),
    (7,  1, 2, 'Contact form with validation',    'Form with reCAPTCHA integration and backend submission',   'MEDIUM', 'REVIEW',      '2026-01-15', '2026-01-19', NULL, 4, 3),
    (8,  1, 2, 'Fix hero image loading perf',     'Optimize and lazy-load hero images for better LCP score',  'URGENT', 'IN_PROGRESS', '2026-01-16', '2026-01-18', NULL, 5, 1)
ON CONFLICT DO NOTHING;

-- Project 1 task 7 subtask (insert after parent)
INSERT INTO tasks (id, project_id, sprint_id, parent_task_id, title, description, priority, status, start_date, due_date, completed_at, position, created_by) VALUES
    (11, 1, 2, 7, 'Add email field validation', 'Client-side email regex and real-time error messages', 'MEDIUM', 'DONE', '2026-01-15', '2026-01-16', '2026-01-16 09:00:00+07', 1, 3)
ON CONFLICT DO NOTHING;

-- Project 1 - Website Redesign | Sprint 3 (PLANNING)
INSERT INTO tasks (id, project_id, sprint_id, title, description, priority, status, start_date, due_date, completed_at, position, created_by) VALUES
    (9,  1, 3, 'Blog listing page',           'Paginated blog posts with category and tag filters',    'MEDIUM', 'TODO', '2026-01-29', '2026-02-03', NULL, 1, 1),
    (10, 1, 3, 'SEO meta tags implementation','Add OpenGraph and Twitter card meta tags to all pages', 'LOW',    'TODO', '2026-01-29', '2026-02-05', NULL, 2, 1)
ON CONFLICT DO NOTHING;

-- Project 2 - Mobile App | Sprint 1 (ACTIVE)
INSERT INTO tasks (id, project_id, sprint_id, title, description, priority, status, start_date, due_date, completed_at, position, created_by) VALUES
    (12, 2, 4, 'Set up React Native project',         'Expo setup with TypeScript template and folder structure',  'HIGH',   'DONE',        '2026-02-01', '2026-02-03', '2026-02-03 10:00:00+07', 1, 1),
    (13, 2, 4, 'Implement authentication screens',    'Login, Register, and Forgot Password screens with redux',   'HIGH',   'IN_PROGRESS', '2026-02-03', '2026-02-10', NULL,                    2, 3),
    (14, 2, 4, 'Setup Redux Toolkit & RTK Query',     'State management and API integration layer configuration',  'HIGH',   'IN_PROGRESS', '2026-02-01', '2026-02-07', NULL,                    3, 4),
    (15, 2, 4, 'Push notification service',           'FCM integration for iOS and Android push notifications',    'MEDIUM', 'TODO',        '2026-02-08', '2026-02-14', NULL,                    4, 4)
ON CONFLICT DO NOTHING;

-- Project 3 - MVP Development | Sprint 1 (ACTIVE)
INSERT INTO tasks (id, project_id, sprint_id, title, description, priority, status, start_date, due_date, completed_at, position, created_by) VALUES
    (16, 3, 5, 'User authentication API',     'JWT auth with access/refresh token rotation',       'HIGH',   'DONE',        '2026-01-15', '2026-01-20', '2026-01-20 14:00:00+07', 1, 4),
    (17, 3, 5, 'Product catalog API',         'CRUD endpoints for product listings with search',   'HIGH',   'IN_PROGRESS', '2026-01-20', '2026-01-27', NULL,                    2, 4),
    (18, 3, 5, 'Shopping cart service',       'Cart management with Redis caching layer',          'HIGH',   'REVIEW',      '2026-01-20', '2026-01-28', NULL,                    3, 4),
    (19, 3, 5, 'Payment gateway integration', 'Stripe one-time payment and webhook integration',   'URGENT', 'TODO',        '2026-01-25', '2026-01-31', NULL,                    4, 2)
ON CONFLICT DO NOTHING;

-- Project 3 - MVP Development | Sprint 2 (PLANNING)
INSERT INTO tasks (id, project_id, sprint_id, title, description, priority, status, start_date, due_date, completed_at, position, created_by) VALUES
    (20, 3, 6, 'Unit tests for auth module', 'JUnit 5 tests with Mockito for auth service layer', 'MEDIUM', 'TODO', '2026-02-01', '2026-02-05', NULL, 1, 4)
ON CONFLICT DO NOTHING;

SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));

-- ==================== TASK ASSIGNEES ====================
INSERT INTO task_assignees (task_id, user_id) VALUES
    (1,  1), (1,  4),
    (2,  1), (2,  3),
    (3,  3),
    (4,  3),
    (5,  3),
    (6,  1), (6,  3),
    (7,  3),
    (8,  1), (8,  4),
    (9,  3),
    (10, 1),
    (11, 3),
    (12, 1),
    (13, 3),
    (14, 4),
    (15, 4),
    (16, 4),
    (17, 4),
    (18, 4), (18, 2),
    (19, 2), (19, 4),
    (20, 4)
ON CONFLICT DO NOTHING;

-- ==================== TASK TAGS ====================
INSERT INTO task_tags (task_id, tag_id) VALUES
    (1,  2),        -- Feature
    (2,  3),        -- Design
    (3,  2), (3,  3), -- Feature, Design
    (4,  2), (4,  3), -- Feature, Design
    (5,  2),        -- Feature
    (7,  2),        -- Feature
    (8,  1),        -- Bug
    (9,  2),        -- Feature
    (10, 4),        -- Docs
    (11, 2),        -- Feature
    (12, 6),        -- Feature (proj 2)
    (13, 6),        -- Feature
    (14, 6), (14, 7), -- Feature, Mobile
    (15, 7),        -- Mobile
    (16, 9),  (16, 10), -- Feature, Backend (proj 3)
    (17, 9),  (17, 10), -- Feature, Backend
    (18, 9),  (18, 10), -- Feature, Backend
    (19, 9),        -- Feature
    (20, 8)         -- Bug (proj 3)
ON CONFLICT DO NOTHING;

-- ==================== COMMENTS ====================

-- Root comments (no parent)
INSERT INTO comments (id, task_id, user_id, content) VALUES
    (1,  4,  1, 'Started the hero animation. Using Framer Motion for smooth entrance transitions.'),
    (4,  7,  3, 'Contact form is ready for review. Please check the validation logic.'),
    (7,  8,  1, 'Using next/image with the priority flag to improve LCP score.'),
    (8,  13, 3, 'Auth screens are looking good. Should we add biometric login support?'),
    (10, 18, 4, 'Cart service implementation is complete. Pending code review.')
ON CONFLICT DO NOTHING;

-- Level 1 replies
INSERT INTO comments (id, task_id, user_id, parent_comment_id, content) VALUES
    (2,  4,  3, 1, 'Great! Should we also add a video background option?'),
    (5,  7,  1, 4, 'Looks good! The error messages could be a bit more user-friendly.'),
    (9,  13, 1, 8, 'Let''s keep biometric as a v2 feature to stay on schedule.'),
    (11, 18, 2, 10, 'Left some comments on the Redis TTL configuration. Please check.')
ON CONFLICT DO NOTHING;

-- Level 2 replies
INSERT INTO comments (id, task_id, user_id, parent_comment_id, content) VALUES
    (3,  4,  1, 2, 'Good idea. Let''s add a subtask for that in the next sprint.'),
    (6,  7,  3, 5, 'Updated the error messages. Ready for re-review!')
ON CONFLICT DO NOTHING;

SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments));

-- ==================== COMMENT REACTIONS ====================
INSERT INTO comment_reactions (comment_id, user_id, icon) VALUES
    (1,  3, '👍'),
    (1,  4, '👍'),
    (4,  1, '👀'),
    (7,  3, '🔥'),
    (10, 2, '👍'),
    (8,  4, '💡')
ON CONFLICT DO NOTHING;

-- ==================== COMMENT MENTIONS ====================
INSERT INTO comment_mentions (comment_id, user_id) VALUES
    (5,  3),
    (9,  3),
    (11, 4)
ON CONFLICT DO NOTHING;

-- ==================== NOTIFICATIONS ====================
INSERT INTO notifications (id, receiver_id, actor_id, type, reference_type, reference_id, payload) VALUES
    (1,  3, 1, 'TASK_ASSIGNED',    'TASK',      4,  '{"taskTitle": "Build homepage hero section",     "projectName": "Website Redesign"}'),
    (2,  3, 1, 'TASK_ASSIGNED',    'TASK',      7,  '{"taskTitle": "Contact form with validation",    "projectName": "Website Redesign"}'),
    (4,  3, 1, 'COMMENT_MENTION',  'COMMENT',   5,  '{"taskTitle": "Contact form with validation",    "actorName": "Alice Nguyen"}'),
    (5,  4, 1, 'TASK_ASSIGNED',    'TASK',      8,  '{"taskTitle": "Fix hero image loading perf",     "projectName": "Website Redesign"}'),
    (6,  4, 2, 'TASK_ASSIGNED',    'TASK',      19, '{"taskTitle": "Payment gateway integration",     "projectName": "MVP Development"}'),
    (8,  3, 1, 'TASK_ASSIGNED',    'TASK',      13, '{"taskTitle": "Implement authentication screens","projectName": "Mobile App"}'),
    (9,  4, 2, 'COMMENT_MENTION',  'COMMENT',   11, '{"taskTitle": "Shopping cart service",           "actorName": "Bob Tran"}'),
    (10, 5, 1, 'WORKSPACE_INVITE', 'WORKSPACE', 1,  '{"workspaceName": "TechCorp", "role": "VIEWER", "inviterName": "Alice Nguyen"}')
ON CONFLICT DO NOTHING;

SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications));
