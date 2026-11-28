#!/usr/bin/env python3
"""
Sync IPL 2027 Retained & Traded Player List
Source: Official "TATA IPL 2027 - Retained Player List" document
"""
import json
import os
import re

# Official Document Data
# Format: (Player Name, Salary in Lakhs, isOverseas, isTrade)
OFFICIAL_DATA = {
    'CSK': [
        ('Akeal Hosein', 200, True, False),
        ('Anshul Kamboj', 340, False, False),
        ('Ayush Mhatre', 30, False, False),
        ('Dewald Brevis', 220, True, False),
        ('Gurjapneet Singh', 220, False, False),
        ('Jack Edwards', 300, True, True),
        ('Jamie Overton', 150, True, False),
        ('Kartik Sharma', 1420, False, False),
        ('Liam Livingstone', 600, True, True),
        ('Mukesh Choudhary', 30, False, False),
        ('Noor Ahmad', 1000, True, False),
        ('Rahul Chahar', 520, False, False),
        ('Ramakrishna Ghosh', 30, False, False),
        ('Ruturaj Gaikwad', 1800, False, False),
        ('Sanju Samson', 1800, False, False),
        ('Sarfaraz Khan', 75, False, False),
        ('Shivam Dube', 1200, False, False),
        ('Shreyas Gopal', 30, False, False),
        ('Urvil Patel', 30, False, False),
    ],
    'DC': [
        ('Ashutosh Sharma', 380, False, False),
        ('Auqib Dar', 840, False, False),
        ('Axar Patel', 1650, False, False),
        ('David Miller', 200, True, False),
        ('KL Rahul', 1400, False, False),
        ('Kyle Jamieson', 200, True, False),
        ('Lungisani Ngidi', 200, True, False),
        ('Madhav Tiwari', 40, False, False),
        ('Mukesh Kumar', 800, False, False),
        ('Prithvi Shaw', 75, False, False),
        ('Rishabh Pant', 1500, False, True),
        ('Sameer Rizvi', 95, False, False),
        ('Tripurana Vijay', 30, False, False),
        ('Tristan Stubbs', 1000, True, False),
        ('Vipraj Nigam', 50, False, False),
        ('Zeeshan Ansari', 40, False, True),
    ],
    'GT': [
        ('Anuj Rawat', 30, False, False),
        ('Ashok Sharma', 90, False, False),
        ('Glenn Phillips', 200, True, False),
        ('Gurnoor Singh Brar', 130, False, False),
        ('Harshal Patel', 400, False, True),
        ('Jason Holder', 700, True, False),
        ('Jayant Yadav', 75, False, False),
        ('Jos Buttler', 1575, True, False),
        ('Kagiso Rabada', 1075, True, False),
        ('Kumar Kushagra', 65, False, False),
        ('Manav Suthar', 30, False, False),
        ('Mohammad Siraj', 1225, False, False),
        ('Mohd. Arshad Khan', 130, False, False),
        ('Nishant Sindhu', 30, False, False),
        ('Prasidh Krishna', 950, False, False),
        ('R. Sai Kishore', 200, False, False),
        ('Rahul Tewatia', 400, False, False),
        ('Rashid Khan', 1800, True, False),
        ('Sai Sudharsan', 850, False, False),
        ('Shubman Gill', 1650, False, False),
        ('Tom Banton', 200, True, False),
        ('Washington Sundar', 320, False, False),
    ],
    'KKR': [
        ('Angkrish Raghuvanshi', 300, False, False),
        ('Anukul Roy', 40, False, False),
        ('Cameron Green', 2520, True, False),
        ('Finn Allen', 200, True, False),
        ('Harshit Rana', 400, False, False),
        ('Kartik Tyagi', 30, False, False),
        ('Manish Pandey', 75, False, False),
        ('Prashant Solanki', 30, False, False),
        ('Ramandeep Singh', 400, False, False),
        ('Rinku Singh', 1300, False, False),
        ('Rovman Powell', 150, True, False),
        ('Sarthak Ranjan', 30, False, False),
        ('Saurabh Dubey', 30, False, False),
        ('Sunil Narine', 1200, True, False),
        ('Tim Seifert', 150, True, False),
        ('Vaibhav Arora', 180, False, False),
        ('Varun Chakaravarthy', 1200, False, False),
    ],
    'LSG': [
        ('Abdul Samad', 420, False, False),
        ('Aiden Markram', 200, True, False),
        ('Akash Singh', 30, False, False),
        ('Akshat Raghuwanshi', 220, False, False),
        ('Arjun Tendulkar', 30, False, False),
        ('Arshin Kulkarni', 30, False, False),
        ('Ayush Badoni', 400, False, False),
        ('Digvesh Rathi', 30, False, False),
        ('Josh Inglis', 860, True, False),
        ('Kuldeep Yadav', 1325, False, True),
        ('Mayank Yadav', 1100, False, False),
        ('Mitchell Marsh', 340, True, False),
        ('Mohsin Khan', 400, False, False),
        ('Mukul Choudhary', 260, False, False),
        ('Nicholas Pooran', 2100, True, False),
        ('Prince Yadav', 30, False, False),
        ('Sam Curran', 240, True, True),
        ('Shahbaz Ahmed', 240, False, False),
    ],
    'MI': [
        ('Arshdeep Singh', 1800, False, True),
        ('Ashwani Kumar', 30, False, False),
        ('Corbin Bosch', 75, True, False),
        ('Jasprit Bumrah', 1800, False, False),
        ('Mitchell Santner', 200, True, False),
        ('Naman Dhir', 525, False, False),
        ('Quinton de Kock', 100, True, False),
        ('Raghu Sharma', 30, False, False),
        ('Raj Angad Bawa', 30, False, False),
        ('Rohit Sharma', 1630, False, False),
        ('Ryan Rickelton', 100, True, False),
        ('Shardul Thakur', 200, False, False),
        ('Sherfane Rutherford', 260, True, False),
        ('Suryakumar Yadav', 1635, False, False),
        ('Tilak Varma', 800, False, False),
        ('Will Jacks', 525, True, False),
    ],
    'PBKS': [
        ('Azmatullah Omarzai', 240, True, False),
        ('Ben Dwarshuis', 440, True, False),
        ('Cooper Connolly', 300, True, False),
        ('Hardik Pandya', 1800, False, True),
        ('Harnoor Pannu', 30, False, False),
        ('Harpreet Brar', 150, False, False),
        ('Marco Jansen', 700, True, False),
        ('Marcus Stoinis', 1100, True, False),
        ('Musheer Khan', 30, False, False),
        ('Prabhsimran Singh', 400, False, False),
        ('Priyansh Arya', 380, False, False),
        ('Shashank Singh', 550, False, False),
        ('Shreyas Iyer', 2675, False, False),
        ('Suryansh Shedge', 30, False, False),
        ('Vishnu Vinod', 95, False, False),
        ('Vyshak Vijaykumar', 180, False, False),
        ('Xavier Bartlett', 80, True, False),
        ('Yash Thakur', 160, False, False),
        ('Yuzvendra Chahal', 1800, False, False),
    ],
    'RR': [
        ('Aman Rao Perala', 30, False, False),
        ('Brijesh Sharma', 30, False, False),
        ('Dasun Shanaka', 200, True, False),
        ('Dhruv Jurel', 1400, False, False),
        ('Donovan Ferreira', 100, True, False),
        ('Jofra Archer', 1250, True, False),
        ('Lhuan-dre Pretorius', 30, True, False),
        ('Manimaran Siddharth', 75, False, True),
        ('Mohammed Shami', 800, False, True),
        ('Nandre Burger', 350, True, False),
        ('Ravi Bishnoi', 720, False, False),
        ('Ravindra Jadeja', 1400, False, False),
        ('Riyan Parag', 1400, False, False),
        ('Sandeep Sharma', 400, False, False),
        ('Shubham Dubey', 80, False, False),
        ('Sushant Mishra', 90, False, False),
        ('Vaibhav Sooryavanshi', 110, False, False),
        ('Yash Raj Punja', 30, False, False),
        ('Yashasvi Jaiswal', 1800, False, False),
    ],
    'RCB': [
        ('Abhinandan Singh', 30, False, False),
        ('Bhuvneshwar Kumar', 1075, False, False),
        ('Devdutt Padikkal', 200, False, False),
        ('Jacob Duffy', 200, True, False),
        ('Jitesh Sharma', 1100, False, False),
        ('Jordan Cox', 75, True, False),
        ('Josh Hazlewood', 1250, True, False),
        ('Kanishk Chouhan', 30, False, False),
        ('Krunal Pandya', 575, False, False),
        ('Nuwan Thushara', 160, True, False),
        ('Phil Salt', 1150, True, False),
        ('Rajat Patidar', 1100, False, False),
        ('Rasikh Dar', 600, False, False),
        ('Romario Shepherd', 150, True, False),
        ('Suyash Sharma', 260, False, False),
        ('Tim David', 300, True, False),
        ('Venkatesh Iyer', 700, False, False),
        ('Vicky Ostwal', 30, False, False),
        ('Virat Kohli', 2100, False, False),
        ('Yash Dayal', 500, False, False),
    ],
    'SRH': [
        ('Abhishek Sharma', 1400, False, False),
        ('Aniket Verma', 30, False, False),
        ('Brydon Carse', 100, True, False),
        ('Eshan Malinga', 120, True, False),
        ('Harsh Dubey', 30, False, False),
        ('Heinrich Klaasen', 2300, True, False),
        ('Ishan Kishan', 1125, False, False),
        ('Khaleel Ahmed', 480, False, True),
        ('Krains Fuletra', 30, False, False),
        ('Nathan Ellis', 200, True, True),
        ('Nitish Kumar Reddy', 600, False, False),
        ('Pat Cummins', 1800, True, False),
        ('Praful Hinge', 30, False, False),
        ('Sakib Hussain', 30, False, False),
        ('Salil Arora', 150, False, False),
        ('Shivang Kumar', 30, False, False),
        ('Smaran Ravichandran', 30, False, False),
        ('T. Natarajan', 500, False, True),
    ]
}

TEAM_METAS = {
    'RCB': {'id': '1', 'name': 'Royal Challengers Bengaluru', 'shortName': 'RCB'},
    'CSK': {'id': '10', 'name': 'Chennai Super Kings', 'shortName': 'CSK'},
    'MI': {'id': '2', 'name': 'Mumbai Indians', 'shortName': 'MI'},
    'KKR': {'id': '4', 'name': 'Kolkata Knight Riders', 'shortName': 'KKR'},
    'SRH': {'id': '3', 'name': 'Sunrisers Hyderabad', 'shortName': 'SRH'},
    'DC': {'id': '7', 'name': 'Delhi Capitals', 'shortName': 'DC'},
    'GT': {'id': '4_gt', 'name': 'Gujarat Titans', 'shortName': 'GT'},
    'LSG': {'id': '9', 'name': 'Lucknow Super Giants', 'shortName': 'LSG'},
    'PBKS': {'id': '5', 'name': 'Punjab Kings', 'shortName': 'PBKS'},
    'RR': {'id': '8', 'name': 'Rajasthan Royals', 'shortName': 'RR'}
}

ALIASES = {
    'auqib dar': 'auqib nabi',
    'lungisani ngidi': 'lungi ngidi',
    'gurnoor singh brar': 'gurnoor brar',
    'mohammad siraj': 'mohammed siraj',
    'mohd. arshad khan': 'arshad khan',
    'r. sai kishore': 'sai kishore',
    'rasikh dar': 'rasikh salam',
    't. natarajan': 't natarajan',
    'harnoor pannu': 'harnoor singh',
    'vyshak vijaykumar': 'vijaykumar vyshak',
    'raj angad bawa': 'raj bawa',
    'digvesh rathi': 'digvesh singh',
}

def norm(name):
    clean = name.lower().replace('\u00a0', ' ').strip()
    return ALIASES.get(clean, clean)

def format_fee(lakhs):
    if lakhs >= 100:
        cr = lakhs / 100.0
        if cr == int(cr):
            return f"₹{int(cr)}.00 Cr"
        else:
            return f"₹{cr:.2f} Cr"
    else:
        return f"₹{lakhs} Lakh"

def run_migration(apply_changes=False):
    with open('comprehensive-players.json', 'r') as f:
        db_players = json.load(f)

    with open('generated/ipl_players_stats_filled.json', 'r') as f:
        stats_cache = json.load(f)
    stats_by_name = {p['name'].lower().strip(): p for p in stats_cache if 'name' in p}

    db_lookup = {norm(p['name']): p for p in db_players}

    # Track which players in DB get retained/traded
    retained_db_ids = set()

    # Step 1: Process all 184 official document players
    for team_short, player_list in OFFICIAL_DATA.items():
        team_info = TEAM_METAS[team_short]
        for p_name, lakhs, is_os, is_trade in player_list:
            cname = norm(p_name)
            p = db_lookup.get(cname)

            fee_str = format_fee(lakhs)
            notes_str = (
                f"Traded to {team_short} ahead of IPL 2027 ({fee_str})"
                if is_trade
                else f"Retained by {team_short} for IPL 2027 ({fee_str})"
            )

            if p:
                retained_db_ids.add(p['id'])
                # Update team
                p['teamId'] = team_info['id']
                p['team'] = team_info['name']
                p['teamShortName'] = team_info['shortName']
                p['transferFee'] = fee_str
                p['transferAcquiredVia'] = 'trade' if is_trade else 'retention'
                p['transferNotes'] = notes_str
                p['squadStatus'] = 'Traded' if is_trade else 'Retained'
                p['isActiveInSquad'] = True

                # Special handling for nationalities
                if cname == 'lungisani ngidi':
                    p['nationality'] = 'South Africa'
                elif cname == 'nuwan thushara':
                    # User explicitly changed Nuwan Thushara; preserve user's setting
                    pass
            else:
                # Missing player! Restore from stats_cache
                cached = stats_by_name.get(p_name.lower().strip())
                new_id = str(max([int(x['id']) for x in db_players if str(x['id']).isdigit()] + [300]) + 1)
                new_player = {
                    'id': new_id,
                    'name': p_name,
                    'role': cached.get('role', 'All-rounder') if cached else 'All-rounder',
                    'allRounderType': cached.get('allrounderType', '') if cached else '',
                    'teamId': team_info['id'],
                    'team': team_info['name'],
                    'teamShortName': team_info['shortName'],
                    'league': 'ipl',
                    'age': cached.get('age', 25) if cached else 25,
                    'dateOfBirth': cached.get('dateOfBirth', '') if cached else '',
                    'nationality': ('Australia' if p_name == 'Cameron Green' else 'Sri Lanka' if p_name == 'Dasun Shanaka' else 'India'),
                    'jerseyNumber': cached.get('jerseyNumber') or (42 if p_name == 'Cameron Green' else 7 if p_name == 'Dasun Shanaka' else 23),
                    'isCaptain': False,
                    'battingStyle': cached.get('battingStyle', 'Right-handed bat') if cached else 'Right-handed bat',
                    'bowlingStyle': cached.get('bowlingStyle', 'Right-arm medium') if cached else 'Right-arm medium',
                    'transferAcquiredVia': 'trade' if is_trade else 'retention',
                    'transferFee': fee_str,
                    'transferNotes': notes_str,
                    'lastAuctionYear': 2026,
                    'stats': cached.get('stats', {}) if cached else {},
                    'isActiveInSquad': True,
                    'squadStatus': 'Traded' if is_trade else 'Retained'
                }
                db_players.append(new_player)
                db_lookup[cname] = new_player
                retained_db_ids.add(new_id)
                print(f"Restored missing player: {p_name} -> ID {new_id} ({team_short})")

    # Step 2: Move unretained players to 2027 Auction Standby Pool
    released_count = 0
    for p in db_players:
        if p['id'] not in retained_db_ids:
            # Check if this player was on a franchise squad
            current_team_id = str(p.get('teamId', '')).lower()
            current_status = str(p.get('squadStatus', '')).lower()

            if current_status == 'mentor':
                # Preserve mentor status, move to pool/staff so they don't count against 25-man playing squad
                p['teamId'] = 'pool'
                p['teamShortName'] = 'Pool'
                p['team'] = '2027 Auction Standby / Pool'
                p['transferFee'] = ''
                p['transferNotes'] = 'CSK Team Mentor / Legend'
                p['isActiveInSquad'] = False
                continue

            p['teamId'] = 'pool'
            p['teamShortName'] = 'Pool'
            p['team'] = '2027 Auction Standby / Pool'
            p['squadStatus'] = 'Released'
            p['transferFee'] = ''
            p['transferNotes'] = 'Released ahead of IPL 2027 Auction'
            p['isActiveInSquad'] = False
            released_count += 1

            # Fix corrupted nationalities for known players
            if p['name'] == 'Abishek Porel':
                p['nationality'] = 'India'
            elif p['name'] == 'Tushar Deshpande':
                p['nationality'] = 'India'
            elif p['name'] == 'Moeen Ali':
                p['nationality'] = 'England'
            elif p['name'] == 'Trent Boult':
                p['nationality'] = 'New Zealand'

    print(f"\nMigration Summary:")
    print(f"Total players in DB: {len(db_players)}")
    print(f"Retained / Traded players on 10 active franchises: {len(retained_db_ids)}")
    print(f"Players moved / retained in 2027 Standby Pool (RAPP): {len(db_players) - len(retained_db_ids)}")

    # Verify each team's roster count and total spent
    print("\n--- Team Verification ---")
    for t_short, p_list in OFFICIAL_DATA.items():
        t_id = TEAM_METAS[t_short]['id']
        actual_players = [p for p in db_players if p.get('teamShortName') == t_short and p['id'] in retained_db_ids]
        doc_count = len(p_list)
        print(f"{t_short}: {len(actual_players)} / {doc_count} players | Match: {len(actual_players) == doc_count}")

    if apply_changes:
        # Save to comprehensive-players.json
        with open('comprehensive-players.json', 'w') as f:
            json.dump(db_players, f, indent=2)
        print("Updated comprehensive-players.json")

        # Save to functions/data/comprehensive-players.json
        with open('functions/data/comprehensive-players.json', 'w') as f:
            json.dump(db_players, f, indent=2)
        print("Updated functions/data/comprehensive-players.json")

        # Save to functions/data/comprehensivePlayers.js
        with open('functions/data/comprehensivePlayers.js', 'w') as f:
            f.write("export const fallbackIplPlayers = ")
            json.dump(db_players, f, indent=2)
            f.write(";\n")
        print("Updated functions/data/comprehensivePlayers.js")

if __name__ == '__main__':
    import sys
    apply = '--apply' in sys.argv
    run_migration(apply_changes=apply)
