<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cn } from '$lib/utils.js';
	import NotebookPen from 'lucide-svelte/icons/notebook-pen';
	import Paperclip from 'lucide-svelte/icons/paperclip';
	import CornerDownLeft from 'lucide-svelte/icons/corner-down-left';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import CircleStop from 'lucide-svelte/icons/circle-stop';
	import UserRound from 'lucide-svelte/icons/user-round';

	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { ActionData, PageData } from './$types';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Separator } from '$lib/components/ui/separator';
	import * as Popover from '$lib/components/ui/popover';
	import * as Card from '$lib/components/ui/card';

	import { useChat } from 'ai/svelte';
	import { invalidateAll } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import { ChatPanelClose, customModelToChat } from '$lib/stores';
	// vairables

	export let data: PageData;
	export let form: ActionData;

	$: data = data;

	$: {
		if (form?.success) {
			invalidateAll();
		}
	}

	let selectedModel: string = data.ollamaModels?.models[0].name ?? '';

	$: chatsFromDB = data.chats;

	let currentChatID: string | undefined;

	let systemPrompt: string | undefined;
	let conversationName: string | undefined;
	let showSkeleton = false;
	let invalidated = false;

	const { input, handleSubmit, messages, stop, isLoading, setMessages } = useChat({
		sendExtraMessageFields: true,
		onFinish() {
			invalidated = true;
			fetch('/api/db')
				.then((res) => res.json())
				.then((data__) => {
					chatsFromDB = data__;
					currentChatID = chatsFromDB[chatsFromDB.length - 1].uuid;

					const currentChat = chatsFromDB.find(
						(chat: {
							id: number;
							uuid: string;
							createdAt: Date;
							updatedAt: Date;
							model: string;
							name: string;
							messages: string;
						}) => chat.uuid === currentChatID
					);
					selectedModel = currentChat?.model ?? data.ollamaModels?.models[0].name ?? '';
					conversationName = currentChat?.name;
					systemPrompt =
						currentChat?.messages[0].role === 'system' ? currentChat?.messages[0].content : '';
				});
			invalidateAll();
		}
	});

	$: {
		if (!invalidated) {
			selectedModel = data.ollamaModels?.models[0].name ?? '';
		}
	}

	$: {
		$messages = $messages.map((message) => {
			if (message.role === 'user') {
				return {
					...message,
					content: message.content.replace(/<model>(.*?)<\/model>/g, '')
				};
			}
			return message;
		});
	}

	// when messages changes scroll into view to chatContent id
	$: {
		if ($messages && $messages.length > 0) {
			// showSkeleton = false;
			if ($messages[$messages.length - 1].role === 'assistant') {
				showSkeleton = false;
			}

			const chatContent = document.getElementById('chatContent');
			chatContent?.scrollIntoView();
		}
	}

	$: {
		if (systemPrompt && systemPrompt !== '') {
			// remove previous system prompt
			$messages = $messages.filter((message) => message.role !== 'system');
			$messages = [
				{
					id: 'system',
					role: 'system',
					content: systemPrompt
				},
				...$messages
			];
		}
	}

	$: {
		if ($customModelToChat && $customModelToChat !== '') {
			selectedModel = $customModelToChat;
		}
	}
</script>

<div class="h-full w-full">
	<!-- <div class={`grid h-full grid-cols-[${!$ChatPanelClose ? '15%_1fr_23%' : '15%_1fr'}]`}> -->
	<div
		class={cn(`grid h-full`, $ChatPanelClose ? 'grid-cols-[15%_1fr]' : 'grid-cols-[15%_1fr_23%]')}
	>
		<div class="col-span border-r px-2">
			<div class="mt-0.5 py-2">
				<Button
					class="flex w-full items-center justify-between transition-all duration-200 active:scale-90"
					variant="outline"
					on:click={() => {
						$messages = [];
						$input = '';
						systemPrompt = undefined;
						currentChatID = undefined;
						conversationName = undefined;
						systemPrompt = undefined;
					}}
				>
					<p>New Conversation</p>
					<NotebookPen class="size-5" />
				</Button>
			</div>
			<Separator />
			<div class="py-2">
				<p class="pb-2">Conversations</p>
				{#if chatsFromDB}
					<div class="space-y-2">
						{#each chatsFromDB as chat (chat.uuid)}
							<Button
								class={cn(
									'flex w-full items-center justify-between transition-all duration-200 active:scale-90',
									currentChatID === chat.uuid && 'bg-secondary'
								)}
								variant="outline"
								on:click={() => {
									setMessages(chat.messages);
									conversationName = chat.name;
									currentChatID = chat.uuid;
									selectedModel = data.ollamaModels?.models.find((model) =>
										model.name.includes(chat.model)
									)?.name
										? chat.model
										: data.ollamaModels?.models[0].name;

									systemPrompt = chat.messages[0].role === 'system' ? chat.messages[0].content : '';
								}}
							>
								<p class="truncate">{chat.name}</p>
								{#if currentChatID === chat.uuid}
									<span class="relative flex size-2" in:fly={{ x: 20, duration: 500 }}>
										<span
											class={cn(
												'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
												'bg-green-500'
											)}
										/>
										<span class={cn('relative inline-flex size-2 rounded-full', 'bg-green-500')} />
									</span>
								{/if}
							</Button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
		<!-- {JSON.stringify(chatsFromDB)} -->
		<div class="col-span h-full border-r">
			<div
				class="relative flex h-full min-h-[50vh] flex-col bg-muted/50 dark:bg-muted/30 lg:col-span-2"
			>
				<div class="h-full flex-1">
					{#if !data.ollamaModels}
						<div class="flex h-full items-center justify-center font-extralight">
							<div class="flex w-full items-center justify-center">
								<Card.Root class="w-3/4 shadow-md">
									<Card.Header class="p-4">
										<div class="flex items-center gap-7">
											<img
												src="/Ollama (1).png"
												alt="Ollama-Logo"
												class="h-6 dark:invert dark:filter"
											/>

											<div>
												<p class="text-orange-500">Ollama server is not running</p>
											</div>
										</div>
									</Card.Header>
									<Card.Content class="bg-muted/60 p-4">
										<p>
											Please start the Ollama server to continue chatting. For more information,
											visit <a
												href="https://ollama.com/"
												target="_blank"
												class="font-semibold text-blue-400">ollama.com</a
											>
										</p>

										<p class="text-muted-foreground">
											Ollama runs @ <a href="http://localhost:11434">http://localhost:11434</a>
										</p>
									</Card.Content>
									<Card.Footer class="p-4">
										<div class="flex items-center gap-7">
											<p>Started the server?</p>
											<Button
												class="h-7"
												on:click={() => {
													invalidateAll();
												}}>Refresh</Button
											>
										</div>
									</Card.Footer>
								</Card.Root>
							</div>
						</div>
					{/if}
					<ScrollArea class="h-[calc(96vh-180px)]" scrollbarYClasses="hidden">
						{#if data.ollamaModels}
							<div>
								{#each $messages as message}
									<div class="flex w-full flex-col gap-5">
										{#if message.role === 'user'}
											<div
												class="border-b border-t bg-zinc-100 py-3 transition-opacity dark:border-zinc-700 dark:bg-secondary"
											>
												<div class="grid grid-cols-[5%_1fr]">
													<div class="flex justify-center">
														<div class="h-fit w-fit rounded-lg bg-white p-1 dark:bg-black">
															<UserRound class="size-6" strokeWidth={1.3} />
														</div>
													</div>
													<div class="flex items-center pr-10 leading-relaxed text-primary/80">
														{#key message.content}
															{message.content}
														{/key}
													</div>
												</div>
											</div>
										{:else if message.role === 'assistant'}
											<div class="bg-white py-4 transition-opacity dark:bg-muted/30">
												<div class="grid grid-cols-[5%_1fr]">
													<div class="flex justify-center">
														<img
															src="/Ollama (1).png"
															alt="Ollama-Logo"
															class="h-6 dark:invert dark:filter"
														/>
													</div>
													<div class="flex items-center pr-10 leading-relaxed text-primary/80">
														{#key message.content}
															{message.content}
														{/key}
													</div>
												</div>
											</div>
										{/if}
									</div>
								{/each}
								{#if showSkeleton}
									<div class="bg-white py-4 transition-opacity dark:bg-muted/30">
										<div class="grid grid-cols-[5%_1fr]">
											<div class="flex justify-center">
												<img
													src="/Ollama (1).png"
													alt="Ollama-Logo"
													class="h-6 dark:invert dark:filter"
												/>
											</div>
											<div class="flex items-center pr-10">
												<div class="flex flex-col gap-2">
													<div class="flex flex-wrap gap-5">
														<Skeleton class="h-4 w-[250px] bg-zinc-300 dark:bg-secondary" />
														<Skeleton class="h-4 w-[200px] bg-zinc-300 dark:bg-secondary" />
														<Skeleton class="h-4 w-[200px] bg-zinc-300 dark:bg-secondary" />
													</div>
													<div class="flex flex-wrap gap-5">
														<Skeleton class="h-4 w-[120px] bg-zinc-300 dark:bg-secondary" />
														<Skeleton class="h-4 w-[200px] bg-zinc-300 dark:bg-secondary" />
														<Skeleton class="h-4 w-[200px] bg-zinc-300 dark:bg-secondary" />
														<Skeleton class="h-4 w-[100px] bg-zinc-300 dark:bg-secondary" />
													</div>
												</div>
											</div>
										</div>
									</div>
								{/if}
								<div id="chatContent" class="mb-24" />
							</div>
						{/if}
					</ScrollArea>
				</div>
				{#if data.ollamaModels}
					<div class="p-4">
						<form
							class="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
							on:submit={(e) => {
								if (
									!$isLoading &&
									$input &&
									$input.length > 0 &&
									$input.trim().length > 0 &&
									$input !== '\n'
								) {
									// $input = `<model>${selectedModel}</model>${$input}`;
									// not the best way to do this but it works. Vercel AI SDK has no way to send data to the request api.
									// So I'm using a hacky way to send the model name, conversation name and chatID to the request api via the input field.
									$input = `<model>['${selectedModel}', '${conversationName}', '${currentChatID}']</model>${$input}`;
									showSkeleton = true;
									e.preventDefault();
									handleSubmit(e);
								} else {
									return;
								}
							}}
						>
							<Label for="message" class="sr-only">Message</Label>
							<Textarea
								id="message"
								rows={3}
								placeholder="Type your message here..."
								class="max-h-40 min-h-12 resize-none border-0 p-3 shadow-none focus:outline-none focus:ring-0 focus-visible:ring-0"
								bind:value={$input}
								on:keydown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										// $input = `<model>${selectedModel}</model>${$input}`;
										if (
											!$isLoading &&
											$input &&
											$input.length > 0 &&
											$input.trim().length > 0 &&
											$input !== '\n'
										) {
											$input = `<model>['${selectedModel}', '${conversationName}', '${currentChatID}']</model>${$input}`;
											showSkeleton = true;
											e.preventDefault();
											handleSubmit(e);
										} else {
											return;
										}
									}
								}}
							/>
							<div class="flex items-center gap-4 p-3 pt-0">
								<Tooltip.Root>
									<Tooltip.Trigger asChild let:builder>
										<Button variant="ghost" size="icon" builders={[builder]}>
											<Paperclip class="size-4" />
											<span class="sr-only">Attach file</span>
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content side="top">Attach File</Tooltip.Content>
								</Tooltip.Root>
								{#if data.ollamaModels}
									<Select.Root
										selected={{
											value: selectedModel,
											label: selectedModel
										}}
										onSelectedChange={(v) => {
											if (typeof v?.value === 'string') {
												selectedModel = v?.value;
											}
										}}
									>
										<Select.Trigger class="w-[300px] focus:ring-offset-0">
											<Label for="model">Model</Label>
											<Select.Value placeholder="Select Model" />
										</Select.Trigger>
										<Select.Content sideOffset={10}>
											{#each data.ollamaModels?.models as model}
												<Select.Item value={model.name}>{model.name}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{/if}
								<div class="flex items-center gap-3 rounded-xl border border-border px-2">
									<span class="relative flex h-3 w-3">
										<span
											class={cn(
												'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
												data.ollamaModels ? 'bg-green-500' : 'bg-red-600'
											)}
										/>
										<span
											class={cn(
												'relative inline-flex h-3 w-3 rounded-full',
												data.ollamaModels ? 'bg-green-500' : 'bg-red-600'
											)}
										/>
									</span>
									<p>
										{#if data.ollamaModels}
											<span class="text-sm font-medium text-green-500">Ollama is running</span>
										{:else}
											<span class="text-sm font-medium text-red-600">Ollama server is down</span>
										{/if}
									</p>
								</div>
								{#if !data.ollamaModels}
									<Tooltip.Root>
										<Tooltip.Trigger asChild let:builder>
											<Button
												size="sm"
												variant="ghost"
												class="p-1 px-2"
												builders={[builder]}
												on:click={() => {
													invalidateAll();
												}}
											>
												<RefreshCw class="size-4" />
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content side="top">Refresh</Tooltip.Content>
									</Tooltip.Root>
								{/if}
								{#if $isLoading || ($input && $input.length > 0 && $input.trim().length > 0 && $input !== '\n')}
									<div
										class="ml-auto gap-1.5"
										in:fly={{ x: 20, duration: 500 }}
										out:fly={{ x: 20, duration: 500 }}
									>
										<Button
											type="submit"
											size="sm"
											class="gap-1.5"
											disabled={$input.length === 0 && !$isLoading}
											on:click={(e) => {
												if (isLoading) {
													stop();
													return;
												} else {
													if (
														$input &&
														$input.length > 0 &&
														$input.trim().length > 0 &&
														$input !== '\n'
													) {
														$input = `<model>['${selectedModel}', '${conversationName}', '${currentChatID}']</model>${$input}`;
														showSkeleton = true;
														e.preventDefault();
														handleSubmit(e);
													} else {
														return;
													}
												}
											}}
										>
											{#if $isLoading}
												Stop
												<CircleStop class="size-3.5" />
											{:else}
												Send
												<CornerDownLeft class="size-3.5" />
											{/if}
										</Button>
									</div>
								{/if}
							</div>
						</form>
					</div>
				{/if}
			</div>
		</div>
		{#if !$ChatPanelClose}
			<div
				class="col-span border-r"
				in:fly={{ x: 30, duration: 500 }}
				out:fly={{ x: 30, duration: 500 }}
			>
				<div class="p-2">
					<fieldset class="grid gap-6 rounded-lg border p-4">
						<legend class="-ml-1 px-1 text-sm font-medium"> Conversation Settings </legend>
						<div class="grid gap-3">
							<Label for="conv-name">Conversation Name</Label>
							<Input
								type="text"
								id="conv-name"
								placeholder="Conversation Name"
								bind:value={conversationName}
							/>
						</div>
						<div class="grid gap-3">
							<Label for="content">System Prompt</Label>
							<Textarea
								id="content"
								placeholder="You are a..."
								class="max-h-[50vh] min-h-[9.5rem]"
								bind:value={systemPrompt}
							/>
						</div>
					</fieldset>
				</div>
				<form method="POST">
					{#if currentChatID}
						<div class="p-2">
							<input type="hidden" name="chatID" value={currentChatID} />
							<Popover.Root portal={null}>
								<Popover.Trigger asChild let:builder>
									<Button
										builders={[builder]}
										variant="destructive"
										size="sm"
										class="h-7 py-0"
										type="button">Delete Conversation</Button
									>
								</Popover.Trigger>
								<Popover.Content sideOffset={8} class="w-[400px]">
									<div class="space-y-2">
										<p class="text-sm">Are you sure you want to delete this conversation?</p>
										<p class="text-xs text-muted-foreground">This action cannot be undone</p>
										<div class="mx-auto flex items-center justify-center">
											<Button variant="destructive" size="sm" class="h-7 py-0" type="submit"
												>Yes, Delete</Button
											>
										</div>
									</div>
								</Popover.Content>
							</Popover.Root>
						</div>
					{/if}
				</form>
			</div>
		{/if}
	</div>
</div>
