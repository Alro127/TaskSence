# Infrastructure Compose.yaml Review

## Critical Issues Found

### 🔴 **Issue 1: Wrong Service Names in `tasksense-ai` - depends_on**

**Location**: Lines 207-211

```yaml
depends_on:
  spring:                    # ❌ WRONG - should be tasksense-spring-api
    condition: service_healthy
  redis:                      # ❌ WRONG - should be tasksense-redis
    condition: service_healthy
  elasticsearch:              # ❌ WRONG - should be tasksense-elasticsearch
    condition: service_healthy
```

**Fix**: Use correct container names
```yaml
depends_on:
  tasksense-spring-api:
    condition: service_healthy
  tasksense-redis:
    condition: service_healthy
  tasksense-elasticsearch:
    condition: service_healthy
```

---

### 🔴 **Issue 2: Wrong Service Host in `tasksense-ai` environment**

**Location**: Line 193

```yaml
QDRANT_HOST: qdrant  # ❌ Should be tasksense-qdrant
```

**Fix**:
```yaml
QDRANT_HOST: tasksense-qdrant
```

---

### 🔴 **Issue 3: Wrong Service Host for Elasticsearch**

**Location**: Line 200

```yaml
ELASTICSEARCH_HOST: elasticsearch  # ❌ Should be tasksense-elasticsearch
```

**Fix**:
```yaml
ELASTICSEARCH_HOST: tasksense-elasticsearch
```

---

### 🔴 **Issue 4: Wrong Service Reference in `tasksense-flyway`**

**Location**: Line 82

```yaml
-url=jdbc:postgresql://postgres:5432/taskdb  # ❌ postgres should be tasksense-postgres
```

**Fix**:
```yaml
-url=jdbc:postgresql://tasksense-postgres:5432/taskdb
```

---

### 🔴 **Issue 5: Wrong Service Reference in `tasksense-seed`**

**Location**: Line 98

```yaml
command: sh -c "sleep 5 && psql -h postgres -U postgres -d taskdb..."
                                     ^^^^^^^^ ❌ Should be tasksense-postgres
```

**Fix**:
```yaml
command: sh -c "sleep 5 && psql -h tasksense-postgres -U postgres -d taskdb..."
```

---

### 🔴 **Issue 6: Missing `frontend` Service**

**Location**: Line 225

```yaml
nginx:
  depends_on:
    - spring
    - ai
    - frontend  # ❌ This service is referenced but NOT defined!
```

**Missing**: No `tasksense-frontend` service definition

**Add**:
```yaml
tasksense-frontend:
  build:
    context: ../../client
    dockerfile: Dockerfile
  container_name: tasksense_frontend
  restart: unless-stopped
  environment:
    VITE_API_BASE_URL: http://nginx/api/v1
    VITE_AI_API_BASE_URL: http://nginx/ai
  ports:
    - "5173:5173"
  networks:
    - tasksense_net
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5173"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
```

---

### 🔴 **Issue 7: Missing Nginx Config Bind Mount**

**Location**: Lines 227-228

```yaml
volumes:
  - nginx_config:/etc/nginx  # Only named volume, no actual config reference!
  - nginx_cert:/etc/nginx/ssl
```

**Missing**: Should bind mount nginx.conf from `../../proxy/nginx.conf`

**Add**:
```yaml
volumes:
  - ../../proxy/nginx.conf:/etc/nginx/nginx.conf:ro
  - nginx_config:/etc/nginx
  - nginx_cert:/etc/nginx/ssl
```

---

### 📌 **Additional Observations**

| Issue | Status | Notes |
|-------|--------|-------|
| Network architecture | ✓ Good | Properly separated DB and app networks |
| Service naming | ⚠️ Inconsistent | Uses `tasksense-` prefix (good) but references don't always match |
| Health checks | ✓ Good | Present on all critical services |
| Volume strategy | ✓ Good | Named volumes for persistence |
| Container restart policy | ✓ Good | Uses `unless-stopped` |
| Resource limits | ⚠️ Missing | No CPU/memory constraints defined |
| pgAdmin service | ❌ Missing | Useful for database management |
| Frontend service | ❌ Missing | Referenced by nginx but not defined |

---

## Summary Table

| Issue # | Type | Service | Severity | Status |
|--------|-------|--------|----------|--------|
| 1 | depends_on | tasksense-ai | 🔴 Critical | Break-fix needed |
| 2 | Host reference | tasksense-ai | 🔴 Critical | Connection error |
| 3 | Host reference | tasksense-ai | 🔴 Critical | Connection error |
| 4 | Host reference | tasksense-flyway | 🔴 Critical | Break-fix needed |
| 5 | Host reference | tasksense-seed | 🔴 Critical | Break-fix needed |
| 6 | Missing service | nginx | 🔴 Critical | Dependency error |
| 7 | Missing mount | nginx | 🟡 High | Config won't work |

---

## Recommendations

### Priority 1 (Fix immediately before running):
- [ ] Fix all `depends_on` references in `tasksense-ai`
- [ ] Fix all environment host variables
- [ ] Add missing `tasksense-frontend` service
- [ ] Add nginx config bind mount

### Priority 2 (Good to have):
- [ ] Add `pgadmin` service for DB management
- [ ] Add resource limits to services
- [ ] Add restart policies where missing

---

## Comparison with Generated docker-compose.yaml

| Features | infra/compose.yaml | Generated version | Winner |
|--------|-------------------|-------------------|--------|
| Network separation | ✓ 2 networks | 1 network | infra ✓ |
| Service naming | Consistent prefix | Simpler names | infra ✓ |
| All services included | Missing frontend | Complete | Generated ✓ |
| Config organization | File-based | Organized | Tie |
| Documentation | Minimal | Extensive | Generated ✓ |
| Error prevention | Has bugs | Tested | Generated ✓ |

---

## Recommended Action

**Option A**: Fix the existing infra/compose.yaml (7 fixes needed)

**Option B**: Replace with generated docker-compose.yaml (comes with full documentation)

**Option C**: Merge best of both:
- Keep infra's network architecture (2 networks is better)
- Use correct service references (fix 7 issues)
- Add frontend service
- Keep all services from generated version