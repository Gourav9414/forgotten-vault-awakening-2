<script>
  let loaded = false;
  function onLoad() { loaded = true; }
</script>

<svelte:head>
  <title>Forgotten Vault: Awakening</title>
  <meta name="description" content="Forgotten Vault: Awakening — virtual-credit prototype." />
  <meta name="theme-color" content="#090817" />
</svelte:head>

<main class="prototype-host" aria-label="Forgotten Vault prototype">
  {#if !loaded}<div class="loading">Opening Forgotten Vault…</div>{/if}
  <iframe title="Forgotten Vault: Awakening" src="/forgotten-vault.html" on:load={onLoad}></iframe>
</main>

<style>
  :global(html), :global(body), :global(#app) { margin: 0; width: 100%; min-width: 320px; min-height: 100%; height: 100%; }
  .prototype-host { position: relative; width: 100%; min-height: 100vh; background: #090817; }
  iframe { display: block; width: 100%; height: 100vh; min-height: 100vh; border: 0; background: #090817; }
  .loading { position: absolute; inset: 0; display: grid; place-items: center; color: #f2c779; font: 600 14px system-ui, sans-serif; pointer-events: none; z-index: 1; }
</style>
