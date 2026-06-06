/* ============================================================
   FOOTER.JS - Footer Animations, Newsletter, Social Icons
   ============================================================ */

(function() {
  'use strict';

  function getBasePath() {
    var script = document.querySelector('script[src$="footer.js"]');
    if (!script) return '';
    var src = script.src;
    var rootUrl = src.replace(/\/assets\/js\/footer\.js.*$/, '');
    var rootPath = '';
    try {
      rootPath = new URL(rootUrl).pathname.replace(/\/$/, '');
    } catch (e) {
      return '';
    }
    var currentPath = window.location.pathname.replace(/\/$/, '');
    if (currentPath === rootPath) return '';
    if (currentPath.startsWith(rootPath + '/')) {
      var relative = currentPath.substring(rootPath.length + 1);
      var parts = relative.split('/');
      var lastPart = parts[parts.length - 1] || '';
      var isFile = lastPart.indexOf('.') !== -1;
      var depth = isFile ? parts.length - 1 : parts.length;
      var result = '';
      for (var i = 0; i < Math.max(0, depth); i++) {
        result += '../';
      }
      return result;
    }
    return '';
  }

  function injectFooter() {
    var base = getBasePath();

    var footerHTML = '\n    <footer class="site-footer">\n      <div class="footer-border"></div>\n      <div class="footer-grid">\n        <div class="footer-column footer-brand scroll-animate fade-in-up">\n          <a href="' + base + 'index.html" class="logo">\n            <img src="' + base + 'assets/logo.png" alt="Ali Tools Company" width="36" height="36" class="logo-img">\n            Ali Tools Company\n          </a>\n          <p class="tagline">Your All-in-One Free Online Toolkit \u2014 140+ tools, zero cost, zero sign-up.</p>\n          <div class="social-icons">\n            <a href="#" class="social-icon facebook" aria-label="Facebook" data-tooltip="Facebook">f</a>\n            <a href="#" class="social-icon twitter" aria-label="Twitter/X" data-tooltip="Twitter/X">\uD835\uDDCF</a>\n            <a href="#" class="social-icon instagram" aria-label="Instagram" data-tooltip="Instagram">\u25FB</a>\n            <a href="#" class="social-icon youtube" aria-label="YouTube" data-tooltip="YouTube">\u25B6</a>\n          </div>\n        </div>\n        <div class="footer-column scroll-animate fade-in-up stagger-delay-1">\n          <h3>Image Tools</h3>\n          <ul>\n            <li><a href="' + base + 'tools/image/image-resizer.html">Image Resizer</a></li>\n            <li><a href="' + base + 'tools/image/image-cropper.html">Image Cropper</a></li>\n            <li><a href="' + base + 'tools/image/image-compressor.html">Image Compressor</a></li>\n            <li><a href="' + base + 'tools/image/image-format-converter.html">Format Converter</a></li>\n            <li><a href="' + base + 'tools/image/image-watermark.html">Watermark</a></li>\n            <li><a href="' + base + 'tools/image/image-grayscale.html">Grayscale</a></li>\n            <li><a href="' + base + 'tools/image/image-blur.html">Blur</a></li>\n            <li><a href="' + base + 'tools/image/image-to-ascii.html">To ASCII</a></li>\n          </ul>\n          <h3 style="margin-top:20px;">PDF Tools</h3>\n          <ul>\n            <li><a href="' + base + 'tools/pdf/pdf-merger.html">PDF Merger</a></li>\n            <li><a href="' + base + 'tools/pdf/pdf-splitter.html">PDF Splitter</a></li>\n            <li><a href="' + base + 'tools/pdf/pdf-compressor.html">PDF Compressor</a></li>\n            <li><a href="' + base + 'tools/pdf/pdf-to-image.html">PDF to Image</a></li>\n            <li><a href="' + base + 'tools/pdf/image-to-pdf.html">Image to PDF</a></li>\n            <li><a href="' + base + 'tools/pdf/pdf-password-protector.html">Password Protect</a></li>\n            <li><a href="' + base + 'tools/pdf/pdf-page-rotator.html">Page Rotator</a></li>\n            <li><a href="' + base + 'tools/pdf/pdf-to-text.html">PDF to Text</a></li>\n          </ul>\n        </div>\n        <div class="footer-column scroll-animate fade-in-up stagger-delay-2">\n          <h3>Converter Tools</h3>\n          <ul>\n            <li><a href="' + base + 'tools/converter/word-to-pdf.html">Word to PDF</a></li>\n            <li><a href="' + base + 'tools/converter/pdf-to-word.html">PDF to Word</a></li>\n            <li><a href="' + base + 'tools/converter/excel-to-csv.html">Excel to CSV</a></li>\n            <li><a href="' + base + 'tools/converter/csv-to-excel.html">CSV to Excel</a></li>\n            <li><a href="' + base + 'tools/converter/html-to-pdf.html">HTML to PDF</a></li>\n            <li><a href="' + base + 'tools/converter/json-to-csv.html">JSON to CSV</a></li>\n            <li><a href="' + base + 'tools/converter/svg-to-png.html">SVG to PNG</a></li>\n            <li><a href="' + base + 'tools/converter/markdown-to-html.html">Markdown to HTML</a></li>\n            <li><a href="' + base + 'tools/converter/qr-to-text.html">QR to Text</a></li>\n            <li><a href="' + base + 'tools/converter/text-to-qr.html">Text to QR</a></li>\n          </ul>\n          <h3 style="margin-top:20px;">Company</h3>\n          <ul>\n            <li><a href="' + base + 'about.html">About Us</a></li>\n            <li><a href="' + base + 'contact.html">Contact Us</a></li>\n            <li><a href="' + base + 'privacy-policy.html">Privacy Policy</a></li>\n            <li><a href="' + base + 'disclaimer.html">Disclaimer</a></li>\n            <li><a href="' + base + 'admin.html">Admin</a></li>\n          </ul>\n        </div>\n        <div class="footer-column scroll-animate fade-in-up stagger-delay-3">\n          <h3>Stay Updated</h3>\n          <p style="font-size:0.9rem;color:var(--gray-600);margin-bottom:16px;">Get notified about new tools and features.</p>\n          <form class="newsletter-form" id="newsletterForm">\n            <input type="email" placeholder="Your email address" required aria-label="Email for newsletter">\n            <button type="submit" class="btn btn-primary">Subscribe</button>\n          </form>\n          <p style="font-size:0.85rem;color:var(--gray-600);">&copy; 2025 Ali Tools Company. All rights reserved.</p>\n          <p class="made-with" style="font-size:0.85rem;color:var(--gray-600);margin-top:4px;">Made with \u2764 for free tools lovers</p>\n        </div>\n      </div>\n      <div class="footer-bottom">\n        <p>&copy; 2025 Ali Tools Company. All rights reserved.</p>\n        <p class="made-with">Made with \u2764 for free tools lovers</p>\n      </div>\n          </div>\n    </footer>\n  ';

    var footerContainer = document.getElementById('footer');
    if (footerContainer) {
      footerContainer.innerHTML = footerHTML;
      initFooter();
    }
  }

  function initFooter() {
    var form = document.getElementById('newsletterForm');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var input = this.querySelector('input[type="email"]');
        if (input && input.value.trim()) {
          var btn = this.querySelector('button');
          var original = btn.textContent;
          btn.textContent = '\u2705 Subscribed!';
          btn.disabled = true;
          input.value = '';
          setTimeout(function() {
            btn.textContent = original;
            btn.disabled = false;
          }, 3000);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFooter);
  } else {
    injectFooter();
  }

})();
