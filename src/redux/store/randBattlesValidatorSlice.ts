import {
  type Draft,
  type PayloadAction,
  createSlice,
} from '@reduxjs/toolkit';
import { type RandomBattlesValidationResult } from '@showdex/utils/random-battles';

export interface RandBattlesValidatorSliceEntry extends RandomBattlesValidationResult {
  updatedAt: number;
}

export type RandBattlesValidatorSliceState = Record<string, RandBattlesValidatorSliceEntry>;

export const randBattlesValidatorSlice = createSlice({
  name: 'randBattlesValidator',
  initialState: {} as RandBattlesValidatorSliceState,
  reducers: {
    set: (
      state: Draft<RandBattlesValidatorSliceState>,
      action: PayloadAction<{ battleId: string; validation: RandomBattlesValidationResult }>,
    ) => {
      const { battleId, validation } = action.payload || {};

      if (!battleId) {
        return;
      }

      state[battleId] = {
        ...validation,
        updatedAt: Date.now(),
      };
    },
    clear: (
      state: Draft<RandBattlesValidatorSliceState>,
      action: PayloadAction<string | string[]>,
    ) => {
      const battleIds = Array.isArray(action.payload) ? action.payload : [action.payload];

      battleIds.filter(Boolean).forEach((battleId) => {
        delete state[battleId];
      });
    },
  },
});
