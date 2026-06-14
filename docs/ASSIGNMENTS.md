# Assignments

Assignments are the trigger for content generation and the main class-wide activity object.

## What an Assignment Is

An assignment is what the teacher gives to the whole class.

It answers two questions:

- what activity should students do?
- what content should be generated or shown for that activity?

Examples:

- watch this video
- play with this simulation
- inspect this 3D model
- take this quiz
- explain it to AI
- predict it
- spot it in the real world
- connect it to another idea

## Why Assignments Exist

Assignments are the product's delivery layer.

They are the moment when curriculum turns into student-facing work.

This is where content generation is triggered, so the backend only does expensive work when a teacher actually needs the activity.

## Current Rules

- Assignments are class-wide.
- The teacher picks one activity type.
- The assignment is attached to one chapter.
- The backend queues any generation needed for that assignment type.
- Generation happens asynchronously.

## Assignment Types

Current placeholder types:

- `video`
- `simulation`
- `model`
- `quiz`
- `explain_ai`
- `predict_ai`
- `spot_it`
- `connect_it`

## Endpoint: `POST /teachers/classes/{class_id}/assignments`

### What it does

Creates an assignment for the whole class and queues generation jobs for the matching chapter assets.

### Why it exists

This is the main action the teacher takes after curriculum and chapters are ready.

Instead of generating everything up front, the system waits until the teacher launches the activity.

### How to use it

Request example:

```json
{
  "chapter_id": "chapter-123",
  "assignment_type": "video",
  "title": "Watch the electricity explainer",
  "instructions": "Watch the video and be ready to discuss current and resistance."
}
```

### Response example

```json
{
  "assignment_id": "...",
  "class_id": "...",
  "chapter_id": "chapter-123",
  "assignment_type": "video",
  "title": "Watch the electricity explainer",
  "instructions": "Watch the video and be ready to discuss current and resistance.",
  "content_json": {
    "placeholder": true,
    "assignment_type": "video",
    "activity": "video",
    "chapter_id": "chapter-123",
    "chapter_title": "Electricity and Circuits"
  },
  "status": "queued",
  "recipients": [
    { "student_id": "..." }
  ],
  "jobs": [
    {
      "job_id": "...",
      "asset_id": "...",
      "asset_type": "concept_video",
      "provider": "manim",
      "integration_target": "manim_generator",
      "status": "queued"
    }
  ]
}
```

### What happens behind the scenes

1. The backend validates that the user is the teacher for the class.
2. The backend validates that the chapter belongs to the class.
3. The assignment is created with `assignment_type` and placeholder `content_json`.
4. The assignment is attached to the whole class.
5. The matching chapter asset jobs are queued.
6. The worker processes those jobs asynchronously.

## Generation Flow

### Video

- uses the Manim service
- updates the chapter asset with generated video metadata

### 3D model

- uses in-process model-finder logic copied from bloop-core
- queries Sketchfab
- ranks candidates with Azure OpenAI
- stores the selected embed/view metadata on the chapter asset

### Simulation, quiz, and AI interactions

- currently remain placeholder-driven
- the assignment stores the intent in `content_json`
- future generators can fill in the same contract later

## Statuses

Assignments and jobs both use status values.

### Assignment status

- `queued`
- `processing`
- `ready`
- `failed`

### Job status

- `queued`
- `processing`
- `ready`
- `failed`

## Related Endpoints

- `GET /teachers/classes/{class_id}/assignments`
- `GET /teachers/classes/{class_id}/assignments/{assignment_id}`

## `GET /teachers/classes/{class_id}/assignments`

Use it for the teacher assignment list.

It returns:

- assignment id
- chapter id
- assignment type
- title
- status
- recipient count
- job count

## `GET /teachers/classes/{class_id}/assignments/{assignment_id}`

Use it for assignment detail.

It returns:

- assignment metadata
- class recipient list
- queued and finished jobs
- generation result metadata

## Product Mental Model

- chapters organize content
- assignments launch activity
- jobs generate the expensive assets only when needed
