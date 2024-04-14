<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import type { ModelResponse } from 'ollama';
	import { tick } from 'svelte';
	import { Input } from '../ui/input';

	export let models: {
		value: string;
		label: string;
	}[] = [];

	export let value: string | undefined = undefined;

	$: models__ = models;

	let open = false;
	export let useForCategory: boolean | undefined = undefined;

	$: selectedValue = '';

	$: {
		if (useForCategory) {
			selectedValue = models__.find((f) => f.value === value)?.label ?? 'Select a Category';
		} else {
			selectedValue = models__.find((f) => f.value === value)?.label ?? 'Select a Base Model';
		}
	}

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	let newValue: string | undefined;

	function addNewCategory() {
		if (newValue && newValue !== '') {
			models = [...models, { value: newValue, label: newValue }];
			// remove duplicates
			models = models.filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i);
			value = newValue;
			newValue = undefined;
		}
	}
</script>

<Popover.Root bind:open let:ids>
	<Popover.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="outline"
			role="combobox"
			aria-expanded={open}
			class="w-[400px] justify-between"
		>
			{selectedValue}
			<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-[400px] p-0" sideOffset={5}>
		<Command.Root>
			{#if !useForCategory}
				<Command.Input placeholder="Search models..." />
				<Command.Empty>
					<div class="p-4 text-center text-gray-500">No models found</div>
				</Command.Empty>
			{:else}
				<Command.Input placeholder="Search categories..." bind:value />
				<Command.Empty>
					<div class="px-4 py-0 text-center text-gray-500">No categories found</div>
				</Command.Empty>
			{/if}
			{#if useForCategory}
				<div class="flex items-center justify-between gap-2 px-3">
					<Input
						placeholder="Add a new category"
						bind:value={newValue}
						class="focus-visible::outline-none my-3 flex h-8 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground  focus-visible:border focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								addNewCategory();
							}
						}}
					/>
					<Button variant="secondary" size="sm" class="size-8" on:click={addNewCategory}>+</Button>
				</div>
			{/if}
			<Command.Group>
				{#each models__ as model}
					<Command.Item
						value={model.value}
						onSelect={(currentValue) => {
							// value = currentValue;
							if (!value || value === '') {
								value = currentValue;
							} else {
								if (value !== currentValue) {
									value = currentValue;
								} else {
									value = undefined;
								}
							}
							closeAndFocusTrigger(ids.trigger);
						}}
					>
						<Check class={cn('mr-2 h-4 w-4', value !== model.value && 'text-transparent')} />
						{model.label}
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
