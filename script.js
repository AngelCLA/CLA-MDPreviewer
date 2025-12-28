const STORAGE_KEY = 'cla-md-content';
    const LAYOUT_KEY = 'cla-md-layout';
    
    const container = document.querySelector('.editor-container');
    const layoutToggleBtn = document.getElementById('layout-toggle');
    const layoutIcon = document.getElementById('layout-icon');
    const input = document.getElementById('markdown-input');
    const preview = document.getElementById('preview');
    const resizer = document.getElementById('resizer');
    const editorPane = document.querySelector('.editor-pane');
    const previewPane = document.querySelector('.preview-pane');
    const clearStorageBtn = document.getElementById('clear-storage-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');

    const initialContent = `# Bienvenido al Previsualizador

Este es un **previsualizador** de Markdown con guardado automático.

## Características

- Vista previa en tiempo real
- Sintaxis Markdown completa
- Guardado automático en localStorage
- Se restaura al recargar la página

### Ejemplos de código

Código inline: \`const x = 10;\`

\`\`\`javascript
function saludar(nombre) {
  console.log(\`Hola, \${nombre}!\`);
}
\`\`\`

> Esta es una cita en bloque.

---

¡Empieza a escribir tu contenido!`;

    function setLayoutIcon(isRow) {
      if (isRow) {
        layoutIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="7" rx="2"/><rect x="4" y="14" width="16" height="7" rx="2"/></svg>`;
      } else {
        layoutIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/></svg>`;
      }
    }

    function saveContent(content) {
      try {
        localStorage.setItem(STORAGE_KEY, content);
      } catch (e) {
        console.error('Error al guardar:', e);
      }
    }

    function loadContent() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved !== null ? saved : initialContent;
      } catch (e) {
        console.error('Error al cargar:', e);
        return initialContent;
      }
    }

    function saveLayout(isRow) {
      try {
        localStorage.setItem(LAYOUT_KEY, isRow ? 'row' : 'column');
      } catch (e) {
        console.error('Error al guardar layout:', e);
      }
    }

    function restoreLayout() {
      try {
        const savedLayout = localStorage.getItem(LAYOUT_KEY);
        if (savedLayout === 'row') {
          container.classList.add('layout-row');
          setLayoutIcon(true);
        }
      } catch (e) {
        console.error('Error al restaurar layout:', e);
      }
    }

    // Configure marked to use Highlight.js for code blocks with auto-detection
    if (window.hljs && typeof marked !== 'undefined') {
      function normalizeLang(lang) {
        if (!lang) return null;
        const l = lang.toLowerCase().trim();
        const map = {
          ts: 'typescript',
          js: 'javascript',
          py: 'python',
          sh: 'bash',
          shell: 'bash',
          bash: 'bash',
          jsx: 'javascript',
          tsx: 'typescript',
          html: 'xml',
        };
        return map[l] || l;
      }

      const renderer = new marked.Renderer();
      renderer.code = (code, infostring, escaped) => {
        const rawLang = (infostring || '').split(/\s+/)[0];
        const language = normalizeLang(rawLang) || null;
        try {
          const highlighted = (language && hljs.getLanguage(language))
            ? hljs.highlight(code, { language }).value
            : hljs.highlightAuto(code).value;
          const langClass = language ? ` language-${language}` : '';
          return `<pre><code class="hljs${langClass}">${highlighted}</code></pre>`;
        } catch (err) {
          const safe = escaped ? code : escapeHtml(code);
          const langClass = language ? ` language-${language}` : '';
          return `<pre><code class="hljs${langClass}">${safe}</code></pre>`;
        }
      };

      function escapeHtml(html) {
        return html
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      marked.setOptions({ renderer });
    }

    function updatePreview() {
      const markdown = input.value;
      preview.innerHTML = marked.parse(markdown);
    }

    // Cargar contenido guardado
    input.value = loadContent();
    restoreLayout();
    updatePreview();

    // Guardar automáticamente
    let saveTimeout;
    input.addEventListener('input', () => {
      updatePreview();
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveContent(input.value);
      }, 500);
    });

    // Toggle layout
    layoutToggleBtn.addEventListener('click', () => {
      const isRow = container.classList.toggle('layout-row');
      setLayoutIcon(isRow);
      saveLayout(isRow);
    });

    // Limpiar storage y restaurar inicial
    clearStorageBtn.addEventListener('click', () => {
      showConfirm('¿Deseas restaurar el contenido inicial?').then((ok) => {
        if (ok) {
          localStorage.removeItem(STORAGE_KEY);
          input.value = initialContent;
          updatePreview();
          saveContent(input.value);
          showToast('Contenido restaurado', 'success');
        }
      });
    });

    // Limpiar todo
    clearBtn.addEventListener('click', () => {
      showConfirm('¿Estás seguro de que quieres limpiar todo?').then((ok) => {
        if (ok) {
          input.value = '';
          updatePreview();
          saveContent('');
          showToast('Contenido limpiado', 'success');
        }
      });
    });

    // Copiar
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(input.value);
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
        }, 2000);
        showToast('Copiado al portapapeles', 'success');
      } catch (err) {
        showAlert('Error al copiar');
        showToast('No se pudo copiar', 'error');
      }
    });

    // Resize functionality
    let isResizing = false;

    resizer.addEventListener('mousedown', () => {
      isResizing = true;
      document.body.style.cursor = container.classList.contains('layout-row') ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const containerRect = container.getBoundingClientRect();
      const isRowLayout = container.classList.contains('layout-row');

      if (isRowLayout) {
        const newHeight = e.clientY - containerRect.top;
        const percentage = (newHeight / containerRect.height) * 100;
        if (percentage >= 20 && percentage <= 80) {
          editorPane.style.flex = `0 0 ${percentage}%`;
          previewPane.style.flex = `0 0 ${100 - percentage}%`;
        }
      } else {
        const newWidth = e.clientX - containerRect.left;
        const percentage = (newWidth / containerRect.width) * 100;
        if (percentage >= 20 && percentage <= 80) {
          editorPane.style.flex = `0 0 ${percentage}%`;
          previewPane.style.flex = `0 0 ${100 - percentage}%`;
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });

    // Minimal modal implementation
    const modal = document.getElementById('app-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm');
    const modalCancelBtn = document.getElementById('modal-cancel');
    const modalOverlay = document.querySelector('.modal-overlay');

    function openModal(message, title = 'Confirmación', showCancel = true) {
      modalMessage.textContent = message;
      document.getElementById('modal-title').textContent = title;
      if (showCancel) modalCancelBtn.style.display = '';
      else modalCancelBtn.style.display = 'none';
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      // trap focus
      modalConfirmBtn.focus();
    }

    function closeModal() {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }

    function showConfirm(message) {
      return new Promise((resolve) => {
        openModal(message, 'Confirmación', true);
        function onConfirm() {
          cleanup();
          resolve(true);
        }
        function onCancel() {
          cleanup();
          resolve(false);
        }
        function onKey(e) {
          if (e.key === 'Escape') onCancel();
          if (e.key === 'Enter') onConfirm();
        }
        function cleanup() {
          modalConfirmBtn.removeEventListener('click', onConfirm);
          modalCancelBtn.removeEventListener('click', onCancel);
          modalOverlay.removeEventListener('click', onCancel);
          document.removeEventListener('keydown', onKey);
          closeModal();
        }
        modalConfirmBtn.addEventListener('click', onConfirm);
        modalCancelBtn.addEventListener('click', onCancel);
        modalOverlay.addEventListener('click', onCancel);
        document.addEventListener('keydown', onKey);
      });
    }

    function showAlert(message) {
      return new Promise((resolve) => {
        openModal(message, 'Información', false);
        function onOk() {
          cleanup();
          resolve();
        }
        function onKey(e) {
          if (e.key === 'Escape' || e.key === 'Enter') onOk();
        }
        function cleanup() {
          modalConfirmBtn.removeEventListener('click', onOk);
          modalOverlay.removeEventListener('click', onOk);
          document.removeEventListener('keydown', onKey);
          closeModal();
        }
        modalConfirmBtn.addEventListener('click', onOk);
        modalOverlay.addEventListener('click', onOk);
        document.addEventListener('keydown', onKey);
      });
    }

    // Toast notifications
    const toastContainer = document.getElementById('toast-container');
    function showToast(message, type = 'info', timeout = 3500) {
      if (!toastContainer) return;
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');

      const content = document.createElement('div');
      content.textContent = message;
      toast.appendChild(content);

      const closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.type = 'button';
      closeBtn.textContent = '✕';
      closeBtn.addEventListener('click', () => removeToast(toast));
      toast.appendChild(closeBtn);

      toastContainer.appendChild(toast);

      // Force reflow to trigger transition
      window.getComputedStyle(toast).opacity;
      toast.classList.add('show');

      const tid = setTimeout(() => removeToast(toast), timeout);

      function removeToast(node) {
        clearTimeout(tid);
        node.classList.remove('show');
        node.addEventListener('transitionend', () => {
          if (node.parentNode) node.parentNode.removeChild(node);
        }, { once: true });
      }
    }

    // Scroll synchronization between editor and preview
    (function setupScrollSync() {
      if (!input || !preview) return;
      let syncingFrom = null;

      function syncScroll(src, dst) {
        if (syncingFrom === dst) return;
        syncingFrom = src;
        
        const srcMax = src.scrollHeight - src.clientHeight || 1;
        const ratio = Math.max(0, Math.min(1, src.scrollTop / srcMax));
        const target = Math.round(ratio * Math.max(0, dst.scrollHeight - dst.clientHeight));
        
        dst.scrollTop = target;
        
        requestAnimationFrame(() => {
          syncingFrom = null;
        });
      }

      input.addEventListener('scroll', () => syncScroll(input, preview), { passive: true });
      preview.addEventListener('scroll', () => syncScroll(preview, input), { passive: true });

      // Keep sync after content updates
      const observer = new MutationObserver(() => {
        if (syncingFrom) return;
        const srcMax = input.scrollHeight - input.clientHeight || 1;
        const ratio = Math.max(0, Math.min(1, input.scrollTop / srcMax));
        preview.scrollTop = Math.round(ratio * Math.max(0, preview.scrollHeight - preview.clientHeight));
      });
      observer.observe(preview, { childList: true, subtree: true, characterData: true });
    })();