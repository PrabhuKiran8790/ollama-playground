import { db } from '$lib/db';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const { customModelName } = await request.json();
	await db.customModels.delete({
		where: {
			model: customModelName
		}
	});
	return json({ success: true });
};
