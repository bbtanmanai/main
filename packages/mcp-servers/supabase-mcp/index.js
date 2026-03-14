import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 환경 변수 로드 (.env 파일이 루트에 있음)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const server = new Server(
  {
    name: "supabase-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 도구 목록 정의
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query_table",
        description: "Supabase 테이블에서 데이터를 조회합니다.",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "테이블 이름" },
            select: { type: "string", description: "조회할 컬럼 (기본값: *)", default: "*" },
            filter: { 
              type: "object", 
              description: "필터 조건 (예: { id: 1 })",
              additionalProperties: true
            },
            limit: { type: "number", description: "최대 결과 수", default: 10 },
            order: { type: "string", description: "정렬 기준 컬럼" },
            ascending: { type: "boolean", description: "오름차순 여부", default: false }
          },
          required: ["table"],
        },
      },
      {
        name: "insert_row",
        description: "Supabase 테이블에 새로운 데이터를 추가합니다.",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "테이블 이름" },
            data: { type: "object", description: "추가할 데이터 객체" },
          },
          required: ["table", "data"],
        },
      },
      {
        name: "update_row",
        description: "Supabase 테이블의 기존 데이터를 수정합니다.",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "테이블 이름" },
            data: { type: "object", description: "수정할 데이터" },
            match: { type: "object", description: "수정할 대상을 찾는 조건 (예: { id: 1 })" },
          },
          required: ["table", "data", "match"],
        },
      },
      {
        name: "delete_row",
        description: "Supabase 테이블에서 데이터를 삭제합니다.",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "테이블 이름" },
            match: { type: "object", description: "삭제할 대상을 찾는 조건 (예: { id: 1 })" },
          },
          required: ["table", "match"],
        },
      },
      {
        name: "rpc",
        description: "Supabase Postgres function (RPC)을 호출합니다.",
        inputSchema: {
          type: "object",
          properties: {
            function_name: { type: "string", description: "함수 이름" },
            params: { type: "object", description: "함수 인자" },
          },
          required: ["function_name"],
        },
      }
    ],
  };
});

// 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "query_table": {
        let query = supabase.from(args.table).select(args.select || "*");
        
        if (args.filter) {
          for (const [key, value] of Object.entries(args.filter)) {
            query = query.eq(key, value);
          }
        }
        
        if (args.order) {
          query = query.order(args.order, { ascending: !!args.ascending });
        }
        
        if (args.limit) {
          query = query.limit(args.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "insert_row": {
        const { data, error } = await supabase.from(args.table).insert(args.data).select();
        if (error) throw error;
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "update_row": {
        const { data, error } = await supabase.from(args.table).update(args.data).match(args.match).select();
        if (error) throw error;
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "delete_row": {
        const { data, error } = await supabase.from(args.table).delete().match(args.match).select();
        if (error) throw error;
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "rpc": {
        const { data, error } = await supabase.rpc(args.function_name, args.params);
        if (error) throw error;
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: `Supabase Error: ${error.message}` }],
    };
  }
});

// 서버 시작
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Supabase MCP server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
