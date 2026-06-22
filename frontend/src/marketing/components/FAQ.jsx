import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/ui/Icon.jsx';
import { FAQS } from '../content.js';
import Reveal from './Reveal.jsx';

function Item({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-ink-200/70 dark:border-ink-800">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-ink-900 dark:text-white">{q}</span>
        <span className={`shrink-0 text-ink-400 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
          <Icon name="plus" className="h-5 w-5" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-8 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ({ heading = 'Frequently asked questions', subheading = 'Everything you need to know about the product and billing.' }) {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">{heading}</h2>
        <p className="mt-3 text-ink-500 dark:text-ink-400">{subheading}</p>
      </Reveal>
      <Reveal>
        <div>
          {FAQS.map((f, i) => (
            <Item key={f.q} q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
