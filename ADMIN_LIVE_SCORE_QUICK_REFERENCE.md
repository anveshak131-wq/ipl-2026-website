# Admin Live Score - Quick Reference Card

## 🎯 Core Concept: Ball-by-Ball Entry

**Everything revolves around recording the next ball. That's it!**

---

## 📱 Main Interface (What Admins See)

### **Top Section: Match Info**
```
Match: RCB vs CSK
Innings: 1 | Over: 12.3 | Batting: RCB
```

### **Score Display**
```
RCB: 145/3 (12.3 overs)
CSK: Yet to bat
```

### **Current Players**
```
Batter: Kohli (45* off 32) | SR: 140.6
Bowler: Bumrah (1/28 off 3.3) | Econ: 8.0
```

### **Ball Entry Buttons** (Large, Touch-Friendly)
```
┌─────┬─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  4  │  6  │
└─────┴─────┴─────┴─────┴─────┘
┌─────┬─────┬─────┬─────┬─────┐
│  W  │ WD  │ NB  │  B  │ LB  │
└─────┴─────┴─────┴─────┴─────┘
```

### **Quick Actions**
```
[Change Batter] [Change Bowler] [Undo Last Ball]
```

---

## ⚡ Common Actions

### **Recording a Normal Ball:**
1. Click the runs button (0, 1, 2, 4, 6)
2. Done! System auto-updates everything

### **Recording a Wicket:**
1. Click "W" button
2. Select dismissal type (Bowled, Caught, LBW, etc.)
3. If needed, select fielder
4. Confirm
5. New batter automatically comes in

### **Recording Extras:**
- **Wide (WD)**: Click "WD" → +1 run, ball doesn't count
- **No-Ball (NB)**: Click "NB" → +1 run, ball doesn't count
- **Bye (B)**: Click "B" → +1 run, ball counts
- **Leg-Bye (LB)**: Click "LB" → +1 run, ball counts

### **Changing Players:**
1. Click "Change Batter" or "Change Bowler"
2. Select from dropdown
3. Done!

### **Undoing a Mistake:**
1. Click "Undo Last Ball"
2. Last ball is removed
3. Can undo up to 5 balls

---

## 🎨 Visual Design Principles

### **Color Coding:**
- **Green**: Runs (0, 1, 2, 4, 6)
- **Red**: Wicket (W)
- **Orange**: Extras (WD, NB)
- **Blue**: Actions (Change Player, Undo)
- **Gold**: Save/Publish

### **Button Sizes:**
- **Ball Entry Buttons**: 80x80px minimum
- **Action Buttons**: 60x40px
- **Touch Targets**: Minimum 44x44px (Apple HIG)

### **Spacing:**
- **Between Buttons**: 12px
- **Section Padding**: 24px
- **Screen Margins**: 16px

---

## 📊 Data Flow

```
Admin Clicks Button
    ↓
System Calculates:
    - Team runs
    - Team wickets  
    - Team overs
    - Batter stats
    - Bowler stats
    - Over progression
    ↓
Updates Display
    ↓
Auto-Saves (every 30s)
    ↓
Publishes to End-Users
```

---

## 🔄 State Management

### **What Gets Stored:**
```typescript
{
  matchId: "123",
  innings: 1,
  battingTeam: "team1",
  currentOver: 12.3,  // Calculated from balls
  team1: {
    runs: 145,
    wickets: 3,
    balls: 75  // Internal calculation
  },
  team2: {
    runs: 0,
    wickets: 0,
    balls: 0
  },
  currentBatter: { id: "p1", runs: 45, balls: 32 },
  currentBowler: { id: "p2", runs: 28, balls: 21 },
  ballHistory: [
    { ball: 1, runs: 4, type: "normal" },
    { ball: 2, runs: 1, type: "normal" },
    { ball: 3, runs: 0, type: "wicket", dismissal: "caught" }
  ]
}
```

---

## 🚨 Error Prevention

### **Validations:**
- Wickets can't exceed 10
- Overs can't exceed 20 (T20)
- Runs can't be negative
- Ball count must match over display

### **Warnings (Non-Blocking):**
- "Wickets > 10" → Yellow warning
- "Overs > 20" → Yellow warning
- "Negative runs" → Red error

### **Confirmations:**
- Wicket entry → Confirm dismissal type
- End innings → Confirm
- End match → Double confirm

---

## 📱 Mobile Optimization

### **Portrait Mode:**
- Buttons stack vertically
- Score at top
- Ball buttons in grid (2 rows)
- Actions at bottom

### **Landscape Mode:**
- Buttons in single row
- Score on left
- Ball buttons on right
- More compact

### **Touch Gestures:**
- **Swipe Left**: Undo last ball
- **Swipe Right**: Redo (if available)
- **Long Press**: Show ball details

---

## 🎓 Training Scenarios

### **Scenario 1: Normal Over**
1. Over 12.1: Click "4" → 4 runs
2. Over 12.2: Click "1" → 1 run
3. Over 12.3: Click "0" → Dot ball
4. Over 12.4: Click "6" → Six!
5. Over 12.5: Click "2" → 2 runs
6. Over 12.6: Click "1" → 1 run
7. **Over complete!** System auto-advances to 13.0

### **Scenario 2: Wicket Over**
1. Over 13.1: Click "W" → Select "Caught" → Select fielder → Confirm
2. New batter comes in automatically
3. Over 13.2: Click "1" → 1 run
4. Continue...

### **Scenario 3: Extras**
1. Over 13.3: Click "WD" → Wide, +1 run, ball doesn't count
2. Over 13.3 (retake): Click "4" → 4 runs
3. Total: 5 runs from that delivery

---

## 🔧 Technical Implementation Tips

### **State Updates:**
```typescript
// When ball is recorded
const handleBall = (runs: number) => {
  // Update team runs
  setTeamRuns(prev => prev + runs);
  
  // Update batter runs
  setBatterRuns(prev => prev + runs);
  
  // Update bowler runs
  setBowlerRuns(prev => prev + runs);
  
  // Increment balls (if legal delivery)
  setBalls(prev => prev + 1);
  
  // Calculate overs
  const overs = ballsToOvers(balls + 1);
  setOvers(overs);
  
  // Add to history
  addToHistory({ runs, timestamp: Date.now() });
};
```

### **Auto-Save:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (hasChanges) {
      saveToAPI();
      setHasChanges(false);
    }
  }, 30000); // Every 30 seconds
  
  return () => clearInterval(interval);
}, [hasChanges]);
```

---

## 📋 Checklist for Admins

### **Before Match:**
- [ ] Select correct match
- [ ] Set toss winner
- [ ] Set toss decision
- [ ] Set match status to "Live"
- [ ] Select starting batter
- [ ] Select starting bowler

### **During Match:**
- [ ] Record each ball accurately
- [ ] Change players when needed
- [ ] Add commentary for key moments
- [ ] Check scorecard periodically

### **After Match:**
- [ ] Click "End Match"
- [ ] Enter result text
- [ ] Verify final scorecard
- [ ] Save and publish

---

## 🆘 Troubleshooting

### **Problem: Wrong score displayed**
- **Solution**: Check ball history, undo incorrect balls

### **Problem: Can't change player**
- **Solution**: Ensure player is in the team roster

### **Problem: Over count wrong**
- **Solution**: System auto-calculates, check if wides/no-balls are recorded correctly

### **Problem: Score not saving**
- **Solution**: Check internet connection, manual save button available

---

## 💡 Pro Tips

1. **Use Undo Liberally**: Better to undo and redo than have wrong data
2. **Check Every Over**: Verify scorecard at end of each over
3. **Save Frequently**: Don't rely only on auto-save
4. **Test Before Match**: Do a practice run with a test match
5. **Keep Backup**: Take screenshots of scorecard periodically

---

**Remember**: The interface should be so simple that admins can focus on the match, not the software!

