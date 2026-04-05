import { create } from "zustand";

type UserState = {
  userId: string | null;
  nickname: string | null;
  setUser: (payload: { userId: string; nickname: string }) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  nickname: null,
  setUser: ({ userId, nickname }) => set({ userId, nickname }),
  clearUser: () => set({ userId: null, nickname: null }),
}));
