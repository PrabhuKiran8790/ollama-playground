import { writable } from 'svelte/store';

export const ChatPanelClose = writable<boolean>(false);
export const customModelToChat = writable<string>('');
export const status = writable('');
export const total = writable(0);
export const completed = writable(0);
export const isError = writable(false);
export const isDownloading = writable(false);
