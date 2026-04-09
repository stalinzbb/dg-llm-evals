import { TrashIcon } from "@/components/icons";
import DrawerShell from "@/components/drawer-shell";

import styles from "@/components/library-drawer.module.css";

function LibraryListItem({ isDefault, item, onDelete, onSelect, type }) {
  const label = type === "case" ? item.name : item.name || "Untitled recipe";

  return (
    <li className={styles.item}>
      <button className={styles.itemMain} onClick={() => onSelect(item)} type="button">
        <div className={styles.itemHeader}>
          <strong>{label}</strong>
          {isDefault ? <span className="tag-chip tag-chip-muted">Default</span> : null}
        </div>

        {type === "case" ? (
          <>
            <div className={styles.itemMeta}>
              <span>{item.organizationType}</span>
              <span>{item.teamActivity}</span>
              <span>{item.teamAffiliation}</span>
            </div>
            <div className={styles.itemCopy}>
              {item.causeTags.join(", ")} · {item.messageLength}
            </div>
          </>
        ) : (
          <div className={styles.itemCopy}>
            {item.messageLengthInstruction || "No message length instruction"}
          </div>
        )}
      </button>

      {!isDefault ? (
        <button
          aria-label={`Delete ${label}`}
          className={styles.deleteButton}
          onClick={() => onDelete(item.id)}
          type="button"
        >
          <TrashIcon />
        </button>
      ) : null}
    </li>
  );
}

export default function LibraryDrawer({
  emptyState,
  helperText,
  items,
  onClose,
  onDelete,
  onSelect,
  title,
  type,
}) {
  return (
    <DrawerShell
      ariaLabel={`Close ${title.toLowerCase()}`}
      helperText={helperText}
      onClose={onClose}
      title={title}
    >
      {items.length ? (
        <ul className={styles.list}>
          {items.map((item, index) => (
            <LibraryListItem
              isDefault={index === 0}
              item={item}
              key={item.id}
              onDelete={onDelete}
              onSelect={onSelect}
              type={type}
            />
          ))}
        </ul>
      ) : (
        <div className="empty-state">{emptyState}</div>
      )}
    </DrawerShell>
  );
}
