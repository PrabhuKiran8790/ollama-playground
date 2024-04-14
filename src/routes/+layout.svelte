<script lang="ts">
	import { page } from '$app/stores';
	import { ChatPanelClose } from '$lib/stores';
	import { cn } from '$lib/utils';
	import Triangle from 'lucide-svelte/icons/triangle';
	import '../app.pcss';

	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-svelte';
	import { ModeWatcher, mode, toggleMode } from 'mode-watcher';

	import { onNavigate } from '$app/navigation';
	import { bottomRoutes, routes, settingsRoutes } from '$lib/routes';

	const preparePageTransition = () => {
		onNavigate((navigation) => {
			if (!(document as any).startViewTransition) return;

			return new Promise((resolve) => {
				(document as any).startViewTransition(async () => {
					resolve();
					await navigation.complete;
				});
			});
		});
	};

	preparePageTransition();

	$: currentRoute = routes.find((r) => {
		return r.route === $page.url.pathname;
	});

	$: {
		if (!currentRoute) {
			currentRoute = bottomRoutes.find((r) => {
				return r.route === $page.url.pathname;
			});
		}
	}

	$: {
		if (!currentRoute) {
			currentRoute = settingsRoutes.find((r) => {
				return r.route === $page.url.pathname;
			});
		}
	}
</script>

<ModeWatcher />

<div class="fixed h-full w-full">
	<div class="grid h-screen w-full pl-[53px]">
		<aside class="inset-y fixed left-0 z-20 flex h-full flex-col border-r">
			<div class="border-b p-2">
				<Button variant="outline" size="icon" aria-label="Home" href="/">
					<!-- <Triangle class="size-5 fill-foreground" /> -->
					<img src="/Ollama (1).png" alt="Ollama-Logo" class="-mt-1 h-6 dark:invert dark:filter" />
				</Button>
			</div>
			<nav class="grid gap-1 p-2">
				{#each routes as { name, route, icon }, i}
					<Tooltip.Root>
						<Tooltip.Trigger asChild let:builder>
							<Button
								variant="ghost"
								size="icon"
								class={cn('rounded-lg', $page.url.pathname === route && 'bg-muted')}
								aria-label={name}
								builders={[builder]}
								href={route}
							>
								<svelte:component this={icon} class="size-5" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content side="right" sideOffset={5}>{name}</Tooltip.Content>
					</Tooltip.Root>
				{/each}
			</nav>
			<nav class="mt-auto grid gap-1 p-2">
				<Tooltip.Root>
					<Tooltip.Trigger asChild let:builder>
						<Button
							on:click={toggleMode}
							variant="ghost"
							size="icon"
							class="rounded-lg"
							builders={[builder]}
						>
							<Moon
								class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
							/>
							<Sun
								class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
							/>
							<span class="sr-only">Toggle theme</span>
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="right" sideOffset={5}>
						{#if $mode === 'dark'}
							Light mode
						{:else}
							Dark mode
						{/if}
					</Tooltip.Content>
				</Tooltip.Root>
				{#each bottomRoutes as route}
					<Tooltip.Root>
						<Tooltip.Trigger asChild let:builder>
							<Button
								variant="ghost"
								size="icon"
								class={cn('mt-auto rounded-lg', $page.url.pathname === route.route && 'bg-muted')}
								aria-label="Help"
								builders={[builder]}
								href={route.route}
							>
								<svelte:component this={route.icon} class="size-5" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content side="right" sideOffset={5}>{route.name}</Tooltip.Content>
					</Tooltip.Root>
				{/each}
			</nav>
		</aside>
		<div class="ml-1 flex flex-col">
			<header
				class="sticky top-[3px] z-10 flex h-[54px] w-full items-center justify-between gap-1 border-b bg-background px-4"
			>
				<h1 class="text-xl font-semibold">
					Ollama-Playground | <span class="text-xs text-muted-foreground">{currentRoute?.name}</span
					>
				</h1>
				{#if $page.url.pathname === '/'}
					<div>
						<button
							on:click={() => {
								$ChatPanelClose = !$ChatPanelClose;
							}}
						>
							{#if $ChatPanelClose}
								<PanelLeftClose />
							{:else}
								<PanelLeftOpen />
							{/if}
						</button>
					</div>
				{/if}
			</header>
			<div class="h-[95%]">
				<slot />
			</div>
		</div>
	</div>
</div>
