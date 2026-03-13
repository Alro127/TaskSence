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

-- ============================================================
-- SUPPLEMENTAL SEED DATA — Pagination Testing
-- Provides 3+ pages for: projects, tasks, comments, notifications, members, workspaces
-- ============================================================

-- ==================== USERS (6-15) ====================
INSERT INTO users (id, email, password_hash, full_name, is_active, avatar_url, phone, gender, dob, bio) VALUES
    (6,  'frank@example.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Frank Nguyen',  TRUE, 'https://i.pravatar.cc/150?u=frank',  '+84901000006', 'MALE',   '1994-08-11', 'DevOps engineer specializing in Kubernetes and CI/CD.'),
    (7,  'grace@example.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Grace Pham',    TRUE, 'https://i.pravatar.cc/150?u=grace',  '+84901000007', 'FEMALE', '1999-01-25', 'Mobile developer with expertise in Flutter and React Native.'),
    (8,  'henry@example.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Henry Le',      TRUE, 'https://i.pravatar.cc/150?u=henry',  '+84901000008', 'MALE',   '1992-04-03', 'Data engineer working with Apache Spark and Kafka.'),
    (9,  'iris@example.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Iris Tran',     TRUE, 'https://i.pravatar.cc/150?u=iris',   '+84901000009', 'FEMALE', '2000-09-17', 'UI/UX designer and Figma expert.'),
    (10, 'jack@example.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jack Hoang',    TRUE, 'https://i.pravatar.cc/150?u=jack',   '+84901000010', 'MALE',   '1997-12-20', 'Full-stack developer focused on Go and React.'),
    (11, 'kate@example.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kate Nguyen',   TRUE, 'https://i.pravatar.cc/150?u=kate',   '+84901000011', 'FEMALE', '1996-06-08', 'Scrum master and agile coach.'),
    (12, 'liam@example.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Liam Pham',     TRUE, 'https://i.pravatar.cc/150?u=liam',   '+84901000012', 'MALE',   '1995-03-28', 'Security engineer with OSCP certification.'),
    (13, 'mia@example.com',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mia Le',        TRUE, 'https://i.pravatar.cc/150?u=mia',    '+84901000013', 'FEMALE', '2001-11-15', 'Junior front-end developer learning Vue and Nuxt.'),
    (14, 'noah@example.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Noah Tran',     TRUE, 'https://i.pravatar.cc/150?u=noah',   '+84901000014', 'MALE',   '1993-07-04', 'Cloud architect certified in AWS and GCP.'),
    (15, 'olivia@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Olivia Hoang',  TRUE, 'https://i.pravatar.cc/150?u=olivia', '+84901000015', 'FEMALE', '1998-05-22', 'Product manager driving cross-functional teams.')
ON CONFLICT DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ==================== USER SKILLS (14-35) ====================
INSERT INTO user_skills (id, user_id, skill_name, level) VALUES
    (14, 6,  'Kubernetes',           5),
    (15, 6,  'Docker',               5),
    (16, 6,  'CI/CD',                4),
    (17, 7,  'Flutter',              5),
    (18, 7,  'React Native',         4),
    (19, 8,  'Apache Spark',         5),
    (20, 8,  'Kafka',                4),
    (21, 8,  'Python',               4),
    (22, 9,  'Figma',                5),
    (23, 9,  'UI/UX Design',         5),
    (24, 10, 'Go',                   5),
    (25, 10, 'React',                4),
    (26, 11, 'Scrum',                5),
    (27, 11, 'Agile',                5),
    (28, 12, 'Security',             5),
    (29, 12, 'Penetration Testing',  4),
    (30, 13, 'Vue',                  3),
    (31, 13, 'Nuxt',                 3),
    (32, 14, 'AWS',                  5),
    (33, 14, 'GCP',                  4),
    (34, 15, 'Product Management',   5),
    (35, 15, 'Roadmapping',          4)
ON CONFLICT DO NOTHING;

SELECT setval('user_skills_id_seq', (SELECT MAX(id) FROM user_skills));

-- ==================== TEAM TEMPLATES (3-5) ====================
INSERT INTO team_templates (id, owner_id, name, description) VALUES
    (3, 3, 'Design Team',  'Product design and UI/UX team'),
    (4, 4, 'DevOps Team',  'Infrastructure and deployment pipeline team'),
    (5, 5, 'QA Team',      'Quality assurance and test automation team')
ON CONFLICT DO NOTHING;

SELECT setval('team_templates_id_seq', (SELECT MAX(id) FROM team_templates));

INSERT INTO team_member_templates (team_template_id, user_id) VALUES
    (3, 3), (3, 9),
    (4, 4), (4, 6), (4, 14),
    (5, 5), (5, 12)
ON CONFLICT DO NOTHING;

-- ==================== WORKSPACES (3-14) — public workspaces for search pagination ====================
INSERT INTO workspaces (id, name, description, owner_id, is_public) VALUES
    (3,  'InnovateLabs',  'Innovation lab for experimental products',              3, TRUE),
    (4,  'DevForge',      'DevForge engineering workspace',                        4, TRUE),
    (5,  'NexaTech',      'Cutting-edge tech solutions team',                      5, TRUE),
    (6,  'CodeCraft',     'Open source projects and side experiments',             1, TRUE),
    (7,  'PixelStudio',   'Creative design and branding studio',                   3, TRUE),
    (8,  'CloudStack',    'Cloud infrastructure and platform engineering',          4, TRUE),
    (9,  'DataNexus',     'Data platform and analytics workspace',                 2, TRUE),
    (10, 'SwiftBuild',    'Rapid prototyping and product development',             5, TRUE),
    (11, 'AgilePro',      'Agile consulting and tooling projects',                 1, FALSE),
    (12, 'ByteForge',     'Low-level systems and embedded development',            2, FALSE),
    (13, 'SparkDev',      'ML and data science project incubator',                 3, TRUE),
    (14, 'TechHub',       'Community-driven open source collaboration',            4, TRUE)
ON CONFLICT DO NOTHING;

SELECT setval('workspaces_id_seq', (SELECT MAX(id) FROM workspaces));

-- ==================== WORKSPACE MEMBERS ====================
INSERT INTO workspace_members (workspace_id, user_id, role) VALUES
    -- Workspace 1 (TechCorp): 10 extra members → total 15, enough for member list pagination
    (1,  6,  'MEMBER'),
    (1,  7,  'MEMBER'),
    (1,  8,  'MEMBER'),
    (1,  9,  'VIEWER'),
    (1,  10, 'MEMBER'),
    (1,  11, 'MANAGER'),
    (1,  12, 'MEMBER'),
    (1,  13, 'MEMBER'),
    (1,  14, 'MEMBER'),
    (1,  15, 'VIEWER'),
    -- Workspace 3: InnovateLabs
    (3,  3,  'OWNER'),
    (3,  1,  'MANAGER'),
    (3,  6,  'MEMBER'),
    (3,  7,  'MEMBER'),
    (3,  9,  'MEMBER'),
    -- Workspace 4: DevForge
    (4,  4,  'OWNER'),
    (4,  1,  'MANAGER'),
    (4,  6,  'MEMBER'),
    (4,  8,  'MEMBER'),
    (4,  14, 'MEMBER'),
    -- Workspace 5: NexaTech
    (5,  5,  'OWNER'),
    (5,  2,  'MANAGER'),
    (5,  7,  'MEMBER'),
    (5,  10, 'MEMBER'),
    (5,  13, 'MEMBER'),
    -- Workspaces 6-14: minimal membership
    (6,  1,  'OWNER'),  (6,  4,  'MEMBER'), (6,  10, 'MEMBER'),
    (7,  3,  'OWNER'),  (7,  9,  'MEMBER'), (7,  13, 'MEMBER'),
    (8,  4,  'OWNER'),  (8,  6,  'MEMBER'), (8,  14, 'MEMBER'),
    (9,  2,  'OWNER'),  (9,  8,  'MEMBER'), (9,  15, 'MEMBER'),
    (10, 5,  'OWNER'),  (10, 7,  'MEMBER'), (10, 10, 'MEMBER'),
    (11, 1,  'OWNER'),  (11, 11, 'MEMBER'),
    (12, 2,  'OWNER'),  (12, 12, 'MEMBER'),
    (13, 3,  'OWNER'),  (13, 8,  'MEMBER'), (13, 10, 'MEMBER'),
    (14, 4,  'OWNER'),  (14, 6,  'MEMBER'), (14, 15, 'MEMBER')
ON CONFLICT DO NOTHING;

-- ==================== PROJECTS ====================
-- Workspace 1 (TechCorp): +13 projects → total 15 (2 full pages at size=9, 1 partial)
-- Workspace 2 (StartupX): +8 projects  → total 10 (2 pages at size=9)
-- Workspace 3 (InnovateLabs): 5 new projects
INSERT INTO projects (id, workspace_id, name, description, status, start_date, end_date) VALUES
    (5,  1, 'E-commerce Platform',    'Full-featured online store with product catalog and checkout',  'ACTIVE',    '2026-03-01', '2026-09-30'),
    (6,  1, 'API Gateway',            'Centralized API gateway with rate limiting and auth middleware', 'ACTIVE',    '2026-02-15', '2026-07-31'),
    (7,  1, 'Analytics Dashboard',    'Real-time analytics and KPI visualization platform',            'ACTIVE',    '2026-03-01', '2026-10-31'),
    (8,  1, 'DevOps Infrastructure',  'Migrate to Kubernetes and set up GitOps workflow',              'ON_HOLD',   '2026-04-01', '2026-12-31'),
    (9,  1, 'Documentation Portal',   'Developer docs portal with search and versioning',              'ACTIVE',    '2026-02-01', '2026-06-30'),
    (10, 1, 'CRM Integration',        'Salesforce and HubSpot CRM integration layer',                  'ACTIVE',    '2026-01-15', '2026-05-31'),
    (11, 1, 'Payment Module',         'Stripe and PayPal unified payment processing service',          'COMPLETED', '2025-10-01', '2026-01-31'),
    (12, 1, 'Notification Service',   'Multi-channel notification service for email, SMS and push',   'COMPLETED', '2025-11-01', '2026-02-28'),
    (13, 1, 'Search Engine',          'Elasticsearch-powered full-text search across all entities',    'ACTIVE',    '2026-03-15', '2026-08-31'),
    (14, 1, 'Admin Panel',            'Internal admin dashboard with role-based access control',       'ACTIVE',    '2026-02-20', '2026-07-15'),
    (15, 1, 'User Onboarding Flow',   'Guided onboarding experience for new workspace members',        'ACTIVE',    '2026-03-01', '2026-05-31'),
    (16, 1, 'Performance Monitoring', 'APM and infrastructure monitoring with Grafana and Prometheus', 'ACTIVE',    '2026-04-01', '2026-11-30'),
    (17, 1, 'Security Audit',         'Compliance and vulnerability assessment initiative',            'ARCHIVED',  '2025-09-01', '2026-01-31'),
    (18, 2, 'Customer Portal',        'Self-service portal for customer account management',           'ACTIVE',    '2026-02-01', '2026-07-31'),
    (19, 2, 'Analytics Engine',       'Event tracking and funnel analysis engine',                     'ACTIVE',    '2026-03-01', '2026-09-30'),
    (20, 2, 'Email Campaign Tool',    'Drag-and-drop email builder with A/B testing',                  'ACTIVE',    '2026-02-15', '2026-06-30'),
    (21, 2, 'Inventory System',       'Real-time inventory tracking and supplier management',          'ON_HOLD',   '2026-04-01', '2026-10-31'),
    (22, 2, 'Reporting Dashboard',    'Automated weekly and monthly business intelligence reports',    'ACTIVE',    '2026-01-20', '2026-05-15'),
    (23, 2, 'API Documentation',      'Swagger and OpenAPI documentation and playground portal',       'COMPLETED', '2025-11-15', '2026-02-15'),
    (24, 2, 'Mobile Backend',         'BFF layer for the iOS and Android applications',                'ACTIVE',    '2026-03-01', '2026-09-01'),
    (25, 2, 'User Research Portal',   'Centralized repository for user interviews and usability tests','ACTIVE',    '2026-02-10', '2026-05-31'),
    (26, 3, 'Brand Identity System',  'Visual identity guidelines, logo and brand kit',               'ACTIVE',    '2026-01-01', '2026-04-30'),
    (27, 3, 'UI Component Library',   'Shared component library built with shadcn/ui and Storybook',  'ACTIVE',    '2026-02-01', '2026-07-31'),
    (28, 3, 'Design Handbook',        'Team-wide design principles and pattern documentation',         'ACTIVE',    '2026-01-15', '2026-06-30'),
    (29, 3, 'Prototype Toolkit',      'Rapid prototyping templates and interactive Figma assets',      'ACTIVE',    '2026-03-01', '2026-08-31'),
    (30, 3, 'Icon System',            'Unified icon set across all products',                          'COMPLETED', '2025-10-01', '2026-01-31')
ON CONFLICT DO NOTHING;

SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));

-- ==================== PROJECT MEMBERS ====================
INSERT INTO project_members (project_id, user_id, role) VALUES
    (5,  1,  'MANAGER'), (5,  4,  'MEMBER'), (5,  10, 'MEMBER'), (5,  13, 'MEMBER'),
    (6,  1,  'MANAGER'), (6,  4,  'MEMBER'), (6,  6,  'MEMBER'),
    (7,  1,  'MANAGER'), (7,  8,  'MEMBER'), (7,  15, 'VIEWER'),
    (8,  6,  'MANAGER'), (8,  4,  'MEMBER'), (8,  14, 'MEMBER'),
    (9,  1,  'MANAGER'), (9,  3,  'MEMBER'),
    (10, 2,  'MANAGER'), (10, 1,  'MEMBER'), (10, 4,  'MEMBER'),
    (11, 4,  'MANAGER'), (11, 1,  'MEMBER'),
    (12, 4,  'MANAGER'), (12, 6,  'MEMBER'),
    (13, 1,  'MANAGER'), (13, 10, 'MEMBER'), (13, 4, 'MEMBER'),
    (14, 11, 'MANAGER'), (14, 1,  'MEMBER'),
    (15, 15, 'MANAGER'), (15, 3,  'MEMBER'), (15, 9, 'MEMBER'),
    (16, 6,  'MANAGER'), (16, 14, 'MEMBER'),
    (17, 12, 'MANAGER'), (17, 1,  'VIEWER'),
    (18, 2,  'MANAGER'), (18, 3,  'MEMBER'), (18, 7,  'MEMBER'),
    (19, 2,  'MANAGER'), (19, 8,  'MEMBER'),
    (20, 2,  'MANAGER'), (20, 3,  'MEMBER'), (20, 9,  'MEMBER'),
    (21, 2,  'MANAGER'), (21, 4,  'MEMBER'),
    (22, 2,  'MANAGER'), (22, 8,  'MEMBER'),
    (23, 2,  'MANAGER'), (23, 10, 'MEMBER'),
    (24, 2,  'MANAGER'), (24, 7,  'MEMBER'), (24, 4, 'MEMBER'),
    (25, 2,  'MANAGER'), (25, 9,  'MEMBER'),
    (26, 3,  'MANAGER'), (26, 9,  'MEMBER'),
    (27, 3,  'MANAGER'), (27, 9,  'MEMBER'), (27, 13, 'MEMBER'),
    (28, 3,  'MANAGER'), (28, 9,  'MEMBER'),
    (29, 3,  'MANAGER'), (29, 9,  'MEMBER'),
    (30, 3,  'MANAGER'), (30, 9,  'MEMBER')
ON CONFLICT DO NOTHING;

-- ==================== SPRINTS (7-20) ====================
INSERT INTO sprints (id, project_id, name, goal, status, start_date, end_date, created_by) VALUES
    (7,  5,  'Sprint 1', 'Product catalog and home page',               'ACTIVE',    '2026-03-01', '2026-03-14', 1),
    (8,  5,  'Sprint 2', 'Cart and checkout flow',                      'PLANNING',  '2026-03-15', '2026-03-28', 1),
    (9,  6,  'Sprint 1', 'Gateway routing and auth middleware',         'ACTIVE',    '2026-02-15', '2026-02-28', 1),
    (10, 7,  'Sprint 1', 'Dashboard layout and chart components',       'ACTIVE',    '2026-03-01', '2026-03-14', 1),
    (11, 9,  'Sprint 1', 'Docs site setup and content structure',       'ACTIVE',    '2026-02-01', '2026-02-14', 1),
    (12, 10, 'Sprint 1', 'Salesforce API connection and data sync',     'ACTIVE',    '2026-01-15', '2026-01-31', 2),
    (13, 13, 'Sprint 1', 'Elasticsearch index design and URL mapping',  'ACTIVE',    '2026-03-15', '2026-03-28', 1),
    (14, 14, 'Sprint 1', 'Admin UI shell and role management',          'ACTIVE',    '2026-02-20', '2026-03-05', 11),
    (15, 18, 'Sprint 1', 'Account overview and profile pages',          'ACTIVE',    '2026-02-01', '2026-02-14', 2),
    (16, 19, 'Sprint 1', 'Event ingestion pipeline',                    'ACTIVE',    '2026-03-01', '2026-03-14', 2),
    (17, 26, 'Sprint 1', 'Logo design and color palette',               'COMPLETED', '2026-01-01', '2026-01-31', 3),
    (18, 27, 'Sprint 1', 'Component scaffolding and Storybook setup',   'ACTIVE',    '2026-02-01', '2026-02-28', 3),
    (19, 27, 'Sprint 2', 'Form and input components',                   'PLANNING',  '2026-03-01', '2026-03-31', 3),
    (20, 28, 'Sprint 1', 'Typography and spacing guidelines',           'COMPLETED', '2026-01-15', '2026-01-31', 3)
ON CONFLICT DO NOTHING;

SELECT setval('sprints_id_seq', (SELECT MAX(id) FROM sprints));

-- ==================== TAGS (13-36) ====================
INSERT INTO tags (id, project_id, name, color) VALUES
    (13, 5,  'Bug',      '#EF4444'),
    (14, 5,  'Feature',  '#3B82F6'),
    (15, 5,  'UI',       '#A855F7'),
    (16, 6,  'Bug',      '#EF4444'),
    (17, 6,  'Feature',  '#3B82F6'),
    (18, 6,  'Security', '#F59E0B'),
    (19, 7,  'Bug',      '#EF4444'),
    (20, 7,  'Feature',  '#3B82F6'),
    (21, 7,  'Chart',    '#10B981'),
    (22, 8,  'Infra',    '#6366F1'),
    (23, 9,  'Docs',     '#10B981'),
    (24, 9,  'Feature',  '#3B82F6'),
    (25, 10, 'Feature',  '#3B82F6'),
    (26, 10, 'Bug',      '#EF4444'),
    (27, 13, 'Feature',  '#3B82F6'),
    (28, 13, 'Bug',      '#EF4444'),
    (29, 14, 'Feature',  '#3B82F6'),
    (30, 14, 'Bug',      '#EF4444'),
    (31, 18, 'Feature',  '#3B82F6'),
    (32, 18, 'Bug',      '#EF4444'),
    (33, 19, 'Feature',  '#3B82F6'),
    (34, 26, 'Design',   '#A855F7'),
    (35, 27, 'Feature',  '#3B82F6'),
    (36, 27, 'Bug',      '#EF4444')
ON CONFLICT DO NOTHING;

SELECT setval('tags_id_seq', (SELECT MAX(id) FROM tags));

-- ==================== TASKS ====================

-- Project 1 (Website Redesign) — +15 tasks → total 26 (~3 pages at size=10)
INSERT INTO tasks (id, project_id, sprint_id, title, description, priority, status, start_date, due_date, position, created_by) VALUES
    (21, 1, 2, 'Dark mode toggle',              'CSS variables swap using Tailwind class strategy',         'MEDIUM', 'TODO',        '2026-01-20', '2026-01-25', 6,  1),
    (22, 1, 2, 'Footer component',              'Site-wide footer with links and newsletter signup',        'LOW',    'TODO',        '2026-01-20', '2026-01-24', 7,  3),
    (23, 1, 2, 'Accessibility audit',           'WCAG 2.1 AA compliance check across all pages',           'HIGH',   'TODO',        '2026-01-22', '2026-01-27', 8,  1),
    (24, 1, 3, 'Blog detail page',              'Individual post layout with MDX rendering',               'MEDIUM', 'TODO',        '2026-02-01', '2026-02-06', 3,  3),
    (25, 1, 3, 'Tag and category filter UI',    'Chip-based filter bar for the blog listing page',         'MEDIUM', 'TODO',        '2026-02-02', '2026-02-07', 4,  3),
    (26, 1, 3, 'RSS feed generation',           'Generate valid RSS 2.0 feed for the blog',               'LOW',    'TODO',        '2026-02-05', '2026-02-10', 5,  1),
    (27, 1, 3, 'Sitemap XML generation',        'Auto-generated sitemap.xml for SEO crawling',             'LOW',    'TODO',        '2026-02-05', '2026-02-09', 6,  1),
    (28, 1, 3, 'robots.txt configuration',      'Configure crawl directives for search engines',           'LOW',    'TODO',        '2026-02-06', '2026-02-08', 7,  1),
    (29, 1, 3, 'Google Analytics integration',  'GA4 tag setup with custom event tracking',               'MEDIUM', 'TODO',        '2026-02-04', '2026-02-08', 8,  1),
    (30, 1, 3, 'Cookie consent banner',         'GDPR-compliant cookie consent with preference center',    'HIGH',   'TODO',        '2026-02-01', '2026-02-05', 9,  1),
    (31, 1, 3, 'Performance budget enforcement','Lighthouse CI threshold checks in GitHub Actions',        'MEDIUM', 'TODO',        '2026-02-08', '2026-02-11', 10, 1),
    (32, 1, 2, 'Image optimization pipeline',   'Sharp-based build-time image processing',                 'MEDIUM', 'IN_PROGRESS', '2026-01-18', '2026-01-22', 9,  4),
    (33, 1, 2, 'Social share buttons',          'Twitter, LinkedIn and copy-link share actions',           'LOW',    'TODO',        '2026-01-20', '2026-01-24', 10, 3),
    (34, 1, 2, 'Breadcrumb navigation',         'Accessible breadcrumb for nested page routes',            'LOW',    'DONE',        '2026-01-15', '2026-01-18', 11, 3),
    (35, 1, 2, 'Loading skeleton components',   'Placeholder skeletons for async content areas',          'MEDIUM', 'REVIEW',      '2026-01-17', '2026-01-20', 12, 3)
ON CONFLICT DO NOTHING;

-- Project 5 (E-commerce Platform) — 12 tasks (~2 pages)
INSERT INTO tasks (id, project_id, sprint_id, title, description, priority, status, start_date, due_date, position, created_by) VALUES
    (36, 5, 7, 'Product listing page',       'Grid/list view toggle with infinite scroll',                'HIGH',   'IN_PROGRESS', '2026-03-01', '2026-03-08', 1, 1),
    (37, 5, 7, 'Product detail page',        'Image gallery, variant selector and add-to-cart button',   'HIGH',   'IN_PROGRESS', '2026-03-01', '2026-03-10', 2, 1),
    (38, 5, 7, 'Search and filter sidebar',  'Faceted search with Elasticsearch autocomplete',           'HIGH',   'TODO',        '2026-03-05', '2026-03-14', 3, 1),
    (39, 5, 7, 'Category management',        'Tree-structured category CRUD for the admin panel',        'MEDIUM', 'TODO',        '2026-03-07', '2026-03-12', 4, 1),
    (40, 5, 7, 'Product image upload',       'Multi-file S3 upload with crop and preview',               'MEDIUM', 'TODO',        '2026-03-08', '2026-03-14', 5, 4),
    (41, 5, 8, 'Shopping cart UI',           'Persistent cart with quantity controls and totals',        'HIGH',   'TODO',        '2026-03-15', '2026-03-20', 1, 1),
    (42, 5, 8, 'Checkout flow',              'Multi-step checkout: address, shipping, payment',          'HIGH',   'TODO',        '2026-03-15', '2026-03-22', 2, 1),
    (43, 5, 8, 'Order confirmation page',    'Order summary email and confirmation receipt trigger',     'MEDIUM', 'TODO',        '2026-03-18', '2026-03-24', 3, 1),
    (44, 5, 8, 'Guest checkout support',     'Allow checkout without creating an account',               'MEDIUM', 'TODO',        '2026-03-19', '2026-03-25', 4, 4),
    (45, 5, 8, 'Discount coupon apply',      'Coupon code validation and cart discount logic',           'LOW',    'TODO',        '2026-03-20', '2026-03-26', 5, 4),
    (46, 5, 7, 'Wishlist feature',           'Save products to a personal wishlist with persistence',    'LOW',    'TODO',        '2026-03-10', '2026-03-14', 6, 1),
    (47, 5, 7, 'Product review and rating',  'Star rating, review text and admin moderation queue',      'MEDIUM', 'TODO',        '2026-03-10', '2026-03-14', 7, 4)
ON CONFLICT DO NOTHING;

-- Project 6 (API Gateway) — 8 tasks
INSERT INTO tasks (id, project_id, sprint_id, title, description, priority, status, start_date, due_date, position, created_by) VALUES
    (48, 6, 9, 'Route configuration DSL',    'YAML-based route definition with hot reload support',     'HIGH',   'IN_PROGRESS', '2026-02-15', '2026-02-21', 1, 1),
    (49, 6, 9, 'JWT auth middleware',        'Validate access tokens on every incoming request',        'HIGH',   'DONE',        '2026-02-15', '2026-02-18', 2, 4),
    (50, 6, 9, 'Rate limiting per client',   'Token bucket algorithm backed by Redis',                  'HIGH',   'IN_PROGRESS', '2026-02-18', '2026-02-25', 3, 4),
    (51, 6, 9, 'Request logging to ELK',     'Structured log forwarding to Elasticsearch stack',        'MEDIUM', 'TODO',        '2026-02-20', '2026-02-26', 4, 4),
    (52, 6, 9, 'Circuit breaker pattern',    'Resilience4j-based circuit breaker integration',          'MEDIUM', 'TODO',        '2026-02-22', '2026-02-28', 5, 4),
    (53, 6, 9, 'Load balancer round-robin',  'Upstream round-robin with active health checks',          'HIGH',   'REVIEW',      '2026-02-17', '2026-02-24', 6, 6),
    (54, 6, 9, 'API key management',         'Generate, rotate and revoke API keys per client',         'MEDIUM', 'TODO',        '2026-02-23', '2026-02-28', 7, 6),
    (55, 6, 9, 'Swagger aggregator',         'Merge downstream OpenAPI specs into a single portal',     'LOW',    'TODO',        '2026-02-24', '2026-02-28', 8, 1)
ON CONFLICT DO NOTHING;

SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));

-- ==================== TASK ASSIGNEES ====================
INSERT INTO task_assignees (task_id, user_id) VALUES
    (21, 3), (22, 3), (23, 1), (23, 3),
    (24, 3), (25, 3), (26, 1), (27, 1),
    (28, 1), (29, 1), (30, 1), (31, 1),
    (32, 4), (33, 3), (34, 3), (35, 3),
    (36, 1), (37, 1), (38, 1), (39, 4),
    (40, 4), (41, 1), (42, 1), (43, 4),
    (44, 4), (45, 4), (46, 1), (47, 4),
    (48, 1), (49, 4), (50, 4), (51, 4),
    (52, 4), (53, 6), (54, 6), (55, 1)
ON CONFLICT DO NOTHING;

-- ==================== TASK TAGS ====================
INSERT INTO task_tags (task_id, tag_id) VALUES
    (21, 2),  (22, 2),  (23, 2),  (24, 2),
    (25, 2),  (26, 4),  (27, 4),  (28, 4),
    (29, 4),  (30, 2),  (31, 4),  (32, 2),
    (33, 2),  (34, 2),  (35, 2),
    (36, 14), (36, 15), (37, 14), (38, 14),
    (39, 14), (40, 15), (41, 15), (42, 14),
    (43, 14), (44, 14), (45, 13), (46, 14),
    (47, 14),
    (48, 17), (49, 18), (50, 18), (51, 16),
    (52, 17), (53, 17), (54, 18), (55, 17)
ON CONFLICT DO NOTHING;

-- ==================== COMMENTS ====================

-- Task 4 (Build homepage hero section) — +20 comments → total 23 (~3 pages at size=10)
INSERT INTO comments (id, task_id, user_id, content) VALUES
    (12, 4, 2, 'Can we add a parallax effect to the background image?'),
    (13, 4, 4, 'The animation timing may need adjusting on slower devices.'),
    (14, 4, 5, 'Looks great on desktop, but mobile needs a different layout.'),
    (15, 4, 1, 'Added a media query breakpoint for tablet view.'),
    (16, 4, 2, 'Should we use GSAP instead of Framer Motion for better performance?'),
    (17, 4, 3, 'Framer Motion is already in our bundle, let''s stay consistent.'),
    (18, 4, 4, 'Hero entrance delay feel a bit slow. Maybe reduce to 200ms?'),
    (19, 4, 1, 'Reduced entrance delay to 150ms. Awaiting CI confirmation.'),
    (20, 4, 5, 'The CTA button color contrast fails WCAG AA. Needs a fix.'),
    (21, 4, 3, 'Updated button to use primary-foreground token for proper contrast.'),
    (22, 4, 2, 'Looks good. Approving the accessibility fix.'),
    (23, 4, 4, 'Added a subtle drop shadow to improve button legibility.'),
    (24, 4, 5, 'Background image is too large on 4K screens, cap with max-width.'),
    (25, 4, 1, 'Wrapped hero section in a max-w-screen-2xl container.'),
    (26, 4, 3, 'Video background option moved to a separate subtask.'),
    (27, 4, 2, 'Confirmed: video background subtask is in Sprint 3 backlog.'),
    (28, 4, 4, 'Let''s also serve the hero image with a CDN cache header.'),
    (29, 4, 1, 'Added Cache-Control: max-age=31536000 for the hero asset.'),
    (30, 4, 5, 'Retina image (@2x) should be served via the srcset attribute.'),
    (31, 4, 3, 'Added srcset with 1x and 2x variants. Tests passing.')
ON CONFLICT DO NOTHING;

-- Task 17 (Product catalog API) — +12 comments (~2 pages)
INSERT INTO comments (id, task_id, user_id, content) VALUES
    (32, 17, 4, 'Starting with basic CRUD endpoints. Search will come later.'),
    (33, 17, 2, 'Remember to add cursor-based pagination to the listing endpoint.'),
    (34, 17, 4, 'Done. Using keyset pagination with created_at + id as the cursor.'),
    (35, 17, 2, 'Great. Please also add a filter by category_id query param.'),
    (36, 17, 4, 'Added. Do you want multi-category filtering with AND or OR logic?'),
    (37, 17, 2, 'OR logic for now. We can add AND as a v2 feature later.'),
    (38, 17, 4, 'Implemented. Also added a price range filter while at it.'),
    (39, 17, 5, 'Please add validation for the price range — min must be <= max.'),
    (40, 17, 4, 'Fixed. Added @Min(0) constraint and a custom cross-field validator.'),
    (41, 17, 2, 'Looks good. Add Swagger annotations before we merge this PR.'),
    (42, 17, 4, 'Swagger annotations done. PR is ready for final review.'),
    (43, 17, 2, 'LGTM. Merging after CI passes.')
ON CONFLICT DO NOTHING;

SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments));

-- ==================== NOTIFICATIONS ====================

-- User 3 (Carol) — +10 new → total 13+ for notification list pagination
INSERT INTO notifications (id, receiver_id, actor_id, type, reference_type, reference_id, payload) VALUES
    (11, 3, 1, 'TASK_ASSIGNED',   'TASK',    21, '{"taskTitle": "Dark mode toggle",              "projectName": "Website Redesign"}'),
    (12, 3, 1, 'TASK_ASSIGNED',   'TASK',    22, '{"taskTitle": "Footer component",              "projectName": "Website Redesign"}'),
    (13, 3, 1, 'TASK_ASSIGNED',   'TASK',    24, '{"taskTitle": "Blog detail page",              "projectName": "Website Redesign"}'),
    (14, 3, 1, 'TASK_ASSIGNED',   'TASK',    25, '{"taskTitle": "Tag and category filter UI",    "projectName": "Website Redesign"}'),
    (15, 3, 2, 'TASK_ASSIGNED',   'TASK',    33, '{"taskTitle": "Social share buttons",          "projectName": "Website Redesign"}'),
    (16, 3, 1, 'TASK_ASSIGNED',   'TASK',    35, '{"taskTitle": "Loading skeleton components",   "projectName": "Website Redesign"}'),
    (17, 3, 2, 'COMMENT_MENTION', 'COMMENT', 16, '{"taskTitle": "Build homepage hero section",   "actorName": "Bob Tran"}'),
    (18, 3, 4, 'COMMENT_MENTION', 'COMMENT', 18, '{"taskTitle": "Build homepage hero section",   "actorName": "Dave Pham"}'),
    (19, 3, 2, 'TASK_ASSIGNED',   'TASK',    18, '{"taskTitle": "Customer Portal",               "projectName": "StartupX"}'),
    (20, 3, 1, 'WORKSPACE_INVITE','WORKSPACE',3, '{"workspaceName": "InnovateLabs", "role": "MEMBER", "inviterName": "Alice Nguyen"}'),
    -- User 1 (Alice) — 10+ for pagination
    (21, 1, 3, 'COMMENT_MENTION', 'COMMENT', 17, '{"taskTitle": "Build homepage hero section",   "actorName": "Carol Le"}'),
    (22, 1, 3, 'COMMENT_MENTION', 'COMMENT', 21, '{"taskTitle": "Build homepage hero section",   "actorName": "Carol Le"}'),
    (23, 1, 3, 'COMMENT_MENTION', 'COMMENT', 31, '{"taskTitle": "Build homepage hero section",   "actorName": "Carol Le"}'),
    (24, 1, 2, 'TASK_ASSIGNED',   'TASK',    46, '{"taskTitle": "Wishlist feature",              "projectName": "E-commerce Platform"}'),
    (25, 1, 2, 'TASK_ASSIGNED',   'TASK',    48, '{"taskTitle": "Route configuration DSL",       "projectName": "API Gateway"}'),
    (26, 1, 2, 'COMMENT_MENTION', 'COMMENT', 33, '{"taskTitle": "Product catalog API",           "actorName": "Bob Tran"}'),
    (27, 1, 4, 'COMMENT_MENTION', 'COMMENT', 34, '{"taskTitle": "Product catalog API",           "actorName": "Dave Pham"}'),
    (28, 1, 2, 'WORKSPACE_INVITE','WORKSPACE',9, '{"workspaceName": "DataNexus", "role": "MEMBER", "inviterName": "Bob Tran"}'),
    (29, 1, 3, 'TASK_ASSIGNED',   'TASK',    55, '{"taskTitle": "Swagger aggregator",            "projectName": "API Gateway"}'),
    (30, 1, 4, 'TASK_REMINDER',   'TASK',    23, '{"taskTitle": "Accessibility audit",           "dueDate": "2026-01-27"}'),
    -- User 4 (Dave) — 10+ for pagination
    (31, 4, 1, 'TASK_ASSIGNED',   'TASK',    32, '{"taskTitle": "Image optimization pipeline",   "projectName": "Website Redesign"}'),
    (32, 4, 1, 'TASK_ASSIGNED',   'TASK',    40, '{"taskTitle": "Product image upload",          "projectName": "E-commerce Platform"}'),
    (33, 4, 1, 'TASK_ASSIGNED',   'TASK',    43, '{"taskTitle": "Order confirmation page",       "projectName": "E-commerce Platform"}'),
    (34, 4, 1, 'TASK_ASSIGNED',   'TASK',    44, '{"taskTitle": "Guest checkout support",        "projectName": "E-commerce Platform"}'),
    (35, 4, 1, 'TASK_ASSIGNED',   'TASK',    45, '{"taskTitle": "Discount coupon apply",         "projectName": "E-commerce Platform"}'),
    (36, 4, 1, 'TASK_ASSIGNED',   'TASK',    47, '{"taskTitle": "Product review and rating",     "projectName": "E-commerce Platform"}'),
    (37, 4, 2, 'COMMENT_MENTION', 'COMMENT', 39, '{"taskTitle": "Product catalog API",           "actorName": "Bob Tran"}'),
    (38, 4, 2, 'COMMENT_MENTION', 'COMMENT', 41, '{"taskTitle": "Product catalog API",           "actorName": "Bob Tran"}'),
    (39, 4, 6, 'TASK_ASSIGNED',   'TASK',    53, '{"taskTitle": "Load balancer round-robin",     "projectName": "API Gateway"}'),
    (40, 4, 6, 'TASK_ASSIGNED',   'TASK',    54, '{"taskTitle": "API key management",            "projectName": "API Gateway"}')
ON CONFLICT DO NOTHING;

SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications));
