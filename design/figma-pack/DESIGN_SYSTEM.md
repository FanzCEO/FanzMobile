# CRM Escort - Figma Design System
## "Neon Intelligence" Theme (Futuristic 2035 AI OS)

> Complete component library, tokens, and screen blueprints for the futuristic AI assistant interface

---

## 🎨 1. COLOR TOKENS

### Base Colors
```
base.black         #0A0A0E
base.dark          #111118
base.mid           #1A1A22
base.light         #272733
```

### Neon Primaries
```
neon.blue          #2D6FFF
neon.violet        #A45CFF
neon.cyan          #33E6FF
neon.pink          #FF3DDA
neon.green         #00FFA3
```

### Gradients (Create as Figma Styles)
```
gradient.ai-core
  → linear 135°: #2D6FFF → #FF3DDA → #33E6FF

gradient.holo
  → linear 135°: #00FFA3 → #A45CFF

gradient.orb
  → linear 180°: #A45CFF → #33E6FF → #2D6FFF
```

### Glass Layer
```
glass.bg           rgba(255,255,255,0.04)
glass.stroke       rgba(255,255,255,0.12)
```

### Semantic
```
success            #00FFBA
warning            #FFCC00
danger             #FF4D4D
info               #2D6FFF
```

---

## ✒️ 2. TYPOGRAPHY

### Primary Fonts
- **iOS**: SF Pro Display / SF Pro Text
- **Android**: Inter
- **Alternate Headers**: Orbitron (futuristic accent)

### Text Styles (Create as Figma Styles)

```
Text/Display/Large
  40px, Weight 700, -2 tracking

Text/Display/Medium
  34px, Weight 600

Text/Header/Large
  28px, Weight 500

Text/Header/Medium
  22px, Weight 500

Text/Body/Regular
  16px, Weight 400

Text/Body/Light
  16px, Weight 300

Text/AI/Subtitle
  14px, Weight 200, Color: neon.cyan or neon.violet

Text/Caption
  12px, Weight 300
```

---

## 🔳 3. EFFECTS

### Figma Effect Styles

**Effect/Glow/NeonBlue**
```
Layer 1: Drop Shadow, 0 0 8, rgba(45,111,255,0.8)
Layer 2: Drop Shadow, 0 0 16, rgba(164,92,255,0.6)
```

**Effect/Glow/Cyan**
```
Layer 1: Drop Shadow, 0 0 8, rgba(51,230,255,0.7)
Layer 2: Drop Shadow, 0 0 18, rgba(51,230,255,0.4)
```

**Effect/Shadow/Card**
```
Drop Shadow: 0 4 20, rgba(0,0,0,0.45)
```

**Effect/Glow/Orb**
```
Layer 1: Drop Shadow, 0 0 30, rgba(164,92,255,0.8)
Layer 2: Drop Shadow, 0 0 60, rgba(45,111,255,0.5)
```

**Effect/Blur/Glass/Strong**
```
Background Blur: 24px
```

**Effect/Blur/Glass/Medium**
```
Background Blur: 18px
```

---

## 📐 4. GRID SYSTEM

### Mobile Grid (390×844 iPhone)
- **Base Unit**: 4pt grid
- **Safe Area Padding**: 20px
- **Columns**: 12
- **Gutter**: 8px
- **Margin**: 20px

### Component Radius Tokens
```
Radius/XS      8px
Radius/SM      12px
Radius/MD      16px
Radius/LG      24px
Radius/XL      32px
Radius/Orb     999px (circle)
```

### Spacing Tokens
```
Space/XS       4px
Space/SM       8px
Space/MD       12px
Space/LG       16px
Space/XL       24px
Space/2XL      32px
```

---

## 🧩 5. COMPONENT LIBRARY

### A. AI ORB (Centerpiece)
**Component Name**: `Comp/AI/Orb`

**Size**: 160×160px

**Structure**:
1. Base circle (Radius: 80px)
   - Fill: gradient.orb
   - Effect: Effect/Glow/Orb
2. Inner circle (Radius: 70px)
   - Fill: glass.bg
   - Stroke: glass.stroke (1px)
3. Optional particle overlay layer

**Variants** (Properties → State):
- `Idle` – soft glow, slow rotation
- `Listening` – pulsing rings
- `Thinking` – rotating gradients
- `Alert` – orange pulse
- `Success` – green pulse

---

### B. GLASS CARD
**Component Name**: `Comp/Card/Glass`

**Dimensions**: 
- Width: Stretch (auto-layout)
- Min Height: 72px

**Structure**:
- Auto-layout: Vertical
- Padding: 16px
- Gap: 8px
- Fill: glass.bg
- Stroke: glass.stroke (1px)
- Radius: Radius/LG (24px)
- Effect: Effect/Shadow/Card

**Slots**:
- Title (Text/Header/Medium)
- Subtitle (Text/Body/Light)
- Meta row (tags, icons)

**Variants**:
- `Default`
- `AI-Highlighted` (add Effect/Glow/NeonBlue)
- `Compact` (min height 56px, smaller text)

---

### C. MESSAGE BUBBLE
**Component Name**: `Comp/Message/Bubble`

**Base**: Auto-layout, max-width 80%

**Left Bubble**:
- Radius: top-left 4px, others 16px
- Fill: base.mid
- Text: Text/Body/Regular

**Right Bubble**:
- Radius: top-right 4px, others 16px
- Fill: gradient.ai-core
- Text: Text/Body/Regular, white

**Optional Layer**: Neon underline for AI-extracted keywords

**Variants**:
- Side: `Left` | `Right`
- HasAIHighlight: `True` | `False`
- HasActions: `True` | `False`

---

### D. CONTACT ROW
**Component Name**: `Comp/Contact/Row`

**Height**: 72px

**Structure** (horizontal auto-layout):
1. **Left**: Hologram avatar (40×40 circle)
   - Gradient fill
   - Initials centered
2. **Middle** (vertical auto-layout):
   - Name (Text/Header/Small - 18px, Weight 500)
   - Subline: "Last seen 2d ago · 3 meetings" (Text/Caption)
3. **Right**: Tag chip (e.g., "Creator", "Brand")

---

### E. TIMELINE NODE
**Component Name**: `Comp/Timeline/Node`

**Structure** (vertical):
1. Circle (10×10)
   - Fill: neon.cyan or neon.violet
   - Effect: Effect/Glow/Cyan
2. Vertical line (1px width, 100% height)
   - Fill: glass.stroke
3. Attached card: Comp/Card/Glass on the right

**Used for**:
- Contact history timeline
- Task progression
- Message threads

---

### F. EVENT CAPSULE
**Component Name**: `Comp/Event/Capsule`

**Dimensions**: Height 44px, Width: auto

**Structure**:
- Radius: 999px (pill)
- Fill: gradient.ai-core
- Left accent bar: 3px neon.blue

**Content** (horizontal auto-layout):
- Title: "Shoot w/ Alex" (Text/Body/Regular, white)
- Time/Location: "Thu · 3:00 PM · Midtown" (Text/Caption, white 70% opacity)

---

### G. BOTTOM NAV
**Component Name**: `Comp/Nav/Bottom`

**Dimensions**: 390×88px (fixed to bottom)

**Structure**:
- Fill: base.black with 80% opacity
- Top border: 1px glass.stroke
- Effect: Effect/Blur/Glass/Medium

**Tabs** (5 slots, horizontal, space-evenly):
1. Home (AI Orb icon)
2. Inbox
3. Contacts
4. Calendar
5. Tasks

**Tab States**:
- Active: Neon glow + underline strip
- Inactive: Gray icon

**Variants**: `Selected → Home | Inbox | Contacts | Calendar | Tasks`

---

### H. BUTTON PRIMARY
**Component Name**: `Comp/Button/Primary`

**Structure**:
- Auto-layout: Horizontal, center aligned
- Radius: 999px
- Fill: gradient.ai-core
- Effect: Effect/Glow/Cyan
- Text: Text/Body/Regular, white

**Variants**:
- Size: `Small` (40px height) | `Medium` (48px) | `Large` (56px)
- State: `Default` | `Hover` | `Pressed` | `Disabled`

---

### I. TAG/CHIP
**Component Name**: `Comp/Chip/Tag`

**Dimensions**: Height 28px, Width: auto

**Structure**:
- Radius: 999px
- Fill: neon.violet with 20% opacity
- Stroke: neon.violet with 40% opacity (1px)
- Text: Text/Caption, neon.violet

**Used for**: Contact tags, message categories, status indicators

---

## 📱 6. SCREEN BLUEPRINTS

### HOME / AI CONTROL HUB
**Frame**: 390×844 (iPhone 14)

**Layout**:
1. **Top** (padding top: 48px)
   - Text: "Good evening, Josh" (Display/Medium, white)
   - Spacing: 24px

2. **Center**
   - AI Orb (Comp/AI/Orb)
   - Below orb: Row of stat chips
     - "2 meetings suggested" (110×36px)
     - "3 follow-ups" (110×36px)
     - "1 new contact" (110×36px)

3. **Bottom Section**
   - Full-width glass panel
   - Recent AI actions list (3-4 cards)

4. **Bottom Nav**: Comp/Nav/Bottom (fixed)

---

### INBOX
**Frame**: 390×844

**Layout**:
1. **Header**
   - Title: "Inbox" (Header/Large)
   - Filter pills: "All", "AI", "Important", "RM chat", "SMS"

2. **Message List** (scrollable)
   - Each item: Comp/Card/Glass
     - Contact name
     - Message preview (2 lines max)
     - AI tags: "Meeting", "Task", "Location"
     - Timestamp

3. **Bottom Nav**: Fixed

---

### CONTACT DETAIL
**Frame**: 390×844

**Layout**:
1. **Top Area** (~220px height)
   - Hologram avatar (80×80, centered)
   - Name (Header/Large)
   - Primary tags row
   - Importance score visualization

2. **AI Summary Panel**
   - Glass card with holographic border
   - Short paragraph summary
   - Spacing: 16px below

3. **Timeline** (scrollable)
   - Vertical timeline using Comp/Timeline/Node
   - Messages, meetings, tasks chronologically

4. **Actions Bar** (floating)
   - Call, Message, Directions buttons

---

### CALENDAR (WEEK VIEW)
**Frame**: 390×844

**Layout**:
1. **Header**
   - Week selector (arrows + current week)
   - Today button

2. **Grid**
   - Background: base.black
   - Grid lines: glass.stroke (fade in/out animation)
   - Events: Comp/Event/Capsule

3. **AI Suggestions** (top floating chip)
   - "You're free at 4 PM — schedule prep meeting?"

---

### TASKS
**Frame**: 390×844

**Layout**:
1. **Header**: "Tasks" (Header/Large)

2. **Vertical Timeline**
   - Neon timeline with nodes
   - Open tasks pulse lightly
   - Completed tasks: muted with checkmark

3. **AI Suggestions Panel**
   - Floating at top
   - "These 3 tasks are overdue"

---

## 🌀 7. MOTION SYSTEM

### AI Orb Animations
```
Idle State:
  - Rotate: 360° over 12s, loop
  - Easing: ease-in-out

Listening State:
  - Pulsing rings: scale 1.0 → 1.15 → 1.0
  - Duration: 800ms per pulse
  - Loop indefinitely

Thinking State:
  - Faster rotation: 360° over 4s
  - Particle flickers overlay

Alert State:
  - Orange pulse: opacity 0.4 → 1.0 → 0.4
  - Duration: 1200ms
  - Loop 3 times
```

### Card Interactions
```
Hover/Press:
  - Y translate: 0 → -2px
  - Shadow: intensify by 20%
  - Duration: 160ms
  - Easing: ease-out

Entry Animation:
  - Fade: 0 → 1
  - Y translate: 20px → 0
  - Duration: 220ms
  - Easing: ease-out

Expand Animation:
  - Scale: 1.0 → 1.06 → 1.0
  - Duration: 300ms
```

### Bottom Nav Tab Selection
```
Select Tab:
  - Icon scale: 1.0 → 1.1
  - Glow: fade in 200ms
  - Underline: slide in from left
  
Deselect Tab:
  - Icon scale: 1.1 → 1.0
  - Glow: fade out 200ms
  - Underline: slide out to right
```

### Screen Transitions
```
Push Right:
  - Duration: 220ms
  - Easing: ease-out
  - X translate: 100% → 0
  - Opacity: 0.8 → 1.0
```

---

## 🎒 8. ASSETS PACK

### Icons Needed (24×24, neon style)
- Home (AI orb simplified)
- Inbox (message bubble)
- Contacts (two overlapping circles)
- Calendar (grid with dot)
- Tasks (checkmark in circle)
- Settings (gear)
- Message (chat bubble)
- Check/Alert (status indicators)
- AI chip indicators (sparkle, brain, location pin)
- Phone, Email, Directions

### Background Textures
- Holographic gradient sheets (PNG, 1000×1000)
- Neon grid lines (SVG)
- Glass blur masks (PNG)

### AI Orb Assets
- 3 gradient variations (PSD/SVG layers)
- 3 glow layers (PNG with alpha)
- Particle overlay (animated sequence)

---

## 🗂️ 9. FIGMA ORGANIZATION

### Pages Structure:
```
00 – Foundations
  ├─ Colors
  ├─ Typography
  ├─ Effects
  └─ Grid & Spacing

01 – Components
  ├─ AI Orb
  ├─ Cards
  ├─ Messages
  ├─ Navigation
  ├─ Buttons
  ├─ Inputs
  ├─ Tags/Chips
  └─ Timeline

02 – Screens – Mobile
  ├─ Home / Hub
  ├─ Inbox
  ├─ Message Detail
  ├─ Contact List
  ├─ Contact Detail
  ├─ Calendar
  ├─ Event Detail
  ├─ Tasks
  └─ Settings

03 – Prototypes
  ├─ AI Orb Interaction
  ├─ Create Meeting Flow
  ├─ Auto-Confirmation Flow
  └─ Workflow Trigger Demo

04 – Assets
  ├─ Icons
  ├─ Backgrounds
  ├─ Gradients
  └─ Logo / App Icon
```

---

## ✅ DELIVERABLES CHECKLIST

### For Designer:
- [ ] Create all color styles
- [ ] Create all text styles
- [ ] Create all effect styles
- [ ] Build component library (A–I)
- [ ] Design all core screens
- [ ] Set up prototypes with motion
- [ ] Export assets pack
- [ ] Document component usage

### For Developer:
- [ ] Extract color tokens to CSS/Swift/Kotlin
- [ ] Implement typography scale
- [ ] Build reusable components matching Figma
- [ ] Add motion/animation matching specs
- [ ] Integrate assets and icons

---

**Design System Version**: 1.0  
**Last Updated**: November 2025  
**Owner**: FANZ Design Team
