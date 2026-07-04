1. # **Stakeholders & Actors**
   1. ## **Main Stakeholders**

- **Students (End User)**: use the system to manage tasks & learn how to manage
- **Student group (Team)**: collaborate on projects
- **Experienced person (Contributor)**: shares workflow and experience 2. ## **Actors in the system**

- **Guest**
- **Authenticated User**

2. # **USE CASE LIST**

- UC-01: Register an account
- UC-02: Login
- UC-03: Log out
- UC-04: Update personal information
- UC-05: Create workspace
- UC-06: Update workspace
- UC-07: Delete workspace
- UC-08: View workspace list
- UC-09: Add members to workspace
- UC-10: Remove members from workspace
- UC-11: Leave workspace
- UC-12: Request to join workspace
- UC-13: Cancel request to join workspace
- UC-14: Handle requests to join workspace
- UC-15: Create project
- UC-16: Update project
- UC-17: Delete project
- UC-18: View project list
- UC-19: Add members to the project
- UC-20: Remove members from the project
- UC-21: Leave project
- UC-22: Request to participate in project
- UC-23: Cancel request to join the project
- UC-24: Processing requests to participate in the project
- UC-25: Create task
- UC-26: Update tasks
- UC-27: Delete task
- UC-28: View task list
- UC-29: View task details
- UC-30: Comment on task
- UC-31: Attach file to task
- UC-32: Suggestions for tasks that should be performed next
- UC-33: Overload warning
- UC-34: Create progress report
- UC-35: Create workflow from project
- UC-36: Edit workflow
- UC-37: Share workflow
- UC-38: Explore workflow
- UC-39: View workflow details
- UC-40: Evaluate workflow
- UC-41: Comment workflow
- UC-42: Save favorite workflows
- UC-43: Create project from workflow
- UC-44: View posted workflow
- UC-45: View project dashboard
- UC-46: View personal dashboard

3. # **LIST OF USE CASE SPECIFICATION**
   1. ## **UC-01 Register account**

| Use case ID | UC-01 |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Function name** | Register an account |
| **Description** | Allows users to create new accounts in the system |
| **Actor** | Guest |
| **Preconditions** | User not logged in |
| **Subconditions** | Account created successfully |
| **Main stream** | User accesses the registration page User enters information User submits the registration form System checks data validity System creates account System notifies success |
| **Alternative Stream** | **A1: Register via OAuth (Google)** User chooses to register using OAuth System redirects to provider User authenticates System receives information and creates account |
|                     |                                                                                                                                                                                    |
| **Exception Stream** | **E1: Email already exists** → System reports error **E2: Invalid data (email format, weak password)** → System refuses and asks to re-enter |

2. ## **UC-02: Login**

| Use case ID | UC-02 |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Function name** | Sign in |
| **Description** | Allow users to log in |
| **Actor** | Guest |
| **Preconditions** | User has an account |
| **Subconditions** | User logged in successfully |
| **Main stream** | User enters email and password User sends login request Authentication system System creates session/token System transfers to system |
| **Alternative Stream** | **A1: Login with OAuth** User selects OAuth Redirect system User authenticates Login system |
|                     |                                                                                                                                              |
| **Exception Stream** | **E1: Wrong login information** → Error message **E2: 3rd party login error** → Login not allowed |

3. ## **UC-03: Sign out**

| Use case ID | UC-03 |
| :----------------- | :------------------------------------------------------------------------------ |
| **Function name** | Sign out |
| **Description** | Allow users to log out of the system |
| **Actor** | User |
| **Preconditions** | User is logged in |
| **Subconditions** | User logs out of the system |
| **Main stream** | User selects logout System deletes session/token Return to login page |
| **Alternative Stream** | None |
|                     |                                                                                  |
| **Exception Stream** | **E1: Token has expired / invalid** → System still considers logout successful |

4. ## **UC-04: Update personal information**

| Use case ID | UC-04 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Function name** | Update personal information |
| **Description** | Allows users to update their personal profile |
| **Actor** | User |
| **Preconditions** | User is logged in |
| **Subconditions** | Updated information |
| **Main stream** | User opens profile page User edits information User saves System validates System updates |
| **Alternative Stream** |                                                                                                               |
|                     |                                                                                                               |
| **Exception Stream** | **E1: Invalid avatar file** → Refuse to upload **E2: Invalid data** → Do not update |

5. ## **UC-05: Create workspace**

| Use case ID | UC-05 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | Create workspace |
| **Description** | Allows creating workspaces for project management |
| **Actor** | User |
| **Preconditions** | Logged in |
| **Subconditions** | Workspace is created User is owner |
| **Main stream** | User chooses to create workspace Enter workspace name Confirm creation System validates System creates workspace and assigns user as owner |
| **Alternative Stream** |                                                                                                                             |
|                     |                                                                                                                             |
| **Exception Stream** | **E1: Invalid/empty workspace name** → Re-entry required **E2: System error while saving DB** → Failure message |

6. ## **UC-06: Update workspace**

| Use case ID | UC-06 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | Update workspace |
| **Description** | Allows editing workspace information |
| **Actor** | User (Owner workspace) |
| **Preconditions** | Logged in user Has permission to edit workspace |
| **Subconditions** | Updated workspace information |
| **Main stream** | User accesses workspace settings page User edits information User saves changes System checks data System updates workspace |
| **Alternative Stream** |                                                                                                                                                           |
|                     |                                                                                                                                                           |
| **Exception Stream** | **E1: No editing rights** → System refuses **E2: Invalid data** → Not updated |

7. ## **UC-07: Delete workspace**

| Use case ID | UC-07 |
| :----------------- | :------------------------------------------------------------------------------------------------ |
| **Function name** | Delete workspace |
| **Description** | Allows deleting workspace and all related data |
| **Actor** | User (Owner) |
| **Preconditions** | The user is the owner of the workspace |
| **Subconditions** | Workspace is deleted from the system |
| **Main stream** | User chooses to delete workspace System asks for confirmation User confirms System deletes workspace |
| **Alternative Stream** | **A1: Cancel deletion operation** User chooses cancel System keeps workspace |
|                     |                                                                                                    |
| **Exception Stream** | **E1: Not owner** → Delete not allowed **E2: Error deleting data** → Failure message |

8. ## **UC-08: View workspace list**

| Use case ID | UC-08 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Function name** | View workspace list |
| **Description** | Allows users to view the workspaces they participate in |
| **Actor** | User |
| **Preconditions** | User is logged in |
| **Subconditions** | List of workspaces displayed |
| **Main stream** | User accesses dashboard System gets list of workspaces System displays |
| **Alternative Stream** | None |
|                     |                                                                                                                  |
| **Exception Stream** | **E1: There is no workspace** → Display empty status **E2: System error when loading data** → Error message |

9. ## **UC-09: Add members to workspace**

| Use case ID | UC-09 |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Function name** | Add members to workspace |
| **Description** | Allows adding other users to the workspace |
| **Actor** | User (Owner/ Manager) |
| **Preconditions** | User has membership management rights |
| **Subconditions** | Member added to workspace |
| **Main stream** | The user enters the email of the person he needs to add. The user confirms the addition. The system checks that the user exists. The system sends invitation to the recipient's email |
| **Alternative Stream** | None |
|                     |                                                                                                                                             |
| **Exception Stream** | **E1: User does not exist** → Error message **E2: User is already in the workspace** → Do not add again **E3: No permissions** → Deny |

10. ## **UC-10: Remove members from workspace**

| Use case ID | UC-10 |
| :----------------- | :---------------------------------------------------------------------------------------------------------- |
| **Function name** | Remove members from workspace |
| **Description** | Allows removing a member from workspace |
| **Actor** | User (Owner) |
| **Preconditions** | Have member management rights |
| **Subconditions** | Member removed from workspace |
| **Main stream** | User selects member User selects remove System confirms System deletes member |
| **Alternative Stream** | None |
|                     |                                                                                                      |
| **Exception Stream** | **E1: No rights** → Not allowed **E2: Delete owner** → Blocked, request to transfer ownership |

11. ## **UC-11 Leave workspace**

| Use case ID | UC-11 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Function name** | Leave workspace |
| **Description** | Allow members to leave the workspace themselves |
| **Actor** | User |
| **Preconditions** | User is logged in User is a member of workspace |
| **Subconditions** | User is removed from workspace |
| **Main stream** | User selects "Leave workspace" System asks for confirmation User confirms System deletes user from workspace |
| **Alternative Stream** | None |
| **Exception Stream** |                                                                                                                |

12. ## **UC-12 Request to join workspace**

| Use case ID | UC-12 |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | Request to join workspace |
| **Description** | Allows users to submit a request to join a workspace where they are not yet a member.                                                                                                             |
| **Actor** | User |
| **Preconditions** | User is logged in. User is not yet a member of the workspace. The workspace has a configuration that allows join requests.                                                                                        |
| **Subconditions** | The request to join is sent and is waiting for the workspace Owner/Manager to process.                                                                                                                                  |
| **Main stream** | Users search and select the workspace they want to join. User selects "Request to join". Condition checking system. The system records the request and sends a notification to the Owner/Manager of the workspace. |
| **Alternative Stream** | **A1: Workspace requires password/invitation code** User enters password/invitation code. Authentication system. If successful, add the user to the workspace (skip the request processing step).                                |
| **Exception Stream** | **E1: User is already a member** → The system reports an error.                                                                                                                                           |

13. ## **UC-13 Cancel request to join workspace**

| Use case ID | UC-13 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | **Cancel request to join workspace** |
| **Description** | Allows users to cancel a previously submitted workspace join request if it has not yet been processed.                                                          |
| **Actor** | User |
| **Preconditions** | The user has submitted a request to join and the request is pending.                                                                                              |
| **Subconditions** | The participation request is removed from the pending list.                                                                                                           |
| **Main stream** | The user accesses the list of sent requests. The user selects the request to join the workspace that needs to be canceled. User confirms cancellation. The system deletes the request from the system. |
| **Alternative Stream** | None |
| **Exception Stream** | **E1: The request has been processed (Accepted/Rejected)** → The system reports an error, cancellation is not allowed.                                                                |

14. ## **UC-14 Processing requests to join workspace**

| Use case ID | UC-14 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | **Handling requests to join workspace** |
| **Description** | Allows Owner/Manager to accept or deny requests to join workspaces from other users.                                                                                                                                                 |
| **Actor** | User (Owner/Manager workspace) |
| **Preconditions** | There is a pending request to join the workspace. User has the right to manage members in the workspace.                                                                                                                                              |
| **Subconditions** | The request is changed to status (Accepted/Rejected). The user is added to the workspace if accepted.                                                                                                                                         |
| **Main stream** | Owner/Manager accesses the participation request list. Select a request. Select action (Accept/Reject). If accepted, the system adds the user to the workspace with the default role (Member). The system sends a result notification to the requesting user. |
| **Alternative Stream** | **A1: Accept and assign custom roles** In step 3, Manager selects a specific role before accepting. The system assigns that role to the new user.                                                                                                |
| **Exception Stream** | **E1: The handler does not have permission** → Refuse the operation.                                                                                                                                                                                       |

15. ## **UC-15: Create project**

| Use case ID | UC-15 |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Function name** | Create project |
| **Description** | Allows users to create projects in workspace |
| **Actor** | User |
| **Preconditions** | Logged in user User belongs to workspace |
| **Subconditions** | The project is successfully created. The creator becomes the owner of the project |
| **Main stream** | User accesses workspace page User presses project creation button User enters information User confirms creation System checks data System creates project |
| **Alternative Stream** |                                                                                                                                                                      |
|                     |                                                                                                                                                                      |
| **Exception Stream** | **E1: Not part of workspace** → Creation not allowed **E2: System error when saving** → Failure message |

16. ## **UC-16: Project update**

| Use case ID | UC-16 |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Function name** | Update project |
| **Description** | Allows editing project information |
| **Actor** | User (Owner) |
| **Preconditions** | Have permission to edit project |
| **Subconditions** | Project information updated |
| **Main stream** | User opens project settings User edits information User saves System checks data System updates |
| **Alternative Stream** |                                                                                                                          |
|                     |                                                                                                                          |
| **Exception Stream** | **E1: No permission** → Reject **E2: Invalid data** → No update |

17. ## ​​**UC-17: Delete project**

| Use case ID | UC-17 |
| :----------------- | :------------------------------------------------------------------------------------------------ |
| **Function name** | Delete project |
| **Description** | Allows deleting projects and related data |
| **Actor** | User (Owner) |
| **Preconditions** | The user is owner |
| **Subconditions** | Project deleted |
| **Main stream** | User selects delete project System asks for confirmation User confirms System deletes project |
| **Alternative Stream** |                                                                                                   |
|                     |                                                                                                   |
| **Exception Stream** | **E1: Not owner** → Not allowed **E2: Error deleting data** → Error message |

18. ## **UC-18: View project list**

| Use case ID | UC-18 |
| :----------------- | :-------------------------------------------------------------------------------------------- |
| **Function name** | View project list |
| **Description** | Display project list in workspace |
| **Actor** | User |
| **Preconditions** | User belongs to workspace |
| **Subconditions** | Project list is displayed |
| **Main stream** | User accesses workspace System gets project list System displays |
| **Alternative Stream** | **A1: Filter / search project** User enters keyword / filter Filter system Display results |
|                     |                                                                                               |
| **Exception Stream** | **E1: No project** → Display empty state **E2: Error loading data** → Error message |

19. ## **UC-19: Add members to project**

| Use case ID | UC-19 |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | Add members to project |
| **Description** | Allows adding members from workspace to project |
| **Actor** | User (Owner / Manager) |
| **Preconditions** | Have project management rights. The user you need to add already belongs to the workspace |
| **Subconditions** | Member added to project |
| **Main stream** | User selects to add member Select user from workspace list Select role (member, viewer,...) Confirm System adds to project |
| **Alternative Stream** | **A1: Quick add (default role)** User selects user System automatically assigns default role Add to project |
|                     |                                                                                                                                     |
| **Exception Stream** | **E1: User not in the workspace** → Not allowed **E2: User already in the project** → Do not add again **E3: No permissions** → Deny |

20. ## **UC-20: Remove members from project**

| Use case ID | UC-20 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | Remove members from project |
| **Description** | Allows removing a member from project |
| **Actor** | User |
| **Preconditions** | User has permission to manage project Member exists in project |
| **Subconditions** | Member removed from project |
| **Main stream** | User opens project member list User selects member User selects remove System asks for confirmation User confirms System removes member from project |
| **Alternative Stream** | None |
|                     |                                                                                                                                                                                 |
| **Exception Stream** | **E1: No rights** → System refuses **E2: Delete owner** → Blocked or requested to transfer ownership |

21. ## **UC-21 Leaving project**

| Use case ID | UC-21 |
| :----------------- | :---------------------------------------------------------------------------------------------------------- |
| **Function name** | Leave project |
| **Description** | Allow members to leave the project themselves |
| **Actor** | User (belongs to project) |
| **Preconditions** | User is logged in and is a member of project |
| **Subconditions** | User deleted from project |
| **Main stream** | User selects "Leave project" System asks for confirmation User confirms System deletes user from project |
| **Alternative Stream** | None |
| **Exception Stream** | **E1:** User is Owner **→** Blocked or required to transfer ownership |

22. ## **UC-22 Project participation request**

| Use case ID | UC-22 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | **Request to join the project** |
| **Description** | Allows workspace members to submit requests to join a project where they are not members.                                                                        |
| **Actor** | User (belongs to workspace) |
| **Preconditions** | The user is logged in and belongs to the workspace containing the project. User is not a member of the project. Project has a configuration that allows participation requests.                                   |
| **Subconditions** | The participation request is sent and waiting for the Project Owner/Manager to process.                                                                                                             |
| **Main stream** | User accesses project (in limited view). User selects "Request to join project". The system records the request and sends a notification to the Owner/Manager of the project. |
| **Alternative Stream** | None |
| **Exception Stream** | **E1: User is already a member of the project** → System error notification.                                                                                                        |

23. ## **UC-23 Cancel project participation request**

| Use case ID | UC-23 |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | **Cancel request to participate in project** |
| **Description** | Allows users to cancel a previously submitted project participation request if the request has not been processed.                                                          |
| **Actor** | User (belongs to workspace) |
| **Preconditions** | The user has sent a request to join the project and the request is pending.                                                                                    |
| **Subconditions** | The request to join the project has been cancelled.                                                                                                                          |
| **Main stream** | The user accesses the list of sent requests. The user selects the request to join the project that needs to be canceled. User confirms cancellation. The system deletes the request from the system. |
| **Alternative Stream** | None |
| **Exception Stream** | **E1: The request has been processed (Accepted/Rejected)** → The system reports an error, cancellation is not allowed.                                                              |

24. ## **UC-24 Processing project participation request**

| Use case ID | UC-24 |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Function name** | **Processing requests to join the project** |
| **Description** | Allows Project Owner/Manager to accept or decline requests to join the project.                                                                                                                                                          |
| **Actor** | User (Owner/Manager project) |
| **Preconditions** | There is a request to join the project pending. User has the right to manage members in the project.                                                                                                                                              |
| **Subconditions** | Request to change status. The user is added to the project if accepted.                                                                                                                                                           |
| **Main stream** | Owner/Manager accesses the list of project participation requests. Select a request. Select action (Accept/Reject). If accepted, the system adds the user to the project and assigns default roles. The system sends a result notification to the requesting user. |
| **Alternative Stream** | None |
| **Exception Stream** | **E1: The handler does not have permission** → Refuse the operation.                                                                                                                                                                                   |

25. ## **UC-25: Create task**

| Use case ID | UC-25 |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | Create task |
| **Description** | Allows creating tasks in project |
| **Actor** | User |
| **Preconditions** | User belongs to project |
| **Subconditions** | Task created successfully |
| **Main stream** | User chooses to create task User enters information (title, description,...) User confirms System checks data System creates task |
| **Alternative Stream** | **A1: Quick add** User enters title quickly System creates task with default config **A2: Creates task from AI (natural language)** User enters natural description User sends request System sends data to AI service AI analyzes and returns task structure (title, description, priority, deadline, ...) System displays preview User confirms System creates task A3: Create subtask |
|                     |                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Exception Stream** | **E1: Not part of the project** → Do not allow creation **E2: Invalid data** → Reject |

26. ## **UC-26: Update task**

| Use case ID | UC-26 |
| :----------------- | :---------------------------------------------------------------------------------------------- |
| **Function name** | Update tasks |
| **Description** | Allows editing task information |
| **Actor** | User |
| **Preconditions** | Have permission to edit tasks |
| **Subconditions** | Task updated |
| **Main stream** | User opens task User edits User saves System validates System updates |
| **Alternative Stream** | **A1: Inline edit (quick edit)** Users edit directly on the list/board Auto-save system |
|                     |                                                                                                |
| **Exception Stream** | **E1: No permission** → Reject **E2: Invalid data** → No update |

27. ## **UC-27: Delete task**

| Use case ID | UC-27 |
| :----------------- | :------------------------------------------------------------------------------------------ |
| **Function name** | Delete tasks |
| **Description** | Allows deleting tasks |
| **Actor** | User |
| **Preconditions** | Has the right to delete tasks |
| **Subconditions** | Task deleted |
| **Main stream** | User selects delete task System asks for confirmation User confirms System deletes task |
| **Alternative Stream** |                                                                                             |
|                     |                                                                                             |
| **Exception Stream** | **E1: No permission** → Not allowed **E2: Task does not exist** → Report error |

28. ## **UC-28: View task list**

| Use case ID | UC-28 |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | View task list |
| **Description** | Display task list in project |
| **Actor** | User |
| **Preconditions** | User belongs to project |
| **Subconditions** | Task list is displayed |
| **Main stream** | User accesses project System gets list of tasks System displays |
| **Alternative Stream** | **A1: Filter / search tasks** User enters filter (status, assignee, priority) Filter system Display **A2: View by multiple views (list / kanban / calendar)** User selects view Corresponding rendering system |
|                     |                                                                                                                                                                                                             |
| **Exception Stream** | **E1: No task** → Display empty state **E2: Error loading data** → Error message |

29. ## **UC-29: View task details**

| Use case ID | UC-29 |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| **Function name** | View task details |
| **Description** | Allows users to view complete information of a task |
| **Actor** | User |
| **Preconditions** | Task exists User has access |
| **Subconditions** | Task information is displayed |
| **Main stream** | User selects a task. The system retrieves detailed data (description, assignee, deadline, priority, subtask, ...) The system displays |
| **Alternative Stream** | **A1: Quick preview** User hovers / quickly clicks System displays popup |
|                     |                                                                                                                                  |
| **Exception Stream** | **E1: Task does not exist** → Error message **E2: No access rights** → Deny |

30. ## **UC-30: Comment on task**

| Use case ID | UC-30 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | Comment tasks |
| **Description** | Allows users to exchange and discuss in task |
| **Actor** | User |
| **Preconditions** | Task exists |
| **Subconditions** | Comment created |
| **Main stream** | User opens task User enters comment User submits System saves comment |
| **Alternative Stream** | **A1: Mention user (@user)** The user mentions The system notifies the user **A2: Reply user** The user presses the reply button to a comment The user enters a reply comment The user submits The system saves the comment |
|                     |                                                                                                                                                                                                 |
| **Exception Stream** | **E1: Empty content** → Do not allow sending **E2: No permission to access task** → Refuse |

31. ## **UC-31: Attach file to task**

| Use case ID | UC-31 |
| :----------------- | :---------------------------------------------------------------------------------------------------------- |
| **Function name** | Attach file |
| **Description** | Allows uploading and attaching files to tasks |
| **Actor** | User |
| **Preconditions** | Task exists |
| **Subconditions** | The file is saved and associated with task |
| **Main stream** | User chooses to upload file User selects file Upload system System saves metadata File display |
| **Alternative Stream** | **A1: Drag & drop file** User drags file into UI Upload system |
|                     |                                                                                                      |
| **Exception Stream** | **E1: File too large / invalid format** → Reject **E2: Upload error** → Notice |

32. ## **UC-32: Suggested task that should be done next**

| Use case ID | UC-32 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Function name** | Next task suggestion |
| **Description** | The AI ​​system recommends priority tasks to do next based on project status, deadline, and dependencies.          |
| **Actor** | User |
| **Preconditions** | User has project and task list |
| **Subconditions** | The suggested list is displayed |
| **Main stream** | User opens the project. The system displays next task suggestions with explanations on the project dashboard interface |
| **Alternative Stream** | Not enough data → simple suggestion (latest deadline) |
|                     |                                                                                                                |
| **Exception Stream** | AI service error → fallback rule-based |

33. ## **UC-33: Overload warning**

| Use case ID | UC-33 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | Work overload warning |
| **Description** | The system detects when a user's workload exceeds the threshold and issues a warning.                                                                              |
| **Actor** | User |
| **Preconditions** | User has many active tasks with estimate or deadline |
| **Subconditions** | User receives overload warning |
| **Main stream** | The system periodically checks the workload Calculate total effort / time Compare with configured threshold If threshold is exceeded → create alert Display alert on UI |
| **Alternative Stream** | There is no estimate → use the number of tasks instead |
|                     |                                                                                                                                                      |
| **Exception Stream** | E1. Not enough data → no warning |

34. ## **UC-34 Generate progress report**

| Use case ID         | UC-34                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tên chức năng**   | Tạo báo cáo tiến độ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Mô tả**           | Hệ thống sử dụng AI để phân tích dữ liệu project và sinh ra: Tóm tắt tiến độ (summary) Phân tích hiệu suất Phát hiện vấn đề (risk, bottleneck) Đề xuất cải thiện                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Tác nhân**        | User                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Điều kiện trước** | User đã đăng nhập Project có: Task Status history hoặc activity log                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Điều kiện sau**   | Insight được hiển thị cho user Có thể export                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Luồng chính**     | User truy cập trang project dashboard User chọn “Generate Report” Hệ thống thu thập dữ liệu: Task list (status, priority, assignee) Deadline Completion history Activity log Hệ thống tiền xử lý: Loại bỏ dữ liệu nhiễu Chuẩn hóa format Tính toán metric: Completion rate Avg completion time Overdue ratio Gửi dữ liệu sang AI Engine AI thực hiện: Tóm tắt tiến độ Phân tích xu hướng Phát hiện vấn đề: Task bị delay nhiều Bottleneck theo assignee Sinh đề xuất: Re-prioritize Reassign task Hệ thống nhận kết quả và format lại: Summary section Insight section Recommendation section Hiển thị cho user User có thể: Export (PDF / text) Copy nội dung Regenerate |
| **Luồng thay thế**  | **A1. Dữ liệu không đủ mạnh** Summary đơn giản Không có recommendation **A2. User chọn quick mode** Bỏ qua phân tích sâu Chỉ trả về summary \+ basic stats                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Luồng ngoại lệ**  | **E1. AI service timeout / lỗi** Fallback: Hiển thị thống kê: Completion rate Task done / total Thông báo: “AI insight currently unavailable” **E2. Dữ liệu không hợp lệ** Không generate report Hiển thị lỗi validation                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

35. ## **UC-35: Create workflow from project**

| Use case ID         | UC-35                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Tạo workflow từ project                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Mô tả**           | Cho phép người dùng chuyển một project hiện có thành workflow. Hệ thống tự động phân tích cấu trúc project (sprint, task), sinh các bước thực hiện (workflow steps) bằng rule-based, sau đó sử dụng AI để tinh chỉnh tên và mô tả các bước nhằm tăng tính dễ hiểu. Người dùng có thể chỉnh sửa trước khi publish.                                                                                                                                                                                                     |
| **Tác nhân**        | User                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Điều kiện trước** | Người dùng đã đăng nhập vào hệ thống Người dùng có quyền truy cập project Project tồn tại và có ít nhất 1 task hoặc sprint                                                                                                                                                                                                                                                                                                                                                                                            |
| **Điều kiện sau**   | Workflow được tạo ở trạng thái Draft Workflow bao gồm danh sách step, mapping với task/sprint và có thể chỉnh sửa                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Luồng chính**     | Người dùng chọn project cần chia sẻ Người dùng chọn chức năng “Share as Workflow” Hệ thống thu thập dữ liệu từ project (sprint, task, subtask) Hệ thống sinh workflow step bằng rule-based: Nếu có sprint → mỗi sprint là một step Nếu không có sprint → nhóm task theo keyword hoặc trạng thái Hệ thống gửi danh sách step sang AI để tinh chỉnh tên và mô tả Hệ thống nhận kết quả từ AI và tổng hợp workflow hoàn chỉnh Hệ thống hiển thị preview workflow cho người dùng Hệ thống lưu workflow ở trạng thái Draft |
| **Luồng thay thế**  | A1: Không có sprint Hệ thống nhóm task theo keyword hoặc trạng thái để tạo step A2: Người dùng không sử dụng AI refinement Hệ thống giữ nguyên step từ rule-based                                                                                                                                                                                                                                                                                                                                                     |
|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Luồng ngoại lệ**  | E1: AI service không khả dụng Hệ thống fallback sang rule-based Workflow vẫn được tạo nhưng không có mô tả nâng cao E2: Dữ liệu project không hợp lệ (task rỗng hoặc không đủ thông tin) Hệ thống thông báo lỗi và không tạo workflow                                                                                                                                                                                                                                                                                 |

36. ## **UC-36: Edit workflow**

| Use case ID | UC-36 |
| :----------------- | :------------------------------------------------------------------------ |
| **Function name** | Edit workflow |
| **Description** | Allows editing workflow content |
| **Actor** | User |
| **Preconditions** | Workflow is in draft state |
| **Subconditions** | Workflow updated |
| **Main stream** | User opens workflow Edit workflow content Save System updates |
| **Alternative Stream** | **A1: Reorder step** → Drag & drop **A2: Add / delete step** → Update |
|                     |                                                                          |
| **Exception Stream** | **E1: No permission** → Deny |

37. ## ​​**UC-37: Share workflow**

| Use case ID         | UC-37                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tên chức năng**   | Chia sẻ workflow                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Mô tả**           | User đưa workflow lên community để chia sẻ.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Tác nhân**        | User                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Điều kiện trước** | Workflow hợp lệ Đã điền đủ metadata                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Điều kiện sau**   | Workflow public Có thể được người khác tìm thấy                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Luồng chính**     | User mở workflow ở trạng thái draft User nhấn “Publish” Hệ thống kiểm tra quyền hạn user: Có phải owner không Workflow có bị lock không Hệ thống validate dữ liệu: Name không rỗng Description đạt độ dài tối thiểu Có ít nhất 1 task Task không bị orphan (dependency hợp lệ) Hệ thống chuẩn hóa dữ liệu: Trim text Chuẩn hóa format task Sinh metadata: createdAt version slug (cho URL) Hệ thống thực hiện publish: Update trạng thái Public cho workflow Lưu vào database Hệ thống trả response thành công Hệ thống thông báo publish thành công và redirect sang trang workflow detail |
| **Luồng thay thế**  | **A1. User chỉnh sửa trước khi publish** Tại bước 2: User chọn “Edit” thay vì publish Quay lại UC-35 **A2. Workflow đã từng publish (republish/update)** Tại bước 3, nếu workflow đã publish trước đó: Không tạo mới Tăng version Update nội dung Sau đó tiếp tục từ bước 5 **A3. Soft validation warning** Tại bước 4, nếu description quá ngắn / thiếu tag: Không block Hiển thị warning: “Workflow có thể khó được tìm thấy” User vẫn có thể tiếp tục publish                                                                                                                            |
|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Luồng ngoại lệư** | E1. Không đủ quyền Tại bước 3, nếu user không phải owner → Trả lỗi: 403 Forbiden → Không tiếp tục E2. Validation fail Tại bước 4: Thiếu name / task invalid → Trả lỗi: Hiển thị field bị lỗi → Không publish E3. Lỗi database khi lưu Tại bước 6: DB lỗi / transaction fail → Rollback toàn bộ → Trả lỗi “Publish thất bại, thử lại sau”                                                                                                                                                                                                                                                    |

38. ## **UC-38: Exploring workflow**

| Use case ID | UC-38 |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Function name** | Explore workflow |
| **Description** | Allows users to search and use workflows from others |
| **Actor** | User |
| **Preconditions** |                                                                                                                                                                     |
| **Subconditions** |                                                                                                                                                                     |
| **Main stream** | User opens discovery page System displays list of public workflows User searches / filters User selects workflow User apply |
| **Alternative Stream** | **A1: AI suggests suitable workflow** System analyzes user behavior Suggests workflow **A2: See preview before using** User opens preview See step Decide to apply |
|                     |                                                                                                                                                                     |
| **Exception Stream** | **E1: No suitable workflow** → Empty display |

39. ## **UC-39 View workflow details**

| Use case ID | UC-39 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | **See detailed workflow** |
| **Description** | Allows users to view the structure, description, and detailed steps of a shared (public) or draft workflow.                                                                             |
| **Actor** | User |
| **Preconditions** | Workflow exists. User has access (public or owner/draft).                                                                                                                                        |
| **Subconditions** | Detailed information of the workflow is displayed.                                                                                                                                                                      |
| **Main stream** | The user visits the Explore page or the list of posted workflows. The user selects a workflow. The system retrieves detailed data (steps, descriptions, reviews, comments). The system displays workflow details. |
| **Alternative Stream** | **A1: View author information** User clicks on the author's name. The system displays the author's basic profile.                                                                                                         |
| **Exception Stream** | **E1: Workflow does not exist or does not have access permission** → 404 error message or access denied.                                                                                                              |

40. ## **UC-40 Workflow Evaluation**

| Use case ID | UC-40 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | **Workflow review** |
| **Description** | Allows users to rate the quality of the shared workflow.                                                                                                    |
| **Actor** | User |
| **Preconditions** | Workflow exists and is public. User is logged in.                                                                                                                       |
| **Subconditions** | User reviews are recorded and the average score of the workflow is updated.                                                                                                   |
| **Main stream** | Users view workflow details. The user selects the number of rating stars (1-5) and/or enters a short comment. The system saves the user's rating. The system updates the average score for the workflow. |
| **Alternative Stream** | **A1: Change rating** User has rated, re-select number of stars/edit comment. New rating update system.                                                                     |
| **Exception Stream** | **E1: System error when saving** → Failure message.                                                                                                                                |

41. ## **UC-41 Comment workflow**

| Use case ID | UC-41 |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function name** | **Comment workflow** |
| **Description** | Allows users to exchange and comment on the content of the shared workflow.                                                                                 |
| **Actor** | User |
| **Preconditions** | Workflow exists and is public. User is logged in.                                                                                                       |
| **Subconditions** | Comments are saved and displayed in the workflow's comments list.                                                                                            |
| **Main stream** | Users view workflow details. User enters comment content. User submitted. The system checks the content and saves comments. The system displays new comments. |
| **Alternative Stream** | **A1: Reply to comment (Reply)** User chooses to reply to a comment. The system saves comments as child comments.                                                  |
| **Exception Stream** | **E1: Invalid comment content (empty/spam)** → Refuse to post and error message.                                                                             |

42. ## **UC-42 Save favorite workflow**

| Use case ID | UC-42 |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Function name** | **Save favorite workflow** |
| **Description** | Allows users to mark and store shared (public) workflows for easy tracking/use later.                                                           |
| **Actor** | User |
| **Preconditions** | Workflow exists and is public. User is logged in.                                                                                                               |
| **Subconditions** | Workflow added/removed from user's favorites list.                                                                                                            |
| **Main stream** | User views workflow list/details. The user selects the "Save favorite" icon (Favorite). The system saves the workflow link to the user's favorite list. |
| **Alternative Stream** | **A1: Remove favorites** The user selects the "Save favorites" icon again. The system deletes workflows from the favorites list.                                                      |
| **Exception Stream** | **E1: System error when saving** → Failure message.                                                                                                                        |

43. ## **UC-43: Create project from workflow**

| Use case ID | UC-43 |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Function name** | Create project from workflow |
| **Description** | Allows creating projects from existing workflows |
| **Actor** | User |
| **Preconditions** |                                                                                                                                                                      |
| **Subconditions** |                                                                                                                                                                      |
| **Main stream** | User selects workflow User selects “Apply” System creates project or task structure System displays results |
| **Alternative Stream** | **A1: Apply part of the workflow** User selects step The system only creates that part **A2: Customize before applying** System displays preview User edits Create |
|                     |                                                                                                                                                                      |
| **Exception Stream** |                                                                                                                                                                      |

44. ## **UC-44 View posted workflow**

| Use case ID | UC-44 |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Function name** | **See posted workflow** |
| **Description** | Allows users to view a list of workflows they have created and shared (public) or are in draft status.                                                                           |
| **Actor** | User |
| **Preconditions** | User is logged in.                                                                                                                                                                             |
| **Subconditions** | A list of user-created workflows is displayed (including Draft and Public).                                                                                                                     |
| **Main stream** | Users access their personal workflow management page. The system queries the list of workflows authored by this user. The system displays a list, including name, description and status (Draft/Public). |
| **Alternative Stream** | **A1: Filter by status** 1\. User selects filter (Draft / Public). 2\. The system updates the display list.                                                                             |
| **Exception Stream** | **E1: No workflows posted** → Displays empty status and suggests creating a new one.                                                                                                          |

45. ## **UC-45: View project dashboard**

| Use case ID | UC-45 |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Function name** | View dashboard project |
| **Description** | Show overview of work progress, projects and performance |
| **Actor** | User |
| **Preconditions** | User has data task/project |
| **Subconditions** | Dashboard is displayed |
| **Main stream** | User opens dashboard Data synthesis system (tasks, deadlines, progress...) Chart / statistics display system |
| **Alternative Stream** | **A1: Filter by project / time** User selects filter System updates display data **A2: Customize dashboard widget** User selects widget he wants to view System saves config |
|                     |                                                                                                                                                                                          |
| **Exception Stream** | **E1: No data** → Show empty status |

46. ## **UC-46: View personal dashboard**

| Use case ID | UC-46 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Function name** | View personal dashboard |
| **Description** | Evaluate work performance based on task data |
| **Actor** | User |
| **Preconditions** |                                                                                                                 |
| **Subconditions** |                                                                                                                 |
| **Main stream** | User opens analytics System calculates: Task completed Average time Deadline miss Show results |
| **Alternative Stream** | **A1: Advanced analytical AI** System sends data to AI AI makes comments Show insight |
|                     |                                                                                                                 |
| **Exception Stream** | **A1: Advanced analytical AI** System sends data to AI AI makes comments Show insight |

##

##