
# CLA-MDPreviewer

Lightweight Markdown live previewer styled for blogs. This repo is deployed at: https://md.claangel.site

## Features
- Live Markdown rendering (using `marked`)
- Editor and preview panes with resizable divider (supports both side-by-side and stacked layouts)
- Synchronized scrolling between editor and preview
- Accessible controls (ARIA, keyboard focus) and responsive layout
- iframe-friendly: sends content height to parent via `postMessage` and accepts layout commands

## Live site
The app is already deployed at:

```
https://md.claangel.site/
```

You can embed that URL directly in other sites via an `<iframe>` (see embedding notes below).

## Quick start (local)
If you want to run locally for development:

```bash
npx http-server . -c-1 -p 8080
# then open http://localhost:8080/
```

## Embedding (iframe)
The previewer posts its height to the parent window as `{ type: 'mdpreviewer-height', height }` and listens for two message types from the parent:

- `mdpreviewer-get-height` — parent can request current height
- `mdpreviewer-set-layout` — set layout to `{ layout: 'row'|'col' }`

Parent example using the live deployment:

```html
<iframe id="mdFrame" src="https://md.claangel.site/" title="Markdown preview" style="width:100%;height:400px;border:0;" loading="lazy"></iframe>
<script>
	const iframe = document.getElementById('mdFrame');
	window.addEventListener('message', (ev) => {
		const data = ev.data || {};
		// In production, validate ev.origin === 'https://md.claangel.site' or your expected origin
		if (data.type === 'mdpreviewer-height') {
			iframe.style.height = data.height + 'px';
		}
	});
	iframe.addEventListener('load', () => {
		// ask for initial height
		iframe.contentWindow.postMessage({ type: 'mdpreviewer-get-height' }, '*');
	});
	// to change layout from parent:
	// iframe.contentWindow.postMessage({ type: 'mdpreviewer-set-layout', layout: 'row' }, '*');
</script>
```

## Server / Security notes
- The hosting server must NOT send `X-Frame-Options: DENY` or `SAMEORIGIN` if you expect cross-origin embedding.
- Prefer restricting framing with a CSP header instead of allowing all origins. Example (nginx):

```nginx
add_header Content-Security-Policy "frame-ancestors 'self' https://your-trusted-site.com";
```

- If you control both parent and iframe, consider validating `event.origin` in the parent before applying height changes.
- Avoid using permissive `frame-ancestors *` in production.

## Accessibility & SEO
- The app includes ARIA attributes and keyboard-focusable resizer.
- Basic SEO meta tags and OpenGraph are included in `index.html`.

## Customization
- Styles are in `styles.css`.
- Main logic in `script.js` (layout toggle, sync scroll, resize behavior, iframe messaging).

## Troubleshooting
- If the iframe height does not update, make sure your parent page is listening for `message` events and that `ev.origin` matches the deployed origin.
- If embedding fails, check response headers from the server for `X-Frame-Options` and `Content-Security-Policy`.

## License
MIT / Personal project — adapt as needed.

