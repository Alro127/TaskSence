# Functional Requirements (FR)

Functional Requirements Specification Document – synchronized with the 46 Use Cases in Documents.md.

## 1. Authentication & Profile

- **FR-AUTH-01:** The system allows visitors to register new accounts using Email/Password (UC-01).
- **FR-AUTH-02:** The system allows login via Email/Password and issues JWT Token (UC-02).
- **FR-AUTH-03:** User can log out and system cancel Refresh Token (UC-03).
- **FR-AUTH-04:** Function to change Avatar and profile information by uploading photos to the system (UC-04).

## 2. Workspace Management

- **FR-WS-01:** Supports basic Workspace features: Create new, Get list, Edit, Delete (UC-05 to UC-08).
- **FR-WS-02:** Owner has the right to invite new members via email (UC-09) and has the right to revoke and delete members from the workspace (UC-10).
- **FR-WS-03:** Members can freely leave the group when they no longer contribute (UC-11).
- **FR-WS-04:** Flow Request to join the workspace includes: Sending request via public/private link, Cancel just sent request, Processing by Administrator (Approve/Reject) (UC-12 to UC-14).

## 3. Project Management

- **FR-PRJ-01:** Provides basic level Project Management (CRUD) functionality at the Project Dashboard screen (UC-15 to UC-18).
- **FR-PRJ-02:** Provides the function of adding and deleting existing colleagues in Workspace, procedures allowing users to voluntarily leave the Project (UC-19 to UC-21).
- **FR-PRJ-03:** Workflow applying to join: Request to approve members to a specific Project that is in Private status instead of Public (UC-22 to UC-24).

## 4. Task & Collaboration (Task Management & Collaboration)

- **FR-TSK-01:** Task structure lifecycle management: Create new task tag, Update status/assignee/due date, Delete/Archive feature (UC-25 to UC-27).
- **FR-TSK-02:** Task View Module: Displays a comprehensive list in List/Kanban board format, Accesses the screen to view expanded details of a task (UC-28, UC-29).
- **FR-TSK-03:** Collaborative features (collaboration): Allows users to tag each other and interact through comments, integrating Object Storage storage system attached to Upload document files (UC-30, UC-31).

## 5. AI Business Support (AI analytical support)

- **FR-AI-01:** Smart suggestions (Recommend): AI application analyzes the context, deadline parameters, interaction history to decide the suggestion "What is the next Task to do (Next Action)" (UC-32).
- **FR-AI-02:** Work health management (Overload Warning): AI scans and identifies associated workload, Overload warnings push notifications to Project Manager (UC-33).

## 6. Reporting (General report)

- **FR-RPT-01:** Ability to periodically compile progress data: Synthesize reports on completion rate, burn-down volume (UC-34).

## 7. Workflow Knowledge Sharing (Intellectual Capital Function)

- **FR-WF-01:** Automatic extraction into a common process: User is a Contributor with the right to convert a sample Project into a Template (UC-35, UC-36).
- **FR-WF-02:** Community Features: Post publicly to share Workflow, browse and explore organizational processes, Review, Comment and exchange on Contributor sample designs (UC-37 to UC-41).
- **FR-WF-03:** Flexible Reuse feature: Bookmark high quality templates, Deploy automatic cloning of new projects from selected Template Workflow (UC-42 to UC-44).

## 8. Dashboard

- **FR-DSH-01:** Project Dashboard: General metrics overview page for a specific project at the operator level (UC-45).
- **FR-DSH-02:** Personal Dashboard: Personal Analytics mode to view an individual's own overdue/on-time workload (UC-46).