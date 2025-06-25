# Timesheet (Supabase Web App)

![image](https://github.com/user-attachments/assets/91e036b8-ec8f-4537-b4a3-6779025a9498)
![image](https://github.com/user-attachments/assets/01925e79-6782-4c99-ad9c-aed6bca60b97)
![image](https://github.com/user-attachments/assets/1c304466-0e46-44ff-804f-b80208c38427)


### 1. Supabase Project Setup

You need a free Supabase account to run this project.

1.  **Create a new Supabase project.**
2.  Go to the **Table Editor** and create the following two tables:

    **Table: `projects`**
    | Column | Type | Notes |
    |---|---|---|
    | `id` | `int8` (Primary Key) | Auto-generated |
    | `name` | `text` | The project's name |
    | `is_active`| `bool` | Default: `true` |

    **Table: `time_entries`**
    | Column | Type | Notes |
    |---|---|---|
    | `id` | `int8` (Primary Key) | Auto-generated |
    | `created_at` | `timestamp` | The date of the entry |
    | `hours`| `numeric`| Hours worked on the project |
    | `user_id`| `uuid` | Foreign Key -> `auth.users.id` |
    | `project_id`| `int8`| Foreign Key -> `projects.id` |


### 2. Configure the Frontend

1.  Open the `app.js` file.
2.  At the top of the file, replace the placeholder values for `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your own keys from your Supabase project's **Settings > API** page.

    ```javascript
    const SUPABASE_URL = 'YOUR_SUPABASE_URL';
    const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
    ```

