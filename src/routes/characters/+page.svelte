<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { cn } from '$lib/utils.js';
	import { goto, invalidateAll } from '$app/navigation';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Combobox } from '$lib/components/site';
	import { Input } from '$lib/components/ui/input';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { type ShowResponse } from 'ollama';
	import ollama from 'ollama/browser';
	import { Info, SquarePlus, Trash } from 'lucide-svelte';
	import type { ActionData } from './$types';
	import { customModelToChat } from '$lib/stores';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Table from '$lib/components/ui/table/index.js';

	export let data;
	export let form: ActionData;

	$: customModels = data.customModels;
	let sheetOpen = false;

	// allow users to create a custom model only from basa models
	$: baseModels = data.ollamaModels?.models.filter(
		({ name }) => !customModels?.some(({ model }) => name.includes(model))
	);

	let baseModel: string | undefined = undefined;

	let modelInfo: ShowResponse;
	let systemPrompt: string;
	let customModelName: string;
	let modelCreating = false;
	let category: string;

	$: categories = data.customModels
		?.map((model) => {
			return {
				value: model.category,
				label: model.category
			};
		})
		.filter((category, index, self) => {
			return index === self.findIndex((t) => t.value === category.value);
		});

	$: {
		if (baseModel) {
			(async function fetchModelFile(baseModel: string) {
				modelInfo = await ollama.show({ model: baseModel });
			})(baseModel);
		}
	}

	let params = [
		{
			name: 'temperature',
			value: undefined,
			min: 0,
			max: 1,
			step: 0.01,
			placeholder: '0.8',
			info: `The temperature of the model. Increasing the temperature will make the model answer more creatively. (Default: 0.8)`
		},
		{
			name: 'top_k',
			value: undefined,
			min: 0,
			max: 100,
			step: 1,
			placeholder: '40',
			info: `Reduces the probability of generating nonsense. A higher value (e.g. 100) will give more diverse answers, while a lower value (e.g. 10) will be more conservative. (Default: 40)`
		},
		{
			name: 'top_p',
			value: undefined,
			min: 0,
			max: 1,
			step: 0.01,
			placeholder: '0.9',
			info: `Works together with top-k. A higher value (e.g., 0.95) will lead to more diverse text, while a lower value (e.g., 0.5) will generate more focused and conservative text. (Default: 0.9)`
		}
	];

	$: params = params;

	$: {
		if (form?.success) {
			sheetOpen = false;
			invalidateAll();
		}
	}

	let categoriesToShow: 'all' | string = 'all';

	let openModelInfoSheet = false;
	let modelToView: string;

	let modelToViewTableColumns = [
		'Name',
		'Category',
		'Size',
		'Quantization',
		'Parameters',
		'Base Model'
	];

	function bytesToGigabytes(bytes: number | undefined, decimalPlaces: number): number {
		if (!bytes) return parseFloat((0).toFixed(decimalPlaces));
		const gigabytes = bytes / Math.pow(1024, 3);
		return parseFloat(gigabytes.toFixed(decimalPlaces));
	}
</script>

<div class="h-full p-1 py-2">
	{#if !customModels || customModels.length === 0}
		<div class="flex h-full w-full items-center justify-center">
			<Card.Root class="w-3/6 shadow-lg">
				<Card.Header>
					<div class="flex items-center gap-7">
						<img src="/Ollama (1).png" alt="Ollama-Logo" class="h-6 dark:invert dark:filter" />

						<div>
							<p class="font-medium">Ollama Custom Models: Tailor-Made Language Tools</p>
						</div>
					</div>
				</Card.Header>
				<Card.Content class="space-y-3 bg-muted/60 p-6 text-secondary-foreground/80">
					<p>
						Ollama's custom models let you tweak powerful language models for your needs. Imagine a
						pre-trained LLM as a lump of clay. Ollama's modelfiles are your sculpting tools.
					</p>

					<ul class="space-y-3">
						<li>
							<strong>Choose a Base LLM:</strong>
							<span class="text-muted-foreground">
								Select a pre-trained model like those from Hugging Face.
							</span>
						</li>
						<li>
							<strong>Mold its Behavior:</strong>
							<span class="text-muted-foreground">
								Adjust settings like creativity, context awareness, and even its virtual
								personality.
							</span>
						</li>
						<li>
							<strong>Fine-tune with Prompts:</strong><span class="text-muted-foreground">
								Train the model on specific tasks or domains to get focused results.
							</span>
						</li>
					</ul>

					<p>
						This lets you build specialized LLMs for tasks like chatbots, question answering in a
						specific field, or even creative writing with a desired style.
					</p>
				</Card.Content>
				<Card.Footer class="py-4">
					<div class="flex w-full items-center justify-end gap-7">
						<Button on:click={() => (sheetOpen = true)}>Get Started</Button>
					</div>
				</Card.Footer>
			</Card.Root>
		</div>
	{:else}
		<div class="sticky top-0 flex w-full flex-wrap gap-4 p-4">
			<Button
				class={cn('h-7')}
				variant={categoriesToShow === 'all' ? 'default' : 'secondary'}
				on:click={() => {
					categoriesToShow = 'all';
				}}>All</Button
			>

			{#if categories}
				{#each categories as category}
					<Button
						class="h-7"
						variant={categoriesToShow === category.value ? 'default' : 'secondary'}
						on:click={() => {
							categoriesToShow = category.value;
						}}>{category.label}</Button
					>
				{/each}
			{/if}
		</div>
		<ScrollArea class="h-[50%]">
			<div class="flex h-full w-full flex-wrap gap-4 overflow-scroll p-4">
				{#each customModels as model (model.id)}
					{#if categoriesToShow === 'all' || categoriesToShow === model.category}
						<div
							class="relative flex h-48 w-48 items-center justify-center rounded-lg bg-secondary outline-1 hover:outline"
						>
							<div class="flex flex-col items-center">
								<p class="text-md">{model.model}</p>
								<Button
									class="absolute left-2 top-3 h-5 cursor-auto px-2 hover:bg-white dark:bg-black"
									variant="outline">{model.category}</Button
								>
							</div>
							<div class="absolute inset-x-3 bottom-3 flex items-center justify-between">
								<Button
									class="h-7 hover:bg-white hover:outline dark:hover:bg-black"
									variant="outline"
									on:click={() => {
										$customModelToChat = model.model;
										goto('/');
									}}>Chat</Button
								>
								<Button
									class="h-7 hover:bg-white hover:outline dark:hover:bg-black"
									variant="outline"
									on:click={() => {
										openModelInfoSheet = true;
										modelToView = model.model;
									}}>View</Button
								>
							</div>
							<div class="absolute right-3 top-3">
								<button
									class="flex size-6 items-center justify-center rounded-full bg-red-500"
									on:click={async () => {
										await ollama.delete({ model: model.model }).then(() => {
											fetch('api/db/customModel/delete', {
												method: 'POST',
												headers: {
													'Content-Type': 'application/json'
												},
												body: JSON.stringify({ customModelName: model.model })
											}).then(() => {
												invalidateAll();
											});
										});
									}}
								>
									<Trash class="size-3.5 text-primary-foreground" />
								</button>
							</div>
						</div>
					{/if}
				{/each}

				<button
					class="flex h-48 w-48 flex-col items-center justify-center gap-5 rounded-lg bg-secondary outline-1 transition-all duration-200 ease-in-out hover:bg-secondary/80 hover:outline active:scale-90"
					on:click={() => (sheetOpen = true)}
				>
					<SquarePlus class="size-10" />
					<p class="text-xl">Add New</p>
				</button>
			</div>
		</ScrollArea>
	{/if}
</div>

<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Content class="w-full overflow-scroll lg:max-w-[50%]">
		<Sheet.Header class="mb-5 space-y-5">
			<Sheet.Title>Create a Modelfile</Sheet.Title>
			<Sheet.Description>
				An Ollama model file is a configuration file used to customize language models on the Ollama
				platform. It includes instructions for building and operating a model, such as the base
				model, behavior parameters, and system messages.
			</Sheet.Description>

			<Separator class="my-3" />
		</Sheet.Header>

		<div>
			<fieldset class="grid gap-6 rounded-xl border p-4">
				<legend class="px-1 text-sm font-medium">Configure Modelfile</legend>
				<div class="grid gap-5">
					<div class="flex flex-col gap-3">
						{#if data.ollamaModels}
							<Label>Select a Base Model</Label>
							<Combobox
								bind:value={baseModel}
								models={baseModels?.map(({ name }) => ({ value: name, label: name }))}
							/>
						{/if}
					</div>
					<div class="flex flex-col gap-3">
						{#if baseModel}
							<div class="relative hidden flex-col items-start gap-8 md:flex">
								<form class="grid w-full items-start gap-6" method="post">
									<fieldset class="grid gap-6 rounded-lg border p-4">
										<legend class="-ml-1 px-1 text-sm font-medium"> Settings </legend>
										<input type="hidden" value={baseModel} name="baseModel" />
										<div class="flex items-center justify-between gap-6">
											<div class="grid w-full gap-3">
												<Label>Name</Label>
												<Input
													type="text"
													placeholder="My Custom Model"
													name="customModelName"
													required
													maxlength={20}
													bind:value={customModelName}
												/>
											</div>
											<div class="grid w-full gap-3">
												<Label>Category</Label>
												<input
													placeholder="Category"
													name="category"
													type="hidden"
													value={category}
												/>

												<Combobox models={categories} useForCategory bind:value={category} />
											</div>
										</div>
										<div class="grid grid-cols-3 gap-4">
											{#each params as param (param.name)}
												<div class="grid gap-0">
													<Label class="flex items-center justify-between">
														<div class="flex items-center gap-3">
															{param.name}
															<Tooltip.Root>
																<Tooltip.Trigger asChild let:builder>
																	<Button
																		variant="ghost"
																		size="sm"
																		builders={[builder]}
																		class="bg-none p-0 hover:bg-transparent active:bg-transparent"
																	>
																		<Info class="size-3" />
																	</Button>
																</Tooltip.Trigger>
																<Tooltip.Content
																	side="right"
																	sideOffset={5}
																	class="max-w-[200px] text-sm text-muted-foreground"
																	>{param.info}</Tooltip.Content
																>
															</Tooltip.Root>
														</div>
														{#if param.value}
															<div>
																<button
																	on:click={() => {
																		param.value = undefined;
																		params = [...params];
																	}}>Reset</button
																>
															</div>
														{/if}
													</Label>
													<Input
														type="number"
														min={param.min}
														max={param.max}
														step={param.step}
														name={param.name}
														bind:value={param.value}
														placeholder={param.placeholder}
													/>
												</div>
											{/each}
										</div>
										<div class="grid gap-3">
											<Label for="content">System Prompt</Label>
											<Textarea
												id="content"
												bind:value={systemPrompt}
												required
												name="systemPrompt"
												placeholder="You are a..."
												class="h-48 resize-none"
											/>
										</div>

										<Button type="submit" disabled={modelCreating}>Create</Button>
									</fieldset>
								</form>
							</div>
						{/if}
					</div>
				</div>
			</fieldset>
		</div>
	</Sheet.Content>
</Sheet.Root>

<Sheet.Root bind:open={openModelInfoSheet}>
	<Sheet.Content class="lg:max-w-[50%]">
		<Sheet.Header>
			<Sheet.Title>{modelToView}</Sheet.Title>
			<Sheet.Description>
				<div>
					<Badge class="rounded-md hover:bg-primary"
						>{customModels?.find((model) => {
							return model.model === modelToView;
						})?.category}</Badge
					>
				</div>
			</Sheet.Description>
		</Sheet.Header>
		<div>
			<Table.Root>
				<Table.Caption>Details of {modelToView}</Table.Caption>
				<Table.Header>
					<Table.Row>
						{#each modelToViewTableColumns as col (col)}
							<Table.Head>{col}</Table.Head>
						{/each}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					<Table.Row>
						<Table.Cell class="font-medium">{modelToView}</Table.Cell>
						<Table.Cell
							>{customModels?.find((model) => {
								return model.model === modelToView;
							})?.category}</Table.Cell
						>
						<Table.Cell>
							{bytesToGigabytes(
								data.ollamaModels?.models.find((model) => {
									return model.name.includes(modelToView);
								})?.size,
								2
							)} GB
						</Table.Cell>
						<Table.Cell
							>{data.ollamaModels?.models.find((model) => {
								return model.name.includes(modelToView);
							})?.details.quantization_level}</Table.Cell
						>
						<Table.Cell
							>{data.ollamaModels?.models.find((model) => {
								return model.name.includes(modelToView);
							})?.details.parameter_size}</Table.Cell
						>
						<Table.Cell
							>{customModels?.find((model) => {
								return model.model === modelToView;
							})?.baseModel}</Table.Cell
						>
					</Table.Row>
				</Table.Body>
			</Table.Root>

			<Button
				variant="destructive"
				on:click={async () => {
					await ollama
						.delete({
							model: modelToView
						})
						.then(() => {
							fetch('api/db/customModel/delete', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({ customModelName: modelToView })
							}).then(() => {
								openModelInfoSheet = false;
								invalidateAll();
							});
						});
				}}>Delete {modelToView}</Button
			>
		</div>
	</Sheet.Content>
</Sheet.Root>
