import { Handlers } from "$fresh/server.ts";
import helpers from "../../utils/oauth.ts";

export const handler: Handlers = {
  GET(req, _) {
    return helpers.signIn(req);
  }
}