    // Obtener referencias DOM primero
    const container = document.querySelector('.editor-container');
    const layoutToggleBtn = document.getElementById('layout-toggle');
    const layoutIcon = document.getElementById('layout-icon');
    const input = document.getElementById('markdown-input');
    const preview = document.getElementById('preview');
    const resizer = document.getElementById('resizer');
    const editorPane = document.querySelector('.editor-pane');
    const previewPane = document.querySelector('.preview-pane');

    // Layout switching logic con un solo botón
    function setLayoutIcon(isRow) {
      if (isRow) {
        // Icono filas
        layoutIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="7" rx="2"/><rect x="4" y="14" width="16" height="7" rx="2"/></svg>`;
      } else {
        // Icono columnas
        layoutIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/></svg>`;
      }
    }

    layoutToggleBtn.addEventListener('click', () => {
      const isRow = container.classList.toggle('layout-row');
      setLayoutIcon(isRow);
      if (typeof debouncedSendHeight === 'function') debouncedSendHeight();
    });

    // Inicializar icono según el layout actual
    setLayoutIcon(container.classList.contains('layout-row'));

    // Contenido inicial de ejemplo
    const initialContent = `# Bienvenido al Previsualizador

Este es un **previsualizador** de Markdown con los estilos de CLA Blog.

## Características

- Vista previa en tiempo real
- Sintaxis Markdown completa
- Estilos personalizados del blog

### Ejemplos de código

Código inline: \`const x = 10;\`

\`\`\`javascript
function saludar(nombre) {
  console.log(\`Hola, \${nombre}!\`);
}
\`\`\`

> Esta es una cita en bloque que muestra cómo se verá en tu blog.

---

¡Empieza a escribir tu contenido!`;

    input.value = initialContent;

    function updatePreview() {
      const markdown = input.value;
      preview.innerHTML = marked.parse(markdown);
      // notify parent iframe (if any) that height may have changed
      if (typeof debouncedSendHeight === 'function') debouncedSendHeight();
    }

    input.addEventListener('input', updatePreview);
    
    // Renderizar contenido inicial
    updatePreview();

    // Funcionalidad del botón Limpiar
    document.getElementById('clear-btn').addEventListener('click', () => {
      if (confirm('¿Estás seguro de que quieres limpiar todo el contenido?')) {
        input.value = '';
        updatePreview();
      }
    });

    // Funcionalidad del botón Copiar
    document.getElementById('copy-btn').addEventListener('click', async () => {
      const text = input.value;
      try {
        await navigator.clipboard.writeText(text);
        const btn = document.getElementById('copy-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          ¡Copiado!
        `;
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      } catch (err) {
        alert('Error al copiar el texto');
      }
    });

    // Sincronización de scroll entre textarea y preview
    let isSyncingScroll = false;

    function syncScroll(source, target) {
      if (isSyncingScroll) return;
      isSyncingScroll = true;
      // Calcular la proporción de scroll
      const sourceScroll = source.scrollTop / (source.scrollHeight - source.clientHeight);
      // Aplicar al target
      target.scrollTop = sourceScroll * (target.scrollHeight - target.clientHeight);
      isSyncingScroll = false;
    }

    input.addEventListener('scroll', () => {
      syncScroll(input, preview);
    });

    preview.addEventListener('scroll', () => {
      syncScroll(preview, input);
    });

    // Funcionalidad de resize
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const isRowLayout = container.classList.contains('layout-row');
      const containerRect = container.getBoundingClientRect();

      if (isRowLayout) {
        // Modo filas: ajustar alto de los paneles
        const newHeight = e.clientY - containerRect.top;
        const containerHeight = containerRect.height;
        const percentage = (newHeight / containerHeight) * 100;
        // Limitar entre 20% y 80%
        if (percentage >= 20 && percentage <= 80) {
          editorPane.style.flex = `0 0 ${percentage}%`;
          previewPane.style.flex = `0 0 ${100 - percentage}%`;
          if (typeof debouncedSendHeight === 'function') debouncedSendHeight();
        }
      } else {
        // Modo columnas: ajustar ancho de los paneles
        const newWidth = e.clientX - containerRect.left;
        const containerWidth = containerRect.width;
        const percentage = (newWidth / containerWidth) * 100;
        // Limitar entre 20% y 80%
        if (percentage >= 20 && percentage <= 80) {
          editorPane.style.flex = `0 0 ${percentage}%`;
          previewPane.style.flex = `0 0 ${100 - percentage}%`;
          if (typeof debouncedSendHeight === 'function') debouncedSendHeight();
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (typeof debouncedSendHeight === 'function') debouncedSendHeight();
      }
    });

    // --- Embed iframe helpers: enviar altura al padre y recibir comandos ---
    function debounce(fn, wait = 120) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
      };
    }

    function sendHeightToParent() {
      try {
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage({ type: 'mdpreviewer-height', height }, '*');
      } catch (e) {
        // ignore
      }
    }

    const debouncedSendHeight = debounce(sendHeightToParent, 120);

    // Observe changes in preview to notify parent when content size changes
    try {
      const mo = new MutationObserver(debouncedSendHeight);
      mo.observe(preview, { childList: true, subtree: true, characterData: true });
    } catch (e) {
      // ignore if MutationObserver not available
    }

    // Also send height on load and when input changes
    window.addEventListener('load', debouncedSendHeight);
    input.addEventListener('input', debouncedSendHeight);

    // Allow parent frames to request layout changes or query height
    window.addEventListener('message', (ev) => {
      const data = ev.data || {};
      if (data && data.type === 'mdpreviewer-set-layout') {
        if (data.layout === 'row') container.classList.add('layout-row');
        else container.classList.remove('layout-row');
        setLayoutIcon(container.classList.contains('layout-row'));
        debouncedSendHeight();
      }
      if (data && data.type === 'mdpreviewer-get-height') {
        sendHeightToParent();
      }
    });