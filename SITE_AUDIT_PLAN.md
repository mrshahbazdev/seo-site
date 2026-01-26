# Multi-User Site Audit System - Implementation Plan

## Overview
Building a SaaS platform where users can:
1. Register/Login (Laravel Breeze/Sanctum)
2. Add multiple websites
3. Run comprehensive site audits
4. View audit history and results
5. Track issues and improvements

---

## Database Schema

### 1. Users Table (Already exists from Laravel)
```sql
- id
- name
- email
- password
- email_verified_at
- created_at
- updated_at
```

### 2. Sites Table
```sql
- id
- user_id (foreign key)
- domain (e.g., "example.com")
- url (e.g., "https://example.com")
- name (user-friendly name)
- status (active/paused/deleted)
- last_audit_at
- created_at
- updated_at
```

### 3. Site_Audits Table
```sql
- id
- site_id (foreign key)
- user_id (foreign key)
- audit_type (full_crawl/lighthouse/duplicate_content/indexation)
- status (pending/processing/completed/failed)
- task_id (DataForSEO task ID)
- results (JSON - full audit data)
- summary (JSON - key metrics)
- score (overall health score 0-100)
- pages_crawled
- issues_found
- started_at
- completed_at
- created_at
- updated_at
```

### 4. Audit_Issues Table
```sql
- id
- audit_id (foreign key)
- site_id (foreign key)
- category (technical/content/seo/performance)
- severity (critical/high/medium/low)
- issue_type (duplicate_title/broken_link/slow_page/etc)
- page_url
- description
- recommendation
- status (open/fixed/ignored)
- created_at
- updated_at
```

---

## API Endpoints

### Sites Management
```
POST   /api/sites              - Add new site
GET    /api/sites              - List user's sites
GET    /api/sites/{id}         - Get site details
PUT    /api/sites/{id}         - Update site
DELETE /api/sites/{id}         - Delete site
```

### Audits
```
POST   /api/sites/{id}/audit/start        - Start new audit
GET    /api/sites/{id}/audits             - List site audits
GET    /api/audits/{id}                   - Get audit details
GET    /api/audits/{id}/issues            - Get audit issues
POST   /api/audits/{id}/issues/{issueId}/status  - Update issue status
```

---

## On-Page API Integration

### Phase 1: Site Discovery & Audit

#### 1. Complete Site Crawl (task_post)
```php
POST https://api.dataforseo.com/v3/on_page/task_post
{
  "target": "example.com",
  "max_crawl_pages": 500,
  "load_resources": true,
  "enable_javascript": true,
  "custom_js": null
}
```

**What it returns:**
- All pages on the site
- Internal/external links
- Page titles, descriptions
- H1-H6 headings
- Images and alt text
- Page load times
- Response codes

#### 2. Lighthouse Audit (lighthouse)
```php
POST https://api.dataforseo.com/v3/on_page/lighthouse/live
{
  "url": "https://example.com",
  "device": "desktop"
}
```

**What it returns:**
- Performance score
- Accessibility score
- Best practices score
- SEO score
- Core Web Vitals
- Detailed recommendations

#### 3. Duplicate Content Check
```php
GET /v3/on_page/duplicate_content
```

**What it returns:**
- Duplicate titles
- Duplicate descriptions
- Duplicate H1 tags
- Similar content pages

#### 4. Indexation Issues
```php
GET /v3/on_page/non_indexable
```

**What it returns:**
- Pages blocked by robots.txt
- Pages with noindex tag
- Pages with canonical issues
- Orphan pages

---

## Workflow

### User Flow:
```
1. User registers/logs in
2. User adds website (domain)
3. User clicks "Run Audit"
4. System:
   a. Creates audit record (status: pending)
   b. Calls DataForSEO On-Page API (task_post)
   c. Gets task_id, updates audit (status: processing)
   d. Polls for completion
   e. When complete, fetches results
   f. Parses results and saves to database
   g. Categorizes issues
   h. Calculates health score
   i. Updates audit (status: completed)
5. User views audit results
6. User can drill down into specific issues
```

### Background Job Processing:
```php
// Queue job for audit processing
ProcessSiteAudit::dispatch($audit);

// Job handles:
- API calls
- Result parsing
- Issue extraction
- Score calculation
- Notifications
```

---

## Implementation Steps

### Step 1: Database Setup ✅
- [x] Create migrations
- [ ] Run migrations
- [ ] Create models
- [ ] Define relationships

### Step 2: Authentication
- [ ] Install Laravel Breeze/Sanctum
- [ ] Set up API authentication
- [ ] Create auth endpoints

### Step 3: Site Management
- [ ] Create Site model & controller
- [ ] Implement CRUD operations
- [ ] Add validation

### Step 4: On-Page Service
- [ ] Create OnPageAuditService
- [ ] Implement task_post method
- [ ] Implement lighthouse method
- [ ] Implement duplicate content check
- [ ] Implement indexation check

### Step 5: Audit Processing
- [ ] Create AuditController
- [ ] Implement start audit endpoint
- [ ] Create background job
- [ ] Implement result parsing
- [ ] Implement issue extraction

### Step 6: Frontend
- [ ] Dashboard page
- [ ] Sites list page
- [ ] Add site form
- [ ] Audit results page
- [ ] Issues list page

---

## Next Actions

1. **Run migrations** to create tables
2. **Install Laravel Sanctum** for API authentication
3. **Create OnPageAuditService** with DataForSEO integration
4. **Build API controllers** for sites and audits
5. **Create background jobs** for async processing
6. **Build React UI** with ui-ux-pro-max

Ready to proceed?
