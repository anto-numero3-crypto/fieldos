'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/LanguageContext'
import {
  Upload, ArrowLeft, ArrowRight, Check, AlertCircle, AlertTriangle,
  FileText, Users, ChevronRight, X, RefreshCw,
} from 'lucide-react'

type Row = Record<string, string>

interface MappedField {
  csvCol: string | null
  dbField: string
  label: string
  required: boolean
}

interface ValidationResult {
  row: Row
  rowIndex: number
  status: 'ok' | 'warning' | 'error'
  issues: string[]
  mapped: Record<string, string>
}

function getDbFields(fr: boolean): MappedField[] {
  return [
    { dbField: 'name',    label: fr ? 'Nom complet'       : 'Full name',  required: true,  csvCol: null },
    { dbField: 'email',   label: fr ? 'Courriel'          : 'Email',      required: false, csvCol: null },
    { dbField: 'phone',   label: fr ? 'Téléphone'         : 'Phone',      required: false, csvCol: null },
    { dbField: 'address', label: fr ? 'Adresse'           : 'Address',    required: false, csvCol: null },
    { dbField: 'notes',   label: fr ? 'Notes'             : 'Notes',      required: false, csvCol: null },
    { dbField: 'tags',    label: fr ? 'Étiquettes (;)'    : 'Tags (;)',   required: false, csvCol: null },
  ]
}

const AUTO_MAP: Record<string, string> = {
  name: 'name', nom: 'name', 'full name': 'name', 'full_name': 'name', prenom: 'name',
  email: 'email', courriel: 'email', 'e-mail': 'email',
  phone: 'phone', tel: 'phone', telephone: 'phone', téléphone: 'phone', mobile: 'phone',
  address: 'address', adresse: 'address', location: 'address',
  notes: 'notes', note: 'notes', comments: 'notes', commentaires: 'notes',
  tags: 'tags', etiquettes: 'tags', étiquettes: 'tags', labels: 'tags',
}

function parseCSV(text: string): { headers: string[]; rows: Row[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  const parseRow = (line: string): string[] => {
    const result: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim()); cur = ''
      } else {
        cur += ch
      }
    }
    result.push(cur.trim())
    return result
  }

  const headers = parseRow(lines[0])
  const rows = lines.slice(1).map((line) => {
    const vals = parseRow(line)
    const row: Row = {}
    headers.forEach((h, i) => { row[h] = vals[i] || '' })
    return row
  }).filter((r) => Object.values(r).some((v) => v.trim()))

  return { headers, rows }
}

function autoMap(headers: string[], dbFields: MappedField[]): MappedField[] {
  return dbFields.map((f) => {
    const match = headers.find((h) => AUTO_MAP[h.toLowerCase()] === f.dbField)
    return { ...f, csvCol: match || null }
  })
}

function validateRows(rows: Row[], mapping: MappedField[], fr: boolean): ValidationResult[] {
  return rows.map((row, rowIndex) => {
    const mapped: Record<string, string> = {}
    mapping.forEach(({ dbField, csvCol }) => {
      if (csvCol && row[csvCol] !== undefined) mapped[dbField] = row[csvCol].trim()
    })

    const issues: string[] = []
    let isError = false
    if (!mapped.name?.trim()) { issues.push(fr ? 'Nom manquant' : 'Missing name'); isError = true }
    if (mapped.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mapped.email)) issues.push(fr ? 'Courriel invalide' : 'Invalid email')

    let status: 'ok' | 'warning' | 'error' = 'ok'
    if (isError) status = 'error'
    else if (issues.length > 0) status = 'warning'

    return { row, rowIndex, status, issues, mapped }
  })
}

export default function ImportPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const DB_FIELDS = getDbFields(fr)
  const [userId, setUserId] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [isDragging, setIsDragging] = useState(false)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<Row[]>([])
  const [fileName, setFileName] = useState('')
  const [mapping, setMapping] = useState<MappedField[]>(DB_FIELDS.map((f) => ({ ...f })))
  const [validation, setValidation] = useState<ValidationResult[]>([])
  const [progress, setProgress] = useState(0)
  const [imported, setImported] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
    })
  }, [router])

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast.error(fr ? 'Veuillez sélectionner un fichier CSV (.csv)' : 'Please select a CSV file (.csv)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(fr ? 'Fichier trop volumineux (max 10 Mo)' : 'File too large (max 10 MB)')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)
      if (headers.length === 0) { toast.error(fr ? 'Fichier CSV vide ou invalide' : 'Empty or invalid CSV file'); return }
      if (rows.length > 5000) { toast.error(fr ? 'Maximum 5 000 lignes par import' : 'Maximum 5,000 rows per import'); return }
      setCsvHeaders(headers)
      setCsvRows(rows)
      setMapping(autoMap(headers, DB_FIELDS))
      setStep(2)
    }
    reader.readAsText(file)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fr])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const runValidation = () => {
    const results = validateRows(csvRows, mapping, fr)
    setValidation(results)
    setStep(3)
  }

  const importRows = async () => {
    setStep(4)
    setProgress(0)
    setImported(0)
    setErrors([])

    const validRows = validation.filter((v) => v.status !== 'error')
    const batchSize = 100
    let done = 0
    const errs: string[] = []

    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize)
      const records = batch.map(({ mapped }) => ({
        user_id: userId!,
        name: mapped.name,
        email: mapped.email || null,
        phone: mapped.phone || null,
        address: mapped.address || null,
        notes: mapped.notes || null,
        tags: mapped.tags ? mapped.tags.split(';').map((t) => t.trim()).filter(Boolean) : null,
      }))

      const { error } = await supabase.from('customers').insert(records)
      if (error) errs.push(`${fr ? 'Lot' : 'Batch'} ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      else done += batch.length

      setProgress(Math.round(((i + batch.length) / validRows.length) * 100))
      setImported(done)
    }

    setErrors(errs)
    setStep(5)
    if (errs.length === 0) {
      toast.success(fr
        ? `${done} client${done > 1 ? 's' : ''} importé${done > 1 ? 's' : ''} avec succès !`
        : `${done} customer${done > 1 ? 's' : ''} imported successfully!`)
    } else {
      toast.error(fr
        ? `Import terminé avec ${errs.length} erreur${errs.length > 1 ? 's' : ''}`
        : `Import completed with ${errs.length} error${errs.length > 1 ? 's' : ''}`)
    }
  }

  const ok = validation.filter((v) => v.status !== 'error').length
  const warn = validation.filter((v) => v.status === 'warning').length
  const err = validation.filter((v) => v.status === 'error').length

  const STEPS = fr
    ? ['Fichier', 'Colonnes', 'Validation', 'Import', 'Terminé']
    : ['File', 'Columns', 'Validation', 'Import', 'Done']

  return (
    <AppLayout title={fr ? 'Importer des clients' : 'Import customers'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Back */}
        <button onClick={() => router.push('/customers')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {fr ? 'Retour aux clients' : 'Back to customers'}
        </button>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className={[
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shrink-0 transition-all',
                step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400',
              ].join(' ')}>
                {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${step === i + 1 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={['h-0.5 flex-1 rounded', step > i + 1 ? 'bg-emerald-400' : 'bg-gray-200'].join(' ')} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Upload ── */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{fr ? 'Sélectionner un fichier CSV' : 'Select a CSV file'}</h2>
            <p className="text-sm text-gray-500 mb-6">{fr ? "Formats acceptés : .csv — jusqu'à 5 000 lignes" : 'Accepted formats: .csv — up to 5,000 rows'}</p>

            <div
              className={['rounded-2xl border-2 border-dashed p-12 text-center transition-all cursor-pointer', isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'].join(' ')}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-base font-medium text-gray-700 mb-1">{fr ? 'Glissez votre fichier CSV ici' : 'Drag your CSV file here'}</p>
              <p className="text-sm text-gray-400">{fr ? 'ou cliquez pour parcourir' : 'or click to browse'}</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>

            <div className="mt-6 rounded-xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">{fr ? 'Format attendu' : 'Expected format'}</p>
              <code className="text-xs text-blue-700 font-mono">{fr ? 'nom,email,telephone,adresse,notes,etiquettes' : 'name,email,phone,address,notes,tags'}</code>
              <p className="text-xs text-blue-600 mt-1">{fr ? 'La première ligne doit être les en-têtes. La détection automatique des colonnes est supportée.' : 'The first row must contain headers. Automatic column detection is supported.'}</p>
            </div>
          </div>
        )}

        {/* ── Step 2: Mapping ── */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{fr ? 'Correspondance des colonnes' : 'Column mapping'}</h2>
                <p className="text-sm text-gray-500">{csvRows.length} {fr ? 'lignes détectées dans' : 'rows detected in'} <span className="font-medium">{fileName}</span></p>
              </div>
              <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <X className="h-4 w-4" /> {fr ? 'Changer de fichier' : 'Change file'}
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {mapping.map((field, i) => (
                <div key={field.dbField} className="flex items-center gap-4">
                  <div className="w-40 shrink-0">
                    <p className="text-sm font-medium text-gray-700">{field.label} {field.required && <span className="text-red-500">*</span>}</p>
                  </div>
                  <select
                    value={field.csvCol || ''}
                    onChange={(e) => {
                      const updated = [...mapping]
                      updated[i] = { ...updated[i], csvCol: e.target.value || null }
                      setMapping(updated)
                    }}
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">{fr ? '— Ignorer —' : '— Skip —'}</option>
                    {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  {field.csvCol && (
                    <div className="w-32 text-xs text-gray-400 truncate">
                      {fr ? 'ex' : 'e.g.'}: &ldquo;{csvRows[0]?.[field.csvCol] || '—'}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                <ArrowLeft className="h-4 w-4 inline mr-1" />{fr ? 'Retour' : 'Back'}
              </button>
              <button
                onClick={runValidation}
                disabled={!mapping.find((m) => m.dbField === 'name')?.csvCol}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {fr ? 'Valider les données' : 'Validate data'} <ArrowRight className="h-4 w-4 inline ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Validation ── */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{fr ? 'Résultats de validation' : 'Validation results'}</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{ok}</p>
                <p className="text-xs text-emerald-600 mt-0.5">{fr ? 'Prêts à importer' : 'Ready to import'}</p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{warn}</p>
                <p className="text-xs text-amber-600 mt-0.5">{fr ? 'Avertissements' : 'Warnings'}</p>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{err}</p>
                <p className="text-xs text-red-600 mt-0.5">{fr ? 'Erreurs (ignorés)' : 'Errors (skipped)'}</p>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50 mb-6">
              {validation.slice(0, 100).map(({ rowIndex, status, issues, mapped }) => (
                <div key={rowIndex} className={['flex items-start gap-3 px-4 py-3', status === 'error' ? 'bg-red-50/50' : status === 'warning' ? 'bg-amber-50/50' : ''].join(' ')}>
                  {status === 'ok' ? <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> :
                    status === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> :
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{mapped.name || <span className="text-red-500">{fr ? 'Sans nom' : 'No name'}</span>}</p>
                    {mapped.email && <p className="text-xs text-gray-500">{mapped.email}</p>}
                    {issues.length > 0 && <p className="text-xs text-amber-600 mt-0.5">{issues.join(' · ')}</p>}
                  </div>
                  <span className="text-xs text-gray-400">{fr ? 'Ligne' : 'Row'} {rowIndex + 2}</span>
                </div>
              ))}
              {validation.length > 100 && (
                <div className="px-4 py-3 text-center text-sm text-gray-400">… {fr ? `et ${validation.length - 100} autres lignes` : `and ${validation.length - 100} more rows`}</div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                <ArrowLeft className="h-4 w-4 inline mr-1" />{fr ? 'Retour' : 'Back'}
              </button>
              <button
                onClick={importRows}
                disabled={ok === 0}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {fr ? `Importer ${ok} client${ok > 1 ? 's' : ''}` : `Import ${ok} customer${ok > 1 ? 's' : ''}`} <ArrowRight className="h-4 w-4 inline ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Progress ── */}
        {step === 4 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-12 text-center">
            <RefreshCw className="h-12 w-12 text-indigo-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{fr ? 'Import en cours…' : 'Importing…'}</h2>
            <p className="text-sm text-gray-500 mb-6">{fr ? `${imported} client${imported !== 1 ? 's' : ''} importé${imported !== 1 ? 's' : ''}` : `${imported} customer${imported !== 1 ? 's' : ''} imported`}</p>
            <div className="w-full max-w-sm mx-auto">
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">{progress}%</p>
            </div>
          </div>
        )}

        {/* ── Step 5: Done ── */}
        {step === 5 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-12 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              {errors.length === 0 ? <Check className="h-9 w-9 text-emerald-600" /> : <AlertCircle className="h-9 w-9 text-amber-600" />}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {errors.length === 0
                ? (fr ? 'Import réussi !' : 'Import successful!')
                : (fr ? 'Import terminé avec des erreurs' : 'Import completed with errors')}
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              {fr
                ? `${imported} client${imported !== 1 ? 's' : ''} importé${imported !== 1 ? 's' : ''} avec succès.`
                : `${imported} customer${imported !== 1 ? 's' : ''} imported successfully.`}
            </p>
            {errors.length > 0 && (
              <div className="mt-4 mb-6 rounded-xl bg-red-50 border border-red-100 p-4 text-left max-w-sm mx-auto">
                <p className="text-sm font-medium text-red-800 mb-2">{errors.length} {fr ? `erreur${errors.length > 1 ? 's' : ''} :` : `error${errors.length > 1 ? 's' : ''}:`}</p>
                {errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
              </div>
            )}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => { setStep(1); setCsvRows([]); setCsvHeaders([]); setFileName(''); setValidation([]) }}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {fr ? 'Nouvel import' : 'New import'}
              </button>
              <button
                onClick={() => router.push('/customers')}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
              >
                <Users className="h-4 w-4" /> {fr ? 'Voir les clients' : 'View customers'} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
