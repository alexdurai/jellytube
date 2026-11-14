<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Monitor, Pause, Play, X } from 'lucide-svelte';
  import type { PlayerPreferences, PreferredVideoResolution } from '../lib/playerPreferences';

  export let preferences: PlayerPreferences;

  const dispatch = createEventDispatcher<{
    change: PlayerPreferences;
    close: void;
  }>();

  let activeTab: 'playback' | 'player' | 'paused' = 'playback';

  function update<K extends keyof PlayerPreferences>(key: K, value: PlayerPreferences[K]) {
    dispatch('change', { ...preferences, [key]: value });
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') dispatch('close');
  }

  function handleTabKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const tabs = ['playback', 'player', 'paused'] as const;
    const currentIndex = tabs.indexOf(activeTab);
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    activeTab = tabs[(currentIndex + direction + tabs.length) % tabs.length];
    document.getElementById(`player-options-tab-${activeTab}`)?.focus();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
  class="player-options-backdrop"
  role="presentation"
  tabindex="-1"
  on:click={handleBackdropClick}
  on:keydown={handleKeydown}
>
  <div
    class="player-options-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="player-options-title"
    tabindex="-1"
    on:click|stopPropagation
    on:keydown|stopPropagation
  >
    <header class="player-options-header">
      <div>
        <h2 id="player-options-title">Options</h2>
        <p>Customize playback, player display, and the paused screen.</p>
      </div>
      <button class="player-options-close" aria-label="Close options" on:click={() => dispatch('close')}>
        <X size={20} />
      </button>
    </header>

    <div class="player-options-layout">
      <div
        class="player-options-tabs"
        aria-label="Option categories"
        role="tablist"
        aria-orientation="vertical"
        tabindex="0"
        on:keydown={handleTabKeydown}
      >
        <button
          id="player-options-tab-playback"
          class:active={activeTab === 'playback'}
          role="tab"
          aria-selected={activeTab === 'playback'}
          aria-controls="player-options-panel-playback"
          on:click={() => (activeTab = 'playback')}
        >
          <Play size={18} />
          <span>Playback</span>
        </button>
        <button
          id="player-options-tab-player"
          class:active={activeTab === 'player'}
          role="tab"
          aria-selected={activeTab === 'player'}
          aria-controls="player-options-panel-player"
          on:click={() => (activeTab = 'player')}
        >
          <Monitor size={18} />
          <span>Player display</span>
        </button>
        <button
          id="player-options-tab-paused"
          class:active={activeTab === 'paused'}
          role="tab"
          aria-selected={activeTab === 'paused'}
          aria-controls="player-options-panel-paused"
          on:click={() => (activeTab = 'paused')}
        >
          <Pause size={18} />
          <span>Paused screen</span>
        </button>
      </div>

      {#if activeTab === 'playback'}
        <div
          class="player-options-panel"
          id="player-options-panel-playback"
          role="tabpanel"
          aria-labelledby="player-options-tab-playback"
        >
          <h3>Playback</h3>
          <label class="player-option-row">
            <span>
              <strong>Preferred video resolution</strong>
              <small>Choose the maximum resolution for new playback.</small>
            </span>
            <select
              value={preferences.preferredVideoResolution}
              on:change={(event) => update(
                'preferredVideoResolution',
                (event.currentTarget as HTMLSelectElement).value as PreferredVideoResolution
              )}
            >
              <option value="max">Maximum available</option>
              <option value="2160">2160p (4K)</option>
              <option value="1080">1080p</option>
              <option value="720">720p</option>
              <option value="480">480p</option>
              <option value="360">360p</option>
            </select>
          </label>
          <p class="player-options-note">Resolution preferences apply when starting a video. You can still change quality from the player.</p>
          <label class="player-option-row">
            <span>
              <strong>Always play with captions</strong>
              <small>Choose the server default or first available caption track.</small>
            </span>
            <input
              type="checkbox"
              checked={preferences.alwaysPlayWithCaptions}
              on:change={(event) => update('alwaysPlayWithCaptions', (event.currentTarget as HTMLInputElement).checked)}
            />
          </label>
        </div>
      {:else if activeTab === 'player'}
        <div
          class="player-options-panel"
          id="player-options-panel-player"
          role="tabpanel"
          aria-labelledby="player-options-tab-player"
        >
          <h3>Player display</h3>
          <label class="player-option-row">
            <span>
              <strong>Always stretch to fill</strong>
              <small>Stretch video to the display's aspect ratio.</small>
            </span>
            <input
              type="checkbox"
              checked={preferences.alwaysStretchToFill}
              on:change={(event) => update('alwaysStretchToFill', (event.currentTarget as HTMLInputElement).checked)}
            />
          </label>
          <label class="player-option-row">
            <span>
              <strong>Show expanded video title</strong>
              <small>Include series, episode date, or movie year and rating in the player title.</small>
            </span>
            <input
              type="checkbox"
              checked={preferences.showExpandedVideoTitle}
              on:change={(event) => update('showExpandedVideoTitle', (event.currentTarget as HTMLInputElement).checked)}
            />
          </label>
          <label class="player-option-row">
            <span>
              <strong>Show video end time in player bar</strong>
              <small>Display the estimated clock time when playback will end.</small>
            </span>
            <input
              type="checkbox"
              checked={preferences.showVideoEndTime}
              on:change={(event) => update('showVideoEndTime', (event.currentTarget as HTMLInputElement).checked)}
            />
          </label>
          <label class="player-option-row">
            <span>
              <strong>Show playback method and resolution</strong>
              <small>Show Direct Play, Direct Stream, or Transcoding and the video resolution.</small>
            </span>
            <input
              type="checkbox"
              checked={preferences.showPlaybackInfo}
              on:change={(event) => update('showPlaybackInfo', (event.currentTarget as HTMLInputElement).checked)}
            />
          </label>
          <label class="player-option-row">
            <span>
              <strong>Picture-in-picture on window blur</strong>
              <small>Enter picture-in-picture while video is playing when this window loses focus.</small>
            </span>
            <input
              type="checkbox"
              checked={preferences.autoPictureInPictureOnBlur}
              on:change={(event) => update('autoPictureInPictureOnBlur', (event.currentTarget as HTMLInputElement).checked)}
            />
          </label>
        </div>
      {:else}
        <div
          class="player-options-panel"
          id="player-options-panel-paused"
          role="tabpanel"
          aria-labelledby="player-options-tab-paused"
        >
          <h3>Paused screen</h3>
          <label class="player-option-row">
            <span>
              <strong>Show related items while paused</strong>
              <small>Show related movies, episodes, or music videos in the paused player.</small>
            </span>
            <input
              type="checkbox"
              checked={preferences.showPausedRecommendations}
              on:change={(event) => update('showPausedRecommendations', (event.currentTarget as HTMLInputElement).checked)}
            />
          </label>
          <label class="player-option-row">
            <span>
              <strong>Show cast while paused</strong>
              <small>Show cast members in a separate row when available.</small>
            </span>
            <input
              type="checkbox"
              checked={preferences.showPausedCast}
              on:change={(event) => update('showPausedCast', (event.currentTarget as HTMLInputElement).checked)}
            />
          </label>
          <label class="player-option-row">
            <span>
              <strong>Show paused panel background</strong>
              <small>Show the translucent background behind paused content.</small>
            </span>
            <input
              type="checkbox"
              checked={preferences.showPausedOverlayBackground}
              on:change={(event) => update('showPausedOverlayBackground', (event.currentTarget as HTMLInputElement).checked)}
            />
          </label>
          <label class="player-option-row">
            <span>
              <strong>Related items shown</strong>
              <small>Choose how many items the paused related row contains.</small>
            </span>
            <select
              value={preferences.pausedRelatedItemCount}
              on:change={(event) => update('pausedRelatedItemCount', Number((event.currentTarget as HTMLSelectElement).value))}
            >
              {#each [2, 3, 4, 5, 6, 7, 8] as count}
                <option value={count}>{count}</option>
              {/each}
            </select>
          </label>
          <label class="player-option-row">
            <span>
              <strong>Related thumbnail size</strong>
              <small>Resize the thumbnails in the paused related row.</small>
            </span>
            <input
              type="range"
              min="120"
              max="320"
              step="20"
              value={preferences.pausedRelatedItemWidth}
              on:input={(event) => update('pausedRelatedItemWidth', Number((event.currentTarget as HTMLInputElement).value))}
              aria-label="Related thumbnail size"
            />
          </label>
        </div>
      {/if}
    </div>
  </div>
</div>
