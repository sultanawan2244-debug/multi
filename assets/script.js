(function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewCard = document.getElementById('previewCard');
    const imageOuter = document.getElementById('imageOuter');
    const displayImage = document.getElementById('displayImage');
    const spinnerOverlay = document.getElementById('spinnerOverlay');
    const compareWrapper = document.getElementById('compareWrapper');
    const compareOriginal = document.getElementById('compareOriginal');
    const compareProcessed = document.getElementById('compareProcessed');
    const compareDivider = document.getElementById('compareDivider');
    const thresholdSlider = document.getElementById('thresholdSlider');
    const contrastSlider = document.getElementById('contrastSlider');
    const brightnessSlider = document.getElementById('brightnessSlider');
    const shadowSlider = document.getElementById('shadowSlider');
    const sharpenSlider = document.getElementById('sharpenSlider');
    const saturationSlider = document.getElementById('saturationSlider');
    const thresholdVal = document.getElementById('thresholdVal');
    const contrastVal = document.getElementById('contrastVal');
    const brightnessVal = document.getElementById('brightnessVal');
    const shadowVal = document.getElementById('shadowVal');
    const sharpenVal = document.getElementById('sharpenVal');
    const saturationVal = document.getElementById('saturationVal');
    const autoAdjustBtn = document.getElementById('autoAdjustBtn');
    const autoAdjustBtn2 = document.getElementById('autoAdjustBtn2');
    const aiEnhanceBtn = document.getElementById('aiEnhanceBtn');
    const applyToAllBtn = document.getElementById('applyToAllBtn');
    const rotateBtn = document.getElementById('rotateBtn');
    const undoBtn = document.getElementById('undoBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const pdfBtn = document.getElementById('pdfBtn');
    const zipAllBtn = document.getElementById('zipAllBtn');
    const resetBtn = document.getElementById('resetBtn');
    const toast = document.getElementById('toast');
    const presetChips = document.getElementById('presetChips');
    const pageStrip = document.getElementById('pageStrip');
    const addPageBtn = document.getElementById('addPageBtn');
    const infoRes = document.getElementById('infoRes');
    const infoSize = document.getElementById('infoSize');
    const infoTime = document.getElementById('infoTime');
    const cropModeBtn = document.getElementById('cropModeBtn');
    const applyCropBtn = document.getElementById('applyCropBtn');
    const autoCropBtn = document.getElementById('autoCropBtn');
    const cornerTL = document.getElementById('cornerTL');
    const cornerTR = document.getElementById('cornerTR');
    const cornerBL = document.getElementById('cornerBL');
    const cornerBR = document.getElementById('cornerBR');
    const toolbarRow = document.getElementById('toolbarRow');
    const singleFileBtn = document.getElementById('singleFileBtn');
    const folderBtn = document.getElementById('folderBtn');
    const fileInputSingle = document.getElementById('fileInputSingle');


    const MAX_DIM = 2000;
    const HISTORY_LIMIT = 30;
    let pages = [];
    let activePageIndex = 0;
    let currentView = 'scanned';
    let cropMode = false;
    let cropCorners = null;
    let historyStack = [];
    let historyPointer = -1;
    let compareDragging = false;
    let cornerDragging = null;
    let processingTimeout = null;
    let lastProcessTime = 0;

    const defaultSettings = {
        threshold: 60,
        contrast: 28,
        brightness: 8,
        shadow: 20,
        sharpen: 35,
        saturation: 10
    };
    const defaultColorMode = true;
    let toastTimer;

    function showToast(msg, type = '') {
        clearTimeout(toastTimer);
        toast.textContent = msg;
        toast.className = 'toast ' + type + ' show';
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function showSpinner() { spinnerOverlay.classList.add('active'); }

    function hideSpinner() { spinnerOverlay.classList.remove('active'); }

    function getActivePage() { return pages[activePageIndex] || null; }

    function updateSlidersFromSettings(s) {
        thresholdSlider.value = s.threshold;
        contrastSlider.value = s.contrast;
        brightnessSlider.value = s.brightness;
        shadowSlider.value = s.shadow;
        sharpenSlider.value = s.sharpen;
        saturationSlider.value = s.saturation;
        thresholdVal.textContent = s.threshold + '%';
        contrastVal.textContent = s.contrast + '%';
        brightnessVal.textContent = s.brightness + '%';
        shadowVal.textContent = s.shadow + '%';
        sharpenVal.textContent = s.sharpen + '%';
        saturationVal.textContent = (s.saturation >= 0 ? '+' : '') + s.saturation + '%';
    }

    function pushHistory() {
        const p = getActivePage();
        if (!p) return;
        historyStack = historyStack.slice(0, historyPointer + 1);
        historyStack.push({
            settings: { ...p.settings },
            colorMode: p.colorMode,
            rotation: p.rotation,
            cropCorners: cropCorners ? { ...cropCorners } : null,
            processedDataURL: p.processedDataURL
        });
        if (historyStack.length > HISTORY_LIMIT) historyStack.shift();
        historyPointer = historyStack.length - 1;
        updateUndoBtn();
    }

    function undo() {
        if (historyPointer <= 0) return;
        historyPointer--;
        const snap = historyStack[historyPointer];
        const p = getActivePage();
        if (!p || !snap) return;
        p.settings = { ...snap.settings };
        p.colorMode = snap.colorMode;
        p.rotation = snap.rotation;
        cropCorners = snap.cropCorners;
        p.processedDataURL = snap.processedDataURL;
        updateSlidersFromSettings(p.settings);
        updatePresetHighlight();
        updateDisplay();
        updateUndoBtn();
        updateCropUI();
        showToast('↩ Undo', 'info');
    }

    function updateUndoBtn() {
        undoBtn.disabled = historyPointer <= 0;
        undoBtn.style.opacity = historyPointer <= 0 ? '0.35' : '1';
    }

    function syncUIFromActivePage() {
        const p = getActivePage();
        if (!p) return;
        updateSlidersFromSettings(p.settings);
        updatePresetHighlight();
        updateUndoBtn();
        updateCropUI();
        updatePageThumbnails();
        updateInfoBar();
    }

    function updateInfoBar() {
        const p = getActivePage();
        if (!p || !p.originalImage) {
            infoRes.textContent = '—';
            infoSize.textContent = '—';
            infoTime.textContent = '—';
            return;
        }
        infoRes.textContent = p.originalImage.width + '×' + p.originalImage.height;
        const sizeKB = p.originalDataURL ? Math.round(p.originalDataURL.length * 0.75 / 1024) : '?';
        infoSize.textContent = sizeKB + ' KB';
        infoTime.textContent = lastProcessTime ? lastProcessTime + 'ms' : '—';
    }

    function updatePageThumbnails() {
        pageStrip.querySelectorAll('.thumb-wrapper').forEach(w => w.remove());
        const addBtn = pageStrip.querySelector('.add-page-btn');
        pages.forEach((p, i) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'thumb-wrapper';
            const thumb = document.createElement('img');
            thumb.className = 'page-thumb' + (i === activePageIndex ? ' active-page' : '');
            thumb.src = p.processedDataURL || p.originalDataURL || '';
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                if (activePageIndex === i) return;
                pushHistory();
                activePageIndex = i;
                cropCorners = null;
                currentView = 'scanned';
                updateToolbarActive();
                if (cropMode) exitCropMode();
                syncUIFromActivePage();
                updateDisplay();
            });
            const delBtn = document.createElement('button');
            delBtn.className = 'thumb-delete-btn';
            delBtn.innerHTML = '×';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deletePage(i);
            });
            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
                delBtn.classList.add('always-visible');
            }
            wrapper.appendChild(thumb);
            wrapper.appendChild(delBtn);
            pageStrip.insertBefore(wrapper, addBtn);
        });
    }

    function deletePage(index) {
        if (pages.length === 0) return;
        if (pages.length === 1) {
            showToast('🗑️ Last page deleted — resetting', 'info');
            resetEverything();
            return;
        }
        const wasActive = index === activePageIndex;
        pages.splice(index, 1);
        if (wasActive) {
            if (activePageIndex >= pages.length) activePageIndex = pages.length - 1;
        } else if (index < activePageIndex) {
            activePageIndex--;
        }
        cropCorners = null;
        if (cropMode) exitCropMode();
        currentView = 'scanned';
        historyStack = [];
        historyPointer = -1;
        updateToolbarActive();
        updatePageThumbnails();
        updateInfoBar();
        updateDisplay();
        if (getActivePage()) {
            updateSlidersFromSettings(getActivePage().settings);
            updatePresetHighlight();
        }
        updateUndoBtn();
        showToast('🗑️ Page deleted', 'info');
    }

    function resetEverything() {
        pages = [];
        activePageIndex = 0;
        historyStack = [];
        historyPointer = -1;
        cropCorners = null;
        cropMode = false;
        currentView = 'scanned';
        updateToolbarActive();
        updateCropUI();
        previewCard.classList.remove('active');
        displayImage.src = '';
        displayImage.style.display = 'none';
        compareWrapper.style.display = 'none';
        updatePageThumbnails();
        updateInfoBar();
        updateUndoBtn();
        document.getElementById('uploadCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function addNewPage(img, dataURL, fileName) {
        const finalFileName = fileName || ('image_' + Date.now() + '.jpg');
        const page = {
            originalImage: img,
            originalDataURL: dataURL,
            processedDataURL: null,
            rotation: 0,
            settings: { ...defaultSettings },
            colorMode: defaultColorMode,
            fileName: finalFileName
        };
        pages.push(page);
        activePageIndex = pages.length - 1;
        cropCorners = null;
        if (cropMode) exitCropMode();
        currentView = 'scanned';
        historyStack = [];
        historyPointer = -1;
        updateToolbarActive();
        processActivePage().then(() => {
            pushHistory();
            updatePageThumbnails();
            updateInfoBar();
            updateDisplay();
        });
    }

    function handleFile(file) {
        if (!file || !file.type.match(/image\/(jpeg|png|webp|bmp|tiff?|heic|heif)/i)) {
            showToast('⚠️ Please select an image file');
            return;
        }
        showSpinner();
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                hideSpinner();
                previewCard.classList.add('active');
                addNewPage(img, e.target.result, file.name);
                previewCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    };
                    img.onerror = () => { hideSpinner();
                showToast('❌ Failed to load image'); };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function handleFiles(files) {
        if (!files || files.length === 0) return;
        const fileArr = Array.from(files).filter(f => f.type.match(/image\//i));
        if (fileArr.length === 0) { showToast('⚠️ No valid images'); return; }
        showSpinner();
        let loaded = 0;
        const total = fileArr.length;
        fileArr.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    loaded++;
                    if (pages.length === 0 && loaded === 1) {
                        previewCard.classList.add('active');
                        previewCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    addNewPage(img, e.target.result, file.name);
                    if (loaded === total) { hideSpinner(); }
                };
                img.onerror = () => { loaded++; if (loaded === total) hideSpinner(); };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    uploadArea.addEventListener('click', (e) => { if (e.target !== fileInput) fileInput.click(); });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
        fileInput.value = '';
    });
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault();
        uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', (e) => { uploadArea.classList.remove('drag-over'); });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    });
    document.body.addEventListener('dragover', e => e.preventDefault());
    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length && !previewCard.classList.contains('active')) handleFiles(e
            .dataTransfer.files);
    });
    addPageBtn.addEventListener('click', () => fileInput.click());

    singleFileBtn.addEventListener('click', () => fileInputSingle.click());
    folderBtn.addEventListener('click', async () => {
        if (window.showDirectoryPicker) {
            try {
                const dirHandle = await window.showDirectoryPicker();
                const imgs = [];
                for await (const entry of dirHandle.values()) {
                    if (entry.kind === 'file' && entry.name.match(/\.(jpe?g|png|webp|bmp|tiff?|heic|heif)$/i)) {
                        const file = await entry.getFile();
                        imgs.push(file);
                    }
                }
                if (imgs.length > 0) handleFiles(imgs);
            } catch (e) {}
        } else {
            showToast('📁 Use Select Files to choose multiple images', 'info');
        }
    });
    fileInputSingle.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
        fileInputSingle.value = '';
    });

    function updateToolbarActive() {
        toolbarRow.querySelectorAll('.tool-btn[data-view]').forEach(b => b.classList.remove('active-tool'));
        const active = toolbarRow.querySelector(`.tool-btn[data-view="${currentView}"]`);
        if (active) active.classList.add('active-tool');
        if (cropMode && currentView === 'crop') cropModeBtn.classList.add('active-tool');
        applyCropBtn.style.display = cropMode ? 'inline-flex' : 'none';
    }

    toolbarRow.addEventListener('click', (e) => {
        const btn = e.target.closest('.tool-btn');
        if (!btn) return;
        const view = btn.dataset.view;
        if (view === 'crop') {
            if (cropMode) exitCropMode();
            else enterCropMode();
            return;
        }
        if (view && ['scanned', 'original', 'compare'].includes(view)) {
            if (cropMode) exitCropMode();
            currentView = view;
            updateToolbarActive();
            updateDisplay();
        }
    });

    function enterCropMode() {
        if (!getActivePage()) return;
        cropMode = true;
        currentView = 'crop';
        updateToolbarActive();
        cropModeBtn.classList.add('active-tool');
        if (!cropCorners) {
            cropCorners = {
                tl: { x: 0.05, y: 0.05 },
                tr: { x: 0.95, y: 0.05 },
                bl: { x: 0.05, y: 0.95 },
                br: { x: 0.95, y: 0.95 }
            };
        }
        displayImage.style.display = 'block';
        compareWrapper.style.display = 'none';
        displayImage.src = getActivePage().processedDataURL || getActivePage().originalDataURL;
        if (displayImage.complete) updateCropUI();
        else displayImage.onload = () => updateCropUI();
        showToast('✂️ Drag corners, then click ✅ Apply Crop', 'info');
    }

    function exitCropMode() {
        cropMode = false;
        cropModeBtn.classList.remove('active-tool');
        currentView = 'scanned';
        updateToolbarActive();
        updateCropUI();
        updateDisplay();
    }

    function applyCrop() {
        if (!cropMode || !cropCorners || !getActivePage()) return;
        pushHistory();
        showSpinner();
        requestAnimationFrame(() => {
            const p = getActivePage();
            const img = p.originalImage;
            const cw = img.width,
                ch = img.height;
            const pts = [
                Math.round(cropCorners.tl.x * cw), Math.round(cropCorners.tl.y * ch),
                Math.round(cropCorners.tr.x * cw), Math.round(cropCorners.tr.y * ch),
                Math.round(cropCorners.br.x * cw), Math.round(cropCorners.br.y * ch),
                Math.round(cropCorners.bl.x * cw), Math.round(cropCorners.bl.y * ch)
            ];
            const minX = Math.min(pts[0], pts[2], pts[4], pts[6]);
            const minY = Math.min(pts[1], pts[3], pts[5], pts[7]);
            const maxX = Math.max(pts[0], pts[2], pts[4], pts[6]);
            const maxY = Math.max(pts[1], pts[3], pts[5], pts[7]);
            const outW = maxX - minX,
                outH = maxY - minY;
            if (outW < 20 || outH < 20) { hideSpinner();
                showToast('⚠️ Crop area too small'); return; }
            const canvas = document.createElement('canvas');
            canvas.width = outW;
            canvas.height = outH;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, minX, minY, outW, outH, 0, 0, outW, outH);
            const newDataURL = canvas.toDataURL('image/jpeg', 0.95);
            const newImg = new Image();
            newImg.onload = function() {
                p.originalImage = newImg;
                p.originalDataURL = newDataURL;
                p.processedDataURL = null;
                p.rotation = 0;
                cropCorners = null;
                exitCropMode();
                processActivePage().then(() => {
                    pushHistory();
                    updatePageThumbnails();
                    updateInfoBar();
                    updateDisplay();
                    hideSpinner();
                    showToast('✅ Crop applied', 'success');
                });
            };
            newImg.src = newDataURL;
        });
    }

    function updateCropUI() {
        const show = cropMode && getActivePage();
        [cornerTL, cornerTR, cornerBL, cornerBR].forEach(c => c.style.display = show ? 'block' : 'none');
        if (!show || !cropCorners) return;
        const outerRect = imageOuter.getBoundingClientRect();
        const imgRect = displayImage.getBoundingClientRect();
        if (imgRect.width === 0 || imgRect.height === 0) return;
        const ox = imgRect.left - outerRect.left;
        const oy = imgRect.top - outerRect.top;
        const sx = imgRect.width,
            sy = imgRect.height;
        cornerTL.style.left = (ox + cropCorners.tl.x * sx - 11) + 'px';
        cornerTL.style.top = (oy + cropCorners.tl.y * sy - 11) + 'px';
        cornerTR.style.left = (ox + cropCorners.tr.x * sx - 11) + 'px';
        cornerTR.style.top = (oy + cropCorners.tr.y * sy - 11) + 'px';
        cornerBL.style.left = (ox + cropCorners.bl.x * sx - 11) + 'px';
        cornerBL.style.top = (oy + cropCorners.bl.y * sy - 11) + 'px';
        cornerBR.style.left = (ox + cropCorners.br.x * sx - 11) + 'px';
        cornerBR.style.top = (oy + cropCorners.br.y * sy - 11) + 'px';
    }

    function getCornerFromEvent(e) {
        const outerRect = imageOuter.getBoundingClientRect();
        const imgRect = displayImage.getBoundingClientRect();
        const ox = imgRect.left - outerRect.left;
        const oy = imgRect.top - outerRect.top;
        const sx = imgRect.width,
            sy = imgRect.height;
        return {
            x: Math.max(0, Math.min(1, (e.clientX - outerRect.left - ox) / sx)),
            y: Math.max(0, Math.min(1, (e.clientY - outerRect.top - oy) / sy))
        };
    }

    [cornerTL, cornerTR, cornerBL, cornerBR].forEach(corner => {
        corner.addEventListener('pointerdown', (e) => {
            if (!cropMode) return;
            e.preventDefault();
            e.stopPropagation();
            cornerDragging = corner;
            corner.setPointerCapture(e.pointerId);
        });
        corner.addEventListener('pointermove', (e) => {
            if (!cropMode || cornerDragging !== corner || !cropCorners) return;
            const pt = getCornerFromEvent(e);
            if (corner === cornerTL) cropCorners.tl = pt;
            if (corner === cornerTR) cropCorners.tr = pt;
            if (corner === cornerBL) cropCorners.bl = pt;
            if (corner === cornerBR) cropCorners.br = pt;
            updateCropUI();
        });
        corner.addEventListener('pointerup', () => { cornerDragging = null; });
        corner.addEventListener('lostpointercapture', () => { cornerDragging = null; });
    });

    applyCropBtn.addEventListener('click', () => {
        if (cropMode) applyCrop();
    });

    window.addEventListener('resize', () => { if (cropMode) updateCropUI(); });

    autoCropBtn.addEventListener('click', () => {
        const p = getActivePage();
        if (!p || !p.originalImage) { showToast('⚠️ No image'); return; }
        showSpinner();
        setTimeout(() => {
            try {
                const img = p.originalImage;
                const scale = Math.min(1, 400 / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale),
                    h = Math.round(img.height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const imageData = ctx.getImageData(0, 0, w, h);
                const data = imageData.data;
                const gray = new Uint8Array(w * h);
                for (let i = 0; i < data.length; i += 4) gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] +
                    0.114 * data[i + 2];
                const hist = new Array(256).fill(0);
                gray.forEach(v => hist[v]++);
                let total = gray.length,
                    wB = 0,
                    maxVar = 0,
                    thresh = 128,
                    sum = 0,
                    sumB = 0;
                for (let i = 0; i < 256; i++) sum += i * hist[i];
                for (let t = 0; t < 256; t++) {
                    wB += hist[t];
                    if (wB === 0) continue;
                    const wF = total - wB;
                    if (wF === 0) break;
                    sumB += t * hist[t];
                    const varBetween = wB * wF * ((sumB / wB) - ((sum - sumB) / wF)) ** 2;
                    if (varBetween > maxVar) { maxVar = varBetween;
                        thresh = t; }
                }
                const mask = new Uint8Array(w * h);
                for (let i = 0; i < gray.length; i++) mask[i] = gray[i] > thresh ? 1 : 0;
                const dilated = new Uint8Array(w * h);
                for (let y = 1; y < h - 1; y++)
                    for (let x = 1; x < w - 1; x++) {
                        let v = 0;
                        for (let dy = -1; dy <= 1; dy++)
                            for (let dx = -1; dx <= 1; dx++) v = Math.max(v, mask[(y + dy) * w + (x + dx)]);
                        dilated[y * w + x] = v;
                    }
                const closed = new Uint8Array(w * h);
                for (let y = 1; y < h - 1; y++)
                    for (let x = 1; x < w - 1; x++) {
                        let v = 1;
                        for (let dy = -1; dy <= 1; dy++)
                            for (let dx = -1; dx <= 1; dx++) v = Math.min(v, dilated[(y + dy) * w + (x + dx)]);
                        closed[y * w + x] = v;
                    }
                let minX = w,
                    minY = h,
                    maxX = 0,
                    maxY = 0;
                for (let y = 0; y < h; y++)
                    for (let x = 0; x < w; x++) {
                        if (closed[y * w + x] === 1) {
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                if (minX >= maxX || minY >= maxY) { hideSpinner();
                    showToast('⚠️ Could not detect document'); return; }
                cropCorners = {
                    tl: { x: minX / w, y: minY / h },
                    tr: { x: maxX / w, y: minY / h },
                    bl: { x: minX / w, y: maxY / h },
                    br: { x: maxX / w, y: maxY / h }
                };
                if (!cropMode) enterCropMode();
                else updateCropUI();
                hideSpinner();
                showToast('🪄 Auto crop detected', 'success');
            } catch (err) { hideSpinner();
                showToast('❌ Auto crop error'); }
        }, 50);
    });

    compareDivider.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        compareDragging = true;
        compareDivider.setPointerCapture(e.pointerId);
    });
    compareDivider.addEventListener('pointermove', (e) => {
        if (!compareDragging) return;
        const rect = compareWrapper.getBoundingClientRect();
        const pct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
        compareDivider.style.left = pct + '%';
        compareProcessed.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    });
    compareDivider.addEventListener('pointerup', () => { compareDragging = false; });
    compareWrapper.addEventListener('pointerdown', (e) => {
        if (e.target === compareDivider || compareDragging) return;
        const rect = compareWrapper.getBoundingClientRect();
        const pct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
        compareDivider.style.left = pct + '%';
        compareProcessed.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    });

    function createProcessedImage(img, settings, colorMode, rotation) {
        const t0 = performance.now();
        const { threshold, contrast, brightness, shadow, sharpen, saturation } = settings;
        const rotated = getRotatedDims(img, rotation);
        let w = rotated.width,
            h = rotated.height;
        const scale = Math.min(1, MAX_DIM / Math.max(w, h));
        const cw = Math.round(w * scale),
            ch = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        const dw = (rotation === 90 || rotation === 270) ? img.height * scale : img.width * scale;
        const dh = (rotation === 90 || rotation === 270) ? img.width * scale : img.height * scale;
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
        const imageData = ctx.getImageData(0, 0, cw, ch);
        const data = imageData.data;
        const hist = new Array(256).fill(0);
        for (let i = 0; i < data.length; i += 4) {
            const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            hist[lum]++;
        }
        let peak = 210,
            mx = 0;
        for (let i = 140; i < 250; i++) { if (hist[i] > mx) { mx = hist[i];
                peak = i; } }
        const whitePoint = Math.round(peak - (threshold - 20) * 1.25);
        const clampedWP = Math.max(135, Math.min(248, whitePoint));
        const contrastFactor = 1 + (contrast / 100) * 5.5;
        const brightOff = brightness * 1.6;
        const shadowStr = shadow / 100;
        const sharpenStr = sharpen / 100;
        const satFactor = 1 + saturation / 100;
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i],
                g = data[i + 1],
                b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (colorMode) {
                const wf = Math.max(0, Math.min(1, (lum - clampedWP) / (255 - clampedWP)));
                const pc = (v) => {
                    let val = v + brightOff;
                    val = 128 + (val - 128) * contrastFactor;
                    val += (255 - val) * wf * 0.92;
                    const gray = 0.299 * val + 0.587 * val + 0.114 * val;
                    val = gray + (val - gray) * satFactor;
                    return Math.max(0, Math.min(255, Math.round(val)));
                };
                r = pc(r);
                g = pc(g);
                b = pc(b);
            } else {
                let gray = lum + brightOff;
                gray = 128 + (gray - 128) * contrastFactor;
                if (gray > clampedWP) gray = 255;
                else if (gray > clampedWP - 28) {
                    const t = (gray - (clampedWP - 28)) / 28;
                    gray = (clampedWP - 28) + t * (255 - (clampedWP - 28));
                    gray += (255 - gray) * t * 0.55;
                }
                if (gray < 70) gray *= 0.55;
                gray = Math.max(0, Math.min(255, Math.round(gray)));
                r = g = b = gray;
            }
            const newLum = 0.299 * r + 0.587 * g + 0.114 * b;
            const liftF = 1 - (newLum / 255) ** 2.2;
            const boost = shadowStr * liftF * 100;
            const adjLum = Math.min(255, newLum + boost);
            if (adjLum > newLum) {
                const sf = adjLum / (newLum || 1);
                r = Math.min(255, Math.round(r * sf));
                g = Math.min(255, Math.round(g * sf));
                b = Math.min(255, Math.round(b * sf));
            }
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
        ctx.putImageData(imageData, 0, 0);
        if (sharpenStr > 0.005) applySharpen(ctx, cw, ch, sharpenStr * 0.7);
        lastProcessTime = Math.round(performance.now() - t0);
        return canvas.toDataURL('image/jpeg', 0.93);
    }

    function applySharpen(ctx, w, h, strength) {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const copy = new Uint8ClampedArray(data);
        const k = [0, -strength, 0, -strength, 1 + 4 * strength, -strength, 0, -strength, 0];
        for (let y = 1; y < h - 1; y++)
            for (let x = 1; x < w - 1; x++)
                for (let c = 0; c < 3; c++) {
                    let s = 0;
                    for (let ky = -1; ky <= 1; ky++)
                        for (let kx = -1; kx <= 1; kx++)
                            s += copy[((y + ky) * w + (x + kx)) * 4 + c] * k[(ky + 1) * 3 + (kx + 1)];
                    data[(y * w + x) * 4 + c] = Math.max(0, Math.min(255, Math.round(s)));
                }
        ctx.putImageData(imgData, 0, 0);
    }

    function getRotatedDims(img, rot) {
        const n = ((rot % 360) + 360) % 360;
        if (n === 90 || n === 270) return { width: img.height, height: img.width };
        return { width: img.width, height: img.height };
    }

    async function processActivePage() {
        const p = getActivePage();
        if (!p || !p.originalImage) return;
        p.processedDataURL = createProcessedImage(p.originalImage, p.settings, p.colorMode, p.rotation);
    }

    function triggerReprocess() {
        clearTimeout(processingTimeout);
        processingTimeout = setTimeout(async () => {
            if (!getActivePage()) return;
            pushHistory();
            showSpinner();
            await processActivePage();
            updateDisplay();
            updatePageThumbnails();
            updateInfoBar();
            hideSpinner();
        }, 180);
    }

    function updateDisplay() {
        const p = getActivePage();
        if (!p) {
            displayImage.style.display = 'none';
            compareWrapper.style.display = 'none';
            return;
        }
        if (cropMode) {
            displayImage.style.display = 'block';
            compareWrapper.style.display = 'none';
            displayImage.src = p.processedDataURL || p.originalDataURL;
            updateCropUI();
            return;
        }
        compareWrapper.style.display = 'none';
        displayImage.style.display = 'block';
        if (currentView === 'scanned') displayImage.src = p.processedDataURL || p.originalDataURL;
        else if (currentView === 'original') displayImage.src = getRotatedOriginalDataURL(p);
        else if (currentView === 'compare') {
            displayImage.style.display = 'none';
            compareWrapper.style.display = 'block';
            compareOriginal.src = getRotatedOriginalDataURL(p);
            compareProcessed.src = p.processedDataURL || p.originalDataURL;
            compareDivider.style.left = '50%';
            compareProcessed.style.clipPath = 'inset(0 50% 0 0)';
        }
    }

    function getRotatedOriginalDataURL(p) {
        if (p.rotation === 0) return p.originalDataURL;
        const img = p.originalImage;
        const rd = getRotatedDims(img, p.rotation);
        const scale = Math.min(1, MAX_DIM / Math.max(rd.width, rd.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(rd.width * scale);
        canvas.height = Math.round(rd.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((p.rotation * Math.PI) / 180);
        const dw = (p.rotation === 90 || p.rotation === 270) ? img.height * scale : img.width * scale;
        const dh = (p.rotation === 90 || p.rotation === 270) ? img.width * scale : img.height * scale;
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
        return canvas.toDataURL('image/jpeg', 0.9);
    }

    function analyzeAndAuto() {
        const p = getActivePage();
        if (!p || !p.originalImage) { showToast('⚠️ No image'); return; }
        showSpinner();
        const ac = document.createElement('canvas');
        const ms = Math.min(1, 400 / Math.max(p.originalImage.width, p.originalImage.height));
        ac.width = Math.round(p.originalImage.width * ms);
        ac.height = Math.round(p.originalImage.height * ms);
        const actx = ac.getContext('2d');
        actx.drawImage(p.originalImage, 0, 0, ac.width, ac.height);
        const id = actx.getImageData(0, 0, ac.width, ac.height);
        const d = id.data;
        const total = ac.width * ac.height;
        const hist = new Array(256).fill(0);
        let sumL = 0;
        const lums = new Float32Array(total);
        for (let i = 0, idx = 0; i < d.length; i += 4, idx++) {
            const L = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
            hist[L]++;
            sumL += L;
            lums[idx] = L;
        }
        const meanL = sumL / total;
        let peak = 210,
            pkCnt = 0;
        for (let i = 145; i < 250; i++) { if (hist[i] > pkCnt) { pkCnt = hist[i];
                peak = i; } }
        let vari = 0;
        for (let i = 0; i < total; i++) vari += (lums[i] - meanL) ** 2;
        const stdDev = Math.sqrt(vari / total);
        let darkCnt = 0;
        for (let i = 0; i < 55; i++) darkCnt += hist[i];
        const darkPct = (darkCnt / total) * 100;
        const autoT = Math.round(28 + (255 - peak) * 0.48);
        const autoC = Math.round(33 - stdDev * 0.65);
        const autoBr = Math.round((128 - meanL) * 0.38);
        const autoSh = Math.round(darkPct * 1.4 + Math.max(0, (128 - meanL)) * 0.25);
        const autoSp = Math.round(25 + stdDev * 0.5);
        const newSettings = {
            threshold: Math.min(92, Math.max(18, autoT)),
            contrast: Math.min(62, Math.max(2, autoC)),
            brightness: Math.min(42, Math.max(-22, autoBr)),
            shadow: Math.min(90, Math.max(3, autoSh)),
            sharpen: Math.min(70, Math.max(10, autoSp)),
            saturation: p.settings.saturation
        };
        pushHistory();
        Object.assign(p.settings, newSettings);
        updateSlidersFromSettings(p.settings);
        updatePresetHighlight();
        triggerReprocess();
        hideSpinner();
        showToast('🤖 Auto-adjusted', 'success');
    }

    const presets = {
        magic: { threshold: 58, contrast: 28, brightness: 8, shadow: 18, sharpen: 35, saturation: 10, colorMode: true },
        bw: { threshold: 72, contrast: 42, brightness: 5, shadow: 12, sharpen: 45, saturation: -50, colorMode: false },
        warm: { threshold: 50, contrast: 20, brightness: 14, shadow: 22, sharpen: 25, saturation: 22, colorMode: true },
        cool: { threshold: 62, contrast: 30, brightness: 6, shadow: 16, sharpen: 38, saturation: -15, colorMode: true },
        contrast: { threshold: 55, contrast: 55, brightness: 0, shadow: 30, sharpen: 55, saturation: 5, colorMode: true },
        soft: { threshold: 45, contrast: 10, brightness: 15, shadow: 35, sharpen: 10, saturation: -5, colorMode: true },
        shadowless: { threshold: 55, contrast: 22, brightness: 14, shadow: 5, sharpen: 28, saturation: 5, colorMode: true },
        cleandoc: { threshold: 78, contrast: 42, brightness: 6, shadow: 8, sharpen: 52, saturation: 0, colorMode: true },
        vintage: { threshold: 38, contrast: 18, brightness: 10, shadow: 32, sharpen: 15, saturation: -25, colorMode: true },
        coolblue: { threshold: 60, contrast: 28, brightness: 3, shadow: 14, sharpen: 40, saturation: -30, colorMode: true },
    };

    function applyPreset(name) {
        const p = getActivePage();
        if (!p) return;
        const preset = presets[name];
        if (!preset) return;
        pushHistory();
        p.settings = {
            threshold: preset.threshold,
            contrast: preset.contrast,
            brightness: preset.brightness,
            shadow: preset.shadow,
            sharpen: preset.sharpen,
            saturation: preset.saturation
        };
        p.colorMode = preset.colorMode;
        updateSlidersFromSettings(p.settings);
        updatePresetHighlight();
        triggerReprocess();
        showToast('🎨 ' + name, 'info');
    }

    function updatePresetHighlight() {
        const p = getActivePage();
        if (!p) return;
        const chips = presetChips.querySelectorAll('.preset-chip');
        chips.forEach(c => c.classList.remove('active-preset'));
        let best = null,
            bestDist = Infinity;
        for (const [name, preset] of Object.entries(presets)) {
            const dist = Math.abs(p.settings.threshold - preset.threshold) +
                Math.abs(p.settings.contrast - preset.contrast) +
                Math.abs(p.settings.brightness - preset.brightness) +
                Math.abs(p.settings.shadow - preset.shadow) +
                Math.abs(p.settings.sharpen - preset.sharpen) +
                Math.abs(p.settings.saturation - preset.saturation) +
                (p.colorMode === preset.colorMode ? 0 : 80);
            if (dist < bestDist) { bestDist = dist;
                best = name; }
        }
        if (best && bestDist < 60) {
            const chip = presetChips.querySelector(`[data-preset="${best}"]`);
            if (chip) chip.classList.add('active-preset');
        }
    }

    presetChips.addEventListener('click', (e) => {
        let chip = e.target.closest ? e.target.closest('.preset-chip') : null;
        if (!chip && e.target.parentElement) chip = e.target.parentElement.closest('.preset-chip');
        if (chip) applyPreset(chip.dataset.preset);
    });

    applyToAllBtn.addEventListener('click', () => {
        if (pages.length < 2) { showToast('⚠️ Need at least 2 pages'); return; }
        const current = getActivePage();
        if (!current) return;
        const targetSettings = { ...current.settings };
        const targetColor = current.colorMode;
        showSpinner();
        setTimeout(async () => {
            for (let i = 0; i < pages.length; i++) {
                if (i === activePageIndex) continue;
                const p = pages[i];
                p.settings = { ...targetSettings };
                p.colorMode = targetColor;
                p.processedDataURL = createProcessedImage(p.originalImage, p.settings, p.colorMode, p.rotation);
            }
            updatePageThumbnails();
            updateDisplay();
            hideSpinner();
            showToast('🔗 Applied to all pages', 'success');
        }, 20);
    });

    function onSliderInput() {
        const p = getActivePage();
        if (!p) return;
        p.settings.threshold = parseInt(thresholdSlider.value);
        p.settings.contrast = parseInt(contrastSlider.value);
        p.settings.brightness = parseInt(brightnessSlider.value);
        p.settings.shadow = parseInt(shadowSlider.value);
        p.settings.sharpen = parseInt(sharpenSlider.value);
        p.settings.saturation = parseInt(saturationSlider.value);
        thresholdVal.textContent = p.settings.threshold + '%';
        contrastVal.textContent = p.settings.contrast + '%';
        brightnessVal.textContent = p.settings.brightness + '%';
        shadowVal.textContent = p.settings.shadow + '%';
        sharpenVal.textContent = p.settings.sharpen + '%';
        saturationVal.textContent = (p.settings.saturation >= 0 ? '+' : '') + p.settings.saturation + '%';
        updatePresetHighlight();
        clearTimeout(processingTimeout);
        processingTimeout = setTimeout(() => { pushHistory();
            triggerReprocess(); }, 250);
    }
    [thresholdSlider, contrastSlider, brightnessSlider, shadowSlider, sharpenSlider, saturationSlider].forEach(
        s => s.addEventListener('input', onSliderInput));

    rotateBtn.addEventListener('click', () => {
        const p = getActivePage();
        if (!p) return;
        pushHistory();
        p.rotation = (p.rotation + 90) % 360;
        triggerReprocess();
        showToast('↩️ Rotated ' + p.rotation + '°');
    });

    undoBtn.addEventListener('click', undo);

    downloadBtn.addEventListener('click', () => {
        const p = getActivePage();
        if (!p || !p.processedDataURL) { showToast('⚠️ Nothing to download'); return; }
        const downloadName = p.fileName || ('scan_' + Date.now() + '.jpg');
        const a = document.createElement('a');
        a.download = downloadName;
        a.href = p.processedDataURL;
        a.click();
        showToast('💾 Downloaded: ' + downloadName, 'success');
    });

    pdfBtn.addEventListener('click', async () => {
        if (!pages.some(p => p.processedDataURL)) { showToast('⚠️ No scans'); return; }
        showSpinner();
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'px', format: 'a4', hotfixes: ['px_scaling'] });
            const pw = doc.internal.pageSize.getWidth(),
                ph = doc.internal.pageSize.getHeight();
            const m = 20,
                mw = pw - m * 2,
                mh = ph - m * 2;
            for (let i = 0; i < pages.length; i++) {
                if (i > 0) doc.addPage();
                const url = pages[i].processedDataURL || pages[i].originalDataURL;
                if (!url) continue;
                const img = new Image();
                img.src = url;
                await new Promise(r => { img.onload = r;
                    setTimeout(r, 2000); });
                const s = Math.min(mw / img.width, mh / img.height, 1);
                const dw = img.width * s,
                    dh = img.height * s;
                doc.addImage(url, 'JPEG', (pw - dw) / 2, (ph - dh) / 2, dw, dh);
            }
            doc.save('scan_' + Date.now() + '.pdf');
            hideSpinner();
            showToast('📕 PDF exported', 'success');
        } catch (e) { hideSpinner();
            showToast('❌ PDF error'); }
    });

    zipAllBtn.addEventListener('click', async () => {
        if (!pages.some(p => p.processedDataURL || p.originalDataURL)) {
            showToast('⚠️ No scans to download');
            return;
        }
        showSpinner();
        try {
            for (const page of pages) {
                if (!page.processedDataURL && page.originalImage) {
                    page.processedDataURL = createProcessedImage(
                        page.originalImage, page.settings, page.colorMode, page.rotation
                    );
                }
            }
            const zip = new JSZip();
            const usedNames = new Set();
            const getUniqueZipName = (name) => {
                if (!usedNames.has(name)) {
                    usedNames.add(name);
                    return name;
                }
                const dotIdx = name.lastIndexOf('.');
                const base = dotIdx > 0 ? name.substring(0, dotIdx) : name;
                const ext = dotIdx > 0 ? name.substring(dotIdx) : '.jpg';
                let counter = 2;
                let newName = base + '_' + counter + ext;
                while (usedNames.has(newName)) {
                    counter++;
                    newName = base + '_' + counter + ext;
                }
                usedNames.add(newName);
                return newName;
            };
            for (let i = 0; i < pages.length; i++) {
                const p = pages[i];
                const dataURL = p.processedDataURL || p.originalDataURL;
                if (!dataURL) continue;
                const base64Data = dataURL.split(',')[1];
                const originalName = p.fileName || ('scan_' + (i + 1) + '.jpg');
                const uniqueName = getUniqueZipName(originalName);
                zip.file(uniqueName, base64Data, { base64: true });
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipURL = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.download = 'scans_all_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.zip';
            a.href = zipURL;
            a.click();
            URL.revokeObjectURL(zipURL);
            hideSpinner();
            showToast('📦 ZIP downloaded with ' + pages.length + ' page(s)', 'success');
        } catch (e) {
            hideSpinner();
            showToast('❌ ZIP creation error');
            console.error(e);
        }
    });

    resetBtn.addEventListener('click', () => {
        resetEverything();
        showToast('🔄 Reset');
    });

    aiEnhanceBtn.addEventListener('click', () => {
        const p = getActivePage();
        if (!p || !p.originalImage) { showToast('⚠️ No image'); return; }
        showSpinner();
        setTimeout(() => {
            try {
                const img = p.originalImage;
                const scale = Math.min(1, 1500 / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale),
                    h = Math.round(img.height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const imageData = ctx.getImageData(0, 0, w, h);
                const data = imageData.data;
                const totalPixels = w * h;

                const gray = new Float32Array(totalPixels);
                for (let i = 0; i < data.length; i += 4) gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] +
                    0.114 * data[i + 2];

                const integral = new Float64Array(totalPixels);
                const sqIntegral = new Float64Array(totalPixels);
                for (let y = 0; y < h; y++) {
                    let rowSum = 0,
                        rowSqSum = 0;
                    for (let x = 0; x < w; x++) {
                        const idx = y * w + x,
                            v = gray[idx];
                        rowSum += v;
                        rowSqSum += v * v;
                        if (y === 0) { integral[idx] = rowSum;
                            sqIntegral[idx] = rowSqSum; } else { integral[idx] = integral[idx - w] + rowSum;
                            sqIntegral[idx] = sqIntegral[idx - w] + rowSqSum; }
                    }
                }

                function getIntegral(arr, x1, y1, x2, y2) {
                    let val = arr[y2 * w + x2];
                    if (x1 > 0) val -= arr[y2 * w + (x1 - 1)];
                    if (y1 > 0) val -= arr[(y1 - 1) * w + x2];
                    if (x1 > 0 && y1 > 0) val += arr[(y1 - 1) * w + (x1 - 1)];
                    return val;
                }

                const windowSize = Math.max(19, Math.floor(Math.min(w, h) * 0.04));
                const half = Math.floor(windowSize / 2);
                const k = 0.25,
                    R = 128;
                const binary = new Uint8Array(totalPixels);
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const x1 = Math.max(0, x - half),
                            x2 = Math.min(w - 1, x + half);
                        const y1 = Math.max(0, y - half),
                            y2 = Math.min(h - 1, y + half);
                        const area = (x2 - x1 + 1) * (y2 - y1 + 1);
                        const sum = getIntegral(integral, x1, y1, x2, y2);
                        const sqSum = getIntegral(sqIntegral, x1, y1, x2, y2);
                        const mean = sum / area;
                        const variance = Math.max(0, sqSum / area - mean * mean);
                        const std = Math.sqrt(variance);
                        const threshold = mean * (1 + k * ((std / R) - 1));
                        binary[y * w + x] = gray[y * w + x] > threshold ? 255 : 0;
                    }
                }

                const cleaned = new Uint8Array(totalPixels);
                for (let y = 2; y < h - 2; y++) {
                    for (let x = 2; x < w - 2; x++) {
                        const idx = y * w + x;
                        let whiteCount = 0;
                        for (let dy = -1; dy <= 1; dy++)
                            for (let dx = -1; dx <= 1; dx++)
                                if (binary[(y + dy) * w + (x + dx)] === 255) whiteCount++;
                        if (binary[idx] === 0 && whiteCount >= 7) cleaned[idx] = 255;
                        else if (binary[idx] === 255 && whiteCount >= 3) cleaned[idx] = 255;
                        else if (binary[idx] === 255 && whiteCount < 3) cleaned[idx] = 0;
                        else cleaned[idx] = binary[idx];
                    }
                }
                for (let y = 0; y < h; y++)
                    for (let x = 0; x < w; x++)
                        if (x < 2 || x >= w - 2 || y < 2 || y >= h - 2) cleaned[y * w + x] = binary[y * w + x];

                for (let i = 0; i < data.length; i += 4) {
                    const v = cleaned[i / 4];
                    data[i] = data[i + 1] = data[i + 2] = v;
                }
                ctx.putImageData(imageData, 0, 0);

                const sharpData = ctx.getImageData(0, 0, w, h);
                const sData = sharpData.data;
                const sCopy = new Uint8ClampedArray(sData);
                const sharpKernel = [0, -0.3, 0, -0.3, 2.2, -0.3, 0, -0.3, 0];
                for (let y = 1; y < h - 1; y++) {
                    for (let x = 1; x < w - 1; x++) {
                        let sum = 0;
                        for (let ky = -1; ky <= 1; ky++)
                            for (let kx = -1; kx <= 1; kx++)
                                sum += sCopy[((y + ky) * w + (x + kx)) * 4] * sharpKernel[(ky + 1) * 3 + (kx + 1)];
                        const val = Math.max(0, Math.min(255, Math.round(sum)));
                        sData[(y * w + x) * 4] = val;
                        sData[(y * w + x) * 4 + 1] = val;
                        sData[(y * w + x) * 4 + 2] = val;
                    }
                }
                ctx.putImageData(sharpData, 0, 0);

                const enhancedURL = canvas.toDataURL('image/jpeg', 0.96);
                const newImg = new Image();
                newImg.onload = function() {
                    p.originalImage = newImg;
                    p.originalDataURL = enhancedURL;
                    p.processedDataURL = null;
                    p.settings = { ...defaultSettings };
                    p.colorMode = false;
                    updateSlidersFromSettings(p.settings);
                    updatePresetHighlight();
                    processActivePage().then(() => {
                        pushHistory();
                        updatePageThumbnails();
                        updateDisplay();
                        hideSpinner();
                        showToast('🤖 AI text enhancement complete', 'success');
                    });
                };
                newImg.src = enhancedURL;
            } catch (e) {
                hideSpinner();
                showToast('❌ AI enhance error');
                console.error(e);
            }
        }, 20);
    });

    document.addEventListener('keydown', (e) => {
        if (!getActivePage()) return;
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && e.key === 's') { e.preventDefault();
            downloadBtn.click(); } else if (ctrl && e.key === 'p') { e.preventDefault();
            pdfBtn.click(); } else if (ctrl && e.key === 'z') { e.preventDefault();
            undo(); } else if (e.key === 'r' && !ctrl) { e.preventDefault();
            rotateBtn.click(); } else if (e.key === 'a' && !ctrl && document.activeElement === document.body) { e.preventDefault();
            autoAdjustBtn.click(); } else if (e.key === 'c' && !ctrl) { toggleCropMode(); } else if (e.key === '1' && !ctrl) { currentView = 'scanned';
            updateToolbarActive();
            updateDisplay(); } else if (e.key === '2' && !ctrl) { currentView = 'original';
            updateToolbarActive();
            updateDisplay(); } else if (e.key === '3' && !ctrl) { currentView = 'compare';
            updateToolbarActive();
            updateDisplay(); } else if (e.key === 'Delete' && !ctrl && document.activeElement === document.body) {
            if (pages.length > 0) { e.preventDefault();
                deletePage(activePageIndex); }
        }
    });

    function toggleCropMode() {
        if (cropMode) exitCropMode();
        else enterCropMode();
    }

    autoAdjustBtn.addEventListener('click', analyzeAndAuto);
    autoAdjustBtn2.addEventListener('click', analyzeAndAuto);

    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const logoBtn = document.getElementById('logoBtn');

    if (logoBtn) {
        logoBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const previewCardObserver = new MutationObserver(() => {
        scrollTopBtn.classList.toggle('visible', previewCard.classList.contains('active'));
    });
    previewCardObserver.observe(previewCard, { attributes: true, attributeFilter: ['class'] });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    async function renderPageToFormat(p, format) {
        const img = new Image();
        img.src = createProcessedImage(p.originalImage, p.settings, p.colorMode, p.rotation);
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        if (format === 'png') return canvas.toDataURL('image/png');
        return canvas.toDataURL('image/jpeg', 1.0);
    }

    function getPageFileName(p, index, ext) {
        const base = p.fileName ? p.fileName.replace(/\.[^.]+$/, '') : ('page_' + (index + 1));
        return base + '.' + ext;
    }

    async function saveAllAsFormat(format) {
        if (!pages.some(p => p.processedDataURL || p.originalDataURL)) {
            showToast('⚠️ No pages to save'); return;
        }
        showSpinner();
        try {
            for (const page of pages) {
                if (!page.processedDataURL && page.originalImage) {
                    page.processedDataURL = createProcessedImage(page.originalImage, page.settings, page.colorMode, page.rotation);
                }
            }
            const zip = new JSZip();
            const ext = format === 'png' ? 'png' : 'jpg';
            for (let i = 0; i < pages.length; i++) {
                const p = pages[i];
                const dataURL = await renderPageToFormat(p, format);
                const base64Data = dataURL.split(',')[1];
                const name = getPageFileName(p, i, ext);
                zip.file(name, base64Data, { base64: true });
            }
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = 'scans_all_' + format.toUpperCase() + '_' + Date.now() + '.zip';
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);
            hideSpinner();
            showToast('📦 Saved all as ' + format.toUpperCase() + ' (' + pages.length + ' page(s))', 'success');
        } catch (e) {
            hideSpinner();
            showToast('❌ Error saving as ' + format.toUpperCase());
            console.error(e);
        }
    }

    function downloadAllIndividually() {
        if (!pages.some(p => p.processedDataURL || p.originalDataURL)) {
            showToast('⚠️ No pages to download'); return;
        }
        let count = 0;
        for (let i = 0; i < pages.length; i++) {
            const p = pages[i];
            const dataURL = p.processedDataURL || p.originalDataURL;
            if (!dataURL) continue;
            const a = document.createElement('a');
            a.download = getPageFileName(p, i, 'jpg');
            a.href = dataURL;
            a.click();
            count++;
        }
        showToast('📥 Downloaded ' + count + ' page(s)', 'success');
    }

    function applyBestFilterToAll() {
        if (pages.length < 1) { showToast('⚠️ No pages'); return; }
        showSpinner();
        setTimeout(async () => {
            const current = getActivePage();
            if (!current) { hideSpinner(); return; }
            let best = null, bestDist = Infinity;
            for (const [name, preset] of Object.entries(presets)) {
                const dist = Math.abs(current.settings.threshold - preset.threshold) +
                    Math.abs(current.settings.contrast - preset.contrast) +
                    Math.abs(current.settings.brightness - preset.brightness) +
                    Math.abs(current.settings.shadow - preset.shadow) +
                    Math.abs(current.settings.sharpen - preset.sharpen) +
                    Math.abs(current.settings.saturation - preset.saturation) +
                    (current.colorMode === preset.colorMode ? 0 : 80);
                if (dist < bestDist) { bestDist = dist; best = name; }
            }
            if (!best || bestDist >= 60) { hideSpinner(); showToast('⚠️ No close filter match'); return; }
            const target = presets[best];
            for (let i = 0; i < pages.length; i++) {
                const p = pages[i];
                p.settings = { ...target };
                p.colorMode = target.colorMode;
                p.processedDataURL = createProcessedImage(p.originalImage, p.settings, p.colorMode, p.rotation);
            }
            if (current) {
                current.settings = { ...target };
                current.colorMode = target.colorMode;
                updateSlidersFromSettings(target);
                updatePresetHighlight();
            }
            updatePageThumbnails();
            updateDisplay();
            hideSpinner();
            showToast('🏆 Best filter "' + best + '" applied to all', 'success');
        }, 20);
    }

    document.getElementById('saveAllJpegBtn').addEventListener('click', () => saveAllAsFormat('jpeg'));
    document.getElementById('saveAllPngBtn').addEventListener('click', () => saveAllAsFormat('png'));
    document.getElementById('downloadAllBtn').addEventListener('click', downloadAllIndividually);
    document.getElementById('bestFilterAllBtn').addEventListener('click', applyBestFilterToAll);

    updateSlidersFromSettings(defaultSettings);
    updateUndoBtn();
    updateInfoBar();
    updatePageThumbnails();
    console.log('🚀 Came-Scanner AI — Powered by Ali-Tools');
})();
