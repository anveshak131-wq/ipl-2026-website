import { onRequest as __api_admin_users_activity_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/admin/users/activity.js"
import { onRequest as __api_admin_login_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/admin/login.js"
import { onRequest as __api_admin_setup_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/admin/setup.js"
import { onRequest as __api_admin_users_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/admin/users.js"
import { onRequest as __api_messages__id__js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/messages/[id].js"
import { onRequest as __api_auth_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/auth.js"
import { onRequest as __api_content_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/content.js"
import { onRequest as __api_enrichDescription_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/enrichDescription.js"
import { onRequest as __api_live_score_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/live-score.js"
import { onRequest as __api_matches_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/matches.js"
import { onRequest as __api_messages_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/messages.js"
import { onRequest as __api_players_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/players.js"
import { onRequest as __api_seed_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/seed.js"
import { onRequest as __api_settings_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/settings.js"
import { onRequest as __api_teams_js_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/api/teams.js"
import { onRequest as ____route___ts_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/[[route]].ts"
import { onRequest as ___middleware_ts_onRequest } from "/Users/anvesh/Downloads/sportsup99/functions/_middleware.ts"

export const routes = [
    {
      routePath: "/api/admin/users/activity",
      mountPath: "/api/admin/users",
      method: "",
      middlewares: [],
      modules: [__api_admin_users_activity_js_onRequest],
    },
  {
      routePath: "/api/admin/login",
      mountPath: "/api/admin",
      method: "",
      middlewares: [],
      modules: [__api_admin_login_js_onRequest],
    },
  {
      routePath: "/api/admin/setup",
      mountPath: "/api/admin",
      method: "",
      middlewares: [],
      modules: [__api_admin_setup_js_onRequest],
    },
  {
      routePath: "/api/admin/users",
      mountPath: "/api/admin",
      method: "",
      middlewares: [],
      modules: [__api_admin_users_js_onRequest],
    },
  {
      routePath: "/api/messages/:id",
      mountPath: "/api/messages",
      method: "",
      middlewares: [],
      modules: [__api_messages__id__js_onRequest],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_auth_js_onRequest],
    },
  {
      routePath: "/api/content",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_content_js_onRequest],
    },
  {
      routePath: "/api/enrichDescription",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_enrichDescription_js_onRequest],
    },
  {
      routePath: "/api/live-score",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_live_score_js_onRequest],
    },
  {
      routePath: "/api/matches",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_matches_js_onRequest],
    },
  {
      routePath: "/api/messages",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_messages_js_onRequest],
    },
  {
      routePath: "/api/players",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_players_js_onRequest],
    },
  {
      routePath: "/api/seed",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_seed_js_onRequest],
    },
  {
      routePath: "/api/settings",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_settings_js_onRequest],
    },
  {
      routePath: "/api/teams",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_teams_js_onRequest],
    },
  {
      routePath: "/:route*",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [____route___ts_onRequest],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_ts_onRequest],
      modules: [],
    },
  ]