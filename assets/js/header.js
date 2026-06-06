/* ============================================================
   HEADER.JS - Mega Menu, Mobile Nav, Scroll Effects
   ============================================================ */

(function() {
  'use strict';

  function getCurrentPage() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    return path;
  }

  function isActive(page) {
    return getCurrentPage() === page ? 'active' : '';
  }

  function getBasePath() {
    const script = document.querySelector('script[src$="header.js"]');
    if (!script) return '';
    const src = script.src;
    const rootUrl = src.replace(/\/assets\/js\/header\.js.*$/, '');
    let rootPath = '';
    try {
      rootPath = new URL(rootUrl).pathname.replace(/\/$/, '');
    } catch {
      return '';
    }
    const currentPath = window.location.pathname.replace(/\/$/, '');
    if (currentPath === rootPath) return '';
    if (currentPath.startsWith(rootPath + '/')) {
      const relative = currentPath.substring(rootPath.length + 1);
      const parts = relative.split('/');
      const lastPart = parts[parts.length - 1] || '';
      const isFile = lastPart.includes('.');
      const depth = isFile ? parts.length - 1 : parts.length;
      return '../'.repeat(Math.max(0, depth));
    }
    return '';
  }

  function injectHeader() {
    const base = getBasePath();
    const current = getCurrentPage();

    const headerHTML = `
    <header class="site-header" id="site-header">
      <div class="header-inner">
        <a href="${base}index.html" class="logo">
          <img src="${base}assets/logo.png" alt="Ali Tools Company" width="36" height="36" class="logo-img">
          Ali Tools Company
        </a>
        <nav class="nav-links" role="navigation" aria-label="Main navigation">
          <a href="${base}index.html" class="${isActive('index.html') || current === '' ? 'active' : ''}">Home</a>
          <a href="${base}image-tools.html" class="${isActive('image-tools.html') ? 'active' : ''}">Image Tools</a>
          <a href="${base}pdf-tools.html" class="${isActive('pdf-tools.html') ? 'active' : ''}">PDF Tools</a>
          <a href="${base}converter-tools.html" class="${isActive('converter-tools.html') ? 'active' : ''}">Converters</a>
          <a href="${base}about.html" class="${isActive('about.html') ? 'active' : ''}">About</a>
          <a href="${base}contact.html" class="${isActive('contact.html') ? 'active' : ''}">Contact</a>
          <div class="links-dropdown-wrapper">
            <button class="links-btn" id="externalLinksToggle" aria-label="External Links">🔗 Links</button>
            <div class="links-dropdown" id="externalLinksDropdown"></div>
          </div>
          <button class="mega-menu-btn" id="megaMenuToggle" aria-label="All Tools">☰ All Tools</button>
        </nav>
        <button class="hamburger" id="hamburgerToggle" aria-label="Toggle mobile menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
    <div class="mega-menu-overlay" id="megaMenuOverlay"></div>
    <div class="mega-menu" id="megaMenu">
      <div class="mega-menu-inner">
        <div class="mega-menu-search">
          <input type="text" id="megaMenuSearch" placeholder="Search all 140+ tools..." aria-label="Search tools">
        </div>
        <div class="mega-menu-column">
          <h3><span class="emoji">🖼️</span> Image Tools (51)</h3>
          <div class="mega-tools-list" data-category="image"></div>
        </div>
        <div class="mega-menu-column">
          <h3><span class="emoji">📄</span> PDF Tools (50)</h3>
          <div class="mega-tools-list" data-category="pdf"></div>
        </div>
        <div class="mega-menu-column">
          <h3><span class="emoji">🔄</span> Converter Tools (40)</h3>
          <div class="mega-tools-list" data-category="converter"></div>
        </div>
        <div class="mega-menu-column">
          <div class="featured-card">
            <h4>⭐ Featured Tool</h4>
            <p>Image Resizer — Resize any image instantly in your browser</p>
            <a href="${base}tools/image/image-resizer.html" class="btn">Try Now →</a>
          </div>
        </div>
      </div>
    </div>
    <div class="mobile-nav" id="mobileNav">
      <a href="${base}index.html" class="${isActive('index.html') || current === '' ? 'active' : ''}">🏠 Home</a>
      <a href="${base}image-tools.html" class="${isActive('image-tools.html') ? 'active' : ''}">🖼️ Image Tools</a>
      <a href="${base}pdf-tools.html" class="${isActive('pdf-tools.html') ? 'active' : ''}">📄 PDF Tools</a>
      <a href="${base}converter-tools.html" class="${isActive('converter-tools.html') ? 'active' : ''}">🔄 Converters</a>
      <a href="${base}about.html" class="${isActive('about.html') ? 'active' : ''}">ℹ️ About</a>
      <a href="${base}contact.html" class="${isActive('contact.html') ? 'active' : ''}">📧 Contact</a>
      <div class="mobile-links-section">
        <div class="mobile-links-header">🔗 External Links</div>
        <div id="mobileExternalLinks"></div>
      </div>
    </div>
  `;

    const headerContainer = document.getElementById('header');
    if (headerContainer) {
      headerContainer.innerHTML = headerHTML;
    }
  }

  function initHeader() {
    const header = document.getElementById('site-header');
    const megaMenu = document.getElementById('megaMenu');
    const megaOverlay = document.getElementById('megaMenuOverlay');
    const megaToggle = document.getElementById('megaMenuToggle');
    const hamburger = document.getElementById('hamburgerToggle');
    const mobileNav = document.getElementById('mobileNav');
    const searchInput = document.getElementById('megaMenuSearch');

    if (!header || !megaMenu || !megaOverlay || !megaToggle || !hamburger || !mobileNav) return;

    window.addEventListener('scroll', function() {
      const scroll = window.pageYOffset || document.documentElement.scrollTop;
      header.classList.toggle('scrolled', scroll > 80);
    }, { passive: true });

    megaToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      toggleMegaMenu();
    });

    megaOverlay.addEventListener('click', function() {
      closeMegaMenu();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeMegaMenu();
        closeMobileNav();
      }
    });

    if (searchInput) {
      searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        document.querySelectorAll('.mega-tools-list .tool-link').forEach(function(link) {
          const text = link.textContent.toLowerCase();
          link.style.display = text.includes(query) || !query ? 'block' : 'none';
        });
      });
    }

    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      this.classList.toggle('active');
      mobileNav.classList.toggle('open');
      closeMegaMenu();
    });

    mobileNav.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        closeMobileNav();
      });
    });

    function toggleMegaMenu() {
      if (megaMenu.classList.contains('open')) {
        closeMegaMenu();
      } else {
        openMegaMenu();
      }
    }

    function openMegaMenu() {
      megaMenu.classList.add('open');
      megaOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeMobileNav();
    }

    function closeMegaMenu() {
      megaMenu.classList.remove('open');
      megaOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    function closeMobileNav() {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('active');
    }
  }

  const toolData = {
    image: [
      'Camera Scanner', 'Image Resizer', 'Image Cropper', 'Image Compressor', 'Image Format Converter',
      'Image to Base64', 'Base64 to Image', 'Image Watermark', 'Image Flipper/Rotator',
      'Image Grayscale', 'Image Brightness/Contrast', 'Image Blur', 'Image Sharpener',
      'Image Border Adder', 'Image Color Inverter', 'Image to ASCII', 'Image EXIF Viewer',
      'Image EXIF Remover', 'Image Color Picker', 'Image Histogram', 'Image Collage Maker',
      'Image Background Color', 'Image Text Overlay', 'Image Pixel Art', 'Image Pencil Sketch',
      'Image Sepia', 'Image Noise Reducer', 'Image Padding Adder', 'Image Canvas Extender',
      'Image Color Palette', 'Image Thumbnail Generator', 'Image Sprite Sheet', 'Image Grid Splitter',
      'Image Sticker Overlay', 'Image Round Corner', 'Image Shadow Adder', 'Image Vignette',
      'Image HDR Effect', 'Image Vintage Retro', 'Image QR Embedder', 'Image Face Pixelator',
      'Image Batch Renamer', 'Image Color Channel', 'Image Tiler', 'Image ICC Viewer',
      'Image Aspect Ratio', 'Image DPI Changer', 'Image to SVG', 'Image Annotation',
      'Image Diff Comparator', 'Image Strip Maker'
    ],
    pdf: [
      'PDF Merger', 'PDF Splitter', 'PDF Compressor', 'PDF to Image', 'Image to PDF',
      'PDF Page Rotator', 'PDF Page Extractor', 'PDF Page Reorder', 'PDF Password Protector',
      'PDF Password Remover', 'PDF Watermark', 'PDF Metadata Editor', 'PDF to Text',
      'PDF Word Counter', 'PDF Page Counter', 'PDF Bookmark Viewer', 'PDF Annotation Viewer',
      'PDF Thumbnail Generator', 'PDF Header/Footer', 'PDF Page Number Adder',
      'PDF Background Color', 'PDF Crop', 'PDF Margin Adjuster', 'PDF Blank Page Remover',
      'PDF Duplicate Detector', 'PDF to HTML', 'PDF to Markdown', 'PDF Form Extractor',
      'PDF Form Filler', 'PDF Redaction', 'PDF Grayscale', 'PDF Linearizer',
      'PDF Version Converter', 'PDF Comparison', 'PDF to CSV', 'PDF to JSON',
      'PDF Font Viewer', 'PDF Layer Viewer', 'PDF Color Profile', 'PDF Signature Block',
      'PDF QR Embedder', 'PDF Bates Numbering', 'PDF TOC Generator', 'PDF Image Extractor',
      'PDF Text Search', 'PDF to EPUB', 'PDF to PowerPoint', 'PDF to Excel', 'PDF to Word',
      'PDF Accessibility Checker'
    ],
    converter: [
      'Word to PDF', 'PDF to Word', 'Excel to CSV', 'CSV to Excel', 'PPTX to PDF',
      'PDF to PPTX', 'HTML to PDF', 'Markdown to HTML', 'HTML to Markdown', 'JSON to CSV',
      'CSV to JSON', 'JSON to XML', 'XML to JSON', 'YAML to JSON', 'JSON to YAML',
      'XML to CSV', 'CSV to XML', 'TXT to PDF', 'PDF to TXT', 'RTF to DOCX',
      'DOCX to HTML', 'HTML to DOCX', 'EPUB to PDF', 'PDF to EPUB', 'ODS to XLSX',
      'ODT to DOCX', 'PPTX to Images', 'Images to PPTX', 'SVG to PNG', 'PNG to SVG',
      'MP4 to MP3', 'WAV to MP3', 'MP3 to WAV', 'Video to GIF', 'GIF to MP4',
      'SRT to VTT', 'VTT to SRT', 'TSV to CSV', 'CSV to TSV', 'QR to Text', 'Text to QR'
    ]
  };

  function generateToolSlug(category, name) {
    if (name === 'Camera Scanner') {
      const base = getBasePath();
      return base + 'assets/camera-scanner.html';
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const base = getBasePath();
    return base + 'tools/' + category + '/' + slug + '.html';
  }

  function getToolEmoji(name) {
    const imageEmojis = { 'scanner': '📷', 'resizer': '📏', 'cropper': '✂️', 'compressor': '🗜️', 'converter': '🔄', 'base64': '🔤', 'watermark': '💧', 'flipper': '🔄', 'rotator': '🔄', 'grayscale': '⚫', 'brightness': '☀️', 'contrast': '🌓', 'blur': '🌫️', 'sharpener': '✨', 'border': '⬜', 'inverter': '🔄', 'ascii': '📝', 'exif': '📋', 'picker': '🎨', 'histogram': '📊', 'collage': '🖼️', 'background': '🎨', 'text': '🔤', 'pixel': '🔲', 'sketch': '✏️', 'sepia': '🟫', 'noise': '📡', 'padding': '⬜', 'canvas': '🖼️', 'palette': '🎨', 'thumbnail': '📷', 'sprite': '🧩', 'grid': '🔲', 'sticker': '🎯', 'round': '⭕', 'shadow': '🌑', 'vignette': '🌑', 'hdr': '🌈', 'vintage': '📻', 'retro': '📻', 'qr': '📱', 'face': '😶', 'batch': '📦', 'channel': '🎨', 'tiler': '🧩', 'icc': '📋', 'aspect': '📐', 'dpi': '🔍', 'svg': '✏️', 'annotation': '🏷️', 'diff': '🔍', 'strip': '📸' };
    const pdfEmojis = { 'merger': '📎', 'splitter': '✂️', 'compressor': '🗜️', 'rotator': '🔄', 'extractor': '📄', 'reorder': '🔀', 'password': '🔒', 'remover': '🔓', 'watermark': '💧', 'metadata': '📋', 'counter': '🔢', 'bookmark': '🔖', 'annotation': '🏷️', 'thumbnail': '📷', 'header': '📐', 'footer': '📐', 'number': '🔢', 'crop': '✂️', 'margin': '📐', 'grayscale': '⚫', 'comparison': '🔍', 'font': '🔤', 'layer': '📑', 'signature': '✍️', 'bates': '🔢', 'toc': '📑', 'search': '🔍', 'accessibility': '♿' };
    const converterEmojis = { 'pdf': '📄', 'word': '📝', 'excel': '📊', 'csv': '📋', 'pptx': '📽️', 'html': '🌐', 'markdown': '📝', 'json': '📦', 'xml': '📄', 'yaml': '📋', 'txt': '📄', 'rtf': '📄', 'docx': '📝', 'epub': '📚', 'ods': '📊', 'odt': '📝', 'svg': '✏️', 'png': '🖼️', 'mp4': '🎬', 'mp3': '🎵', 'wav': '🎵', 'gif': '🎞️', 'srt': '📜', 'vtt': '📜', 'tsv': '📋', 'qr': '📱', 'text': '📝' };
    const lower = name.toLowerCase();
    for (const [key, emoji] of Object.entries(imageEmojis)) { if (lower.includes(key)) return emoji; }
    for (const [key, emoji] of Object.entries(pdfEmojis)) { if (lower.includes(key)) return emoji; }
    for (const [key, emoji] of Object.entries(converterEmojis)) { if (lower.includes(key)) return emoji; }
    return '🔧';
  }

  function populateMegaMenu() {
    document.querySelectorAll('.mega-tools-list').forEach(function(container) {
      const cat = container.dataset.category;
      const tools = toolData[cat] || [];
      tools.forEach(function(name) {
        const link = document.createElement('a');
        link.href = generateToolSlug(cat, name);
        link.className = 'tool-link';
        link.textContent = getToolEmoji(name) + ' ' + name;
        container.appendChild(link);
      });
    });
  }

  function initExternalLinks() {
    function getLinks() {
      try {
        return JSON.parse(localStorage.getItem('alitools_external_links')) || [];
      } catch {
        return [];
      }
    }

    function renderDropdown() {
      const dropdown = document.getElementById('externalLinksDropdown');
      const mobileContainer = document.getElementById('mobileExternalLinks');
      const links = getLinks();

      var html = '<div class="links-dropdown-list">';
      if (links.length === 0) {
        html += '<div class="links-dropdown-empty">No links added</div>';
      } else {
        for (var i = 0; i < links.length; i++) {
          html += '<a href="' + links[i].url + '" target="_blank" rel="noopener noreferrer" class="links-dropdown-item">';
          html += '<span class="links-item-name">' + escapeHtml(links[i].name) + '</span>';
          html += '</a>';
        }
      }
      html += '</div>';
      dropdown.innerHTML = html;

      var mobileHtml = '';
      if (links.length === 0) {
        mobileHtml = '<div class="mobile-links-empty">No links added</div>';
      } else {
        for (var j = 0; j < links.length; j++) {
          mobileHtml += '<a href="' + links[j].url + '" target="_blank" rel="noopener noreferrer" class="mobile-links-item">';
          mobileHtml += escapeHtml(links[j].name) + '</a>';
        }
      }
      mobileContainer.innerHTML = mobileHtml;
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    var toggle = document.getElementById('externalLinksToggle');
    var dropdown = document.getElementById('externalLinksDropdown');

    if (toggle && dropdown) {
      document.addEventListener('click', function(e) {
        if (toggle.contains(e.target) || dropdown.contains(e.target)) {
          dropdown.classList.toggle('open');
          toggle.classList.toggle('open');
        } else {
          dropdown.classList.remove('open');
          toggle.classList.remove('open');
        }
      });
    }

    window.addEventListener('storage', function(e) {
      if (e.key === 'alitools_external_links') renderDropdown();
    });

    renderDropdown();
  }

  function init() {
    injectHeader();
    initHeader();
    populateMegaMenu();
    initExternalLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
