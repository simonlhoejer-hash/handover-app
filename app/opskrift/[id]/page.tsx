"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function OpskriftPage() {
  const params = useParams()
  const id = params.id as string

  const [recipe, setRecipe] = useState<any>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [editing, setEditing] = useState(false)
  const [stepsInput, setStepsInput] = useState("")

  // 🔥 HENT OPSKRIFT
  useEffect(() => {
    if (!id) return

    async function fetchRecipe() {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error("Fetch fejl:", error)
        return
      }

      setRecipe(data)
    }

    fetchRecipe()
  }, [id])

  // 🔥 GENERER + GEM AI
  const generateMethod = async () => {
    if (!recipe || recipe.steps) return

    setLoadingAI(true)

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: recipe.name,
          ingredients: recipe.ingredients,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error("API fejl:", errorText)
        alert("AI fejl – tjek console")
        return
      }

      const data = await res.json()

      if (!data?.text) {
        alert("AI returnerede tomt svar")
        return
      }

      const { error } = await supabase
        .from("recipes")
        .update({ steps: data.text })
        .eq("id", id)

      if (error) {
        console.error("❌ Supabase fejl:", error)
        alert("Kunne ikke gemme")
        return
      }

      setRecipe({ ...recipe, steps: data.text })

    } catch (err) {
      console.error("Fetch fejl:", err)
      alert("Noget gik galt med AI")
    } finally {
      setLoadingAI(false)
    }
  }

  // 🔥 AUTO GENERER
  useEffect(() => {
    if (!recipe) return
    if (!recipe.steps) {
      generateMethod()
    }
  }, [recipe])

  if (!recipe) {
    return <p className="p-6">Loader...</p>
  }

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">

      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{recipe.name}</h1>
        <p className="text-gray-500">
          {recipe.portions} portioner
        </p>
      </div>

      {/* INGREDIENSER */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Ingredienser</h2>

        <ul className="space-y-1">
          {(recipe.ingredients || []).map((i: any, index: number) => (
            <li key={index}>
              {i.amount} kg – {i.name}
            </li>
          ))}
        </ul>
      </div>

      {/* FREMGANGSMÅDE */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Fremgangsmåde</h2>

        {/* VISNING */}
        {!editing && (
          <>
            {!recipe.steps ? (
              <p className="text-gray-400 italic">
                Genererer fremgangsmåde...
              </p>
            ) : (
              <ol className="list-decimal pl-5 space-y-1">
                {recipe.steps.split("\n").map((step: string, i: number) => (
                  <li key={i}>
                    {step.replace(/^\d+\.\s*/, "")}
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-4 flex gap-2">
              {!recipe.steps && (
                <button
                  onClick={generateMethod}
                  disabled={loadingAI}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl print:hidden"
                >
                  {loadingAI ? "Genererer..." : "Generer med AI"}
                </button>
              )}

              {recipe.steps && (
                <button
                  onClick={() => {
                    setEditing(true)
                    setStepsInput(recipe.steps)
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-xl print:hidden"
                >
                  Rediger
                </button>
              )}
            </div>
          </>
        )}

        {/* EDIT MODE */}
        {editing && (
          <>
            <textarea
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              className="w-full min-h-[200px] p-3 border rounded-xl"
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={async () => {
                  const { error } = await supabase
                    .from("recipes")
                    .update({ steps: stepsInput })
                    .eq("id", id)

                  if (error) {
                    alert("Kunne ikke gemme")
                    return
                  }

                  setRecipe({ ...recipe, steps: stepsInput })
                  setEditing(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl"
              >
                Gem
              </button>

              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-200 rounded-xl"
              >
                Annuller
              </button>
            </div>
          </>
        )}
      </div>

      {/* PRINT */}
      <div className="text-center">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-black text-white rounded-xl print:hidden"
        >
          Print opskrift
        </button>
      </div>

    </div>
  )
}