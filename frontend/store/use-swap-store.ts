import { create } from "zustand";
import { SOL_MINT, USDC_MINT } from "@/lib/trading-constants";

export interface SwapInputs {
  inputMint: string;
  outputMint: string;
  inputAmount: number;
}

interface SwapState {
  inputs: SwapInputs;
  setInputs: (inputs: Partial<SwapInputs>) => void;
}

export const useSwapStore = create<SwapState>((set) => ({
  inputs: {
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    inputAmount: 0,
  },
  setInputs: (inputs) =>
    set((s) => ({
      inputs: {
        ...s.inputs,
        ...inputs,
        inputMint: inputs.inputMint ?? s.inputs.inputMint,
        outputMint: inputs.outputMint ?? s.inputs.outputMint,
        inputAmount: inputs.inputAmount ?? s.inputs.inputAmount,
      },
    })),
}));
