# Quality Checks - Minimal Setup

## 🎯 What This Does

**Prevents TypeScript build errors from reaching CI/CD** without being intrusive.

---

## ⚡ What Runs Automatically

### On Commit (Instant)

- ✨ **Prettier** auto-formats your staged files
- No validation, just formatting - super fast!

### On Push (~2-3 seconds)

- 🔍 **TypeScript check** - catches the build errors
- **Skip if needed:** `git push --no-verify`

### On CI/CD (GitHub)

- Full validation runs as final safety net
- See `.github/workflows/ci.yml`

---

## 🔧 Manual Commands

```bash
# Quick check before pushing (recommended)
npm run check

# Fix code formatting manually
npm run lint:fix

# Run full TypeScript check
npm run typecheck
```

---

## 💡 Common Error Fixed

### TypeScript Build Error

```typescript
// ❌ This fails in production builds:
process.env.NEXT_PUBLIC_API_URL;

// ✅ Use bracket notation instead:
process.env["NEXT_PUBLIC_API_URL"];
```

**Why?** TypeScript's strict mode requires bracket notation for `process.env` properties.

---

## 📝 Quick Reference

| Action          | What Runs           | Speed   | Can Skip?              |
| --------------- | ------------------- | ------- | ---------------------- |
| `git commit`    | Prettier formatting | Instant | Yes with `--no-verify` |
| `git push`      | TypeScript check    | ~2-3s   | Yes with `--no-verify` |
| CI/CD           | Full validation     | ~2-3min | No                     |
| `npm run check` | TypeScript check    | ~2-3s   | Manual                 |

---

## 🚀 Philosophy

**Minimal & Non-Disruptive:**

- Commit freely - just auto-formatting
- Push with quick validation
- CI/CD as final safety net
- You're in control

**Pro tip:** Run `npm run check` while developing to catch errors early!
