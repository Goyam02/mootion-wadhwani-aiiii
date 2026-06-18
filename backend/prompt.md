You are working on Mootion, an EdTech platform for Indian government school 
students (Classes 6–12). Read the following before writing a single line of code.

═══════════════════════════════
STEP 1 — READ THESE FILES FIRST
═══════════════════════════════

1. docs/API_REFERENCE.md — this is the canonical backend contract. Every API 
   call you make must match this exactly.
2. frontend/src/lib/api.ts — the existing apiClient. Use this for every request.
3. frontend/src/app/student/ — all student-facing pages and components.
   Specifically read: StudentHomePage.tsx, the playground page, and any 
   existing tab/section components.
4. backend/ — skim the routers for students, chat-with-ai, assignments, and 
   simulations to understand what is actually implemented vs stubbed.

Do not write any code until you have read all of the above.

═══════════════════════════════
STEP 2 — WHAT IS ALREADY DONE
(do not touch these)
═══════════════════════════════

- Teacher auth, onboarding, class creation — complete and working
- Student auth, class joining, multi-class support — complete and working
- Teacher class detail page with real chapter fetching — complete and working
- Student home chapter browsing via Explore — partially done
- Teacher doubts page with split-panel respond UI — complete and working
- Student playground Teacher tab with doubt submission and reply view — 
  complete and working. DO NOT TOUCH THIS TAB OR ANY DOUBT CODE.
- Token refresh and role-based route guards — complete and working

═══════════════════════════════
STEP 3 — WHAT NEEDS TO BE DONE
═══════════════════════════════

Make the student home and playground fully dynamic. Everything currently 
hardcoded must be replaced with real backend data.

── STUDENT HOME /student/home ──

Three sections need to be wired up:

UP NEXT:
1. GET /students/classes → all class_ids
2. For each: GET /students/classes/{class_id}/assignments
3. Flatten, filter status "ready", sort by type priority:
   explain_it → predict_it → spot_it → connect_it → quiz → video → simulation → model
4. Show top one as the Up Next card: title, subject, assignment_type label, 
   "Start" button routing to /student/playground?assignment_id=X&class_id=Y
5. Empty state: "You're all caught up!"

TASKS (/tasks tab):
- Same flattened assignment list (cache it, don't re-fetch)
- Group by class/subject with section headers
- Assignment type display labels:
  explain_ai→"Explain It", predict_ai→"Predict It", spot_it→"Spot It",
  connect_it→"Connect It", quiz→"Quiz", video→"Watch", 
  simulation→"Simulation", model→"3D Model"
- status "ready" → tappable, routes to playground with context
- status "queued"/"processing" → "Being prepared..." grey, not tappable
- status "failed" → "Unavailable" red, not tappable
- Empty state: "No tasks assigned yet."

EXPLORE (/explore tab):
1. GET /students/classes → subjects enrolled in
2. For each class: GET /teachers/classes/{class_id}/chapters
3. Display chapters grouped by subject as browseable cards
4. Tapping a chapter → /student/playground?class_id=X&chapter_id=Y
5. Bottom row: GET /simulations/supported-subjects → subject tiles
6. "Open Playground" CTA → /student/playground with no params

── STUDENT PLAYGROUND /student/playground ──

DO NOT TOUCH: Teacher tab, doubt resolution, /ask-teacher command.

Read query params on mount: assignment_id, class_id, chapter_id

CHAT INITIALIZATION:
- assignment_id present → GET assignment details, then 
  POST /chat-with-ai/chats { class_id, chapter_id, assignment_id }
- only chapter_id → POST /chat-with-ai/chats { class_id, chapter_id }
- nothing → POST /chat-with-ai/chats {}
- After creating: GET /chat-with-ai/chats/{chat_id}/messages for history
- Store chat_id in sessionStorage as "mootion_chat_id"
- On mount with no query params: if "mootion_chat_id" exists in sessionStorage, 
  resume that chat instead of creating a new one

SENDING A MESSAGE:
POST /chat-with-ai/chats/{chat_id}/messages { content }
Show typing indicator while waiting.
Render assistant_message.content as AI reply.
For generated_assets, render inline by asset_type:

  quiz → interactive widget: tap to select answer, show correct/incorrect on submit
  simulation → iframe using external_url, fallback to "Open Simulation" button
  three_d_model → "View 3D Model" button opening external_url in new tab
  concept_video → inline video player or link
  explain_it / predict_it / spot_it / connect_it →
    show instructions from payload_json +
    a "Submit your answer" textarea that calls
    POST /students/classes/{class_id}/assignments/{assignment_id}/submit
    { transcription_text, language: "english" }
    then show ai_feedback and scores inline after response

ASSIGNMENT CONTEXT BANNER:
If assignment_id in query params, show slim banner at top of Mootion tab:
"[Subject] · [Chapter Title] · [Assignment Type]"
X button dismisses it and creates a new context-free chat.

CHAT HISTORY SIDEBAR (desktop only, width > 768px):
GET /chat-with-ai/chats → collapsible left panel listing past threads
Clicking a thread → GET /chat-with-ai/chats/{chat_id}/messages → load it
"New Chat" button at top → new context-free chat
Hide entirely on mobile.

FREE MODE welcome message (client-side only, no API call):
"Hi! I'm your Mootion AI. Ask me anything about your subjects, 
or type /ask-teacher to send a doubt to your teacher."
Show this as the first message only when chat history is empty.

QUOTAS:
GET /students/quotas on playground mount.
If doubt_videos_used_today >= doubt_videos_max:
Show subtle banner "You've reached today's video limit."
Disable video asset generation in chat responses (still allow all other types).

═══════════════════════════════
CONSTRAINTS
═══════════════════════════════
- DO NOT touch Teacher tab, doubt resolution, or /ask-teacher command
- DO NOT touch any teacher-facing pages
- DO NOT touch apiClient auth/refresh logic
- No visual redesign — match all existing component patterns exactly
- Use frontend/src/lib/api.ts for every single API call
- Handle every loading state (skeleton or spinner per section)
- Handle every empty state with friendly copy
- Mobile-first — all new elements must work at 375px width
- Cache class list and assignment list in component state — do not re-fetch 
  the same data multiple times on a single page mount
- Find actual route paths from existing code before hardcoding anything
- After completing, run npm run lint and fix all TypeScript errors before 
  considering the task done