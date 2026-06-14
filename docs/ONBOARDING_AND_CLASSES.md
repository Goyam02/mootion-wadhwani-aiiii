# Onboarding and Classes

This document covers the teacher and student flows around onboarding and class membership.

## Product Model

- The app is effectively single-tenant for now.
- A hidden default school exists internally, but is never shown in the UI or API responses.
- Teachers create classes one by one.
- Students join classes by class code.
- Both roles can belong to multiple classes.

## Why This Exists

The product needs a minimal structural layer before curriculum and assignments make sense.

- The school is hidden so the user never has to manage tenant setup.
- The class is the main grouping primitive.
- Everything else, including curriculum and assignments, attaches to a class.

## Teacher Flow

### Step 1: See your profile

Endpoint:

- `GET /teachers/me`

Use it to confirm the logged-in teacher profile and onboarding state.

### Step 2: Set onboarding preferences

Endpoint:

- `POST /teachers/onboarding/preferences`

Request:

```json
{
  "preferred_language": "english"
}
```

Why it exists:

- the product needs a language preference before teacher-facing content is generated
- the setting is stored on the user profile

### Step 3: Complete onboarding

Endpoint:

- `POST /teachers/onboarding/complete`

Request:

```json
{
  "load_ncert": true
}
```

Why it exists:

- this is the final signal that the teacher finished setup
- `load_ncert` is a product hint for showing curriculum bootstrap affordances

### Step 4: Create a class

Endpoint:

- `POST /teachers/classes`

Request:

```json
{
  "grade": "8",
  "subject": "Physics"
}
```

What the backend creates:

- a class record
- a teacher-class membership row
- a unique class code

Why it exists:

- the class is the container for curriculum, chapters, and assignments
- the unique code is how students join

### Step 5: List your classes

Endpoint:

- `GET /teachers/classes`

Use it when the teacher dashboard needs to show all classes they own or participate in.

## Student Flow

### Step 1: See your profile

Endpoint:

- `GET /students/me`

### Step 2: Set language

Endpoint:

- `POST /students/language`

Request:

```json
{
  "preferred_language": "english"
}
```

### Step 3: Join a class

Endpoint:

- `POST /students/join-class`

Request:

```json
{
  "class_code": "AB12CD34"
}
```

Why it exists:

- students join by simple code rather than school, section, or admin approval
- the product can support many classes per student

### Step 4: List joined classes

Endpoint:

- `GET /students/classes`

## Membership Rules

- A teacher can belong to many classes.
- A student can belong to many classes.
- Membership is stored separately from the class record.
- Duplicate membership creation is avoided in the service layer.

## Hidden School

- The hidden school is an implementation detail only.
- It exists so class records have a tenant anchor.
- It should not appear in the teacher or student product experience.

## Common Usage Pattern

1. Teacher registers or logs in.
2. Teacher sets preferences.
3. Teacher completes onboarding.
4. Teacher creates one or more classes.
5. Students join each class with the class code.
