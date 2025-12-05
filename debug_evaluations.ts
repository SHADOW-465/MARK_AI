
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugEvaluations() {
    console.log("--- Debugging Evaluations ---")

    // Fetch all answer sheets to get an ID
    const { data: sheets } = await supabase.from("answer_sheets").select("id, student_id, status").limit(5)
    console.log("Recent Sheets:", sheets)

    if (sheets && sheets.length > 0) {
        const sheetId = sheets[0].id
        console.log(`Checking evaluations for sheet: ${sheetId}`)

        const { data: evaluations, error } = await supabase
            .from("question_evaluations")
            .select("*")
            .eq("answer_sheet_id", sheetId)

        if (error) console.error("Error:", error)
        else console.log("Evaluations found:", evaluations?.length)
    }
}

debugEvaluations()
