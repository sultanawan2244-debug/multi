/* ============================================================
   TOOL-UTILS.JS - Shared File Upload, Drag-Drop, Progress
   ============================================================ */

(function() {
  'use strict';

  window.AlToolsUtils = {
    validateFileType: function(file) {
      const input = document.querySelector('.file-input') || document.querySelector('input[type="file"]');
      if (!input || !input.accept || input.accept === '') return true;
      const accept = input.accept;
      if (accept === '*') return true;
      const types = accept.split(',');
      for (let i = 0; i < types.length; i++) {
        const t = types[i].trim();
        if (!t) continue;
        if (t.endsWith('/*')) {
          const prefix = t.slice(0, -2);
          if (file.type.startsWith(prefix + '/')) return true;
        } else if (t.startsWith('.')) {
          if (file.name.toLowerCase().endsWith(t.toLowerCase())) return true;
        } else if (file.type === t) return true;
      }
      return false;
    },

    initDropZone: function(dropZoneId, callback) {
      const dropZone = document.getElementById(dropZoneId);
      if (!dropZone) return;

      const fileInput = dropZone.querySelector('input[type="file"]') || dropZone.querySelector('.file-input');
      
      if (fileInput) {
        dropZone.addEventListener('click', function() {
          fileInput.click();
        });

        fileInput.addEventListener('change', function(e) {
          if (this.files && this.files[0]) {
            if (typeof callback === 'function') {
              callback(this.files[0]);
            }
          }
        });
      }

      // Drag and drop events
      ['dragenter', 'dragover'].forEach(function(evt) {
        dropZone.addEventListener(evt, function(e) {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(function(evt) {
        dropZone.addEventListener(evt, function(e) {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.remove('drag-over');
        });
      });

      dropZone.addEventListener('drop', function(e) {
        const files = e.dataTransfer.files;
        if (files && files[0]) {
          if (typeof callback === 'function') {
            callback(files[0]);
          }
          if (fileInput) {
            fileInput.files = files;
          }
        }
      });
    },

    showProgress: function(progressId) {
      const bar = document.getElementById(progressId);
      if (bar) {
        bar.classList.add('active');
        const fill = bar.querySelector('.progress-fill');
        if (fill) {
          fill.style.width = '0%';
        }
      }
    },

    updateProgress: function(progressId, percent) {
      const bar = document.getElementById(progressId);
      if (bar) {
        const fill = bar.querySelector('.progress-fill');
        if (fill) {
          fill.style.width = Math.min(percent, 100) + '%';
        }
      }
    },

    hideProgress: function(progressId) {
      const bar = document.getElementById(progressId);
      if (bar) {
        setTimeout(function() {
          bar.classList.remove('active');
          const fill = bar.querySelector('.progress-fill');
          if (fill) {
            fill.style.width = '0%';
          }
        }, 500);
      }
    },

    simulateProgress: function(progressId, duration, callback) {
      const bar = document.getElementById(progressId);
      if (!bar) {
        if (typeof callback === 'function') callback();
        return;
      }
      
      this.showProgress(progressId);
      const fill = bar.querySelector('.progress-fill');
      if (!fill) {
        if (typeof callback === 'function') callback();
        return;
      }

      const steps = 20;
      const interval = duration / steps;
      let current = 0;

      function step() {
        current++;
        const progress = current / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        const pct = eased * 90;
        fill.style.width = pct + '%';

        if (current < steps) {
          setTimeout(step, interval);
        } else {
          fill.style.width = '100%';
          setTimeout(function() {
            if (typeof callback === 'function') callback();
          }, 300);
        }
      }

      setTimeout(step, interval);
    },

    formatFileSize: function(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    showFileInfo: function(containerId, file) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const fileTypes = {
        'image/jpeg': 'JPEG Image',
        'image/png': 'PNG Image',
        'image/gif': 'GIF Image',
        'image/webp': 'WebP Image',
        'image/svg+xml': 'SVG Image',
        'image/bmp': 'BMP Image',
        'image/tiff': 'TIFF Image',
        'application/pdf': 'PDF Document',
        'text/plain': 'Text File',
        'text/csv': 'CSV File',
        'application/json': 'JSON File',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel File'
      };

      container.innerHTML = `
        <div class="file-info">
          <span>📄</span>
          <span class="file-name">${file.name}</span>
          <span class="file-size">(${this.formatFileSize(file.size)})</span>
          <span class="file-type">${fileTypes[file.type] || file.type || 'Unknown'}</span>
          <button class="remove-file" onclick="this.closest('.file-info').remove()" aria-label="Remove file">✕</button>
        </div>
      `;
      container.style.display = 'block';
    },

    loadImage: function(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const img = new Image();
          img.onload = function() {
            resolve({ image: img, dataUrl: e.target.result });
          };
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    loadFileAsDataURL: function(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function(e) {
          resolve(e.target.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    loadFileAsText: function(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function(e) {
          resolve(e.target.result);
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    },

    loadFileAsArrayBuffer: function(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function(e) {
          resolve(e.target.result);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    },

    triggerDownload: function(dataUrl, filename) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    showError: function(containerId, message) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '<div class="file-info" style="background:#FFEBEE;color:#C62828;border:1px solid #FFCDD2;"><span>⚠️</span> ' + message + '</div>';
      container.style.display = 'block';
    },

    showSuccess: function(containerId, message) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '<div class="file-info" style="background:#E8F5E9;color:#2E7D32;border:1px solid #C8E6C9;"><span>✅</span> ' + message + '</div>';
      container.style.display = 'block';
    },

    drawImageOnCanvas: function(img, canvasId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      return ctx;
    },

    confettiBurst: function() {
      const colors = ['#1A73E8', '#00C6FF', '#10B981', '#E53935', '#FBBC04', '#8E24AA', '#FF6D00'];
      for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.top = '-10px';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.width = (6 + Math.random() * 8) + 'px';
        piece.style.height = (6 + Math.random() * 8) + 'px';
        piece.style.animationDuration = (1 + Math.random() * 1.5) + 's';
        piece.style.animationDelay = (Math.random() * 0.5) + 's';
        piece.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
        document.body.appendChild(piece);
        setTimeout(function() { piece.remove(); }, 3000);
      }
    }
  };

})();
