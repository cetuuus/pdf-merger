import { PDFDocument } from 'pdf-lib'

export default defineEventHandler(async (event) => {
  // 1. Lecture des fichiers envoyés en multipart/form-data
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Veuillez fournir au moins deux fichiers PDF.'
    })
  }

  // 2. Création d'un nouveau document PDF vierge
  const mergedPdf = await PDFDocument.create()

  for (const file of formData) {
    // Vérification basique du type MIME
    if (file.type !== 'application/pdf') {
      throw createError({
        statusCode: 400,
        statusMessage: `Le fichier ${file.filename || 'inconnu'} n'est pas un PDF valide.`
      })
    }

    try {
      // Chargement du PDF courant et copie de toutes ses pages
      const pdfDoc = await PDFDocument.load(file.data)
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())

      copiedPages.forEach((page) => {
        mergedPdf.addPage(page)
      })
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: `Impossible de lire le fichier ${file.filename}. Il est peut-être corrompu ou protégé par un mot de passe.`
      })
    }
  }

  // 3. Sauvegarde du PDF fusionné sous forme de tableau d'octets (Uint8Array)
  const mergedPdfBytes = await mergedPdf.save()

  // 4. Définition des en-têtes HTTP pour forcer le téléchargement/affichage du PDF
  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="fusion.pdf"',
    'Content-Length': mergedPdfBytes.length.toString()
  })

  return mergedPdfBytes
})