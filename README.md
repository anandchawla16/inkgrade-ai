# ✍️ InkGrade AI — Real-Time Handwritten Worksheet Grader & Voice Tutor
> **Gemini Buildathon Project Submission**  
> *Transforming static handwritten homework into an interactive, spatial visual-audio learning conference.*

---

## 🎯 The Real-World Problem
Every evening, teachers spend 2–3 hours grading physical, handwritten worksheets, often reducing detailed feedback to hurried red "X" marks. Students receive their papers back days later without understanding *why* their step-by-step logic failed. 

Existing tools (like Photomath or Google Lens) act as single-equation "answer revealers" that enable cheating. They do not evaluate complete, multi-question handwritten student worksheets, cannot pinpoint the exact line where a student's misconception occurred, and offer zero conversational pedagogical debrief.

---

## 🚀 The Solution: InkGrade AI
**InkGrade AI** bridges multimodal spatial vision with conversational voice tutoring:
1. **Handwriting Spatial Inspection:** Students snap or upload a photo of their handwritten Math or English worksheet.
2. **"Teacher Pen" Visual Overlay:** Gemini 2.0 Flash analyzes the step-by-step working and returns normalized bounding box coordinates `[ymin, xmin, ymax, xmax]`. The frontend renders realistic digital red-pen dashed boxes around erroneous steps, floating handwritten teacher margin notes, and green checkmarks for correct problems.
3. **Conversational Voice Debrief:** Mrs. Davis (the AI Voice Tutor) walks the student through their sheet orally in under 90 seconds, breaking down the exact misconceptions without shaming.
4. **Two-Way Voice Q&A:** The student can click the microphone or speak back (*"Why is question 3 wrong?"*), and the agent responds conversationally grounded in the physical sheet context.

---

## 🏗️ Architecture & Technology Stack

```
                        ┌──────────────────────────────┐
                        │   Client Web App (Vite/HTML5) │
                        │   Canvas/SVG Overlay Engine  │
                        └──────────────┬───────────────┘
                                       │
                    POST /api/grade    │    Audio / Speech Recognition
                 (Image / Sample ID)   │    (Two-Way Spoken Debrief)
                                       ▼
                        ┌──────────────────────────────┐
                        │      FastAPI Python Server    │
                        └──────────────┬───────────────┘
                                       │
                      Structured JSON  │  Spatial Vision & Prompts
                     with Bounding Box │  `[ymin, xmin, ymax, xmax]`
                                       ▼
                        ┌──────────────────────────────┐
                        │    Google Gemini 2.0 Flash   │
                        │    (Multimodal Vision + Live)│
                        └──────────────────────────────┘
```

* **AI Model:** `gemini-3.8-flash` via the official `google-genai` Python SDK.
* **Spatial Reasoning:** Structured JSON schema enforcing normalized 0–1000 bounding boxes (`box_2d`) for fine-grained error localization.
* **Backend:** FastAPI, Uvicorn, Pillow, Pydantic.
* **Frontend:** Responsive Glassmorphism UI, SVG/Canvas overlay rendering with auto-scaling coordinate transforms, Web Speech API for voice synthesis and microphone input.

---

## 🧪 Pre-Generated Test Sheets Included
The app comes with pre-generated kid-solved handwritten worksheets ready for immediate testing:
1. **Math (Grade 7 Algebra & PEMDAS):** `test_sheets/math_grade7_algebra.png`
   * Solved by 7th grader "Alex Miller".
   * Contains classic student traps: Distributive property error ($4(x-3) \rightarrow 4x-7$), fraction addition error ($1/3 + 2/5 \rightarrow 3/8$), and PEMDAS order of operations violation ($8 + 2 \times 4^2 \rightarrow 10 \times 16$).
2. **English (Grade 5 Grammar & Spelling):** `test_sheets/english_grade5_grammar.png`
   * Solved by 5th grader "Emma Watson".
   * Contains real elementary errors: Subject-verb agreement with prepositional phrases, homophones (*They're* vs *Their*), spelling (*recieve*), and plural possessive apostrophes.

---

## 🏃 Quick Start (Run Locally)

### 1. Launch the Server
From this directory, run:
```bash
run.bat
```
Or with Python:
```bash
python app.py
```

### 2. Open in Browser
Visit:
```
http://localhost:8090
```

1. Click on **Alex's Algebra Quiz** or **Emma's Grammar Sheet** on the left to see instant visual markings and hear the teacher debrief.
2. Click any red correction box on the paper to hear the specific explanation for that problem.
3. Click the 🎙️ **Microphone** to ask the teacher a follow-up question.
4. Drop your own handwritten photo in the dropzone (and enter your Gemini API key in the top right).
