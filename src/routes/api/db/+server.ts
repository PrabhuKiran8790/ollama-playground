import { db } from '$lib/db';
import { json } from '@sveltejs/kit';

export async function GET() {
	const chats = await db.chats.findMany();

	// json.parse to all the messages in the chats
	chats.forEach(
		(chat: {
			id: number;
			uuid: string;
			createdAt: Date;
			updatedAt: Date;
			model: string;
			name: string;
			messages: string;
		}) => {
			chat.messages = JSON.parse(chat.messages);
		}
	);

	return json(chats);
}
