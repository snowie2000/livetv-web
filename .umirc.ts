import proxy from "./config/proxy"
import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "index" },
    { path: "/login", component: "login" },
    { path: "/channels", component: "channels"}
  ],
  npmClient: 'yarn',
  proxy: proxy.dev,
  favicons: ["favicon.png","favicon.ico"]
});
