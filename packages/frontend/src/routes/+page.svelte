<script lang="ts">
  import ChatWidget from "$lib/ChatWidget.svelte";
  // ← MUST have the $ sign!
</script>

<div
  class="min-h-screen bg-base-200 flex flex-col items-center justify-center p-8"
>
  <h1 class="text-5xl font-bold mb-4 text-primary">
    Welcome to HELEC Store Demo
  </h1>
  <p class="text-xl mb-12 text-center max-w-2xl">
    Chat with our AI assistant in real-time! The floating bubble is in the
    bottom right corner.
  </p>

  <!-- The chat widget appears here -->
  <ChatWidget />
</div>
