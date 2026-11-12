<script setup lang="ts">
const files = ref<File[]>([])
const isMerging = ref(false)
const errorMessage = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Ajout des fichiers sélectionnés
function handleFileSelect(event: Event) {
  errorMessage.value = null
  const target = event.target as HTMLInputElement
  if (!target.files) return

  const newFiles = Array.from(target.files).filter(
    file => file.type === 'application/pdf'
  )

  if (newFiles.length !== target.files.length) {
    errorMessage.value = 'Seuls les fichiers PDF sont acceptés.'
  }

  files.value.push(...newFiles)

  // Reset de l'input pour pouvoir sélectionner le même fichier deux fois si besoin
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Supprimer un fichier
function removeFile(index: number) {
  files.value.splice(index, 1)
}

// Déplacer un fichier vers le haut ou le bas
function moveFile(index: number, direction: 'up' | 'down') {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= files.value.length) return

  const item = files.value.splice(index, 1)[0]
  files.value.splice(newIndex, 0, item)
}

// Envoi à l'API et téléchargement
async function mergePdfs() {
  if (files.value.length < 2) {
    errorMessage.value = 'Ajoutez au moins 2 fichiers PDF pour les fusionner.'
    return
  }

  isMerging.value = true
  errorMessage.value = null

  try {
    const formData = new FormData()
    files.value.forEach((file) => {
      formData.append('files', file)
    })

    // Appel de l'API Nuxt en demandant un Blob en retour
    const blob = await $fetch<Blob>('/api/merge', {
      method: 'POST',
      body: formData,
      responseType: 'blob'
    })

    // Création d'un lien temporaire pour déclencher le téléchargement
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `fusion-${Date.now()}.pdf`)
    document.body.appendChild(link)
    link.click()

    // Nettoyage
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string } }
    errorMessage.value = fetchError.data?.statusMessage || 'Une erreur est survenue lors de la fusion.'
  } finally {
    isMerging.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 py-12 px-4">
    <div class="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-slate-900">
          Fusionner des PDF
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Sélectionnez vos fichiers, ordonnez-les et téléchargez le résultat.
        </p>
      </div>

      <!-- Zone d'upload -->
      <div class="mb-6">
        <label
          for="pdf-upload"
          class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition"
        >
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
            <p class="text-sm font-medium text-slate-700">
              Cliquez pour ajouter des fichiers PDF
            </p>
            <p class="text-xs text-slate-400 mt-1">
              Sélection multiple autorisée
            </p>
          </div>
          <input
            id="pdf-upload"
            ref="fileInput"
            type="file"
            accept="application/pdf"
            multiple
            class="hidden"
            @change="handleFileSelect"
          >
        </label>
      </div>

      <!-- Message d'erreur -->
      <div
        v-if="errorMessage"
        class="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600"
      >
        {{ errorMessage }}
      </div>

      <!-- Liste des fichiers -->
      <div
        v-if="files.length > 0"
        class="mb-6 space-y-2"
      >
        <div
          v-for="(file, index) in files"
          :key="`${file.name}-${index}`"
          class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
        >
          <div class="flex items-center space-x-3 truncate pr-2">
            <span class="font-mono text-xs text-slate-400 w-4">
              {{ index + 1 }}.
            </span>
            <span class="font-medium text-slate-700 truncate">
              {{ file.name }}
            </span>
          </div>

          <div class="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              :disabled="index === 0"
              class="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30"
              title="Monter"
              @click="moveFile(index, 'up')"
            >
              ↑
            </button>
            <button
              type="button"
              :disabled="index === files.length - 1"
              class="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30"
              title="Descendre"
              @click="moveFile(index, 'down')"
            >
              ↓
            </button>
            <button
              type="button"
              class="p-1.5 text-red-500 hover:text-red-700 ml-1"
              title="Supprimer"
              @click="removeFile(index)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- Bouton d'action -->
      <button
        type="button"
        :disabled="files.length < 2 || isMerging"
        class="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition text-sm"
        @click="mergePdfs"
      >
        <span v-if="isMerging">Fusion en cours...</span>
        <span v-else>Fusionner {{ files.length }} fichier(s)</span>
      </button>
    </div>
  </div>
</template>