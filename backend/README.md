# CloudTracker Backend API

This is the FastAPI backend for the CloudTracker application, a cloud applications tracking and validation tool.

## Features

- User authentication with JWT tokens
- Applications management with detailed Git and environment information
- Checklist items management
- Dashboard metrics and recent activities
- Database seeding with initial data
- Git repository validation with authentication support for private repositories

## Setup

1. Create a virtual environment (optional but recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install the dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the backend directory with your environment variables:

```
# Database Configuration
DATABASE_URL=sqlite:///./cloudtracker.db

# Security Settings
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Keys
OPENAI_API_KEY=your-api-key-here

# GitHub/Git Configuration
GITHUB_TOKEN=your-github-token-here  # For GitHub repositories
GIT_AUTH_TOKEN=your-git-auth-token-here  # For any Git repositories
```

4. Run the server:

```bash
python run.py
```

The server will run at http://localhost:8000 by default.

## API Documentation

Once the server is running, you can access:

- OpenAPI documentation: http://localhost:8000/docs
- ReDoc documentation: http://localhost:8000/redoc

## Default Credentials

The database is automatically seeded with:

- Username: admin
- Password: password123

## Default Categories and Checklist Items

The system provides the following default categories and checklist items:

### Application Categories
1. Auditability
   - Logs are searchable and available
   - Avoid logging confidential data
   - Create audit trail logs
   - Implement tracking ID for log messages
   - Log REST API calls
   - Log application messages
   - Client UI errors are logged
2. Availability
   - Retry Logic
   - Set timeouts on IO operation
   - Auto scale
   - Throttling, drop request
   - Set circuit breakers on outgoing requests
3. Error Handling
   - Log system errors
   - Use HTTP standard error codes
   - Include Client error tracking
4. DC.Testing
   - Automated Regression Testing

### Platform Categories
1. Alerting (ID: platform-alerting)
   - All alerting is actionable
2. Availability (ID: platform-availability)
   - Automated failovers
3. Monitoring Infra (ID: platform-monitoring-infra)
   - Monitor CPU utilization
4. Monitoring App (ID: platform-monitoring-app)
   - Monitoring application process
   - Monitor port availability
   - URL monitoring
   - Monitor application heap memory usage
   - Application CPU Utilization
   - Monitor Golden
5. Recoverability (ID: platform-recoverability)
   - Demonstrate recovery strategy

**Note:** If you have an existing database and need to update to the latest category structure, you'll need to delete your existing database and restart the application to reseed the database.

## API Endpoints

### Authentication

- `POST /api/auth/token` - Login and get access token
- `POST /api/auth/register` - Register a new user

### Applications

- `GET /api/applications` - List all applications
- `POST /api/applications` - Create a new application
- `GET /api/applications/{application_id}` - Get application details
- `PUT /api/applications/{application_id}` - Update an application
- `DELETE /api/applications/{application_id}` - Delete an application

### Dashboard

- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/recent-activities` - Get recent activities

### Checklist

- `GET /api/categories` - List all categories
- `GET /api/categories/{category_id}/items` - List checklist items for a category
- `POST /api/categories/{category_id}/items` - Create a new checklist item
- `PUT /api/checklist-items/{item_id}` - Update a checklist item
- `DELETE /api/checklist-items/{item_id}` - Delete a checklist item

## Application Details

When creating or updating an application, the following fields can be provided:

### Basic Information
- `name` - Application name
- `status` - Status of the application (In Review, Approved, Onboarded, Production)
- `description` - Detailed description of the application

### Git Repository Information
- `git_repo_link` - Git repository link for the component
- `prod_branch_name` - PROD version branch name or PROD equivalent branch name for OCP migration
- `is_default_branch` - Whether the PROD equivalent branch is the default branch
- `default_branch_name` - Default branch name for the component
- `git_cd_repo_link` - GIT CD repository link
- `prod_cd_branch_name` - Production equivalent branch name for CD repository

### Environment Information
- `is_running_dev_pcf` - Whether the PROD version is running in DEV PCF
- `dev_env_name` - Active DEV environment name
- `is_running_sit_pcf` - Whether the PROD version is running in SIT PCF
- `sit_env_name` - Active SIT environment name
- `is_running_uat_pcf` - Whether the PROD version is running in UAT PCF
- `uat_env_name` - Active UAT environment name

### PCF Information
- `dev_pcf_details` - DEV PCF Foundation/Org/Space details
- `sit_pcf_details` - SIT PCF Foundation/Org/Space details
- `uat_pcf_details` - UAT PCF Foundation/Org/Space details
- `additional_nonprod_env` - Additional non-production environments

### OCP Information
- `target_ocp_env` - Target OCP environment (Sterling, Lewisville, Manassas)

### Access and App Details
- `ad_ent_groups` - AD-ENT groups needed to work on the app
- `test_user` - Test user information for testing
- `needs_vanity_url` - Whether the app needs a vanity URL
- `vanity_url_preference` - Vanity URL preference

### Integration and Infrastructure
- `upstream_downstream_impact` - Upstream and downstream apps that might be impacted
- `cmp_link` - CMP link
- `pcf_access_steps` - Steps to request access to PCF app manager

### Technical Information
- `app_type` - Application type (Batch, UI, API)
- `uses_bridge_utility` - Whether the app uses Bridge Utility Server in PCF
- `technology_stack` - Technology stack (Java, .NET, Python, Angular, React)
- `build_pack` - Build pack (Gradle, Maven, NPM, etc.)
- `uses_epl` - Whether the component is using EPL/EPLX 