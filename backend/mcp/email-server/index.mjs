import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import nodemailer from "nodemailer";
import { z } from "zod";

const toolInputSchema = {
	to: z.string().min(1),
	subject: z.string().min(1),
	text: z.string().min(1).optional(),
	html: z.string().min(1).optional(),
	from: z.string().min(1).optional(),
	replyTo: z.string().min(1).optional(),
};

function isEmailEnabled() {
	const v = (process.env.EMAIL_ENABLED ?? "true").toLowerCase().trim();
	return v === "1" || v === "true" || v === "yes" || v === "on";
}

function buildTransport() {
	const host = process.env.SMTP_HOST;
	const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;

	if (!host) throw new Error("Missing SMTP_HOST");
	if (!user) throw new Error("Missing SMTP_USER");
	if (!pass) throw new Error("Missing SMTP_PASS");

	// If the user explicitly sets SMTP_SECURE=true, use SMTPS (usually 465).
	const secureEnv = (process.env.SMTP_SECURE ?? "").toLowerCase().trim();
	const secure =
		secureEnv === "1" ||
		secureEnv === "true" ||
		secureEnv === "yes" ||
		secureEnv === "on";

	return nodemailer.createTransport({
		host,
		port,
		secure,
		auth: { user, pass },
	});
}

const server = new McpServer({
	name: "quiz-portal-email-server",
	version: "1.0.0",
});

server.tool(
	"send_test_submission_email",
	toolInputSchema,
	async ({ to, subject, text, html, from, replyTo }) => {
		if (!isEmailEnabled()) {
			return {
				content: [
					{
						type: "text",
						text: "EMAIL_ENABLED is false; skipped sending email.",
					},
				],
			};
		}

		const transport = buildTransport();
		const defaultFrom = process.env.EMAIL_FROM || process.env.SMTP_USER;

		await transport.sendMail({
			from: from || defaultFrom,
			to,
			subject,
			text: text || undefined,
			html: html || undefined,
			replyTo: replyTo || undefined,
		});

		return { content: [{ type: "text", text: `Email sent to ${to}` }] };
	},
);

const transport = new StdioServerTransport();
await server.connect(transport);
