import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/schema"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import crypto from "crypto"

// Encryption helpers for API key storage
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET || "default-key-change-in-production"
const ALGORITHM = "aes-256-cbc"

function encrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  return `${iv.toString("hex")}:${encrypted}`
}

function decrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32)
  const parts = text.split(":")
  const iv = Buffer.from(parts[0], "hex")
  const encryptedText = parts[1]
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  let decrypted = decipher.update(encryptedText, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

// GET - Retrieve user's Gemini API key (masked)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [user] = await db
      .select({ geminiApiKey: users.geminiApiKey })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user?.geminiApiKey) {
      return NextResponse.json({ hasKey: false, maskedKey: null })
    }

    // Return masked version (show first 4 and last 4 characters)
    const decryptedKey = decrypt(user.geminiApiKey)
    const maskedKey = decryptedKey.length > 8
      ? `${decryptedKey.slice(0, 4)}${"*".repeat(decryptedKey.length - 8)}${decryptedKey.slice(-4)}`
      : "*".repeat(decryptedKey.length)

    return NextResponse.json({ hasKey: true, maskedKey })
  } catch (error) {
    console.error("Error fetching Gemini API key:", error)
    return NextResponse.json(
      { error: "Failed to fetch API key" },
      { status: 500 }
    )
  }
}

// POST - Save or update user's Gemini API key
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "Invalid API key format" },
        { status: 400 }
      )
    }

    // Basic validation for Gemini API key format
    if (!apiKey.startsWith("AIza") || apiKey.length < 30) {
      return NextResponse.json(
        { error: "Invalid Gemini API key format. Key should start with 'AIza'" },
        { status: 400 }
      )
    }

    // Encrypt the API key before storing
    const encryptedKey = encrypt(apiKey)

    await db
      .update(users)
      .set({ geminiApiKey: encryptedKey })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({ success: true, message: "API key saved successfully" })
  } catch (error) {
    console.error("Error saving Gemini API key:", error)
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    )
  }
}

// DELETE - Remove user's Gemini API key
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db
      .update(users)
      .set({ geminiApiKey: null })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({ success: true, message: "API key removed successfully" })
  } catch (error) {
    console.error("Error removing Gemini API key:", error)
    return NextResponse.json(
      { error: "Failed to remove API key" },
      { status: 500 }
    )
  }
}
