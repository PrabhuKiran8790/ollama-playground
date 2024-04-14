<script>
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { settingsRoutes } from '$lib/routes';
	import { cn } from '$lib/utils';
	import '../../app.pcss';
</script>

<div class="grid h-full grid-cols-[17%_1fr]">
	<div class="h-full">
		<div class="flex h-full flex-col gap-3 border-r p-4">
			{#each settingsRoutes as route (route.route)}
				<Button
					href={route.route}
					variant="outline"
					class={cn(
						'flex w-full items-center justify-between gap-2',
						$page.url.pathname === route.route ? 'bg-accent text-accent-foreground' : ''
					)}
				>
					<p>{route.name}</p>
					<svelte:component this={route.icon} class="size-5" />
				</Button>
			{/each}
		</div>
	</div>

	<div class="p-4">
		<slot />
	</div>
</div>
