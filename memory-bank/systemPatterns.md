# System Patterns: SoT Job Board

## Architecture Overview
- React-based frontend
- Supabase backend
- Component-based structure
- Responsive design system

## Design Patterns

### Component Architecture
- Atomic design principles
- Reusable UI components
- Container/Presenter pattern
- Custom hooks for logic

### State Management
- React Context for global state
- Local state for component-specific data
- Supabase real-time subscriptions
- Optimistic updates

### Data Flow
- Centralized API calls
- Type-safe data handling
- Error boundary implementation
- Loading state management

### Authentication
- Supabase Auth integration
- Role-based access control
- Protected routes
- Session management

### Form Handling
- Form validation patterns
- Error message handling
- Input masking
- Accessibility patterns

### Styling
- Tailwind utility classes
- Component-specific styles
- Responsive breakpoints
- Theme management

### Admin Dashboard Architecture
- Dashboard layout with multiple views
- Job management workflow system
- Real-time analytics tracking
- Theme customization system
- Email notification service

### Database Schema
```sql
-- Site Configuration
CREATE TABLE site_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logo_url TEXT,
    theme_color TEXT,
    header_font TEXT,
    body_font TEXT,
    allow_submissions BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Postings
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    location TEXT,
    salary_range TEXT,
    application_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    click_count INTEGER DEFAULT 0,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approval_date TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    submitter_email TEXT NOT NULL,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Click Analytics
CREATE TABLE click_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID REFERENCES job_postings(id),
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT
);

-- Email Notifications
CREATE TABLE email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID REFERENCES job_postings(id),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Technical Decisions
- TypeScript for type safety
- Vite for fast development
- Tailwind for styling
- Supabase for backend
- Email service integration for notifications
- Real-time updates for analytics
- Theme customization system 