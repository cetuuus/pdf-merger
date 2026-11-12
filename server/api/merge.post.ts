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

  const mergedPdf = await PDFDocument.create()

  for (const file of formData) {
    if (file.type !== 'application/pdf') {
      throw createError({
        statusCode: 400,
        statusMessage: `Le fichier ${file.filename || 'inconnu'} n'est pas un PDF valide.`
      })
    }

    // Vérification de la taille de chaque fichier côté serveur
    if (file.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: `Le fichier "${file.filename}" dépasse la taille maximale autorisée de 20 Mo.`
      })
    }

    try {
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

  const mergedPdfBytes = await mergedPdf.save()

  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="fusion.pdf"',
    'Content-Length': mergedPdfBytes.length.toString()
  })

  return mergedPdfBytes
})