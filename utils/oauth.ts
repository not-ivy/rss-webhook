import { createDiscordOAuthConfig, createHelpers } from "@deno/kv-oauth";

const oauthConfig = createDiscordOAuthConfig({
  redirectUri: Deno.env.get("DISCORD_REDIRECT_URI") ?? "http://localhost:8000/api/callback",
  scope: ['identify']
});

const helpers = createHelpers(oauthConfig);

export default helpers;