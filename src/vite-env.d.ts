/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_GOOGLE_CLIENT_ID?: string;
	readonly VITE_STRIPE_PAYMENT_LINK?: string;
	readonly VITE_TAILSCALE_HOST?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
