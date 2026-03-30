import { GoogleGenAI } from "@google/genai"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { name, ingredients } = await req.json()

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    })

const prompt = `
Du er en professionel kok.

Opgave:
Lav en kort og præcis fremgangsmåde til retten: ${name}

Regler:
- Skriv KUN fremgangsmåde
- Ingen introduktion
- Ingen forklaring
- Ingen overskrift
- Skriv i nummereret liste (1, 2, 3...)
- Korte, klare sætninger

Ingredienser:
${ingredients.map((i: any) => `- ${i.amount} kg ${i.name}`).join("\n")}
`

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })

    return NextResponse.json({
      text: result.text,
    })

  } catch (error: any) {
    console.error("🔥 GEMINI ERROR:", error)

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}