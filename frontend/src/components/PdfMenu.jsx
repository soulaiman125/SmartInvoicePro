import { useState, useRef, useEffect } from 'react';
import Button from './ui/Button.jsx';
import Icon from './ui/Icon.jsx';
import { downloadFile } from '../utils/download.js';
import { useToast } from '../context/ToastContext.jsx';

const TEMPLATES = [
  { id: 'modern', label: 'Modern', hint: 'Branded colour header' },
  { id: 'classic', label: 'Classic', hint: 'Traditional, monochrome' },
];

// Download button with a template picker. `basePath` is the API collection
// (e.g. "invoices" or "quotations"); the file is fetched from
// `/{basePath}/{id}/pdf?template={template}`.
export default function PdfMenu({ basePath, id, number, kind = 'document' }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const toast = useToast();

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const download = async (template) => {
    setOpen(false);
    setBusy(true);
    try {
      const name = `${kind}-${number || id}${template === 'classic' ? '-classic' : ''}.pdf`;
      await downloadFile(`/${basePath}/${id}/pdf?template=${template}`, name);
    } catch {
      toast.error('Could not generate the PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <Button variant="secondary" size="sm" loading={busy} onClick={() => setOpen((v) => !v)}>
        <Icon name="download" className="h-4 w-4" /> PDF
        <Icon name="chevron" className="h-3.5 w-3.5 rotate-90 opacity-60" />
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-ink-200/80 bg-white shadow-popover dark:border-ink-700 dark:bg-ink-900">
          <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">PDF template</p>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => download(t.id)}
              className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/60"
            >
              <Icon name="download" className="mt-0.5 h-4 w-4 text-brand-500" />
              <span>
                <span className="block text-sm font-medium text-ink-800 dark:text-ink-100">{t.label}</span>
                <span className="block text-xs text-ink-400">{t.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
