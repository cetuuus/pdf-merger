import { PDFDocument } from 'pdf-lib'

export default defineEventHandler(async (event) => {
  const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 Mo

  const formData = await readMultipartFormData(event)

  if (!formData || formData.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Veuillez fournir au moins deux fichiers PDF.'
    })
  }

  // Extraction des fichiers et du mode de fusion
  const files = formData.filter(f => f.name === 'files')
  const modeField = formData.find(f => f.name === 'mode')
  const mergeMode = modeField ? modeField.data.toString() : 'sequential'

  if (files.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Veuillez fournir au moins deux fichiers PDF.'
    })
  }

  // Sécurité backend : Le mode interleave est strictement limité à 2 fichiers max
  if (mergeMode === 'interleave' && files.length > 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le mode alterné (Recto-Verso) n\'est pas autorisé avec 3 fichiers ou plus.'
    })
  }

  const mergedPdf = await PDFDocument.create()
  const loadedPdfs: PDFDocument[] = []

  // 1. Chargement et validation de tous les documents
  for (const file of files) {
    if (file.type !== 'application/pdf') {
      throw createError({
        statusCode: 400,
        statusMessage: `Le fichier ${file.filename || 'inconnu'} n'est pas un PDF valide.`
      })
    }

    if (file.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: `Le fichier "${file.filename}" dépasse la taille maximale autorisée de 20 Mo.`
      })
    }

    try {
      const pdfDoc = await PDFDocument.load(file.data)
      loadedPdfs.push(pdfDoc)
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: `Impossible de lire le fichier ${file.filename}. Il est peut-être corrompu ou protégé par un mot de passe.`
      })
    }
  }

  // 2. Logique de fusion selon le mode choisi
  if (mergeMode === 'interleave') {
    // Mode Alterné (Recto / Verso : Doc 1 [impairs] et Doc 2 [pairs])
    const maxPages = Math.max(...loadedPdfs.map(pdf => pdf.getPageCount()))

    for (let i = 0; i < maxPages; i++) {
      for (const pdfDoc of loadedPdfs) {
        const pageCount = pdfDoc.getPageCount()
        if (i < pageCount) {
          const [copiedPage] = await mergedPdf.copyPages(pdfDoc, [i])
          mergedPdf.addPage(copiedPage)
        }
      }
    }
  } else {
    // Mode Séquentiel classique
    for (const pdfDoc of loadedPdfs) {
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page)
      })
    }
  }

  // 3. Sauvegarde et retour du PDF final
  const mergedPdfBytes = await mergedPdf.save()

  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="fusion.pdf"',
    'Content-Length': mergedPdfBytes.length.toString()
  })

  return mergedPdfBytes
})