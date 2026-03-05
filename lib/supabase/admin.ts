import { createClient } from "@supabase/supabase-js"

/**
 * Server-only admin client — uses service role key, bypasses RLS.
 * Use ONLY in API routes (app/api/**) and Server Actions.
 * Never import this in client components.
 */
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}
