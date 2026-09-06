import { create } from 'zustand';
import type { WalletBalanceDTO } from '@astroai/shared-types';

interface WalletState {
  balance: WalletBalanceDTO | null;
  isLoading: boolean;
  setBalance: (balance: WalletBalanceDTO) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: null,
  isLoading: false,
  setBalance: (balance) => set({ balance, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ balance: null, isLoading: false }),
}));
