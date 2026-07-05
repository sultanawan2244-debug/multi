# Multi-File Rewrite — COMPLETE (All 141 Tools)

## Goal
Rewrite JavaScript in all HTML tools to support multi-file selection with individual download buttons and a "Download All as ZIP" button.

## Constraints & Preferences
- Template uses `var filesList = []`, `renderFileList()`, `updateUI()`, `triggerDownload()`, `downloadSingle()`, `addFiles()` functions
- Conversion logic adapted to work with `item.file` instead of `loadedFile`
- On completion: `item.blob = blob; item.status = 'done'; idx++; next();`
- ActionBtn iterates through filesList via `next()`; downloadAllBtn uses JSZip
- Preserve original conversion logic, extra UI elements (controls, previews, helper functions)
- Replace `loadedFile` with `item.file`; replace `setupDownload(blob, filename)` with item callback; remove `simulateProgress` wrapper; use `.catch()` on promises
- For image tools: `utils.loadImage(item.file)` returns `{ image, dataUrl }` — conversion logic uses `originalImage` variable from the promise result
- Manual drop-zone events over `utils.initDropZone()` (only passes single File)

## All Files Converted

### Converters: 41/41 — all converted
csv-to-excel, excel-to-csv, ods-to-xlsx, docx-to-html, html-to-docx, rtf-to-docx, odt-to-docx, html-to-markdown, html-to-pdf, txt-to-pdf, png-to-svg, svg-to-png, gif-to-mp4, qr-to-text, video-to-gif, mp3-to-wav, mp4-to-mp3, wav-to-mp3, epub-to-pdf, pdf-to-epub, pdf-to-pptx, pdf-to-txt, pdf-to-word, pptx-to-pdf, pptx-to-images, images-to-pptx, csv-to-xml, word-to-pdf, csv-to-json, csv-to-tsv, tsv-to-csv, srt-to-vtt, vtt-to-srt, json-to-csv, json-to-xml, json-to-yaml, yaml-to-json, xml-to-json, xml-to-csv, markdown-to-html, pdf-merger

### Image Tools: 47/50 — 3 viewer-only left single-file
color-picker, exif-viewer, histogram remain single-file (no downloadable output)

### PDF Tools: 46/50 — 4 viewer-only left single-file
layer-viewer, page-counter, text-search, word-counter remain single-file (no downloadable output)

## Key Decisions
- **Header protection** in `assets/js/header.js` disables right-click, F12, Ctrl+Shift+I/J/C, Ctrl+U across all pages
- **Manual drop-zone handlers** used instead of `utils.initDropZone()` because the shared utility only passes a single File
- **Image tools**: conversion logic adapted to work inside `next()` iterator — each file is loaded via `utils.loadImage(item.file)`, processed with canvas operations, and the result blob stored on the item
- **Preview areas** are shown during processing (each file's preview replaces the previous one)
- **PDF tools**: most use pdf-lib for direct manipulation; pdf.js + canvas rendering for grayscale, image-extraction, thumbnail, to-image; pdf.js text extraction for to-text, to-csv, to-json, etc.
- **Unique tools preserved**: collage-maker (N-to-1 batch), flipper-rotator (5 transform buttons), pixel-art (hexToRgb helper), pencil-sketch (dodge blend), watermark (tile mode), text-overlay, pdf-form-filler (interactive), pdf-form-extractor (JSON/CSV output), etc.
- **viewer-only tools**: left as single-file since they produce no downloadable output

## Verification
- All 134 converted files use `var filesList = []` pattern
- All have `renderFileList()`, `updateUI()`, `triggerDownload()`, `downloadSingle()`, `addFiles()`
- All remove `simulateProgress` wrapper and `setupDownload` function
- All use `item.blob = blob; item.status = 'done';` completion pattern
- All use `.catch()` on promises for error handling
- downloadAllBtn generates ZIP using JSZip (with fallback to individual downloads)
- file-list-item CSS class present in all files
- Balanced script tags and proper `</body></html>` ending verified
- text-to-qr.html excluded (text-input based, no file handling)
