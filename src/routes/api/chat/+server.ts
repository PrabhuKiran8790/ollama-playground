import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { db } from '$lib/db.js';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
	baseURL: 'http://localhost:11434/v1',
	apiKey: 'ollama' // required but unused
});

export const POST = async (event) => {
	const { messages } = await event.request.json();

	// Get the last object
	const lastObject = messages[messages.length - 1];

	// Extract the model between the tags
	const modelRegex = /<model>(.*?)<\/model>/;
	const match = lastObject.content.match(modelRegex);

	const extractValues = (str: string | undefined) => {
		if (!str) {
			return [];
		}
		const matches = str.match(/'([^']+)'/g);
		if (!matches) {
			return [];
		}
		return matches.map((match) => match.replace(/'/g, ''));
	};

	// eslint-disable-next-line prefer-const
	let [model, name, currentChatID] = extractValues(match[1]);

	// Remove the model tags and content from the content property
	lastObject.content = lastObject.content.replace(modelRegex, '');

	const response = await openai.chat.completions.create({
		model: model,
		stream: true,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		messages: messages.map((message: any) => ({
			content: message.content,
			role: message.role
		}))
	});

	let messagesToDB = [...messages];

	const stream = OpenAIStream(response, {
		onCompletion: async (completion: string) => {
			messagesToDB = [
				...messagesToDB,
				{
					role: 'assistant',
					content: completion
				}
			];

			if (name === 'undefined') {
				name = `Conversation - ${uuidv4().substring(0, 4)}`;
			}

			if (currentChatID === 'undefined') {
				await db.chats.create({
					data: {
						uuid: uuidv4(),
						model: model,
						name: name,
						messages: JSON.stringify(messagesToDB)
					}
				});
			} else {
				await db.chats.update({
					where: {
						uuid: currentChatID
					},
					data: {
						messages: JSON.stringify(messagesToDB),
						model: model,
						name: name
					}
				});
			}
		}
	});
	return new StreamingTextResponse(stream);
};
