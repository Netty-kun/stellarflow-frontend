# Voting Power Calculator - Component Structure

## Component Tree

```
VotingPowerCalculator
│
├── Header Section
│   ├── Title (h2)
│   ├── Description (p)
│   └── TrendingUp Icon
│
├── Info Banner
│   ├── Info Icon
│   └── veFLOW Explanation Text
│
├── Main Content Grid
│   │
│   ├── Left Column: Controls
│   │   │
│   │   ├── Slider (FLOW Amount)
│   │   │   ├── Label + Value Display
│   │   │   ├── Range Input (styled)
│   │   │   └── Helper Text / Balance Info
│   │   │
│   │   ├── Balance Warning (conditional)
│   │   │   └── Error Message
│   │   │
│   │   ├── Slider (Lock Duration)
│   │   │   ├── Label + Formatted Duration
│   │   │   ├── Range Input (styled)
│   │   │   └── Helper Text
│   │   │
│   │   └── Preset Buttons Row
│   │       ├── Button: 1 Month
│   │       ├── Button: 6 Months
│   │       ├── Button: 1 Year
│   │       ├── Button: 2 Years
│   │       └── Button: Max (4 Years)
│   │
│   └── Right Column: Visualization
│       │
│       └── VotingPowerGauge
│           │
│           ├── SVG Container
│           │   ├── Gradient Definition
│           │   ├── Background Circle
│           │   └── Progress Arc (animated)
│           │
│           └── Center Content (absolute)
│               ├── Vote Icon
│               ├── Percentage Value
│               └── Label Text
│
├── Metrics Grid (3 columns)
│   │
│   ├── MetricsCard: veFLOW Balance
│   │   ├── Lock Icon
│   │   ├── Label: "veFLOW Balance"
│   │   ├── Value (calculated)
│   │   └── Subtext (formula)
│   │
│   ├── MetricsCard: Power Multiplier
│   │   ├── TrendingUp Icon
│   │   ├── Label: "Power Multiplier"
│   │   ├── Value (1x - 4x)
│   │   └── Subtext (duration)
│   │
│   └── MetricsCard: Yield Boost
│       ├── Zap Icon
│       ├── Label: "Yield Boost"
│       ├── Value (1x - 4x)
│       └── Subtext (description)
│
├── Action Button (conditional)
│   └── Lock Tokens Button
│       └── Dynamic Text (amount + duration)
│
└── Footer Section
    ├── Important Note 1
    └── Important Note 2
```

## Component Hierarchy Detail

### 1. VotingPowerCalculator (Main Component)

**Responsibilities:**
- State management (flowAmount, lockWeeks)
- Calculations (multiplier, veFLOW, votingPower, yieldBoost)
- Event handling (slider changes, button clicks)
- Validation logic

**State:**
```typescript
const [flowAmount, setFlowAmount] = useState<number>(5000);
const [lockWeeks, setLockWeeks] = useState<number>(52);
```

**Memoized Values:**
```typescript
const multiplier = useMemo(() => calculateMultiplier(lockWeeks), [lockWeeks]);
const veFlowBalance = useMemo(() => flowAmount * multiplier, [flowAmount, multiplier]);
const votingPowerPercent = useMemo(() => ..., [veFlowBalance, totalVeSupply]);
const yieldBoost = useMemo(() => calculateYieldBoost(lockWeeks), [lockWeeks]);
```

### 2. VotingPowerGauge (Sub-component)

**Props:**
```typescript
{
  percentage: number;  // 0-100
  size?: number;       // default: 160
}
```

**Structure:**
- SVG with viewBox for scaling
- Gradient definition (purple → blue → cyan)
- Background circle (gray)
- Progress arc with dasharray animation
- Center content overlay

**Calculations:**
```typescript
const radius = size / 2 - 12;
const circumference = 2 * Math.PI * radius;
const strokeDashoffset = circumference * (1 - Math.min(percentage / 100, 1));
```

### 3. Slider (Sub-component)

**Props:**
```typescript
{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  helperText?: string;
}
```

**Features:**
- Visual progress bar (gradient fill)
- Real-time value display
- Custom thumb styling (via CSS)
- Helper text below

### 4. MetricsCard (Sub-component)

**Props:**
```typescript
{
  icon: React.ElementType;
  label: string;
  value: string;
  subtext?: string;
  colorClass?: string;
}
```

**Layout:**
- Icon + label row
- Large value display
- Optional subtext
- Bordered card with background

## Data Flow

```
User Interaction
      │
      ▼
Slider onChange
      │
      ▼
State Update (setFlowAmount / setLockWeeks)
      │
      ▼
Re-render Triggered
      │
      ├──────────────────┬──────────────────┐
      ▼                  ▼                  ▼
useMemo Recalc    useMemo Recalc    useMemo Recalc
(multiplier)      (veFlowBalance)   (votingPower)
      │                  │                  │
      └──────────────────┴──────────────────┘
                         │
                         ▼
            UI Components Update
                         │
      ┌──────────────────┼──────────────────┐
      ▼                  ▼                  ▼
    Gauge            Metrics Cards     Button Text
  (animated)         (values)          (dynamic)
```

## Event Flow

### Slider Interaction
```
1. User drags slider
2. onChange event fires
3. setState called with new value
4. useMemo recalculates dependent values
5. UI updates (gauge animates, metrics update)
```

### Preset Button Click
```
1. User clicks preset button (e.g., "1 Year")
2. onClick handler sets lockWeeks to 52
3. useMemo recalculates multiplier
4. Duration slider thumb moves to new position
5. All dependent UI elements update
```

### Lock Button Click
```
1. User clicks "Lock X FLOW for Y duration"
2. Validation checks (amount > 0, amount ≤ balance)
3. If valid: onLockTokens callback invoked
4. Callback receives (amount, durationWeeks)
5. Parent component handles lock logic
```

## Styling Architecture

### Container Structure
```css
<div className="max-w-4xl mx-auto rounded-xl border border-gray-800 bg-[#0d1117] p-6 space-y-6">
  ├── Header (space-y-1)
  ├── Info Banner (rounded-lg border p-4)
  ├── Content Grid (grid md:grid-cols-2 gap-6)
  │   ├── Sliders Column (space-y-6)
  │   └── Gauge Column (flex items-center justify-center)
  ├── Metrics Grid (grid sm:grid-cols-3 gap-4)
  ├── Action Button (w-full py-3)
  └── Footer (text-xs space-y-1)
</div>
```

### Responsive Breakpoints
```css
/* Mobile-first approach */
Base:        Single column, stacked
sm (640px):  Metric grid becomes 3-col
md (768px):  Content grid becomes 2-col (sliders | gauge)
```

## Performance Optimizations

### 1. Memoization Strategy
```typescript
// Expensive calculations memoized
const multiplier = useMemo(() => ..., [lockWeeks]);
const veFlowBalance = useMemo(() => ..., [flowAmount, multiplier]);
const votingPowerPercent = useMemo(() => ..., [veFlowBalance, totalVeSupply]);
```

### 2. Callback Stability
```typescript
// Callback only recreated when dependencies change
const handleLock = useCallback(() => {
  onLockTokens?.(flowAmount, lockWeeks);
}, [flowAmount, lockWeeks, onLockTokens]);
```

### 3. GPU Acceleration
```css
/* Gauge animations use transform (GPU) not layout properties */
circle {
  transition: stroke-dashoffset 0.5s ease;
  filter: drop-shadow(...);
  will-change: transform;
}
```

### 4. CSS Containment
```css
/* Sub-components isolated from main layout */
.metric-card {
  contain: layout style;
}
```

## Accessibility Tree

```
VotingPowerCalculator [role=region]
│
├── Heading "Voting Power Calculator" [h2]
├── Description [p]
│
├── Info Banner [role=note]
│   └── Text content
│
├── Controls Group
│   ├── "FLOW Token Amount" [label]
│   ├── Slider [role=slider, aria-valuemin, aria-valuemax, aria-valuenow]
│   ├── "Lock Duration" [label]
│   └── Slider [role=slider, aria-valuemin, aria-valuemax, aria-valuenow]
│
├── Preset Buttons Group
│   └── Buttons [role=button, type=button]
│
├── Gauge Visualization
│   └── SVG [aria-label="Voting power: X.XX%"]
│
├── Metrics Cards Group
│   ├── Card 1 [role=article]
│   ├── Card 2 [role=article]
│   └── Card 3 [role=article]
│
├── Lock Button [role=button, type=button, disabled?]
│
└── Footer Notes [role=contentinfo]
```

## State Management

### Component State
```typescript
// Local state
flowAmount: number     // User's input amount
lockWeeks: number      // User's selected duration

// Derived state (memoized)
multiplier: number     // Calculated from lockWeeks
veFlowBalance: number  // flowAmount × multiplier
votingPowerPercent: number  // (veFLOW / totalSupply) × 100
yieldBoost: number     // Same as multiplier
```

### Props State
```typescript
// External state (passed in)
totalVeSupply: number          // From blockchain/API
userBalance?: number           // From wallet
onLockTokens?: Function        // Parent callback
```

## File Dependencies

```
VotingPowerCalculator.tsx
├── React (useState, useMemo, useCallback)
├── lucide-react (TrendingUp, Zap, Vote, Lock, Info)
└── Tailwind CSS classes

globals.css
├── Tailwind v4 imports
└── Custom slider styles (.slider-thumb)

index.ts
└── Export statements

Test file depends on:
├── @testing-library/react
└── VotingPowerCalculator component

Stories file depends on:
├── @storybook/react
└── VotingPowerCalculator component
```

## Calculation Pipeline

```
Input: flowAmount, lockWeeks, totalVeSupply
      │
      ▼
Step 1: Calculate Multiplier
      multiplier = 1 + (lockWeeks / 208) × 3
      │
      ▼
Step 2: Calculate veFLOW Balance
      veFlowBalance = flowAmount × multiplier
      │
      ▼
Step 3: Calculate Voting Power %
      votingPowerPercent = (veFlowBalance / totalVeSupply) × 100
      │
      ▼
Step 4: Yield Boost (same as multiplier)
      yieldBoost = multiplier
      │
      ▼
Output: Display in UI (gauge + metrics)
```

## Validation Pipeline

```
User Input
      │
      ▼
Check: amount > 0?
      │
      ├── No → Disable lock button
      │
      ▼ Yes
Check: userBalance provided?
      │
      ├── No → No validation
      │
      ▼ Yes
Check: amount ≤ userBalance?
      │
      ├── No → Show error + disable button
      │
      ▼ Yes
All valid → Enable lock button
```

## Component Communication

```
Parent Component
      │
      ├── totalVeSupply (prop) ───────────┐
      ├── userBalance (prop) ─────────────┼─→ VotingPowerCalculator
      └── onLockTokens (callback) ────────┘          │
                                                      │
                                                      ├─→ VotingPowerGauge
                                                      ├─→ Slider (x2)
                                                      └─→ MetricsCard (x3)
                                                            │
User clicks lock ←──────────────────────────────────────┘
      │
      ▼
onLockTokens(amount, weeks) called
      │
      ▼
Parent handles blockchain interaction
```

## Summary

The VotingPowerCalculator is a self-contained component with:
- **Clear hierarchy**: Main component → Sub-components
- **Efficient state**: Local state + memoized derivations
- **Unidirectional data flow**: Props down, events up
- **Optimized rendering**: Only updates what changes
- **Accessible structure**: Semantic HTML + ARIA
- **Responsive design**: Mobile-first, grid-based
- **Clean separation**: Logic, rendering, styling separated

This architecture ensures maintainability, testability, and performance.
