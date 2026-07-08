const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";
const DEFAULT_AGENT_BASE_URL = "http://localhost:8000";

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const resolveUrl = (url: string) => {
	if (url.startsWith("/")) {
		return `${window.location.origin}${url}`;
	}
	return url;
};

export const apiBaseUrl = normalizeBaseUrl(
	resolveUrl(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL)
);

export const apiHost = new URL(apiBaseUrl).origin;

export const agentBaseUrl = normalizeBaseUrl(
	resolveUrl(import.meta.env.VITE_API_AGENT_BASE_URL || DEFAULT_AGENT_BASE_URL)
);

export const agentHost = new URL(agentBaseUrl).origin;
