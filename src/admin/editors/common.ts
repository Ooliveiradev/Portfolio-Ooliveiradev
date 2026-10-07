import type { PortfolioDocument } from '../../content/model';
import { newId } from '../../content/model';
import type { IslandId } from '../../types';
import type { Lang, ListOps } from '../ui';

/** Edits are written as recipes that mutate a private copy, so editors never touch shared state. */
export type Update = (recipe: (draft: PortfolioDocument) => void) => void;

export interface EditorProps {
  doc: PortfolioDocument;
  update: Update;
  lang: Lang;
  onPreviewIsland: (id: IslandId) => void;
}

interface OpsOptions<T> {
  select: (draft: PortfolioDocument) => T[];
  make?: () => T;
  /** Deep copy with fresh ids; enables the duplicate button. */
  clone?: (item: T) => T;
  visibility?: boolean;
  /** Refuses to hide the last visible item (the world needs at least one island). */
  keepOneVisible?: boolean;
  max?: number;
}

export function listOps<T extends { id: string }>(update: Update, options: OpsOptions<T>): ListOps {
  const { select, make, clone, visibility, keepOneVisible, max = 60 } = options;
  return {
    move: (index, direction) => update(draft => {
      const items = select(draft);
      const target = index + direction;
      if (target < 0 || target >= items.length) return;
      items.splice(target, 0, items.splice(index, 1)[0]);
    }),
    remove: index => update(draft => { select(draft).splice(index, 1); }),
    duplicate: clone ? index => update(draft => {
      const items = select(draft);
      if (items.length >= max) return;
      items.splice(index + 1, 0, clone(items[index]));
    }) : undefined,
    toggleVisible: visibility ? index => update(draft => {
      const items = select(draft) as (T & { visible: boolean })[];
      const item = items[index];
      if (item.visible && keepOneVisible && items.filter(other => other.visible).length <= 1) return;
      item.visible = !item.visible;
    }) : undefined,
    add: make ? () => update(draft => {
      const items = select(draft);
      if (items.length < max) items.push(make());
    }) : undefined,
  };
}

/** Copies an item and gives it (and anything with an id inside it) new identifiers. */
export function cloneWithNewIds<T>(item: T, prefix: string): T {
  const copy = structuredClone(item);
  const refresh = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(refresh);
    else if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (typeof record.id === 'string') record.id = newId(prefix);
      Object.values(record).forEach(refresh);
    }
  };
  refresh(copy);
  return copy;
}
