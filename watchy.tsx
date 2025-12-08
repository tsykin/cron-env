import { serve } from "bun";

console.log("I restarted at:", Date.now());

serve({
	port: 4003,
	fetch(request: Request) {
		return new Response("Sup");
	},
});
