Improve the existing UI design for an Indonesian stock broker accumulation dashboard.

This is **iteration 2**, focusing on calendar enhancement and layout restructuring after user clicks Analyze.


---

## 1. Layout Transition Behavior

* Initial state: single-column layout with input fields and CTA button
* After user clicks **Analyze**, transition smoothly into a **two-column layout** with animation
* Use smooth slide + fade transition

**Layout proportions:**

* Left column: 1/3 width
* Right column: 2/3 width

Left and right columns must have **independent vertical scrolling**


---

## 2. Left Column (Control & Summary Panel)

### Top Section:

* Reusable input form (same as initial state):
  * Multi-select Broker Code
  * Emiten Code
  * Date Range
  * CTA button: “Analyze”

### Below Input:

#### Executive Summary

* Clear statement whether brokers are in **Accumulation or Distribution**
* Highlight net buy or net sell result
* Short insight sentence (example: “Dominant accumulation by BK and AK during mid-month period”)

### Broker Summary Table

Compact table with following columns:

* **BY** → Broker code that performed BUY
* **B.Val** → Buy Value (example: 19.4M)
* **B.Lot** → Buy Lot (example: 127.4k)
* **B.Avg** → Average buy price
* **SL** → Broker code that performed SELL
* **S.Val** → Sell Value
* **S.Lot** → Sell Lot
* **S.Avg** → Average sell price

Color rules:

* Buy-related values → green
* Sell-related values → red

Table should be compact, readable, and optimized for fast scanning.


---

## 3. Right Column (Main Calendar Visualization)

### Calendar View

* Shows **monthly calendar blocks**
* Most recent month at the top
* Older months stacked vertically below

### Calendar Cell Content:

Each date cell displays:

* Net lot value
* Net transaction value (IDR)
* Closing price of the stock for that day

### Hover Interaction:

On hover over a calendar cell:

* Show tooltip or expanded card displaying:
  * Broker-wise accumulation / distribution
  * Example:
    * BK: +19M / 125k Lot
    * YU: -8M / 52k Lot
* Color-coded:
  * Green = net buy
  * Red = net sell

### Color Rules:

* Green background for net buy days
* Red background for net sell days
* Neutral gray for no transaction


---

## 4. UI Style & UX Guidelines

* Modern fintech dashboard
* Professional Indonesian stock trading tone
* Dark mode friendly
* High readability for numerical data
* Smooth hover and transition animations


---

## 5. Output Requirement

* High-fidelity UI
* Product-ready layout
* Suitable for implementation in React / Next.js

Focus on clarity, data density, and professional trader experience.