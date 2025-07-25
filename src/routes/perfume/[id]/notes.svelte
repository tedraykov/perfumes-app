<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { Perfume, PerfumeNote } from '$lib/server/db/schema';
	import NotesGroup from './notes-group.svelte';

	let { perfume }: { perfume: Perfume } = $props();

	// Groups notes by their type into top, middle, and base arrays.
	function groupNotes({ notes }: Perfume) {
		if (!notes) {
			throw new Error('Notes are missing from the queried perfume');
		}
		const groups = {
			topNotes: [] as PerfumeNote[],
			middleNotes: [] as PerfumeNote[],
			baseNotes: [] as PerfumeNote[],
			ungroupedNotes: [] as PerfumeNote[]
		};
		for (const note of notes) {
			switch (note.note_type) {
				case 'top':
					groups.topNotes.push(note);
					break;
				case 'middle':
					groups.middleNotes.push(note);
					break;
				case 'base':
					groups.baseNotes.push(note);
					break;
				default:
					groups.ungroupedNotes.push(note);
			}
		}
		return groups;
	}
	const notes = $derived(groupNotes(perfume));
</script>

<div class="notes-box mx-auto flex flex-col gap-4">
	<NotesGroup title="Top Notes" notes={notes.topNotes} />
	<NotesGroup title="Middle Notes" notes={notes.middleNotes} />
	<NotesGroup title="Base Notes" notes={notes.baseNotes} />
</div>
