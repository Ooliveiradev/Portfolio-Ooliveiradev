import React from 'react';
import { motion } from 'motion/react';
import { useNarrativeMotion } from './useNarrativeMotion';

interface Milestone {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

/** Preserve editorial chronology (including overlapping roles); never parse localized dates. */
export function NarrativeTimeline({ items, label, lowPower }: { items: Milestone[]; label: string; lowPower?: boolean }) {
  const { simple } = useNarrativeMotion(lowPower);
  return <ol className="narrative-timeline" aria-label={label}>
    {items.map(item => <motion.li key={item.id}
      initial={simple ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }} animate={simple ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <span className="narrative-milestone-dot" aria-hidden="true" />
      <p className="narrative-milestone-date">{item.date}</p>
      <h3>{item.title}</h3><p className="narrative-milestone-subtitle">{item.subtitle}</p>
      {item.content}
    </motion.li>)}
  </ol>;
}
