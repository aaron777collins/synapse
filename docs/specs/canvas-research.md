# Obsidian Canvas - Exhaustive Research

## 1. Core Concept and Purpose

Obsidian Canvas is a core plugin (enabled by default) that provides an infinite spatial workspace for visual thinking. It allows users to lay out notes, images, PDFs, videos, audio, and web pages on a boundless 2D surface and connect them with directional arrows. Canvas files use the `.canvas` extension and are stored as JSON using the open **JSON Canvas** spec (v1.0, published 2024-03-11, MIT license).

Use cases: mind mapping, flowcharts, project planning, brainstorming, research boards, diagramming, Kanban-style boards, and any spatial/non-linear organization of knowledge.

Canvas does NOT enforce any particular workflow - it is a freeform infinite whiteboard.

---

## 2. The .canvas File Format (JSON Canvas Spec 1.0)

### Top-Level Structure

```json
{
  "nodes": [],
  "edges": []
}
```

Both arrays are **optional**. If present, nodes are stored in **ascending z-index order** (first node = bottom layer, last node = top layer).

### Complete Sample File

```json
{
  "nodes": [
    {
      "id": "754a8ef995f366bc",
      "type": "group",
      "x": -300,
      "y": -460,
      "width": 610,
      "height": 200,
      "label": "JSON Canvas"
    },
    {
      "id": "8132d4d894c80022",
      "type": "file",
      "file": "readme.md",
      "x": -280,
      "y": -200,
      "width": 570,
      "height": 560,
      "color": "6"
    },
    {
      "id": "7efdbbe0c4742315",
      "type": "file",
      "file": "_site/logo.svg",
      "x": -280,
      "y": -440,
      "width": 217,
      "height": 80
    },
    {
      "id": "59e896bc8da20699",
      "type": "text",
      "text": "Learn more:\n\n- [Apps](/docs/apps.md)\n- [Spec](spec/1.0.md)\n- [Github](https://github.com/obsidianmd/jsoncanvas)",
      "x": 40,
      "y": -440,
      "width": 250,
      "height": 160
    },
    {
      "id": "0ba565e7f30e0652",
      "type": "file",
      "file": "spec/1.0.md",
      "x": 360,
      "y": -400,
      "width": 400,
      "height": 400
    }
  ],
  "edges": [
    {
      "id": "6fa11ab87f90b8af",
      "fromNode": "7efdbbe0c4742315",
      "fromSide": "right",
      "toNode": "59e896bc8da20699",
      "toSide": "left"
    }
  ]
}
```

---

## 3. Node Types and Properties

### Base Properties (ALL node types)

| Property | Type    | Required | Description |
|----------|---------|----------|-------------|
| `id`     | string  | Yes      | Unique identifier. Conventionally 16-character lowercase hex (e.g., `"6f0ad84f44ce9c17"`). |
| `type`   | string  | Yes      | One of: `"text"`, `"file"`, `"link"`, `"group"` |
| `x`      | integer | Yes      | Horizontal position in pixels (top-left corner). Negative values allowed. |
| `y`      | integer | Yes      | Vertical position in pixels (top-left corner). Negative values allowed. |
| `width`  | integer | Yes      | Width in pixels |
| `height` | integer | Yes      | Height in pixels |
| `color`  | canvasColor | No  | See Color System section |

### Text Nodes (`type: "text"`)

| Property | Type   | Required | Description |
|----------|--------|----------|-------------|
| `text`   | string | Yes      | Plain text with Markdown syntax. Use `\n` for line breaks in JSON. |

- Text cards support full Obsidian Flavored Markdown: links, code blocks, formatting, etc.
- Text is stored directly in the .canvas file (NOT as a separate note file).
- Text cards do NOT appear in backlinks, do NOT support Properties/frontmatter.
- Can be converted to a vault note via right-click > "Convert to file..."

### File Nodes (`type: "file"`)

| Property  | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `file`    | string | Yes      | Path to file within vault |
| `subpath` | string | No       | Heading or block reference, starts with `#` (e.g., `"#heading-name"` or `"#^block-id"`) |

- Can reference: notes (.md), images, PDFs, videos, audio files, SVGs, other attachments.
- Embedded notes can be edited directly within the canvas.
- Supports "Swap file" to replace with another file of the same type.

### Link Nodes (`type: "link"`)

| Property | Type   | Required | Description |
|----------|--------|----------|-------------|
| `url`    | string | Yes      | External URL |

- Renders as an embedded iframe of the web page.
- Open in browser via Ctrl+click (Cmd+click on macOS) or right-click > "Open in browser".

### Group Nodes (`type: "group"`)

| Property          | Type   | Required | Description |
|-------------------|--------|----------|-------------|
| `label`           | string | No       | Text label displayed at the top of the group |
| `background`      | string | No       | Path to background image file |
| `backgroundStyle` | string | No       | One of: `"cover"`, `"ratio"`, `"repeat"` |

- Groups are visual containers for other nodes.
- **Membership is spatial**: any node fully within the group's bounding box is a member.
- Moving a card into a group makes it a member; moving it out removes membership.
- Dragging a group by its header/border moves ALL contained nodes.
- Dragging inside a group area does NOT move the group (only the cards within).
- Groups can be colored like regular cards.
- Double-click the group label area to rename it.
- Deleting a group deletes only the container, NOT the nodes inside.

---

## 4. Edges (Connections)

### Edge Properties

| Property   | Type        | Required | Default    | Description |
|------------|-------------|----------|------------|-------------|
| `id`       | string      | Yes      | -          | Unique identifier |
| `fromNode` | string      | Yes      | -          | Source node ID |
| `toNode`   | string      | Yes      | -          | Target node ID |
| `fromSide` | string      | No       | auto       | `"top"`, `"right"`, `"bottom"`, `"left"` |
| `toSide`   | string      | No       | auto       | `"top"`, `"right"`, `"bottom"`, `"left"` |
| `fromEnd`  | string      | No       | `"none"`   | `"none"` or `"arrow"` |
| `toEnd`    | string      | No       | `"arrow"`  | `"none"` or `"arrow"` |
| `color`    | canvasColor | No       | -          | Line color |
| `label`    | string      | No       | -          | Text label on the edge |

### Connection Side Calculation

When `fromSide` or `toSide` is omitted, the application auto-calculates the optimal connection point based on relative node positions. The anchor point for each side is at the **midpoint** of that edge:

- **Right**: `x = node.x + node.width`, `y = node.y + node.height/2`
- **Bottom**: `x = node.x + node.width/2`, `y = node.y + node.height`
- **Left**: `x = node.x`, `y = node.y + node.height/2`
- **Top**: `x = node.x + node.width/2`, `y = node.y`

### Edge Rendering

- Connections are rendered as **SVG `<path>` elements** with curved (bezier) paths by default.
- CSS selector: `.canvas .canvas-connection path`
- Arrow markers are rendered as SVG marker definitions.
- The default rendering uses curved/bezier paths, NOT straight lines.

### Arrow Direction Types

| Configuration | fromEnd | toEnd | Visual |
|---------------|---------|-------|--------|
| Unidirectional (default) | `"none"` | `"arrow"` | `A -----> B` |
| Bidirectional | `"arrow"` | `"arrow"` | `A <----> B` |
| Nondirectional | `"none"` | `"none"` | `A ——————— B` |

---

## 5. Color System

### canvasColor Type

Colors are stored as strings and support two formats:

1. **Hex format**: Standard hexadecimal, e.g., `"#FF0000"`
2. **Preset numbers**: String digits `"1"` through `"6"`

### Preset Color Mapping

| Preset | Color Name | CSS Variable | Light Mode Hex | Light Mode RGB | Dark Mode Hex | Dark Mode RGB |
|--------|-----------|--------------|----------------|----------------|---------------|---------------|
| `"1"`  | Red       | `--canvas-color-1` → `--color-red` | `#e93147` | `233, 49, 71` | `#fb464c` | `251, 70, 76` |
| `"2"`  | Orange    | `--canvas-color-2` → `--color-orange` | `#ec7500` | `236, 117, 0` | `#e9973f` | `233, 151, 63` |
| `"3"`  | Yellow    | `--canvas-color-3` → `--color-yellow` | `#e0ac00` | `224, 172, 0` | `#e0de71` | `224, 222, 113` |
| `"4"`  | Green     | `--canvas-color-4` → `--color-green` | `#08b94e` | `8, 185, 78` | `#44cf6e` | `68, 207, 110` |
| `"5"`  | Cyan      | `--canvas-color-5` → `--color-cyan` | `#00bfbc` | `0, 191, 188` | `#53dfdd` | `83, 223, 221` |
| `"6"`  | Purple    | `--canvas-color-6` → `--color-purple` | `#7852ee` | `120, 82, 238` | `#a882ff` | `168, 130, 255` |

**Note**: One CSS snippet maps color-5 to `--color-blue` instead of `--color-cyan`. The official spec says "cyan" but Obsidian internally may use `--color-blue` for preset 5 in some contexts. Both `--color-cyan` and `--color-blue` exist as separate variables.

### CSS Variable Format

Canvas color variables use RGB triplets (NOT hex): `--canvas-color-1: 233, 49, 71;`

The CSS class applied to colored nodes: `.mod-canvas-color-1` through `.mod-canvas-color-6`, and nodes with color get the `.is-themed` class.

### CSS Variables for Canvas

| Variable | Description |
|----------|-------------|
| `--canvas-background` | Canvas background color |
| `--canvas-card-label-color` | Card label text color |
| `--canvas-dot-pattern` | Dot pattern color |
| `--canvas-color-1` through `--canvas-color-6` | Card/edge color presets |

---

## 6. UI/UX Details

### Canvas Background

- Infinite 2D space with a **dot grid pattern** rendered as SVG (`.canvas-background`).
- The dot pattern provides visual orientation for spatial positioning.
- Background color is controlled by `--canvas-background` CSS variable.

### Toolbar Layout

**Top-right control bar:**
- Zoom in / Zoom out buttons
- Zoom to fit button
- Reset zoom button
- Undo / Redo buttons (unique to canvas)
- Read-only toggle / settings menu

**Bottom-center card creation bar (3 buttons):**
1. Blank file icon - drag to create empty text card
2. Document icon - drag to add note from vault
3. Image icon - drag to add media from vault

**Selection popup (floating toolbar above selected items):**
- Delete / trash icon
- Set color (color palette picker)
- Zoom to selection
- Edit label (for edges)
- Create group (when multiple items selected)

### Read-Only Mode

- Toggleable from the settings menu in the top right.
- Prevents modification of canvas content.
- Known limitation: card/note/media creation toolbar buttons may still appear.

---

## 7. Interaction Model

### Creating Nodes

| Method | Action |
|--------|--------|
| Double-click empty canvas | Creates new text card at click position |
| Drag bottom toolbar icons | Creates card where dropped |
| Right-click canvas > "Add note from vault" | Opens search, creates note card |
| Right-click canvas > "Add media from vault" | Opens file picker, creates media card |
| Right-click canvas > "Add web page" | Enter URL, creates link card |
| Drag file from File Explorer | Creates file card |
| Drag folder from File Explorer | Creates cards for all files in folder |
| Drag URL from browser | Creates link card |
| Paste URL | Creates link card |
| Drag connection to empty space | Opens menu to create new card or add note from vault, automatically connected |

### Selecting Nodes

| Method | Action |
|--------|--------|
| Click | Select single card |
| Shift+click | Add/remove from selection |
| Drag on empty space | Box/rectangle selection |
| Ctrl+A (Cmd+A) | Select all items |

### Moving Nodes

| Method | Action |
|--------|--------|
| Click and drag | Move selected card(s) |
| Shift+drag | Constrain movement to one axis (horizontal or vertical) |
| Alt+drag (Option+drag) | Duplicate card and move the copy |

### Resizing Nodes

- Drag any **edge or corner** handle of a card.
- **Shift+drag** while resizing to maintain aspect ratio.
- **Space** while resizing disables grid snapping.
- Snapping is **enabled by default** - cards snap to grid alignment and to other card edges/centers.

### Editing Cards

| Action | Result |
|--------|--------|
| Double-click text/note card | Enter edit mode |
| Click outside card | Exit edit mode |
| Press Escape | Exit edit mode |
| Single click (some contexts) | May enter edit mode on embedded notes |

When a card is in edit mode, the canvas drag/scroll is disabled within the card area. The card content becomes interactive (scrollable, editable).

### Creating Connections

1. Hover over any card edge - a **filled circle dot** appears at the midpoint.
2. Click and drag from the dot to another card's edge.
3. Release on the target card to create the connection.
4. Default: unidirectional arrow (from source to target).
5. Dragging to **empty space** opens a menu: create new card or add note, auto-connected.

### Editing Connections

| Action | Result |
|--------|--------|
| Click on a connection line | Select it |
| Double-click connection line | Add/edit label |
| Right-click connection > Edit label | Add/edit label |
| Right-click connection > Remove | Delete connection |
| Right-click connection > toggle direction | Cycle: unidirectional / bidirectional / nondirectional |
| Right-click > "Go to target" | Pan to the target node |
| Right-click > "Go to source" | Pan to the source node |
| Drag endpoint circle away from card | Disconnect that end |
| Drag endpoint circle to another card | Reconnect to different card |

### Panning (Canvas Movement)

| Method | Action |
|--------|--------|
| Space + left-click drag | Pan canvas |
| Middle mouse button drag | Pan canvas |
| Right-click drag | Pan canvas |
| Mouse wheel | Scroll vertically |
| Shift + mouse wheel | Scroll horizontally |

### Zooming

| Method | Action |
|--------|--------|
| Ctrl + scroll wheel | Zoom in/out |
| Space + scroll wheel | Zoom in/out |
| Zoom toolbar buttons (top right) | Zoom in/out |
| Shift+1 | Zoom to fit (shows all items) |
| Shift+2 | Zoom to selection |
| Reset zoom button | Returns to default zoom level |

---

## 8. Context Menu (Right-Click) Options

### On empty canvas:
- Add card (text)
- Add note from vault
- Add media from vault
- Add web page
- Create group
- Paste

### On a card:
- Edit
- Delete
- Set color
- Convert to file... (text cards only)
- Swap file (file/media cards only)
- Open in browser (link cards only)
- Zoom to selection
- Create group (if multiple selected)

### On a connection:
- Edit label
- Remove
- Toggle direction (unidirectional / bidirectional / nondirectional)
- Set color
- Go to target
- Go to source

---

## 9. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+A (Cmd+A) | Select all |
| Ctrl+Z (Cmd+Z) | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Backspace / Delete | Delete selected items |
| Escape | Exit edit mode / deselect |
| Shift+1 | Zoom to fit |
| Shift+2 | Zoom to selection |
| Shift+drag | Constrain movement direction |
| Space (while dragging) | Disable snapping |
| Shift (while resizing) | Maintain aspect ratio |
| Alt+drag | Duplicate and move |
| Double-click | Create text card / enter edit mode |
| Enter (on selected card) | Enter edit mode |

---

## 10. Integration with Obsidian Vault

### Linking and Embedding

- **Wikilinks in text cards**: `[[note-name]]` links work within text card Markdown.
- **File nodes**: Reference any vault file by path, with optional subpath for headings/blocks.
- **Backlinks**: Text cards do NOT generate backlinks. File/note cards DO appear in backlinks.
- **Embedding canvas in notes**: Syntax `![[FileName.canvas]]` creates a link/preview. Currently shows outlines of nodes but not full content (limited implementation).
- **Canvas in graph view**: Canvas files appear in the graph view (with plugin support).

### Canvas File Behavior

- Canvas files are stored in the vault like any other file.
- They appear in the File Explorer.
- They can be moved, renamed, and organized like notes.
- Canvas implements `MarkdownFileInfo` interface, enabling some editor commands to work within Canvas.
- Canvas views use the standard Workspace leaf system (tabs, panes, popout windows).
- Supports deferred loading via `WorkspaceLeaf#isDeferred` (v1.7.2+).

---

## 11. Sizing Guidelines

### Recommended Node Sizes (in pixels)

| Type | Width | Height |
|------|-------|--------|
| Small text card | 200-300 | 80-150 |
| Medium text card | 300-450 | 150-300 |
| Large text card | 400-600 | 300-500 |
| File preview card | 300-500 | 200-400 |
| Link preview card | 250-400 | 100-200 |

### Layout Best Practices

- Space nodes 50-100px apart.
- Use 20-50px padding inside groups.
- Align to grid multiples (10 or 20) for cleaner layouts.
- Default new text card width: approximately 13.5 grid units (~270px).
- Default note card width: approximately 20 grid units (~400px).

---

## 12. Validation Requirements

For a valid .canvas file:
1. All IDs must be unique across all nodes and edges.
2. Edge `fromNode`/`toNode` must reference existing node IDs.
3. Required fields must be present for each node type.
4. `fromSide`/`toSide` must be one of: `"top"`, `"right"`, `"bottom"`, `"left"`.
5. `fromEnd`/`toEnd` must be one of: `"none"`, `"arrow"`.
6. `backgroundStyle` must be one of: `"cover"`, `"ratio"`, `"repeat"`.
7. Must be valid, parseable JSON.
8. The format supports arbitrary additional keys on all structures for forward compatibility.

---

## 13. Platform Notes

- **Desktop**: Fully supported on Windows, macOS, Linux.
- **Mobile**: Available in iOS/Android app stores; touch-optimized interface.
- **Export**: No built-in PDF export. Workarounds exist via developer console scripts.
- **Open format**: JSON Canvas is MIT-licensed, designed for interoperability with other apps.
