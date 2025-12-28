<script lang="ts">
  import { io } from "socket.io-client";
  import { onMount } from "svelte";

  let messages: any[] = [];
  let input = "";
  let socket: any;
  let isTyping = false;
  let showChat = false;
  let conversationId = "";
  let errorMessage = "";
  let showError = false;

  // Use Vite's environment variable system
  const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || "http://localhost:3000";

  // Show error toast
  function showErrorToast(message: string) {
    errorMessage = message;
    showError = true;
    setTimeout(() => {
      showError = false;
    }, 5000); // Hide after 5 seconds
  }

  onMount(async () => {
    // Load or create conversation
    conversationId = localStorage.getItem("helec_conversation_id") || "";

    if (conversationId) {
      // Load existing conversation history
      try {
        const response = await fetch(
          `${backendUrl}/api/chat/conversation/${conversationId}`
        );
        const data = await response.json();

        if (data.status === "success" && data.data.messages) {
          messages = data.data.messages;
          console.log(`Loaded ${messages.length} messages from conversation ${conversationId}`);
        } else {
          // Conversation not found, clear invalid ID
          localStorage.removeItem("helec_conversation_id");
          conversationId = "";
        }
      } catch (error) {
        console.error("Failed to load conversation history:", error);
        // Clear invalid conversation ID
        localStorage.removeItem("helec_conversation_id");
        conversationId = "";
      }
    }

    if (!conversationId) {
      // Create a new conversation via REST API
      try {
        const response = await fetch(`${backendUrl}/api/chat/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Hello! I'm looking for help." }),
        });
        const data = await response.json();

        if (data.status === "success" && data.conversationId) {
          conversationId = data.conversationId;
          localStorage.setItem("helec_conversation_id", conversationId);
          // Load initial messages
          if (data.messages && data.messages.length > 0) {
            messages = data.messages;
          }
          console.log("Created new conversation:", conversationId);
        }
      } catch (error) {
        console.error("Failed to create conversation:", error);
      }
    }

    // Connect Socket.IO
    socket = io(backendUrl, {
      reconnection: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Socket connected to backend");
      if (conversationId) {
        socket.emit("join_conversation", conversationId);
      }
    });

    socket.on("new_message", (msg: any) => {
      messages = [...messages, msg];
      scrollToBottom();
    });

    socket.on("typing", ({ isTyping: typing }: { isTyping: boolean }) => {
      isTyping = typing;
      scrollToBottom();
    });

    socket.on("error", (err: any) => {
      console.error("Socket error:", err);
    });
  });

  function sendMessage() {
    console.log("sendMessage called", { input, conversationId });

    if (!input.trim()) {
      showErrorToast("Please type a message first");
      return;
    }

    if (input.trim().length > 2000) {
      showErrorToast("Message is too long (maximum 2000 characters)");
      return;
    }

    if (!conversationId) {
      showErrorToast("Connection not ready. Please wait a moment.");
      return;
    }

    if (!socket || !socket.connected) {
      showErrorToast("Not connected. Reconnecting...");
      return;
    }

    const message = {
      content: input.trim(),
      conversationId,
    };

    console.log("Emitting send_message:", message);
    socket.emit("send_message", message);
    input = "";
  }

  function scrollToBottom() {
    const container = document.getElementById("messages");
    if (container) container.scrollTop = container.scrollHeight;
  }

  function resetConversation() {
    if (confirm("Start a new conversation? This will clear your current chat.")) {
      localStorage.removeItem("helec_conversation_id");
      messages = [];
      conversationId = "";
      showChat = false;
      // Reload to create new conversation
      window.location.reload();
    }
  }
</script>

<!-- Floating Bubble Button -->
<button
  class="fixed bottom-6 right-6 z-50 btn btn-circle btn-lg btn-primary shadow-2xl"
  on:click={() => (showChat = !showChat)}
>
  <span class="text-3xl">💬</span>
</button>

{#if showChat}
  <!-- Chat Window -->
  <div
    class="fixed bottom-24 right-6 z-50 card bg-base-100 w-96 shadow-2xl rounded-box overflow-hidden"
  >
    <!-- Header -->
    <div class="bg-primary text-primary-content p-4 flex items-center gap-3">
      <div class="avatar">
        <div
          class="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
        >
          <img
            src="https://api.dicebear.com/7.x/bottts/svg?seed=HELEC"
            alt="HELEC Bot"
          />
        </div>
      </div>
      <div class="flex-1">
        <h3 class="font-bold">HELEC Assistant</h3>
        <p class="text-xs opacity-80">Online • Replies instantly</p>
      </div>
      <button
        class="btn btn-ghost btn-sm btn-circle"
        on:click={resetConversation}
        title="Start new conversation"
        aria-label="Start new conversation"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>

    <!-- Messages Area -->
    <div
      id="messages"
      class="flex-1 p-4 overflow-y-auto max-h-96 bg-base-200 space-y-4"
    >
      {#each messages as msg}
        <div
          class="{msg.senderType === 'user' ? 'chat-end' : 'chat-start'} chat"
        >
          <div
            class="chat-bubble {msg.senderType === 'user'
              ? 'chat-bubble-primary'
              : 'chat-bubble-secondary'} max-w-[80%]"
          >
            {msg.content}
          </div>
          <div class="chat-footer opacity-50 text-xs mt-1">
            {new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      {/each}

      {#if isTyping}
        <div class="chat-start">
          <div class="chat-bubble chat-bubble-secondary">
            <span class="loading loading-dots loading-md"></span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Input Area -->
    <div class="p-4 border-t border-base-300 bg-base-100">
      <div class="join w-full">
        <input
          bind:value={input}
          on:keydown={(e) =>
            e.key === "Enter" && (e.preventDefault(), sendMessage())}
          placeholder="Type your message..."
          class="input input-bordered join-item flex-1"
        />
        <button class="btn btn-primary join-item" on:click={sendMessage}
          >Send</button
        >
      </div>
    </div>
  </div>
{/if}

<!-- Error Toast Notification -->
{#if showError}
  <div
    class="toast toast-top toast-center z-50"
    role="alert"
    aria-live="assertive"
  >
    <div class="alert alert-error shadow-lg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="stroke-current shrink-0 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{errorMessage}</span>
      <button
        class="btn btn-sm btn-ghost"
        on:click={() => (showError = false)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  </div>
{/if}
