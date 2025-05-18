# mcp_config.py
from contextlib import AsyncExitStack
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StdioServerParameters

async def get_tools_async():
    server_params = StdioServerParameters(
        command="npx",
        args=["-y", "@openbnb/mcp-server-airbnb", "--ignore-robots-txt"],
    )
    tools, exit_stack = await MCPToolset.from_server(connection_params=server_params)
    return tools, exit_stack
