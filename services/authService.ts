// Auth service removed as per user request.
export const getAvatarUrl = (seed: string) => {
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};
export const subscribeToAuth = (cb: any) => { return () => {} };
export const logoutUser = async () => {};