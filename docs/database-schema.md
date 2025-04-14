# SoT Job Board Database Schema

This document describes the database schema for the School of Technology Job Board, focusing on the admin dashboard functionality.

## Tables

### 1. site_config

Stores site-wide configuration settings.

| Column             | Type                      | Description                          |
|--------------------|---------------------------|--------------------------------------|
| id                 | UUID                      | Primary key                          |
| logo_url           | TEXT                      | URL to the site logo                 |
| theme_color        | TEXT                      | Primary theme color                  |
| header_font        | TEXT                      | Font for headers                     |
| body_font          | TEXT                      | Font for body text                   |
| allow_submissions  | BOOLEAN                   | Whether job submissions are allowed  |
| created_at         | TIMESTAMP WITH TIME ZONE  | Creation timestamp                   |
| updated_at         | TIMESTAMP WITH TIME ZONE  | Last update timestamp                |

### 2. job_postings

Stores all job postings with approval workflow.

| Column             | Type                      | Description                          |
|--------------------|---------------------------|--------------------------------------|
| id                 | UUID                      | Primary key                          |
| title              | TEXT                      | Job title                            |
| company_name       | TEXT                      | Company name                         |
| description        | TEXT                      | Job description                      |
| requirements       | TEXT                      | Job requirements                     |
| location           | TEXT                      | Job location                         |
| salary_range       | TEXT                      | Salary range                         |
| application_url    | TEXT                      | Application URL                      |
| status             | TEXT                      | Status (pending/approved/rejected/expired)|
| click_count        | INTEGER                   | Number of application clicks         |
| submission_date    | TIMESTAMP WITH TIME ZONE  | Submission timestamp                 |
| approval_date      | TIMESTAMP WITH TIME ZONE  | Approval timestamp                   |
| expiration_date    | TIMESTAMP WITH TIME ZONE  | Expiration timestamp                 |
| submitter_email    | TEXT                      | Email of submitter                   |
| admin_notes        | TEXT                      | Admin notes                          |
| created_at         | TIMESTAMP WITH TIME ZONE  | Creation timestamp                   |
| updated_at         | TIMESTAMP WITH TIME ZONE  | Last update timestamp                |

### 3. click_analytics

Tracks clicks on job application links.

| Column             | Type                      | Description                          |
|--------------------|---------------------------|--------------------------------------|
| id                 | UUID                      | Primary key                          |
| job_posting_id     | UUID                      | Foreign key to job_postings          |
| clicked_at         | TIMESTAMP WITH TIME ZONE  | Timestamp of click                   |
| user_agent         | TEXT                      | User agent string                    |
| ip_address         | TEXT                      | IP address                           |

### 4. email_notifications

Tracks email notifications sent for job status changes.

| Column             | Type                      | Description                          |
|--------------------|---------------------------|--------------------------------------|
| id                 | UUID                      | Primary key                          |
| job_posting_id     | UUID                      | Foreign key to job_postings          |
| recipient_email    | TEXT                      | Email recipient                      |
| subject            | TEXT                      | Email subject                        |
| body               | TEXT                      | Email body                           |
| status             | TEXT                      | Status (pending/sent/failed)         |
| sent_at            | TIMESTAMP WITH TIME ZONE  | Timestamp when sent                  |
| created_at         | TIMESTAMP WITH TIME ZONE  | Creation timestamp                   |

### 5. admin_profiles

Stores admin user information.

| Column             | Type                      | Description                          |
|--------------------|---------------------------|--------------------------------------|
| id                 | UUID                      | Primary key (links to auth.users)    |
| name               | TEXT                      | Admin name                           |
| email              | TEXT                      | Admin email                          |
| avatar_url         | TEXT                      | URL to admin avatar                  |
| is_super_admin     | BOOLEAN                   | Super admin flag                     |
| created_at         | TIMESTAMP WITH TIME ZONE  | Creation timestamp                   |
| updated_at         | TIMESTAMP WITH TIME ZONE  | Last update timestamp                |

## Views

### 1. active_job_listings

Shows all active job listings with days until expiration.

### 2. pending_job_submissions

Shows pending job submissions that need approval.

### 3. job_posting_analytics

Shows analytics of job postings by status.

### 4. active_jobs_analytics

Shows analytics for currently active job postings.

### 5. expiring_jobs

Shows jobs expiring within the next 7 days.

### 6. click_analytics_daily

Shows daily click analytics.

### 7. pending_approvals_stats

Shows statistics about pending approvals.

### 8. admin_dashboard_summary

Shows summary statistics for the admin dashboard.

### 9. email_notification_stats

Shows statistics about email notifications.

## Functions

### Job Management

- `approve_job(job_id, days_active, admin_notes)`: Approves a job posting
- `reject_job(job_id, rejection_reason)`: Rejects a job posting
- `extend_job_expiration(job_id, additional_days)`: Extends job expiration
- `track_job_click(job_id, user_agent, ip_address)`: Tracks a job application click
- `expire_old_jobs()`: Automatically expires old jobs

### Admin Management

- `is_admin(user_id)`: Checks if a user is an admin
- `create_admin(email, name, avatar_url, is_super_admin)`: Creates a new admin
- `remove_admin(user_id)`: Removes admin privileges
- `bootstrap_first_admin(email, name)`: Creates the first super admin
- `get_all_admins()`: Gets all admin users
- `is_admin_claim()`: Function for JWT claim to identify admins

### Site Configuration

- `update_site_config(logo_url, theme_color, header_font, body_font, allow_submissions)`: Updates site config
- `get_site_config()`: Gets current site configuration
- `toggle_job_submissions(enable)`: Toggles job submissions on/off

### Email Notifications

- `mark_email_sent(email_id)`: Marks an email as sent
- `mark_email_failed(email_id, error_message)`: Marks an email as failed
- `get_pending_emails(limit)`: Gets pending email notifications

## Public API Functions

These functions are exposed to the client application.

### Admin Functions (require admin privileges)

- `admin_approve_job(job_id, days_active, admin_notes)`: Approves a job posting
- `admin_reject_job(job_id, rejection_reason)`: Rejects a job posting
- `admin_extend_job(job_id, additional_days)`: Extends job expiration
- `admin_update_site_config(logo_url, theme_color, header_font, body_font, allow_submissions)`: Updates site config
- `admin_toggle_submissions(enable)`: Toggles job submissions on/off
- `admin_get_pending_emails(limit)`: Gets pending email notifications
- `get_admin_dashboard_summary()`: Gets dashboard summary

### Public Functions

- `track_job_application_click(job_id)`: Tracks a job application click
- `get_site_config()`: Gets current site configuration

## Row-Level Security (RLS)

- **job_postings**: Admins can manage all postings; public can only view approved, non-expired jobs
- **site_config**: Admins can manage; public can only view
- **click_analytics**: Admins can manage; public can insert (for tracking)
- **email_notifications**: Admins only
- **admin_profiles**: Admins only

## JWT Claims

The system uses a custom JWT claim `is_admin` to identify admin users. This claim is added to the JWT token when a user is authenticated and is an admin.

## Setup

1. Run the migrations in the `supabase/migrations` directory
2. Set up the JWT claim in Supabase Dashboard > Authentication > JWT Templates
3. Create the first admin user using the `bootstrap_first_admin` function

## Example Usage

### Creating the First Admin

```sql
SELECT bootstrap_first_admin('admin@example.com', 'Admin User');
```

### Approving a Job Posting

```sql
SELECT admin_approve_job('job-uuid', 30, 'Approved by admin');
```

### Updating Site Configuration

```sql
SELECT admin_update_site_config(
  '/new-logo.png',
  '#FF5722',
  'Roboto',
  'Open Sans',
  true
);
```

### Tracking a Job Click

```sql
SELECT track_job_application_click('job-uuid');
``` 