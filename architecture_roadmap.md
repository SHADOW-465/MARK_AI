# PRO-TIER ARCHITECTURE ROADMAP: MARK AI

## 1. **Input Validation & Type-Safety: The "Zod" Layer**

### Why It's Critical
Currently, your API routes likely assume the `req.body` is correct. In production, this is dangerous. If a malicious user sends `{ "xp": "one million" }` instead of an integer, your app could crash or behave unpredictably.

### The Solution: Zod
**Zod** is a schema declaration and validation library. It checks data BEFORE it touches your database.

### Implementation Pattern

1.  **Define a Schema (`lib/validators/student.ts`)**
    ```typescript
    import { z } from "zod";

    export const StudentUpdateSchema = z.object({
      name: z.string().min(2, "Name must be at least 2 chars"),
      class: z.string().optional(),
      examDate: z.string().datetime(), // Validates ISO date strings
      targetScore: z.number().min(0).max(100),
    });

    // Automatically infer TypeScript type from the schema
    export type StudentUpdatePayload = z.infer<typeof StudentUpdateSchema>;
    ```

2.  **Use in API Route (`app/api/student/update/route.ts`)**
    ```typescript
    import { StudentUpdateSchema } from "@/lib/validators/student";
    
    export async function POST(req: Request) {
      const body = await req.json();

      // 1. VALIDATE
      const result = StudentUpdateSchema.safeParse(body);
      
      if (!result.success) {
        // Return structured error messages to frontend
        return Response.json({ errors: result.error.flatten() }, { status: 400 });
      }

      // 2. USE CLEAN DATA
      const cleanData = result.data; // Fully typed as StudentUpdatePayload
      
      // ... database calls using cleanData ...
    }
    ```

---

## 2. **Server Actions: The Modern API Replacement**

### Why It's Critical
You are currently using `/app/api/...` routes. This is fine, but **Server Actions** are the "native" way to handle mutations in Next.js 14+. They:
*   eliminate the need to manually `fetch('/api/...')`
*   provide automatic type-safety from client to server (no need to manually type `response.json()`)
*   work even if JavaScript is disabled (progressive enhancement)

### The Solution: Move logic from API Routes to Actions

**Old Way (Client Component):**
```tsx
const handleSubmit = async (data) => {
  await fetch('/api/student', { method: 'POST', body: JSON.stringify(data) });
}
```

**New Way (Server Action):**
1.  **Define Action (`app/actions/student.ts`)**
    ```typescript
    'use server' // Marks this function as server-only

    import { prisma } from "@/lib/prisma";
    import { revalidatePath } from "next/cache";

    export async function updateStudent(formData: FormData) {
      // Direct DB access is safe here!
      await prisma.student.update({ ... });
      
      // Automatically refresh the UI data without a page reload
      revalidatePath('/dashboard');
    }
    ```

2.  **Use in Component (`app/page.tsx`)**
    ```tsx
    import { updateStudent } from "@/app/actions/student";

    // You can call it directly in a form
    <form action={updateStudent}>
      <input name="name" />
      <button type="submit">Save</button>
    </form>
    ```

---

## 3. **AI Streaming & Standardization: Vercel AI SDK**

### Why It's Critical
Your current AI implementation likely waits for the *entire* response from Gemini before showing anything. For a long essay or study guide, this feels slow (5-10s loading spinner).

### The Solution: Vercel AI SDK (Core + React)
This library standardizes how you talk to AI models (Gemini, OpenAI, Anthropic) and provides **streaming** out of the box.

### Implementation Pattern

1.  **Standardize the Provider (`app/api/chat/route.ts`)**
    ```typescript
    import { google } from '@ai-sdk/google';
    import { streamText } from 'ai';

    export async function POST(req: Request) {
      const { messages } = await req.json();

      // "streamText" handles the complex streaming logic for you
      const result = await streamText({
        model: google('gemini-1.5-pro'),
        messages,
      });

      return result.toDataStreamResponse();
    }
    ```

2.  **Hook on Frontend (`components/Chat.tsx`)**
    ```tsx
    'use client';
    import { useChat } from 'ai/react';

    export default function Chat() {
      // Automatically handles loading states, streaming updates, and input clearing
      const { messages, input, handleInputChange, handleSubmit } = useChat();

      return (
        <div>
          {messages.map(m => (
            <div key={m.id}>{m.content}</div>
          ))}
          <input value={input} onChange={handleInputChange} />
        </div>
      );
    }
    ```

---

## 4. **Smart Caching: "Semantic Cache"**

### Why It's Critical
If Student A asks "What is mitochondria?" and Student B asks "Define mitochondria", you are paying for the AI generation twice.

### The Solution: Semantic Caching (Redis/Upstash)
Store the *meaning* (vector embedding) of the question. If a new question is semantically similar (95% match), serve the cached answer instantly.

### Implementation Pattern
Use a library like `@upstash/semantic-cache` in your AI route:

```typescript
import { SemanticCache } from "@upstash/semantic-cache";

const cache = new SemanticCache({ ...credentials });

export async function POST(req: Request) {
  const { question } = await req.json();

  // 1. Check Cache
  const cached = await cache.get(question);
  if (cached) return Response.json({ answer: cached, source: 'cache' });

  // 2. Generate if Miss
  const answer = await generateAIResponse(question);

  // 3. Store for others
  await cache.set(question, answer);
  
  return Response.json({ answer, source: 'ai' });
}
```

---

## 5. **Testing Architecture**

### Why It's Critical
As your application grows, manually clicking "Generate Guide" to check if it works becomes impossible.

### The Solution: Integration Tests with Playwright
Don't mock everything. Test the *flows*.

**Example Test (`tests/ai-guide.spec.ts`)**:
```typescript
import { test, expect } from '@playwright/test';

test('User can generate a study guide', async ({ page }) => {
  await page.goto('/student/dashboard');
  await page.getByRole('button', { name: 'Create AI Guide' }).click();
  
  // Wait for the AI streaming to start
  await expect(page.locator('.ai-content')).toBeVisible();
  
  // Verify the result is saved to the timeline
  await page.goto('/student/history');
  await expect(page.getByText('New Study Guide')).toBeVisible();
});
```

---

## Summary Checklist for "Pro-Max" Upgrade

| Priority | Feature | Benefit | Effort |
| :--- | :--- | :--- | :--- |
| **High** | **Zod Validation** | Prevents crashes & malicious data | Low (1-2 days) |
| **High** | **Vercel AI SDK** | Streaming UI = 10x better UX | Medium (2-3 days) |
| **Medium** | **Server Actions** | Cleaner code, less boilerplate | High (Refactor) |
| **Low** | **Semantic Cache** | Save money on API costs | Low (1 day) |
