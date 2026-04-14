import { TrashIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DrawerShell from "@/components/drawer-shell";

function LibraryListItem({ isDefault, item, onDelete, onSelect, type }) {
  const label = type === "case" ? item.name : item.name || "Untitled recipe";

  return (
    <li className="flex items-start gap-2 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50">
      <button className="flex-1 text-left" onClick={() => onSelect(item)} type="button">
        <div className="mb-1 flex items-center gap-2">
          <strong className="text-sm font-medium">{label}</strong>
          {isDefault ? (
            <Badge className="text-[0.65rem]" variant="secondary">
              Default
            </Badge>
          ) : null}
        </div>
        {type === "case" ? (
          <>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {item.organizationType ? <span>{item.organizationType}</span> : null}
              {item.teamActivity ? <span>{item.teamActivity}</span> : null}
              {item.teamAffiliation ? <span>{item.teamAffiliation}</span> : null}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {item.causeTags.join(", ")} · {item.messageLength}
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">
            {item.messageLengthInstruction || "No message length instruction"}
          </div>
        )}
      </button>
      {!isDefault ? (
        <Button
          aria-label={`Delete ${label}`}
          onClick={() => onDelete(item.id)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <TrashIcon />
        </Button>
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
        <ul className="grid gap-2">
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
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyState}</p>
      )}
    </DrawerShell>
  );
}
