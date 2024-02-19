import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "index" },
    { path: "/login", component: "login" },
    { path: "/channels", component: "channels"}
  ],
  npmClient: 'yarn',
  favicons: ["favicon.png"]
});
