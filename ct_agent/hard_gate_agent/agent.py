import asyncio
import logging
from google.adk.agents.llm_agent import LlmAgent
from google.adk.models.lite_llm import LiteLlm
from .mcp_config import get_tools_async

logging.basicConfig(level=logging.INFO)



logging.basicConfig(level=logging.INFO)

# --- Async function to build the agent ---
async def build_root_agent():
    tools, exit_stack = await get_tools_async()

    agent = LlmAgent(
        model=LiteLlm(
            model="gpt-3.5-turbo",  # Ensure this is supported by your local LLM proxy
            base_url="http://localhost:1234/v1",
            api_key="dummy-key",     # Only needed if your proxy requires it
            provider="openai",       # Set to "openai" for OpenAI-compatible proxies
        ),
        name="hard_gate_agent",
        instruction="Help the user search for Airbnb stays using available tools.",
        tools=tools,
    )

    # Ensure cleanup of MCP toolset on shutdown
    agent.register_cleanup(exit_stack.aclose)

    logging.info("Agent instance built successfully.")
    return agent

# --- Synchronously build root_agent required by `adk web` ---
try:
    root_agent = asyncio.run(build_root_agent())
except Exception as e:
    logging.exception("Failed to initialize root_agent")
    root_agent = None  # Important: Avoid unbound variable if error occurs
