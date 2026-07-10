import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts({
  onSearch,
  onCreate,
  onEdit,
  onDelete,
}: {
  onSearch?: () => void;
  onCreate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check shortcuts that use Cmd/Ctrl
      if (e.shiftKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "k":
            if (onSearch) {
              e.preventDefault();
              onSearch();
            }
            break;
          case "n":
            if (onCreate) {
              e.preventDefault();
              onCreate();
            }
            break;
          case "e":
            if (onEdit) {
              e.preventDefault();
              onEdit();
            }
            break;
        }
        
      } else {
        // Ignore Delete/Backspace if typing in an input or textarea
        if (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement ||
          (document.activeElement as HTMLElement).isContentEditable
        ) {
          return;
        }
        
        if ((e.key === "Delete" || e.key === "Backspace") && onDelete) {
          e.preventDefault();
          onDelete();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSearch, onCreate, onEdit, onDelete]);
}
