# Curriculum Manual Flow

This document explains the current curriculum implementation and how it will transition to AI generation later.

## What Curriculum Means in Mootion

Curriculum is the roadmap for the class.

It is not a flat list of chapters. It is a tree with:

- a root module
- nested units
- topics and subtopics
- a flattened graph view for rendering and validation

The product keeps this shape stable so future AI generation can populate the same structure instead of inventing a separate one.

## Current State

- Curriculum creation is manual-first.
- Teachers can create the roadmap from scratch.
- Teachers can patch the tree.
- Every patch creates a new snapshot version.
- NCERT bootstrap is the fast path for preset roadmaps.

## Stored Data

### `curriculum_plans`

This is the canonical current curriculum for a class.

It stores:

- current version
- title
- source type
- source text or source subject, when applicable
- the full roadmap tree
- status

### `curriculum_snapshots`

This stores immutable copies after each save.

Why it matters:

- teachers can edit repeatedly without losing history
- the backend can reason about version conflicts
- future AI-generated curricula can still be audited

## Endpoint Families

### Create curriculum

- `POST /teachers/classes/{class_id}/curriculum`

Use this when the teacher wants to create a manual roadmap from scratch.

### Bootstrap NCERT curriculum

- `POST /teachers/classes/{class_id}/curriculum/bootstrap`

Use this when the teacher wants the backend to generate a preset roadmap for a supported grade and subject.

### List curricula

- `GET /teachers/classes/{class_id}/curriculum`

### Get one curriculum

- `GET /teachers/classes/{class_id}/curriculum/{curriculum_id}`

### Replace curriculum metadata/tree

- `PUT /teachers/classes/{class_id}/curriculum/{curriculum_id}`

### Patch curriculum tree

- `PATCH /teachers/classes/{class_id}/curriculum/{curriculum_id}`

## Manual Curriculum Creation

Use manual creation when the teacher already knows the structure they want.

Request shape:

```json
{
  "title": "Electricity and Circuits",
  "curriculum_data": {
    "version": "1.0",
    "title": "Electricity and Circuits",
    "subject": "Physics",
    "grade": "8",
    "source_type": "manual",
    "source_text": null,
    "source_subject": null,
    "document_id": null,
    "root": {
      "id": "root",
      "title": "Electricity and Circuits",
      "kind": "module",
      "order": 0,
      "metadata": {},
      "children": []
    },
    "nodes": [],
    "edges": []
  },
  "status": "draft"
}
```

## NCERT Bootstrap

### What it is

NCERT bootstrap is a preset roadmap generator.

It exists so teachers can start with a sensible curriculum instead of building the tree from zero.

### When to use it

- the teacher wants a ready-made roadmap
- the class matches a supported grade and subject
- the team wants to move quickly during onboarding

### Supported grades

- 6
- 7
- 8
- 9
- 10
- 11
- 12

### Supported subjects

- Physics
- Mathematics
- Chemistry
- Biology
- Computer Science

### How to use it

Send an empty POST request to:

```text
POST /teachers/classes/{class_id}/curriculum/bootstrap
```

No body is required.

### What happens

1. The backend checks teacher access to the class.
2. The backend reads the class grade and subject.
3. The backend builds a preset tree for that combination.
4. The curriculum is saved as `source_type = "ncert"`.
5. A snapshot is written.

### Why it exists

- it is the fastest way to seed a class roadmap
- it preserves the same tree shape as manual creation
- it keeps the AI future path simple because the output shape is already stable

## How the Structure Works

- `root` is the canonical tree.
- `nodes` is the flattened node list.
- `edges` is the flattened relationship list.
- `kind` is one of `module`, `unit`, `topic`, `subtopic`, or `lesson`.
- `source_type` indicates whether the curriculum started as manual, ncert, syllabus, document, or subject.

## Future AI Flow

Later, AI generation should produce the same shape from:

- syllabus text
- uploaded document
- subject name
- NCERT preset

The AI layer should fill the same structure, not create a different model.
