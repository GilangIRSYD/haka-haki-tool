# Claude Code Prompt Templates

Copy these prompts when starting a new conversation with Claude Code.

---

## 🚀 PROMPT 1: Initial Project Setup (Recommended for first conversation)

```
Hi Claude! I'm working on this Next.js project. Please read the `.claude-guidelines` file first to understand the project structure and coding conventions. After reading it, confirm that you understand the rules and are ready to follow them.
```

---

## 📝 PROMPT 2: Quick Task (After initial setup)

```
Please follow the conventions in `.claude-guidelines` and create [YOUR COMPONENT/FEATURE HERE].
```

**Examples:**
- "Please follow the conventions in `.claude-guidelines` and create a user profile card component with avatar, name, and email."
- "Please follow the conventions in `.claude-guidelines` and create a hook for managing shopping cart state."
- "Please follow the conventions in `.claude-guidelines` and create a utility function to format currency to Indonesian Rupiah."

---

## 🎯 PROMPT 3: Reminder (If Claude forgets conventions)

```
Wait! Please check the `.claude-guidelines` file. You should:
1. Place the file in the correct folder (use the decision tree)
2. Follow the naming conventions
3. Create/update barrel exports
4. Use barrel exports for imports

Please redo this following those rules.
```

---

## 🔍 PROMPT 4: Code Review

```
Please review the code changes and verify they follow the conventions in `.claude-guidelines`:
- Correct folder placement?
- Correct naming convention?
- Barrel exports updated?
- Using barrel exports for imports?
- Build passes?

Check each point and let me know if anything needs to be fixed.
```

---

## 💡 PROMPT 5: Feature Request (Complex)

```
I need to add [FEATURE DESCRIPTION].

Please follow the `.claude-guidelines` conventions and:
1. Analyze what files/components need to be created
2. Show me the plan before implementing
3. Follow the decision tree for folder placement
4. Create barrel exports
5. Use barrel exports for imports

Start by reading `.claude-guidelines` and then show me the plan.
```

---

## 📋 PROMPT 6: Batch Tasks

```
I need you to create these following the conventions in `.claude-guidelines`:
1. [TASK 1]
2. [TASK 2]
3. [TASK 3]

For each task, follow the decision tree and verify:
- Correct folder
- Correct naming
- Barrel exports updated
- Build passes

Do them one by one and show me the result for each.
```

---

## 🎓 TIPS FOR USING CLAUDE CODE

### Best Practices:

1. **Always reference guidelines** in your first prompt
2. **Use decision tree** if Claude seems confused
3. **Ask for plan first** for complex features
4. **Verify build** after major changes
5. **Check barrel exports** were updated

### Example Workflow:

```
You: Hi Claude! Please read `.claude-guidelines` and create a product card component.

Claude: [Reads guidelines] I'll create a product card component in `components/ui/ProductCard.tsx` following the conventions:
- PascalCase naming
- Export props interface
- Use FC type
- Update barrel export

[Proceeds to implement correctly]
```

### If Claude Makes Mistakes:

```
You: That's not following the guidelines. Check `.claude-guidelines` again:
- Utilities go in `lib/`, not `components/`
- Hooks go in `hooks/`, not `lib/`
- Don't forget to update the barrel export

Please fix it.
```

---

## 🔧 QUICK REMINDERS

### Folder Quick Reference:
- **Layout components** → `components/layout/`
- **UI components** → `components/ui/`
- **Icons** → `components/icons/`
- **Utilities** → `lib/`
- **Hooks** → `hooks/`
- **Services** → `services/`

### Import Convention:
```typescript
// ✅ Correct
import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui";

// ❌ Wrong
import { Navbar } from "@/components/layout/navbar";
```

### Naming Convention:
- **Components**: PascalCase (`Button.tsx`, `UserProfile.tsx`)
- **Utilities/Hooks/Services**: camelCase (`utils.ts`, `useAuth.ts`)

---

## 📞 GETTING HELP

If Claude Code is not following conventions:

1. **Explicitly reference the file:**
   ```
   Please read `.claude-guidelines` file and follow those rules.
   ```

2. **Quote specific rule:**
   ```
   According to `.claude-guidelines`, utilities should go in `lib/` folder. Please move it.
   ```

3. **Ask for verification:**
   ```
   Did you update the barrel export in the index.ts file? Please check.
   ```

---

## ✅ CHECKLIST FOR REVIEW

After Claude completes a task, verify:

- [ ] File in correct folder?
- [ ] Correct naming convention?
- [ ] Props/interface exported?
- [ ] Barrel export updated?
- [ ] Using barrel exports for imports?
- [ ] Build passes (`npm run build`)

If any answer is NO, ask Claude to fix it.

---

**File Location:** `/Users/gilangsafera/Documents/gilang/code/broksum-web/idx-web/.claude-guidelines`
**Convention Type:** Type-Based (Atomic) Component Organization
**Last Updated:** 2026-01-02
