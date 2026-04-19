'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtMoney } from '@/lib/format'
import { toast } from 'sonner'
import {
  Package, Wrench, Search, Plus, Pencil, Trash2, X, Check,
  Loader2, Tag, Hash,
} from 'lucide-react'

interface Product {
  id: string
  org_id: string
  name: string
  description: string | null
  unit_price: number
  unit: string | null
  category: string | null
  is_service: boolean
  is_active: boolean
  usage_count: number
  created_at: string
  updated_at: string | null
}

const CATEGORIES_FR = ['Matériaux', 'Équipement', 'Main-d\'oeuvre', 'Transport', 'Consultation', 'Entretien', 'Installation', 'Réparation', 'Autre']
const CATEGORIES_EN = ['Materials', 'Equipment', 'Labour', 'Transport', 'Consultation', 'Maintenance', 'Installation', 'Repair', 'Other']

const UNITS_FR = ['unité', 'heure', 'jour', 'mois', 'pied', 'mètre', 'kg', 'lb', 'lot', 'forfait']
const UNITS_EN = ['unit', 'hour', 'day', 'month', 'foot', 'meter', 'kg', 'lb', 'lot', 'flat rate']

export default function ProduitsPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'services' | 'products'>('services')
  const [search, setSearch] = useState('')

  // Inline add form
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const categories = fr ? CATEGORIES_FR : CATEGORIES_EN
  const units = fr ? UNITS_FR : UNITS_EN

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch {
      toast.error(fr ? 'Erreur de chargement' : 'Failed to load')
    }
    setLoading(false)
  }

  const filtered = products.filter((p) => {
    if (!p.is_active) return false
    const isService = tab === 'services'
    if (p.is_service !== isService) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) { toast.error(fr ? 'Le nom est requis' : 'Name is required'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          unit_price: parseFloat(newPrice) || 0,
          unit: newUnit || null,
          category: newCategory || null,
          description: newDesc.trim() || null,
          is_service: tab === 'services',
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error'); setSubmitting(false); return }
      setProducts((prev) => [data.product, ...prev])
      setNewName(''); setNewPrice(''); setNewUnit(''); setNewCategory(''); setNewDesc('')
      setAdding(false)
      toast.success(fr ? 'Ajouté !' : 'Added!')
    } catch {
      toast.error(fr ? 'Erreur réseau' : 'Network error')
    }
    setSubmitting(false)
  }

  const startEdit = (p: Product) => {
    setEditingId(p.id)
    setEditName(p.name)
    setEditPrice(String(p.unit_price))
    setEditUnit(p.unit || '')
    setEditCategory(p.category || '')
    setEditDesc(p.description || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async () => {
    if (!editingId) return
    const name = editName.trim()
    if (!name) { toast.error(fr ? 'Le nom est requis' : 'Name is required'); return }
    setEditSaving(true)
    try {
      const res = await fetch(`/api/products/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          unit_price: parseFloat(editPrice) || 0,
          unit: editUnit || null,
          category: editCategory || null,
          description: editDesc.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error'); setEditSaving(false); return }
      setProducts((prev) => prev.map((p) => p.id === editingId ? { ...p, ...data.product } : p))
      setEditingId(null)
      toast.success(fr ? 'Modifié !' : 'Updated!')
    } catch {
      toast.error(fr ? 'Erreur réseau' : 'Network error')
    }
    setEditSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(fr ? 'Supprimer ce produit ?' : 'Delete this product?')) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Error'); return }
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_active: false } : p))
      toast.success(fr ? 'Supprimé' : 'Deleted')
    } catch {
      toast.error(fr ? 'Erreur réseau' : 'Network error')
    }
  }

  return (
    <AppLayout title={fr ? 'Produits & Services' : 'Products & Services'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {fr ? 'Catalogue de produits' : 'Product Catalog'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {fr ? 'Gérez vos produits et services pour la facturation' : 'Manage products and services for invoicing'}
            </p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {fr ? 'Ajouter' : 'Add'}
          </button>
        </div>

        {/* Tabs: Services / Products */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab('services')}
            className={[
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all flex-1 justify-center',
              tab === 'services' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            <Wrench className="h-4 w-4" />
            {fr ? 'Services' : 'Services'}
          </button>
          <button
            onClick={() => setTab('products')}
            className={[
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all flex-1 justify-center',
              tab === 'products' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            <Package className="h-4 w-4" />
            {fr ? 'Produits' : 'Products'}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={fr ? 'Rechercher...' : 'Search...'}
            className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        {/* Inline Add Form */}
        {adding && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-800 p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {tab === 'services'
                ? (fr ? 'Nouveau service' : 'New service')
                : (fr ? 'Nouveau produit' : 'New product')
              }
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={fr ? 'Nom *' : 'Name *'}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder={fr ? 'Prix unitaire' : 'Unit price'}
                step="0.01"
                min="0"
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">{fr ? 'Unité' : 'Unit'}</option>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">{fr ? 'Catégorie' : 'Category'}</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={fr ? 'Description (optionnel)' : 'Description (optional)'}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => { setAdding(false); setNewName(''); setNewPrice(''); setNewUnit(''); setNewCategory(''); setNewDesc('') }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-4 w-4" /> {fr ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {fr ? 'Ajouter' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {/* Product/Service List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              {tab === 'services' ? <Wrench className="h-6 w-6 text-gray-400" /> : <Package className="h-6 w-6 text-gray-400" />}
            </div>
            <p className="text-sm text-gray-500">
              {search
                ? (fr ? 'Aucun résultat' : 'No results')
                : tab === 'services'
                  ? (fr ? 'Aucun service ajouté' : 'No services added yet')
                  : (fr ? 'Aucun produit ajouté' : 'No products added yet')
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:shadow-sm transition-shadow"
              >
                {editingId === p.id ? (
                  /* Edit mode */
                  <div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        step="0.01"
                        min="0"
                        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <select
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">{fr ? 'Unité' : 'Unit'}</option>
                        {units.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">{fr ? 'Catégorie' : 'Category'}</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder={fr ? 'Description' : 'Description'}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-3">
                      <button onClick={cancelEdit} className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        {fr ? 'Annuler' : 'Cancel'}
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={editSaving}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                      >
                        {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        {fr ? 'Enregistrer' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                        {p.category && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
                            <Tag className="h-3 w-3" />{p.category}
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{p.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-semibold text-indigo-600">
                          {fmtMoney(p.unit_price, lang)}
                          {p.unit && <span className="text-gray-400 font-normal"> / {p.unit}</span>}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Hash className="h-3 w-3" />{fr ? `${p.usage_count} utilisations` : `${p.usage_count} uses`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(p)}
                        className="rounded-lg p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                        title={fr ? 'Modifier' : 'Edit'}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        title={fr ? 'Supprimer' : 'Delete'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
