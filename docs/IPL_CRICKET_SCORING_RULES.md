# IPL Cricket Scoring Rules - Comprehensive Guide

This document provides a complete reference for all scoring rules in IPL cricket, including runs, extras, and dismissals.

---

## 📊 Table of Contents

1. [Regular Runs](#regular-runs)
2. [Extras](#extras)
3. [Combined Scoring (Extras + Runs)](#combined-scoring-extras--runs)
4. [Dismissals](#dismissals)
5. [Scoring Impact Summary](#scoring-impact-summary)
6. [Implementation Notes](#implementation-notes)

---

## 🏏 Regular Runs

### **0 Runs (Dot Ball)**
- **Description**: Batter hits the ball but doesn't score any runs
- **Team Score**: +0
- **Batter Runs**: +0
- **Batter Balls**: +1 (counts as legal delivery)
- **Bowler Runs Conceded**: +0
- **Bowler Balls**: +1 (counts as legal delivery)
- **Ball Count**: +1 (legal delivery)

### **1 Run**
- **Description**: Batter hits the ball and completes 1 run between wickets
- **Team Score**: +1
- **Batter Runs**: +1
- **Batter Balls**: +1
- **Bowler Runs Conceded**: +1
- **Bowler Balls**: +1
- **Ball Count**: +1

### **2 Runs**
- **Description**: Batter hits the ball and completes 2 runs between wickets
- **Team Score**: +2
- **Batter Runs**: +2
- **Batter Balls**: +1
- **Bowler Runs Conceded**: +2
- **Bowler Balls**: +1
- **Ball Count**: +1

### **3 Runs**
- **Description**: Batter hits the ball and completes 3 runs between wickets
- **Team Score**: +3
- **Batter Runs**: +3
- **Batter Balls**: +1
- **Bowler Runs Conceded**: +3
- **Bowler Balls**: +1
- **Ball Count**: +1

### **4 Runs (Boundary)**
- **Description**: Ball crosses the boundary after touching the ground
- **Team Score**: +4
- **Batter Runs**: +4
- **Batter Balls**: +1
- **Bowler Runs Conceded**: +4
- **Bowler Balls**: +1
- **Ball Count**: +1
- **Special**: Triggers boundary celebration animation

### **6 Runs (Six)**
- **Description**: Ball crosses the boundary without touching the ground
- **Team Score**: +6
- **Batter Runs**: +6
- **Batter Balls**: +1
- **Bowler Runs Conceded**: +6
- **Bowler Balls**: +1
- **Ball Count**: +1
- **Special**: Triggers boundary celebration animation (enhanced for sixes)

---

## 🎯 Extras

### **No Ball (NB)**
- **Description**: Illegal delivery (e.g., overstepping crease, dangerous bowling)
- **Team Score**: +1 (automatic extra run)
- **Batter Runs**: +0 (unless runs are scored off the bat)
- **Batter Balls**: +0 (does NOT count as legal delivery)
- **Bowler Runs Conceded**: +1 (minimum)
- **Bowler Balls**: +0 (does NOT count as legal delivery)
- **Ball Count**: +0 (illegal delivery, must be re-bowled)
- **Special Rules**:
  - Batter cannot be dismissed (except run out, hit wicket, obstructing field, handled ball)
  - Next delivery is a "Free Hit" (batter can only be dismissed by run out)
  - If batter scores runs off the bat, those runs are added to batter's score AND team score

### **Wide (WD)**
- **Description**: Delivery too wide or high for batter to play a normal shot
- **Team Score**: +1 (automatic extra run)
- **Batter Runs**: +0 (unless runs are scored)
- **Batter Balls**: +0 (does NOT count as legal delivery)
- **Bowler Runs Conceded**: +1 (minimum)
- **Bowler Balls**: +0 (does NOT count as legal delivery)
- **Ball Count**: +0 (illegal delivery, must be re-bowled)
- **Special Rules**:
  - Batter cannot be dismissed (except run out, stumped, hit wicket, obstructing field)
  - If batter hits the ball and scores runs, those runs are added

### **Bye (B)**
- **Description**: Ball passes batter without contact, wicketkeeper fails to stop it, runs are taken
- **Team Score**: +1 (or more if multiple runs)
- **Batter Runs**: +0 (byes don't count as batter runs)
- **Batter Balls**: +1 (counts as legal delivery)
- **Bowler Runs Conceded**: +0 (byes don't count against bowler)
- **Bowler Balls**: +1 (counts as legal delivery)
- **Ball Count**: +1 (legal delivery)
- **Special**: Can be 1, 2, 3, or 4 byes (if ball reaches boundary = 4 byes)

### **Leg Bye (LB)**
- **Description**: Ball hits batter's body (not bat), batter attempts shot or evades, runs are taken
- **Team Score**: +1 (or more if multiple runs)
- **Batter Runs**: +0 (leg byes don't count as batter runs)
- **Batter Balls**: +1 (counts as legal delivery)
- **Bowler Runs Conceded**: +0 (leg byes don't count against bowler)
- **Bowler Balls**: +1 (counts as legal delivery)
- **Ball Count**: +1 (legal delivery)
- **Special**: Can be 1, 2, 3, or 4 leg byes (if ball reaches boundary = 4 leg byes)
- **Requirement**: Batter must have attempted to play the ball or tried to evade it

---

## 🔄 Combined Scoring (Extras + Runs)

### **No Ball + Runs (NB+1, NB+2, NB+3, NB+4, NB+6)**

#### **NB+1 (No Ball + 1 Run)**
- **Description**: No ball is bowled, batter hits the ball and scores 1 run
- **Team Score**: +2 (1 for no ball + 1 for run)
- **Batter Runs**: +1 (runs scored off the bat)
- **Batter Balls**: +0 (no ball doesn't count)
- **Bowler Runs Conceded**: +2 (1 for no ball + 1 for run)
- **Bowler Balls**: +0 (no ball doesn't count)
- **Ball Count**: +0 (must be re-bowled)

#### **NB+2 (No Ball + 2 Runs)**
- **Team Score**: +3 (1 for no ball + 2 for runs)
- **Batter Runs**: +2
- **Batter Balls**: +0
- **Bowler Runs Conceded**: +3
- **Bowler Balls**: +0
- **Ball Count**: +0

#### **NB+3 (No Ball + 3 Runs)**
- **Team Score**: +4 (1 for no ball + 3 for runs)
- **Batter Runs**: +3
- **Batter Balls**: +0
- **Bowler Runs Conceded**: +4
- **Bowler Balls**: +0
- **Ball Count**: +0

#### **NB+4 (No Ball + 4 Runs)**
- **Team Score**: +5 (1 for no ball + 4 for runs)
- **Batter Runs**: +4
- **Batter Balls**: +0
- **Bowler Runs Conceded**: +5
- **Bowler Balls**: +0
- **Ball Count**: +0
- **Special**: Triggers boundary celebration (4 runs scored)

#### **NB+6 (No Ball + 6 Runs)**
- **Team Score**: +7 (1 for no ball + 6 for runs)
- **Batter Runs**: +6
- **Batter Balls**: +0
- **Bowler Runs Conceded**: +7
- **Bowler Balls**: +0
- **Ball Count**: +0
- **Special**: Triggers boundary celebration (6 runs scored)

### **Wide + Runs (WD+1, WD+2, WD+3, WD+4)**

#### **WD+1 (Wide + 1 Run)**
- **Description**: Wide ball is bowled, batter hits the ball and scores 1 run
- **Team Score**: +2 (1 for wide + 1 for run)
- **Batter Runs**: +1 (runs scored off the bat)
- **Batter Balls**: +0 (wide doesn't count)
- **Bowler Runs Conceded**: +2 (1 for wide + 1 for run)
- **Bowler Balls**: +0 (wide doesn't count)
- **Ball Count**: +0 (must be re-bowled)

#### **WD+2 (Wide + 2 Runs)**
- **Team Score**: +3 (1 for wide + 2 for runs)
- **Batter Runs**: +2
- **Batter Balls**: +0
- **Bowler Runs Conceded**: +3
- **Bowler Balls**: +0
- **Ball Count**: +0

#### **WD+3 (Wide + 3 Runs)**
- **Team Score**: +4 (1 for wide + 3 for runs)
- **Batter Runs**: +3
- **Batter Balls**: +0
- **Bowler Runs Conceded**: +4
- **Bowler Balls**: +0
- **Ball Count**: +0

#### **WD+4 (Wide + 4 Runs)**
- **Team Score**: +5 (1 for wide + 4 for runs)
- **Batter Runs**: +4
- **Batter Balls**: +0
- **Bowler Runs Conceded**: +5
- **Bowler Balls**: +0
- **Ball Count**: +0
- **Special**: Triggers boundary celebration (4 runs scored)

**Note**: WD+6 is theoretically possible but extremely rare (wide ball hit for six)

### **Byes + Runs (1 Bye, 2 Byes, 3 Byes, 4 Byes)**

#### **1 Bye**
- **Team Score**: +1
- **Batter Runs**: +0
- **Batter Balls**: +1
- **Bowler Runs Conceded**: +0
- **Bowler Balls**: +1
- **Ball Count**: +1

#### **2 Byes**
- **Team Score**: +2
- **Batter Runs**: +0
- **Batter Balls**: +1
- **Bowler Runs Conceded**: +0
- **Bowler Balls**: +1
- **Ball Count**: +1

#### **3 Byes**
- **Team Score**: +3
- **Batter Runs**: +0
- **Batter Balls**: +1
- **Bowler Runs Conceded**: +0
- **Bowler Balls**: +1
- **Ball Count**: +1

#### **4 Byes (Boundary Byes)**
- **Team Score**: +4
- **Batter Runs**: +0
- **Batter Balls**: +1
- **Bowler Runs Conceded**: +0
- **Bowler Balls**: +1
- **Ball Count**: +1
- **Special**: Ball reaches boundary without being touched

### **Leg Byes + Runs (1 Leg Bye, 2 Leg Byes, 3 Leg Byes, 4 Leg Byes)**

#### **1 Leg Bye**
- **Team Score**: +1
- **Batter Runs**: +0
- **Batter Balls**: +1
- **Bowler Runs Conceded**: +0
- **Bowler Balls**: +1
- **Ball Count**: +1

#### **2 Leg Byes**
- **Team Score**: +2
- **Batter Runs**: +0
- **Batter Balls**: +1
- **Bowler Runs Conceded**: +0
- **Bowler Balls**: +1
- **Ball Count**: +1

#### **3 Leg Byes**
- **Team Score**: +3
- **Batter Runs**: +0
- **Batter Balls**: +1
- **Bowler Runs Conceded**: +0
- **Bowler Balls**: +1
- **Ball Count**: +1

#### **4 Leg Byes (Boundary Leg Byes)**
- **Team Score**: +4
- **Batter Runs**: +0
- **Batter Balls**: +1
- **Bowler Runs Conceded**: +0
- **Bowler Balls**: +1
- **Ball Count**: +1
- **Special**: Ball reaches boundary after hitting batter's body

---

## 🚪 Dismissals (Wickets)

### **1. Bowled**
- **Description**: Ball hits the stumps and dislodges the bails
- **Team Wickets**: +1
- **Batter**: Out
- **Batter Runs**: No change (runs scored before dismissal count)
- **Batter Balls**: +1 (if legal delivery)
- **Bowler Wickets**: +1
- **Bowler Runs Conceded**: +0 (unless runs were scored)
- **Bowler Balls**: +1 (if legal delivery)
- **Ball Count**: +1 (if legal delivery)
- **Notation**: "b [Bowler Name]"

### **2. Caught**
- **Description**: Fielder catches the ball on the full after batter hits it
- **Team Wickets**: +1
- **Batter**: Out
- **Batter Runs**: No change (runs scored before dismissal count)
- **Batter Balls**: +1 (if legal delivery)
- **Bowler Wickets**: +1
- **Bowler Runs Conceded**: +runs (runs scored on that ball)
- **Bowler Balls**: +1 (if legal delivery)
- **Ball Count**: +1 (if legal delivery)
- **Notation**: "c [Fielder Name] b [Bowler Name]"
- **Special**: Can be caught by wicketkeeper, slips, or any fielder

### **3. Leg Before Wicket (LBW)**
- **Description**: Ball strikes batter's body (not bat) in line with stumps, would have hit stumps
- **Team Wickets**: +1
- **Batter**: Out
- **Batter Runs**: No change
- **Batter Balls**: +1 (if legal delivery)
- **Bowler Wickets**: +1
- **Bowler Runs Conceded**: +0 (unless runs were scored before dismissal)
- **Bowler Balls**: +1 (if legal delivery)
- **Ball Count**: +1 (if legal delivery)
- **Notation**: "lbw b [Bowler Name]"
- **Special Rules**:
  - Ball must pitch in line with or outside off stump
  - If ball pitches outside leg stump, batter cannot be out LBW
  - If batter attempts a shot, more lenient interpretation

### **4. Stumped**
- **Description**: Wicketkeeper removes bails while batter is out of crease and not attempting a run
- **Team Wickets**: +1
- **Batter**: Out
- **Batter Runs**: No change
- **Batter Balls**: +1 (if legal delivery)
- **Bowler Wickets**: +1 (credited to bowler)
- **Bowler Runs Conceded**: +0 (unless runs were scored)
- **Bowler Balls**: +1 (if legal delivery)
- **Ball Count**: +1 (if legal delivery)
- **Notation**: "st [Wicketkeeper Name] b [Bowler Name]"
- **Special**: Usually happens when batter steps forward to play a shot and misses

### **5. Run Out**
- **Description**: Fielder hits stumps with ball while batter is out of crease
- **Team Wickets**: +1
- **Batter**: Out
- **Batter Runs**: No change (runs scored before dismissal count)
- **Batter Balls**: +1 (if legal delivery)
- **Bowler Wickets**: +0 (NOT credited to bowler)
- **Bowler Runs Conceded**: +runs (runs scored on that ball)
- **Bowler Balls**: +1 (if legal delivery)
- **Ball Count**: +1 (if legal delivery)
- **Notation**: "run out ([Fielder Name])"
- **Special**: Can happen on any ball, including no balls and wides

### **6. Hit Wicket**
- **Description**: Batter dislodges bails with bat or body after bowler enters delivery stride
- **Team Wickets**: +1
- **Batter**: Out
- **Batter Runs**: No change
- **Batter Balls**: +1 (if legal delivery)
- **Bowler Wickets**: +1
- **Bowler Runs Conceded**: +runs (runs scored on that ball)
- **Bowler Balls**: +1 (if legal delivery)
- **Ball Count**: +1 (if legal delivery)
- **Notation**: "hit wicket b [Bowler Name]"

### **7. Obstructing the Field**
- **Description**: Batter deliberately obstructs fielder from making a play
- **Team Wickets**: +1
- **Batter**: Out
- **Batter Runs**: No change
- **Batter Balls**: +1 (if legal delivery)
- **Bowler Wickets**: +0 (NOT credited to bowler)
- **Bowler Runs Conceded**: +runs (runs scored on that ball)
- **Bowler Balls**: +1 (if legal delivery)
- **Ball Count**: +1 (if legal delivery)
- **Notation**: "obstructing the field"

### **8. Handled the Ball**
- **Description**: Batter uses hand to return ball to fielder without consent
- **Team Wickets**: +1
- **Batter**: Out
- **Batter Runs**: No change
- **Batter Balls**: +1 (if legal delivery)
- **Bowler Wickets**: +0 (NOT credited to bowler)
- **Bowler Runs Conceded**: +runs (runs scored on that ball)
- **Bowler Balls**: +1 (if legal delivery)
- **Ball Count**: +1 (if legal delivery)
- **Notation**: "handled the ball"
- **Note**: Very rare, now often grouped with "obstructing the field"

### **9. Hit the Ball Twice**
- **Description**: Batter intentionally strikes ball twice (except to protect wicket)
- **Team Wickets**: +1
- **Batter**: Out
- **Batter Runs**: No change
- **Batter Balls**: +1 (if legal delivery)
- **Bowler Wickets**: +0 (NOT credited to bowler)
- **Bowler Runs Conceded**: +runs (runs scored on that ball)
- **Bowler Balls**: +1 (if legal delivery)
- **Ball Count**: +1 (if legal delivery)
- **Notation**: "hit the ball twice"

### **10. Timed Out**
- **Description**: New batter takes longer than 3 minutes to reach crease after previous dismissal
- **Team Wickets**: +1
- **Batter**: Out (before facing a ball)
- **Batter Runs**: 0
- **Batter Balls**: 0
- **Bowler Wickets**: +0 (NOT credited to bowler)
- **Bowler Runs Conceded**: +0
- **Bowler Balls**: +0
- **Ball Count**: +0
- **Notation**: "timed out"
- **Note**: Extremely rare in professional cricket

---

## 📋 Scoring Impact Summary

### **Quick Reference Table**

| Event | Team Score | Batter Runs | Batter Balls | Bowler Runs | Bowler Balls | Ball Count | Notes |
|-------|-----------|-------------|--------------|-------------|--------------|------------|-------|
| **0** | +0 | +0 | +1 | +0 | +1 | +1 | Dot ball |
| **1** | +1 | +1 | +1 | +1 | +1 | +1 | Single |
| **2** | +2 | +2 | +1 | +2 | +1 | +1 | Two runs |
| **3** | +3 | +3 | +1 | +3 | +1 | +1 | Three runs |
| **4** | +4 | +4 | +1 | +4 | +1 | +1 | Boundary (4) |
| **6** | +6 | +6 | +1 | +6 | +1 | +1 | Six |
| **NB** | +1 | +0 | +0 | +1 | +0 | +0 | No ball only |
| **NB+1** | +2 | +1 | +0 | +2 | +0 | +0 | No ball + 1 run |
| **NB+2** | +3 | +2 | +0 | +3 | +0 | +0 | No ball + 2 runs |
| **NB+4** | +5 | +4 | +0 | +5 | +0 | +0 | No ball + 4 runs |
| **NB+6** | +7 | +6 | +0 | +7 | +0 | +0 | No ball + 6 runs |
| **WD** | +1 | +0 | +0 | +1 | +0 | +0 | Wide only |
| **WD+1** | +2 | +1 | +0 | +2 | +0 | +0 | Wide + 1 run |
| **WD+2** | +3 | +2 | +0 | +3 | +0 | +0 | Wide + 2 runs |
| **WD+4** | +5 | +4 | +0 | +5 | +0 | +0 | Wide + 4 runs |
| **1B** | +1 | +0 | +1 | +0 | +1 | +1 | 1 bye |
| **2B** | +2 | +0 | +1 | +0 | +1 | +1 | 2 byes |
| **3B** | +3 | +0 | +1 | +0 | +1 | +1 | 3 byes |
| **4B** | +4 | +0 | +1 | +0 | +1 | +1 | 4 byes (boundary) |
| **1LB** | +1 | +0 | +1 | +0 | +1 | +1 | 1 leg bye |
| **2LB** | +2 | +0 | +1 | +0 | +1 | +1 | 2 leg byes |
| **3LB** | +3 | +0 | +1 | +0 | +1 | +1 | 3 leg byes |
| **4LB** | +4 | +0 | +1 | +0 | +1 | +1 | 4 leg byes (boundary) |
| **W (Bowled)** | +0 | +0 | +1 | +0 | +1 | +1 | Wicket |
| **W (Caught)** | +runs | +runs | +1 | +runs | +1 | +1 | Wicket + runs |
| **W (LBW)** | +0 | +0 | +1 | +0 | +1 | +1 | Wicket |
| **W (Stumped)** | +0 | +0 | +1 | +0 | +1 | +1 | Wicket |

---

## 💻 Implementation Notes

### **Current Implementation Status**

The current system (`useLiveScore.ts`) handles:
- ✅ Regular runs (0, 1, 2, 3, 4, 6)
- ✅ Basic extras (WD, NB, B, LB)
- ✅ Wickets (W)
- ❌ **Missing**: No ball + runs (NB+1, NB+2, NB+4, NB+6)
- ❌ **Missing**: Wide + runs (WD+1, WD+2, WD+4)
- ❌ **Missing**: Multiple byes (2B, 3B, 4B)
- ❌ **Missing**: Multiple leg byes (2LB, 3LB, 4LB)
- ❌ **Missing**: Detailed dismissal types (currently generic "W")

### **Recommended Enhancements**

1. **Extend BallEvent Type**:
   ```typescript
   export interface BallEvent {
     type: number | 'W' | 'WD' | 'NB' | 'B' | 'LB' | 
           'NB+1' | 'NB+2' | 'NB+3' | 'NB+4' | 'NB+6' |
           'WD+1' | 'WD+2' | 'WD+3' | 'WD+4' |
           '1B' | '2B' | '3B' | '4B' |
           '1LB' | '2LB' | '3LB' | '4LB';
     runs: number;
     timestamp: number;
     dismissalType?: 'bowled' | 'caught' | 'lbw' | 'stumped' | 'run out' | 
                     'hit wicket' | 'obstructing field' | 'handled ball' | 
                     'hit ball twice' | 'timed out';
     fielderName?: string;
   }
   ```

2. **Update recordBall Logic**:
   - Handle combined extras (NB+1, WD+1, etc.)
   - Handle multiple byes/leg byes
   - Properly credit runs to batter/bowler based on event type
   - Track ball count correctly (illegal deliveries don't count)

3. **UI Enhancements**:
   - Add buttons for NB+1, NB+2, NB+4, NB+6
   - Add buttons for WD+1, WD+2, WD+4
   - Add buttons for 2B, 3B, 4B
   - Add buttons for 2LB, 3LB, 4LB
   - Enhanced wicket modal with all 10 dismissal types
   - Visual indicators for free hits (after no ball)

4. **Commentary System**:
   - Update `RichCommentary` to handle all new event types
   - Add proper descriptions for combined extras
   - Show dismissal notation correctly

---

## 📚 References

- [MCC Laws of Cricket](https://www.lords.org/mcc/the-laws-of-cricket)
- [ICC Playing Conditions](https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions)
- [IPL Official Playing Conditions](https://documents.iplt20.com/bcci/documents/1742707993986_Match_Playing_Conditions.pdf)
- [Wikipedia - Cricket Scoring](https://en.wikipedia.org/wiki/Scoring_in_cricket)

---

**Last Updated**: 2024
**Version**: 1.0

