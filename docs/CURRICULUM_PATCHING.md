# Curriculum Patching

This document describes the curriculum editing contract for Mootion.

The current implementation is manual-first, but the data shape is intentionally compatible with future AI generation.

## Core Model

- A curriculum belongs to one class.
- A curriculum is stored as a roadmap-style tree.
- Teachers edit the current tree in the UI.
- Each successful edit creates a new snapshot version.
- The backend keeps the canonical current tree plus versioned snapshots.

## The Stored Shape

The canonical payload contains:

- `title`
- `subject`
- `grade`
- `source_type`
- `source_text`
- `source_subject`
- `document_id`
- `root`
- `nodes`
- `edges`

### Why both tree and graph are stored

- the tree is easy to edit and reason about
- the flattened graph is easy to render and validate
- future UI components can choose whichever representation is simpler

## Versioning

- `curriculum_plans.version` stores the current version.
- Every patch increments the version.
- `curriculum_snapshots` stores the full saved tree after each patch.
- The API requires `expected_version` to prevent accidental overwrite.

If the version does not match, the backend returns `409 Conflict`.

### Why versioning exists

This protects teachers from overwriting each other's changes or losing edits due to stale UI state.

## Patch Operations

The patch endpoint supports four operations:

- `add_node`
- `update_node`
- `delete_node`
- `move_node`

### Add Node

Adds a new child node under a parent.

Use this when the teacher wants to expand a section of the roadmap.

Requirements:

- `parent_node_id` is required
- `payload.title` is required
- `payload.id` is optional, otherwise the backend generates one

Example:

```json
{
  "operation": "add_node",
  "expected_version": 1,
  "parent_node_id": "root",
  "position": 0,
  "payload": {
    "id": "unit_1",
    "title": "Electric Current",
    "kind": "unit",
    "metadata": {}
  }
}
```

### Update Node

Updates node fields in place.

Use this when the teacher wants to rename or reframe a node without changing the structure.

Allowed fields in `payload`:

- `title`
- `kind`
- `metadata`

Example:

```json
{
  "operation": "update_node",
  "expected_version": 2,
  "target_node_id": "unit_1",
  "payload": {
    "title": "Electricity Basics",
    "metadata": {
      "notes": "Teacher clarified scope"
    }
  }
}
```

### Delete Node

Deletes a node and removes it from its parent.

Use this when a topic is no longer relevant to the class roadmap.

Rules:

- root cannot be deleted

Example:

```json
{
  "operation": "delete_node",
  "expected_version": 3,
  "target_node_id": "topic_1"
}
```

### Move Node

Reorders a node within the same parent only.

Use this when the teacher wants to change sequencing without changing the tree structure.

Rules:

- `target_node_id` is required
- `parent_node_id` is required
- the node must already belong to that same parent
- cross-branch moves are rejected

Example:

```json
{
  "operation": "move_node",
  "expected_version": 4,
  "target_node_id": "topic_2",
  "parent_node_id": "unit_1",
  "position": 0
}
```

## API Endpoints

### `POST /teachers/classes/{class_id}/curriculum`

Creates a brand-new curriculum tree.

Use it when:

- the teacher wants full control over the structure
- the class does not need a preset
- the team is testing manual curriculum creation

### `POST /teachers/classes/{class_id}/curriculum/bootstrap`

Creates a preset NCERT roadmap tree for the class grade and subject.

Use it when:

- you want the fastest possible curriculum setup
- the class grade/subject pair is supported
- you want a good default tree that can still be edited later

### `GET /teachers/classes/{class_id}/curriculum`

Returns all curricula attached to a class.

### `GET /teachers/classes/{class_id}/curriculum/{curriculum_id}`

Returns one curriculum tree and the current version.

### `PUT /teachers/classes/{class_id}/curriculum/{curriculum_id}`

Replaces curriculum metadata or tree content.

Use this when the teacher is editing the curriculum directly rather than applying a small patch.

### `PATCH /teachers/classes/{class_id}/curriculum/{curriculum_id}`

Applies a tree patch and saves a new snapshot version.

Use this for interactive editing in the UI.

## Future AI Flow

Later, AI generation should produce the same structure:

- input: syllabus text, uploaded document, subject name, or NCERT preset
- output: the same `CurriculumRoadmapData` shape
- teacher edits: the same patch API

That way the AI layer is only a generator, not a separate data model.
