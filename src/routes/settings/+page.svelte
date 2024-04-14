<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import type { PageData } from './$types';
	import * as Table from '$lib/components/ui/table';
	import { formatDistanceToNow } from 'date-fns';
	import Trash from 'lucide-svelte/icons/trash';
	import ollama from 'ollama/browser';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Progress } from '$lib/components/ui/progress';
	import { completed, isDownloading, isError, total, status } from '$lib/stores';

	export let data: PageData;
	$: customModels = data.customModels;

	function formatTimeAgo(date: Date): string {
		return formatDistanceToNow(date, { addSuffix: true });
	}

	function bytesToGigabytes(bytes: number | undefined, decimalPlaces: number): number {
		if (!bytes) return parseFloat((0).toFixed(decimalPlaces));
		const gigabytes = bytes / Math.pow(1024, 3);
		return parseFloat(gigabytes.toFixed(decimalPlaces));
	}

	let cols = ['Name', 'Size', 'Quantization', 'Parameters', 'Modified at'];

	$: baseModels = data.ollamaModels?.models
		.filter(({ name }) => !customModels?.some(({ model }) => name.includes(model)))
		.map((model) => {
			return {
				Name: model.name,
				Size: `${bytesToGigabytes(model.size, 2)} GB`,
				Quantization: model.details.quantization_level,
				Parameters: model.details.parameter_size,
				'Modified at': formatTimeAgo(model.modified_at)
			};
		});

	// find custom models from data.ollamaModels.models if the name in customModels includes the model name from data.ollamaModels.models
	$: customModels__ = data.ollamaModels?.models
		.filter(({ name }) => customModels?.some(({ model }) => name.includes(model)))
		.map((model) => {
			return {
				Name: model.name,
				Size: `${bytesToGigabytes(model.size, 2)} GB`,
				Quantization: model.details.quantization_level,
				Parameters: model.details.parameter_size,
				'Modified at': formatTimeAgo(model.modified_at)
			};
		});

	let modelName: string;

	async function startStreaming() {
		try {
			const stream = await ollama.pull({
				model: modelName,
				stream: true
			});

			modelName = '';
			$isError = false;

			for await (const chunk of stream) {
				$isDownloading = true;
				$status = chunk.status;
				$total = bytesToGigabytes(chunk.total, 2);
				$completed = bytesToGigabytes(chunk.completed, 2);
			}
		} catch (error: any) {
			$isDownloading = false;
			$isError = true;
			$status = error.message;
		}
	}

	$: {
		if ($status === 'success') {
			$status = '';
			$total = 0;
			$completed = 0;
			$isDownloading = false;
			invalidateAll();
		}
	}
</script>

<div class="h-full p-2">
	<h1 class="text-2xl font-semibold">Manage Models</h1>

	<div class="my-6">
		<form class="grid gap-4" on:submit|preventDefault={startStreaming}>
			<Label for="search">Download/Pull Model from Ollama</Label>
			<div class="flex items-center gap-10">
				<Input
					placeholder="Enter model name"
					bind:value={modelName}
					class="focus-visible:ring-muted focus-visible:ring-offset-0"
					disabled={$isDownloading}
					on:keydown={(e) => {
						if (e.key === 'Enter') {
							startStreaming();
						}
					}}
				/>
				<Button
					variant="secondary"
					type="submit"
					on:click={startStreaming}
					disabled={modelName === '' || $isDownloading}>Download</Button
				>
			</div>
		</form>
	</div>

	<div>
		{#if !$isError}
			{#if $total || $status}
				<div class="mx-auto flex w-[80%] flex-col items-center gap-5">
					<div class="flex w-full items-center justify-between">
						<div>
							<p>{$status}</p>
						</div>
						<div>
							<p>{$completed} GB / {$total} GB</p>
						</div>
					</div>
					<Progress value={$completed} max={$total} />
				</div>
			{/if}
		{:else}
			<p class="text-center text-red-500">{$status}</p>
		{/if}
	</div>

	<div class="flex h-full flex-col pt-5">
		<ScrollArea class="h-[calc(100vh-150px)]">
			<h1 class="pb-5">Base Models</h1>
			<div class="overflow-y-scroll rounded-lg border">
				<Table.Root class="h-full">
					<Table.Header>
						<Table.Row class="bg-muted/50">
							{#each cols as col (col)}
								<Table.Head>{col}</Table.Head>
							{/each}
							<Table.Head />
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if baseModels}
							{#each baseModels as model (model.Name)}
								<Table.Row>
									<Table.Cell>{model.Name}</Table.Cell>
									<Table.Cell>{model.Size}</Table.Cell>
									<Table.Cell>{model.Quantization}</Table.Cell>
									<Table.Cell>{model.Parameters}</Table.Cell>
									<Table.Cell>{model['Modified at']}</Table.Cell>
									<Table.Cell>
										<Button
											variant="destructive"
											size="sm"
											class="h-7 py-0"
											type="button"
											on:click={async () => {
												await ollama
													.delete({
														model: model.Name
													})
													.then(() => {
														invalidateAll();
													});
											}}
										>
											<Trash class="size-4" />
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						{/if}
					</Table.Body>
				</Table.Root>
			</div>
			{#if customModels__ && customModels__.length > 0}
				<h1 class="py-5">Custom Models</h1>
				<div class="overflow-y-scroll rounded-lg border">
					<Table.Root class="h-full">
						<Table.Header>
							<Table.Row class="bg-muted/50">
								{#each cols as col (col)}
									<Table.Head>{col}</Table.Head>
								{/each}
								<Table.Head />
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each customModels__ as model (model.Name)}
								<Table.Row>
									<Table.Cell>{model.Name}</Table.Cell>
									<Table.Cell>{model.Size}</Table.Cell>
									<Table.Cell>{model.Quantization}</Table.Cell>
									<Table.Cell>{model.Parameters}</Table.Cell>
									<Table.Cell>{model['Modified at']}</Table.Cell>
									<Table.Cell>
										<Button
											variant="destructive"
											size="sm"
											class="h-7 py-0"
											type="button"
											on:click={async () => {
												await ollama.delete({ model: model.Name }).then(() => {
													fetch('api/db/customModel/delete', {
														method: 'POST',
														headers: {
															'Content-Type': 'application/json'
														},
														body: JSON.stringify({
															customModelName: model.Name.replace(':latest', '')
														})
													}).then(() => {
														invalidateAll();
													});
												});
											}}
										>
											<Trash class="size-4" />
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</ScrollArea>
	</div>
</div>
