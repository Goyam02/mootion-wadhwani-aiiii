# NCERT Subtopics Integration

This document outlines the details of the NCERT subtopics integration, explaining the data shapes, the seed scripts, extension guidelines, and mapping caveats.

## 1. Subtopics Response Shape

Subtopics are exposed as a `subtopics` array in both the teacher and student chapter detail endpoints:
- `GET /teachers/classes/{class_id}/chapters/{chapter_id}`
- `GET /students/classes/{class_id}/chapters/{chapter_id}`

### JSON Schema
Each entry in the `subtopics` array has the following structure:

```json
{
  "subtopic_id": "string",
  "title": "string",
  "order": "integer",
  "kind": "string",
  "metadata": "object"
}
```

### Example Response
```json
{
  "chapter_id": "8693da26-6f5d-476d-82d0-f17c65024ed3",
  "class_id": "b627a378-9fd7-4f72-9871-0a05209d6492",
  "curriculum_id": "1ad3d9c1-7f91-49b8-b8cf-ec42859945cd",
  "source_node_id": "matter-in-our-surroundings",
  "sequence_number": 0,
  "title": "Matter in Our Surroundings",
  "status": "unset",
  "assets": [...],
  "topics": [...],
  "subtopics": [
    {
      "subtopic_id": "matter-in-our-surroundings_topic_1",
      "title": "Physical Nature of Matter",
      "order": 0,
      "kind": "topic",
      "metadata": {
        "source": "syllabus.json",
        "class": "9",
        "subject": "science",
        "chapter_id": "matter-in-our-surroundings",
        "chapter_title": "Matter in Our Surroundings",
        "topic_index": 0
      }
    },
    {
      "subtopic_id": "matter-in-our-surroundings_topic_2",
      "title": "Characteristics of Particles of Matter",
      "order": 1,
      "kind": "topic",
      "metadata": {
        "source": "syllabus.json",
        "class": "9",
        "subject": "science",
        "chapter_id": "matter-in-our-surroundings",
        "chapter_title": "Matter in Our Surroundings",
        "topic_index": 1
      }
    }
  ]
}
```

---

## 2. Seeding the Database

A seed script is provided to pre-populate all NCERT classrooms, curricula, chapters, and subtopics for the default teacher user `abc`.

### How to Run the Seed Script
Navigate to the root directory and execute:
```bash
PYTHONPATH=backend venv/bin/python backend/seed_ncert.py
```

This script will:
1. Ensure the teacher `abc` exists and has onboarding completed.
2. Iterate through all supported grades (6-12) and their subjects.
3. Automatically create classrooms, establish teacher memberships, bootstrap their curricula from `syllabus.json`, and bootstrap all chapters/topics.

---

## 3. Adding New Subjects or Grades

To add a new subject or grade in the future:
1. Update `backend/app/repositories/syllabus.json` with the new grade and subject hierarchy:
   ```json
   {
     "class": 13,
     "subjects": {
       "computer-science": {
         "chapters": [
           {
             "id": "intro-to-python",
             "name": "Introduction to Python",
             "topics": [
               "Variables and Data Types",
               "Control Flow structures"
             ]
           }
         ]
       }
     }
   }
   ```
2. Update the `ALLOWED_SUBJECTS` set in [onboarding_service.py](file:///Users/divy13ansh/Projects/Hackathons/mootion/mootion-wadhwani-ai/backend/app/services/onboarding_service.py#L38) if the subject is not already allowed.
3. Ensure subject aliases/normalization is updated in `_normalize_subject` within [curriculum_presets.py](file:///Users/divy13ansh/Projects/Hackathons/mootion/mootion-wadhwani-ai/backend/app/services/curriculum_presets.py#L57) if needed.
4. Add the new grade and subject to the `scope` dictionary in the `seed_ncert.py` script.

---

## 4. Curriculum Mapping Caveats

- **Mapping `source_node_id` to Chapter**: When bootstrapping, the system parses the curriculum tree. Immediate children of the tree root (representing the units/chapters) have their `id` set as the chapter's `source_node_id` in the database.
- **Grades 11-12 Filtering**: Unlike grades 6-10 where general "Science" is taught, grades 11-12 split science into Physics, Chemistry, and Biology. In `syllabus.json`, all of these are combined under the key `"science"`. The backend filtering logic in `build_ncert_curriculum` automatically filters chapters starting with "Physics", "Chemistry", or "Biology" for classes 11 and 12 and strips the prefix to keep the title clean.
- **Two-way Science Fallback**: For grades 5-10, the frontend router uses a bidirectional fallback matching algorithm. It matches a browser URL path subject like `science` to classroom subjects in the DB like `Physics`, `Chemistry`, or `Biology` (and vice-versa).
