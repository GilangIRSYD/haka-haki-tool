# Next.js & HeroUI Template

This is a template for creating applications using Next.js 14 (app directory) and HeroUI (v2).

[Try it on CodeSandbox](https://githubbox.com/heroui-inc/heroui/next-app-template)

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [HeroUI v2](https://heroui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [next-themes](https://github.com/pacocoursey/next-themes)

## Project Structure

This project uses **Type-Based (Atomic) Component Organization** for better maintainability and scalability.

```
idx-web/
├── app/                    # Next.js App Router (pages, layouts, API routes)
├── components/             # Reusable Components
│   ├── layout/            # Layout components (navbar, footer, sidebar)
│   ├── ui/                # General UI components (buttons, cards, forms)
│   └── icons/             # Icon components
├── lib/                   # Utility functions, helpers, formatters
├── hooks/                 # Custom React hooks
├── services/              # API calls, external services
├── config/                # Configuration files (site config, fonts)
├── types/                 # TypeScript type definitions
└── styles/                # Global styles
```

### Folder Conventions

| Folder | Purpose | Examples |
|--------|---------|----------|
| `components/layout/` | Layout-related components | Navbar, Footer, Sidebar |
| `components/ui/` | Reusable UI components | Button, Card, Modal, Form |
| `components/icons/` | Icon components | Logo, SocialIcons, SearchIcon |
| `lib/` | Pure functions, utilities | validators, formatters, constants |
| `hooks/` | Custom React hooks | useAuth, useForm, useLocalStorage |
| `services/` | API calls, external services | apiClient, authService |
| `config/` | Configuration | site config, fonts, environment |
| `types/` | TypeScript types/interfaces | component props, API types |

### Import Convention

Use **barrel exports** (index.ts) for cleaner imports:

```typescript
// ✅ CORRECT - Use barrel exports
import { Navbar } from "@/components/layout";
import { ThemeSwitch } from "@/components/ui";
import { GithubIcon } from "@/components/icons";
import { title } from "@/lib/utils";

// ❌ WRONG - Don't import from specific file
import { Navbar } from "@/components/layout/navbar";
```

### File Naming

- **Components**: PascalCase - `Navbar.tsx`, `ThemeSwitch.tsx`
- **Utilities/Hooks/Services**: camelCase - `utils.ts`, `useAuth.ts`, `api.ts`

### Component Rules

1. **One component per file**
2. **File name must match component name**
3. **Export props interfaces** for reusability
4. **Add "use client"** only when using hooks/event handlers
5. **Define prop types** explicitly

Example:
```typescript
"use client";

import { FC } from "react";

export interface ButtonProps {
  label: string;
  onClick?: () => void;
}

export const Button: FC<ButtonProps> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};
```

### Development Workflow

1. **Place components in correct folder** based on type (layout/ui/icons)
2. **Create barrel export** (index.ts) in new folders
3. **Use barrel exports** for imports
4. **Run build** before committing: `npm run build`

> 📖 **AI Assistants**: This project has comprehensive coding convention files:
> - `.claude-guidelines` - Detailed rules for **Claude Code CLI** (read this first!)
> - `.cursorrules` - Rules for Cursor AI editor and other AI tools
>
> **For Claude Code users:** The AI will automatically follow the conventions in `.claude-guidelines` when working on this project.

## How to Use

### Use the template with create-next-app

To create a new project based on this template using `create-next-app`, run the following command:

```bash
npx create-next-app -e https://github.com/heroui-inc/next-app-template
```

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`, Example using `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@heroui/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## License

Licensed under the [MIT license](https://github.com/heroui-inc/next-app-template/blob/main/LICENSE).
