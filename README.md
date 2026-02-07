# MCPorch

SuperBenefit's MCP Server Framework - a coordination hub providing shared access control, identity resolution, and standardized conventions for community-built MCP servers.

## Quick Start

```bash
npm install
npm run dev
```

- **Test MCP**: http://localhost:8787/mcp (use [MCP Inspector](https://github.com/modelcontextprotocol/inspector))
- **Test REST**: http://localhost:8787/api/v1/health

## Project Structure

```
src/
├── auth/           # Access control & identity resolution
├── mcp/            # MCP server, tools, and resources
├── api/            # REST API routes
└── index.ts        # Application entry point
```

## Available Routes

| Route | Description |
|-------|-------------|
| `/mcp` | MCP Streamable HTTP endpoint |
| `/api/v1/health` | Health check endpoint |

## Current Status

**Phase 1 (Open tier)** - All tools are public, no authentication required.

## Documentation

- [mcporch-spec.md](./mcporch-spec.md) - Full architecture specification
- [src/auth/README.md](./src/auth/README.md) - Access tier details
- [src/mcp/tools/README.md](./src/mcp/tools/README.md) - Adding new tools

## License

TBD
