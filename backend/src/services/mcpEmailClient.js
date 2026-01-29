const path = require("path");

/**
 * Calls the local MCP stdio email server tool.
 *
 * Notes:
 * - This is intentionally deterministic (no prompting/LLM usage).
 * - Failures should be handled by callers to avoid breaking primary flows.
 */
async function callMcpEmailTool(toolName, toolArgs) {
	// The MCP SDK is ESM-first. Use dynamic import from CommonJS.
	const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
	const { StdioClientTransport } = await import(
		"@modelcontextprotocol/sdk/client/stdio.js"
	);

	const serverScript = path.resolve(
		__dirname,
		"../../mcp/email-server/index.mjs",
	);

	const client = new Client(
		{ name: "quiz-portal-backend", version: "1.0.0" },
		{ capabilities: {} },
	);

	const transport = new StdioClientTransport({
		command: process.execPath,
		args: [serverScript],
		env: process.env,
	});

	try {
		await client.connect(transport);
		const result = await client.callTool({
			name: toolName,
			arguments: toolArgs,
		});
		return result;
	} finally {
		// Close transport even if the call fails.
		try {
			await transport.close();
		} catch {
			// ignore
		}
	}
}

async function sendTestSubmissionEmail({ to, subject, text, html }) {
	return callMcpEmailTool("send_test_submission_email", {
		to,
		subject,
		text,
		html,
	});
}

module.exports = {
	callMcpEmailTool,
	sendTestSubmissionEmail,
};
