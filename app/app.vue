<script setup lang="ts">
const files = ref<File[]>([])
const isMerging = ref(false)
const errorMessage = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// État des options avancées
const showOptions = ref(false)
const mergeMode = ref<'sequential' | 'interleave'>('sequential')

// Limites de taille (en octets)
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 Mo par fichier
const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50 Mo au total

// Surveillance du changement de mode pour vérifier immédiatement la règle des 3 fichiers
watch(mergeMode, (newMode) => {
  errorMessage.value = null
  if (newMode === 'interleave' && files.value.length > 2) {
    errorMessage.value = 'Le mode alterné (Recto-Verso) est limité à 2 fichiers maximum.'
  }
})

function handleFileSelect(event: Event) {
  errorMessage.value = null
  const target = event.target as HTMLInputElement
  if (!target.files) return

  const newFiles = Array.from(target.files)
  const validFiles: File[] = []

  for (const file of newFiles) {
    if (file.type !== 'application/pdf') {
      errorMessage.value = 'Seuls les fichiers PDF sont acceptés.'
      continue
    }
    if (file.size > MAX_FILE_SIZE) {
      errorMessage.value = `Le fichier "${file.name}" dépasse la limite de 20 Mo.`
      continue
    }
    validFiles.push(file)
  }

  const currentTotalSize = files.value.reduce((acc, f) => acc + f.size, 0)
  const incomingSize = validFiles.reduce((acc, f) => acc + f.size, 0)

  if (currentTotalSize + incomingSize > MAX_TOTAL_SIZE) {
    errorMessage.value = 'La taille totale des fichiers dépasse la limite autorisée de 50 Mo.'
    if (fileInput.value) fileInput.value.value = ''
    return
  }

  files.value.push(...validFiles)

  // Vérification de la contrainte si on est en mode interleave
  if (mergeMode.value === 'interleave' && files.value.length > 2) {
    errorMessage.value = 'Le mode alterné (Recto-Verso) n\'est pas possible avec 3 fichiers ou plus. Veuillez repasser en mode séquentiel ou retirer des fichiers.'
  }

  if (fileInput.value) fileInput.value.value = ''
}

function removeFile(index: number) {
  errorMessage.value = null
  files.value.splice(index, 1)

  // Retirer l'erreur si on redevient <= 2 fichiers en mode interleave
  if (mergeMode.value === 'interleave' && files.value.length <= 2) {
    errorMessage.value = null
  }
}

function moveFile(index: number, direction: 'up' | 'down') {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= files.value.length) return

  const item = files.value.splice(index, 1)[0]
  files.value.splice(newIndex, 0, item)
}

async function mergePdfs() {
  if (files.value.length < 2) {
    errorMessage.value = 'Ajoutez au moins 2 fichiers PDF pour les fusionner.'
    return
  }

  // Double sécurité avant l'envoi
  if (mergeMode.value === 'interleave' && files.value.length > 2) {
    errorMessage.value = 'Le mode alterné (Recto-Verso) n\'est pas possible avec 3 fichiers ou plus.'
    return
  }

  isMerging.value = true
  errorMessage.value = null

  try {
    const formData = new FormData()
    files.value.forEach((file) => {
      formData.append('files', file)
    })
    formData.append('mode', mergeMode.value)

    const blob = await $fetch<Blob>('/api/merge', {
      method: 'POST',
      body: formData,
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `fusion-${Date.now()}.pdf`)
    document.body.appendChild(link)
    link.click()

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
          Sélectionnez vos fichiers, ordonnez-les et fusionnez.
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
              PDF uniquement • Max 20 Mo par fichier
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

      <!-- Bouton pour afficher les options supplémentaires -->
      <div class="mb-6">
        <button
          type="button"
          class="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
          @click="showOptions = !showOptions"
        >
          <span class="mr-1.5">{{ showOptions ? '▼' : '▶' }}</span> Options avancées
        </button>

        <div
          v-if="showOptions"
          class="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-sm animate-fadeIn"
        >
          <p class="font-medium text-slate-700 text-xs uppercase tracking-wide">
            Mode de fusion
          </p>
          <div class="space-y-2">
            <label class="flex items-start space-x-3 cursor-pointer">
              <input
                v-model="mergeMode"
                type="radio"
                value="sequential"
                class="mt-0.5 text-slate-900 focus:ring-slate-500"
              >
              <div>
                <span class="font-medium text-slate-800">Séquentiel (Standard)</span>
                <p class="text-xs text-slate-500">Met les fichiers les uns à la suite des autres.</p>
              </div>
            </label>

            <label class="flex items-start space-x-3 cursor-pointer">
              <input
                v-model="mergeMode"
                type="radio"
                value="interleave"
                class="mt-0.5 text-slate-900 focus:ring-slate-500"
              >
              <div>
                <span class="font-medium text-slate-800">Alterné / Recto-Verso (2 fichiers max)</span>
                <p class="text-xs text-slate-500">Alterne les pages entre le Doc 1 (impairs) et le Doc 2 (pairs).</p>
              </div>
            </label>
          </div>
        </div>
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
            <div class="truncate">
              <p class="font-medium text-slate-700 truncate">
                {{ file.name }}
              </p>
              <p class="text-xs text-slate-400">
                {{ (file.size / (1024 * 1024)).toFixed(2) }} Mo
              </p>
            </div>
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
        :disabled="files.length < 2 || isMerging || (mergeMode === 'interleave' && files.length > 2)"
        class="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition text-sm"
        @click="mergePdfs"
      >
        <span v-if="isMerging">Fusion en cours...</span>
        <span v-else>Fusionner {{ files.length }} fichier(s)</span>
      </button>
    </div>
  </div>
</template>