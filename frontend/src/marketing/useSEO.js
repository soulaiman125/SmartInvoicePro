import { useEffect } from 'react';

// Lightweight SEO: sets the document title + meta description per page without
// pulling in a helmet dependency. Restores the base title on unmount.
export function useSEO(title, description) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = `${title} · SmartInvoice Pro`;

    let meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute('content');
    if (description) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    window.scrollTo(0, 0);

    return () => {
      document.title = prevTitle;
      if (description && meta && prevDesc != null) meta.setAttribute('content', prevDesc);
    };
  }, [title, description]);
}
