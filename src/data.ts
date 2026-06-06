/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Person, GiftHistoryEntry } from './types';

export const TODAY_DATE_STR = '2026-06-06';

export const INITIAL_PEOPLE: Person[] = [
  {
    id: 'person-1',
    name: 'Eleanor Vance',
    birthday: '06-10', // June 10 (within 7 days of June 6) -> error highlight
    birth_year: 1993,
    type: 'spouse',
    notes: 'Loves classic mystery novels and Earl Grey tea. Prefers experiences over material items.',
    gift_history: [
      {
        year: 2025,
        occasion: 'birthday',
        gave_item: 'Kindle Paperwhite Oasis',
        gave_amount: 250,
        received_item: 'Full Leather Wallet & Keychain',
        received_amount: 110
      },
      {
        year: 2024,
        occasion: 'birthday',
        gave_item: 'Spa Day Day-Pass Package',
        gave_amount: 180,
        received_item: 'Mechanical Keyboard (Cherry MX Brown)',
        received_amount: 140
      }
    ]
  },
  {
    id: 'person-2',
    name: 'Mary Vance',
    birthday: '06-15', // June 15 (within 14 days of June 6) -> warning highlight
    birth_year: 1965,
    type: 'parent',
    notes: 'Avid gardener. Keen on outdoor plants or reliable winter slippers.',
    gift_history: [
      {
        year: 2025,
        occasion: 'Mother\'s Day',
        gave_item: 'Bonsai Starter Kit with Pruning Scissors',
        gave_amount: 65,
        received_item: 'Homemade Strawberry Jam (x3 Jars)',
        received_amount: 20
      },
      {
        year: 2025,
        occasion: 'birthday',
        gave_item: 'Alpaca Wool Shawl',
        gave_amount: 120,
        received_item: 'Hand-knit Woolen Socks',
        received_amount: 45
      }
    ]
  },
  {
    id: 'person-3',
    name: 'Dave Vance',
    birthday: '07-20', // July 20 (upcoming)
    birth_year: 1995,
    type: 'sibling',
    notes: 'Enthusiastic board gamer and record collector. Indie rock fan.',
    gift_history: [
      {
        year: 2025,
        occasion: 'birthday',
        gave_item: 'Vinyl: "Ants From Up There" (Deluxe)',
        gave_amount: 45,
        received_item: 'Wingspan Board Game',
        received_amount: 55
      }
    ]
  },
  {
    id: 'person-4',
    name: 'Marcus Brody',
    birthday: '01-05', // Jan 5 (a while away)
    birth_year: 1992,
    type: 'close-friend',
    notes: 'Coffee enthusiast. Loves single-origin espresso beans and premium brewing accessories.',
    gift_history: [
      {
        year: 2025,
        occasion: 'birthday',
        gave_item: 'Fellow Carter Move Mug',
        gave_amount: 35,
        received_item: 'Hario V60 Ceramic Decanter',
        received_amount: 30
      },
      {
        year: 2024,
        occasion: 'birthday',
        gave_item: 'Premium Coffee Bean Subscription (3mo)',
        gave_amount: 75,
        received_item: 'Stainless Steel Whiskey Stones Set',
        received_amount: 40
      }
    ]
  },
  {
    id: 'person-5',
    name: 'Susan Harris',
    birthday: '10-12', // October 12
    birth_year: 1988,
    type: 'colleague',
    notes: 'Secret Santa or small birthday greetings. Prefers elegant stationary or desk accessories.',
    gift_history: [
      {
        year: 2025,
        occasion: 'birthday',
        gave_item: 'Fountain Pen & Inkwell Set',
        gave_amount: 40,
        received_item: 'Stumptown Coffee Gift Card',
        received_amount: 25
      }
    ]
  }
];

// Helper to check days until next birthday from a given reference date
export function getDaysUntilBirthday(birthdayStr: string, todayStr: string = TODAY_DATE_STR): number {
  const [mStr, dStr] = birthdayStr.split('-');
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  if (isNaN(month) || isNaN(day)) return 365;

  const today = new Date(todayStr);
  const currentYear = today.getFullYear();

  // Create birthday for this year
  let bday = new Date(currentYear, month - 1, day);

  // Strip time part of today
  const todayNoTime = new Date(currentYear, today.getMonth(), today.getDate());

  if (bday < todayNoTime) {
    bday = new Date(currentYear + 1, month - 1, day);
  }

  const diffTime = bday.getTime() - todayNoTime.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Helper to determine the age of a person at their next birthday or current age
export function getAge(birthYear: number | null, birthdayStr: string, todayStr: string = TODAY_DATE_STR): number | null {
  if (birthYear === null || isNaN(birthYear)) return null;

  const [mStr, dStr] = birthdayStr.split('-');
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  if (isNaN(month) || isNaN(day)) return null;

  const today = new Date(todayStr);
  const currentYear = today.getFullYear();

  let age = currentYear - birthYear;

  // If birthday hasn't happened yet this year, current age is (age - 1)
  const bdayThisYear = new Date(currentYear, month - 1, day);
  const todayNoTime = new Date(currentYear, today.getMonth(), today.getDate());
  if (todayNoTime < bdayThisYear) {
    return age - 1;
  }
  return age;
}

// Format date of birthday beautifully: e.g., "06-10" to "Jun 10"
export function formatBirthday(birthdayStr: string): string {
  const [mStr, dStr] = birthdayStr.split('-');
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  if (isNaN(month) || isNaN(day)) return birthdayStr;

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return `${monthNames[month - 1]} ${day}`;
}

export function getLastGave(history: GiftHistoryEntry[]): string {
  if (!history || history.length === 0) return 'None';
  // Sort descending by year
  const sorted = [...history]
    .filter(entry => entry.gave_item)
    .sort((a, b) => b.year - a.year);
  if (sorted.length === 0) return 'None';
  return `${sorted[0].gave_item} (${sorted[0].year})`;
}

export function getLastReceived(history: GiftHistoryEntry[]): string {
  if (!history || history.length === 0) return 'None';
  const sorted = [...history]
    .filter(entry => entry.received_item)
    .sort((a, b) => b.year - a.year);
  if (sorted.length === 0) return 'None';
  return `${sorted[0].received_item} (${sorted[0].year})`;
}

export function getTotalGave(history: GiftHistoryEntry[]): number {
  return history.reduce((sum, entry) => sum + (entry.gave_amount || 0), 0);
}

export function getTotalReceived(history: GiftHistoryEntry[]): number {
  return history.reduce((sum, entry) => sum + (entry.received_amount || 0), 0);
}

// Static Systemd content files for user references
export const SYSTEMD_TIMER_CONTENT = `[Unit]
Description=Run Birthday Reminder Daily

[Timer]
OnCalendar=*-*-* 08:00:00
Persistent=true

[Install]
WantedBy=timers.target`;

export const SYSTEMD_SERVICE_CONTENT = `[Unit]
Description=Birthday Reminder Service
After=network.target

[Service]
Type=oneshot
ExecStart=%h/.config/birthday-planner/reminder.sh`;

export const SH_REMINDER_CONTENT = `#!/bin/bash
# ~/.config/birthday-planner/reminder.sh
# Requires 'jq' utility. Finds people with birthdays within 14 days and triggers notify-send.

PEOPLE_JSON="$HOME/.config/birthday-planner/people.json"

if [ ! -f "$PEOPLE_JSON" ]; then
    echo "Error: people.json not found at $PEOPLE_JSON" >&2
    exit 1
fi

TODAY_MON_DAY=$(date +%m-%d)
TODAY_YEAR=$(date +%Y)

cat "$PEOPLE_JSON" | jq -c '.[]' | while read -r person; do
    id=$(echo "$person" | jq -r '.id')
    name=$(echo "$person" | jq -r '.name')
    bday=$(echo "$person" | jq -r '.birthday') # MM-DD
    type=$(echo "$person" | jq -r '.type')

    # Parse months and days
    bm=\${bday:0:2}
    bd=\${bday:3:2}
    
    # Calculate days left
    bday_epoch=$(date -d "$TODAY_YEAR-$bm-$bd" +%s 2>/dev/null)
    today_epoch=$(date -d "$(date +%Y-%m-%d)" +%s)
    
    if [ -z "$bday_epoch" ]; then
        # Handle end of year or date-parsing adjustments
        bday_epoch=$(date -d "$((TODAY_YEAR+1))-$bm-$bd" +%s)
    fi
    
    if [ "$bday_epoch" -lt "$today_epoch" ]; then
        bday_epoch=$(date -d "$((TODAY_YEAR+1))-$bm-$bd" +%s)
    fi
    
    diff_seconds=$((bday_epoch - today_epoch))
    diff_days=$((diff_seconds / 86400))
    
    if [ "$diff_days" -le 14 ] && [ "$diff_days" -ge 0 ]; then
        notify-send "Birthday Reminder" "Birthday in \${diff_days}d — \${name} (\${type})" --icon=appointment-soon
    fi
done`;

// A neat Python version that handles dates elegantly and does not depend on date utility format variations
export const PYTHON_REMINDER_CONTENT = `#!/usr/bin/env python3
# ~/.config/birthday-planner/reminder.py
# An elegant, portable Python script to run daily and notify for birthdays within 14 days.

import json
import os
import subprocess
from datetime import datetime

PEOPLE_JSON = os.path.expanduser("~/.config/birthday-planner/people.json")

if not os.path.exists(PEOPLE_JSON):
    print(f"Error: {PEOPLE_JSON} not found.")
    exit(1)

with open(PEOPLE_JSON, 'r') as f:
    people = json.load(f)

today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

for p in people:
    name = p.get('name')
    bday_str = p.get('birthday') # MM-DD
    p_type = p.get('type')
    
    try:
        b_month, b_day = map(int, bday_str.split('-'))
    except Exception:
        continue
        
    # Calculate bday this year
    bday_this_year = datetime(today.year, b_month, b_day)
    if bday_this_year < today:
        bday_this_year = datetime(today.year + 1, b_month, b_day)
        
    days_left = (bday_this_year - today).days
    
    if 0 <= days_left <= 14:
        title = "Birthday Reminder"
        msg = f"Birthday in {days_left}d — {name} ({p_type})"
        # Trigger native desktop notification via notify-send
        subprocess.run(["notify-send", title, msg, "--icon=appointment-soon"])
`;
