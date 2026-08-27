import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigrations() {
  const scriptsDir = path.join(__dirname)
  
  // Read and execute migration files in order
  const migrationFiles = ["001_create_tables.sql", "002_seed_data.sql"]
  
  for (const file of migrationFiles) {
    const filePath = path.join(scriptsDir, file)
    if (fs.existsSync(filePath)) {
      console.log(`Running migration: ${file}`)
      const sql = fs.readFileSync(filePath, "utf-8")
      
      // Split by semicolons and run each statement
      const statements = sql.split(";").filter(s => s.trim())
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc("exec_sql", { sql: statement })
          if (error) {
            console.error(`Error in ${file}:`, error.message)
          }
        }
      }
      console.log(`Completed: ${file}`)
    }
  }
}

runMigrations().catch(console.error)
