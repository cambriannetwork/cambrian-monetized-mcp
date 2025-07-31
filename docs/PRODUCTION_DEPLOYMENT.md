# Cambrian Monetized MCP Server - Production Deployment

## 🚀 Deployment Status: LIVE

The Cambrian Monetized MCP server has been successfully deployed to production!

### Server Details
- **Status**: ✅ Running
- **Port**: 50133
- **URL**: http://localhost:50133
- **Process Manager**: PM2 (ID: 5, Name: cambrian-monetized-mcp)

### Key Configuration
- **API Key**: ricky.ovJYjDLpKaoX3Wcu
- **Payment Recipient**: 0x4C3B0B1Cab290300bd5A36AD5f33A607acbD7ac3
- **Cambrian API**: https://opabinia.cambrian.org

### Management Commands

```bash
# View logs
pm2 logs cambrian-monetized-mcp

# Check status
pm2 status cambrian-monetized-mcp

# Stop server
pm2 stop cambrian-monetized-mcp

# Restart server
pm2 restart cambrian-monetized-mcp

# Remove from PM2
pm2 delete cambrian-monetized-mcp
```

### Monitoring

The server is now running as a background process managed by PM2. It will:
- Automatically restart if it crashes
- Start on system reboot (if PM2 startup is configured)
- Log all output to PM2 logs

### Integration with Claude Desktop

To use this MCP server with Claude Desktop, add this configuration:

```json
{
  "mcpServers": {
    "cambrian-api": {
      "command": "node",
      "args": ["http://YOUR_SERVER_IP:50133"],
      "env": {
        "MCP_SERVER_URL": "http://YOUR_SERVER_IP:50133"
      }
    }
  }
}
```

### Security Notes

1. The server is currently bound to all interfaces (0.0.0.0)
2. Consider adding firewall rules if external access is needed
3. The API key is stored in environment variables
4. All payments go to the configured recipient address

### Files Deployed

- `/projects/rickycambrian/cambrian-monetized-mcp-dev/` - Working directory
- `dist/` - Compiled JavaScript files
- `.env.production` - Production environment variables
- `start-production-direct.sh` - Startup script

The deployment was completed safely without affecting any existing services on the server.