## Description
Provide a concise explanation of the changes made and the problem being solved.

## Type of Change
- [ ] New feature (`feat`)
- [ ] Bug fix (`fix`)
- [ ] Refactoring (`refactor`)
- [ ] Performance improvement (`perf`)
- [ ] Security fix (`security`)

## Security Checklist
- [ ] Target URLs pass anti-SSRF validation (`validateSafeUrl`).
- [ ] No internal secrets, keys, or credentials committed.
- [ ] All database queries sanitized through Drizzle ORM.
- [ ] API endpoints protected by `CombinedAuthGuard`.

## Verification Steps
1. Run `pnpm turbo test`
2. Run `docker compose up -d`
3. Verify test execution in Swagger UI at `http://localhost:4000/api/docs`
