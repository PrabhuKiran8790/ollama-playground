import { Bot, MessageSquareQuote, Settings, Settings2 } from 'lucide-svelte';

export const routes = [
	{
		name: 'Chat',
		route: '/',
		icon: MessageSquareQuote
	},
	{
		name: 'Characters',
		route: '/characters',
		icon: Bot
	}
];

export const bottomRoutes = [
	{
		name: 'Settings',
		route: '/settings',
		icon: Settings2
	}
];

export const settingsRoutes = [
	{
		name: 'Manage Models',
		route: '/settings',
		icon: Settings
	}
];
