'use server';

import { revalidateTag } from 'next/cache';

export interface BallOverridePayload {
  matchId: string;
  deliveryId: string;
  overIndex: number;
  ballIndex: number;
  runsBat: number;
  extras: number;
  extraType?: 'WD' | 'NB' | 'B' | 'LB' | null;
  isWicket: boolean;
  wicketType?: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | null;
  isDeadBall?: boolean;
  overrideReason: string;
}

export async function mutateDeliveryScore(payload: BallOverridePayload) {
  console.log(`[AUDIT] Match: ${payload.matchId} | Ball: ${payload.deliveryId} modified`);
  console.log(`[REASON]: ${payload.overrideReason}`);

  revalidateTag(`match-${payload.matchId}`);
  revalidateTag(`match-${payload.matchId}-scorecard`);

  return { 
    success: true, 
    updatedDeliveryId: payload.deliveryId, 
    timestamp: new Date().toISOString() 
  };
}
