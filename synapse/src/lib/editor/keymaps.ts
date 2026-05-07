import { keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";

export function createKeymapExtensions(onSave: () => void) {
  return [
    history(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      {
        key: "Mod-s",
        run: () => {
          onSave();
          return true;
        },
      },
    ]),
  ];
}
