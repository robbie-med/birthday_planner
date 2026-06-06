/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GiftHistoryEntry {
  year: number;
  occasion: string;
  gave_item: string | null;
  gave_amount: number | null;
  received_item: string | null;
  received_amount: number | null;
}

export type PersonType =
  | 'spouse'
  | 'parent'
  | 'sibling'
  | 'in-law'
  | 'close-friend'
  | 'colleague'
  | 'other';

export interface Person {
  id: string;
  name: string;
  birthday: string; // MM-DD
  birth_year: number | null;
  type: PersonType;
  notes: string;
  gift_history: GiftHistoryEntry[];
}

export type TuiScreen = 'upcoming' | 'all-people' | 'detail';
