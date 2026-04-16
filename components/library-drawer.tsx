import { TrashIcon } from "@/components/icons";
import DrawerShell from "@/components/drawer-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PromptTemplate, TestCase } from "@/lib/types/domain";

type LibraryDrawerCaseProps = {
  emptyState: string;
  helperText: string;
  items: TestCase[];
  onClose: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onSelect: (item: TestCase) => void;
  title: string;
  type: "case";
};

type LibraryDrawerPromptProps = {
  emptyState: string;
  helperText: string;
  items: PromptTemplate[];
  onClose: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onSelect: (item: PromptTemplate) => void;
  title: string;
  type: "prompt";
};

type LibraryDrawerProps = LibraryDrawerCaseProps | LibraryDrawerPromptProps;

function LibraryListItem({
  isDefault,
  item,
  onDelete,
  onSelect,
  type,
}: {
  isDefault: boolean;
  item: PromptTemplate | TestCase;
  onDelete: (id: string) => void | Promise<void>;
  onSelect: (item: PromptTemplate | TestCase) => void;
  type: LibraryDrawerProps["type"];
}) {
  const label = item.name || (type === "prompt" ? "Untitled recipe" : "");

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
              {(item as TestCase).organizationType ? (
                <span>{(item as TestCase).organizationType}</span>
              ) : null}
              {(item as TestCase).teamActivity ? <span>{(item as TestCase).teamActivity}</span> : null}
              {(item as TestCase).teamAffiliation ? (
                <span>{(item as TestCase).teamAffiliation}</span>
              ) : null}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {(item as TestCase).causeTags.join(", ")} · {(item as TestCase).messageLength}
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">
            {(item as PromptTemplate).messageLengthInstruction || "No message length instruction"}
          </div>
        )}
      </button>
      {!isDefault && item.id ? (
        <Button
          aria-label={`Delete ${label}`}
          onClick={() => onDelete(item.id as string)}
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

export default function LibraryDrawer(props: LibraryDrawerProps) {
  const { emptyState, helperText, items, onClose, onDelete, title, type } = props;

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
              key={item.id ?? `${type}-${index}`}
              onDelete={onDelete}
              onSelect={props.onSelect as (item: PromptTemplate | TestCase) => void}
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
