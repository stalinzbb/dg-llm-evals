import { CloseIcon } from "@/components/icons";

import styles from "@/components/drawer-shell.module.css";

export default function DrawerShell({
  ariaLabel,
  children,
  helperText,
  onClose,
  panelClassName = "",
  title,
}) {
  const panelClasses = [styles.drawer, panelClassName].filter(Boolean).join(" ");

  return (
    <>
      <button aria-label={ariaLabel} className={styles.backdrop} onClick={onClose} type="button" />
      <aside className={panelClasses}>
        <div className={styles.header}>
          <div>
            <h3>{title}</h3>
            {helperText ? <div className="field-help">{helperText}</div> : null}
          </div>
          <button
            aria-label={ariaLabel}
            className={`ghost-button ${styles.iconButton}`}
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </aside>
    </>
  );
}
