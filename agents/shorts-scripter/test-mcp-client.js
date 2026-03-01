import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MCP_SERVER_PATH = path.join(__dirname, "../../mcp-servers/notebooklm-audio-mcp/index.js");

async function main() {
    const transport = new StdioClientTransport({
        command: "node",
        args: [MCP_SERVER_PATH]
    });

    const client = new Client({
        name: "test-client",
        version: "1.0.0"
    }, {
        capabilities: {}
    });

    await client.connect(transport);
    
    console.log("Connected to NotebookLM Audio MCP");

    const notebookUrl = "https://notebooklm.google.com/notebook/2c528d3c-a785-4d4d-a904-7b5241af1c3b";
    const videoUrl = "https://www.youtube.com/watch?v=fiRfcZ3WOcM";

    try {
        console.log(`Calling extract_youtube_transcript for ${videoUrl}...`);
        const result = await client.callTool({
            name: "extract_youtube_transcript",
            arguments: {
                videoUrl: videoUrl,
                notebookId: notebookUrl
            }
        });
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }

    await client.close();
}

main().catch(console.error);
