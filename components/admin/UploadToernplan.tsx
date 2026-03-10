'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'

export default function UploadToernplan(){

const [file,setFile] = useState<File | null>(null)
const [loading,setLoading] = useState(false)
const [progress,setProgress] = useState(0)
const [department,setDepartment] = useState('galley')

const monthMap:any = {
Jan:1, Feb:2, Mar:3, Marts:3, Apr:4, Maj:5,
Jun:6, Jul:7, Aug:8, Sep:9, Okt:10, Nov:11, Dec:12
}

const handleImport = async()=>{

if(!file){
alert("Vælg Excel fil")
return
}

setLoading(true)
setProgress(10)

try{

const buffer = await file.arrayBuffer()
const workbook = XLSX.read(buffer)

const rowsToInsert:any[] = []
let processedSheets = 0

for(const sheetName of workbook.SheetNames){

if(!monthMap[sheetName]) continue

const month = monthMap[sheetName]

const sheet = workbook.Sheets[sheetName]
const rows:any[] = XLSX.utils.sheet_to_json(sheet,{header:1})

for(let r=0;r<rows.length;r++){

const row = rows[r]

// AT kolonne = navn
const fullName =
String(row[45] || '').trim()

if(!fullName) continue

const name = fullName

// AU → frem = dage
for(let d=46; d<77; d++){

const raw = row[d]

if(!raw) continue

const value =
String(raw).trim().toUpperCase()

if(!["A","+DS","-DS"].includes(value))
continue

const day = d-45

const dateObj =
new Date(2026,month-1,day)

if(dateObj.getMonth() !== month-1)
continue

const date =
`${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`

rowsToInsert.push({
date,
name,
status:value,
department
})

}

}

processedSheets++
setProgress(20 + processedSheets * 5)

}

setProgress(70)

const {error:deleteError} =
await supabase
.from('crew_schedule')
.delete()
.eq('department',department)

if(deleteError) throw deleteError

setProgress(85)

const {error} =
await supabase
.from('crew_schedule')
.insert(rowsToInsert)

if(error) throw error

setProgress(100)

alert(`Importerede ${rowsToInsert.length} rækker`)

}catch(err:any){

console.error(err)

alert(
err?.message ||
err?.error_description ||
JSON.stringify(err)
)

}

setLoading(false)

}

return(

<section className="rounded-3xl p-8 space-y-6 bg-white border border-black/5 shadow-md dark:bg-[#162338] dark:border-white/10">

<h2 className="text-2xl font-semibold">
Upload tørnplan
</h2>

<select
value={department}
onChange={(e)=>setDepartment(e.target.value)}
className="w-full rounded-xl p-3 bg-gray-100 dark:bg-[#1d2e46]"
>
<option value="galley">Galley</option>
<option value="shop">Shop</option>
</select>

<input
type="file"
accept=".xlsx,.xls"
onChange={(e)=>setFile(e.target.files?.[0] || null)}
className="w-full"
/>

{loading && (
<div className="w-full bg-gray-200 rounded-xl overflow-hidden">
<div
className="bg-black dark:bg-white h-3 transition-all"
style={{width:`${progress}%`}}
/>
</div>
)}

<button
onClick={handleImport}
disabled={loading}
className="w-full py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black"
>

{loading ? `Importerer ${progress}%` : "Importer tørnplan"}

</button>

</section>

)

}