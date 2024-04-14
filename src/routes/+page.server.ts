import ollama from 'ollama';
import { PUBLIC_OLLAMA_ENDPOINT } from '$env/static/public';
import { db } from '$lib/db';

export const load = async (event) => {
	try {
		const [ollamaResponse] = await Promise.all([event.fetch(PUBLIC_OLLAMA_ENDPOINT)]);

		if (!ollamaResponse.ok) {
			return {
				error: true,
				message: "ollama is down. Make sure it's running."
			};
		}

		const ollamaModels = await ollama.list();

		const chats = await event
			.fetch('api/db')
			.then((res) => res.json())
			.then((data) => data);
		return {
			ollamaModels,
			chats,
			customModels: await db.customModels.findMany()
		};
	} catch (e) {
		return {
			error: true,
			message: "ollama is down. Make sure it's running."
		};
	}
};

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const chatID = data.get('chatID');

		await db.chats.delete({
			where: {
				uuid: chatID as string
			}
		});

		return {
			success: true
		};
	}
};
