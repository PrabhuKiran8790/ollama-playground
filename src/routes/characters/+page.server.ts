import ollama, { type ShowResponse } from 'ollama';
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
		const customModels = await db.customModels.findMany();

		return {
			ollamaModels,
			chats,
			customModels
		};
	} catch (e) {
		return {
			error: true,
			message: "ollama is down. Make sure it's running."
		};
	}
};

function createModelFile(
	modelInfo: ShowResponse,
	systemPrompt: string,
	params_: {
		name: string;
		value: undefined | string;
	}[],
	baseModel: string
) {
	let modelFile = `FROM ${baseModel}\n
TEMPLATE """${modelInfo.template}"""

SYSTEM """${systemPrompt}"""

${modelInfo.parameters.replace(/stop\s+/g, 'PARAMETER stop ')}
\n
`;

	for (const param of params_) {
		if (param.value) {
			modelFile += `PARAMETER ${param.name} ${param.value}\n`;
		}
	}
	return modelFile;
}

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const data_ = {
			category: data.get('category') as string,
			customModelName: data.get('customModelName') as string,
			baseModel: data.get('baseModel') as string,
			systemPrompt: data.get('systemPrompt') as string,
			params: [
				{
					name: 'temperature',
					value: data.get('temperature') === '' ? undefined : (data.get('temperature') as string)
				},
				{
					name: 'top_k',
					value: data.get('top_k') === '' ? undefined : (data.get('top_k') as string)
				},
				{
					name: 'top_p',
					value: data.get('top_p') === '' ? undefined : (data.get('top_p') as string)
				}
			]
		};

		const modelInfo = await ollama.show({
			model: data_.baseModel as string
		});

		const modelFile = createModelFile(
			modelInfo,
			data_.systemPrompt as string,
			data_.params,
			data_.baseModel as string
		);

		await ollama.create({
			model: data_.customModelName as string,
			modelfile: modelFile
		});

		if (await db.customModels.findFirst({ where: { model: data_.customModelName } })) {
			await db.customModels.update({
				where: {
					model: data_.customModelName
				},
				data: {
					category: data_.category,
					baseModel: data_.baseModel,
					model: data_.customModelName
				}
			});
		} else {
			await db.customModels.create({
				data: {
					model: data_.customModelName,
					category: data_.category,
					baseModel: data_.baseModel
				}
			});
		}

		return {
			success: true
		};
	}
};
