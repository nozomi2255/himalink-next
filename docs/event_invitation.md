# Event Invitation Feature

To support inviting users to events and managing participation, create the following table and RPCs in Supabase.

## Table: `EventParticipants`

| Column      | Type    | Description                              |
|-------------|---------|------------------------------------------|
| id          | uuid PK | Primary key                              |
| event_id    | uuid FK | References `Entries.id`                  |
| user_id     | uuid FK | Invited or participating user            |
| status      | text    | `invited`, `requested`, `accepted`       |
| created_at  | timestamptz | record creation time                |
| updated_at  | timestamptz | record update time                  |

## RPCs

- `invite_user_to_event(p_entry_id uuid, p_email text)`
  - Finds a user by email and inserts a row with status `invited`.
- `request_join_event(p_entry_id uuid)`
  - Inserts or updates a row for the current user with status `requested`.
- `approve_join_request(p_entry_id uuid, p_user_id uuid)`
  - Updates the row for the user to status `accepted`.
- `get_entry_participants(p_entry_id uuid)`
  - Returns participants with their status and profile information.

These additions enable inviting, joining and approving participation in events.
