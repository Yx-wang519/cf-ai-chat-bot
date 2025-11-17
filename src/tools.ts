/**
 * Simple demo tools for the AI chat agent.
 * - getWeatherInformation: fake weather lookup
 * - getLocalTime: fake local time lookup
 */
import { tool, type ToolSet } from "ai";
import { z } from "zod/v3";

/**
 * Weather information tool
 * Just returns a fake weather string for demo purposes.
 */
const getWeatherInformation = tool({
  description: "Show the weather in a given city to the user.",
  inputSchema: z.object({
    city: z.string().describe("The city name to look up.")
  }),
  execute: async ({ city }) => {
    console.log(`Getting weather information for ${city}`);
    // Demo only – here you could call a real weather API
    return `The weather in ${city} is sunny with a high of 22°C.`;
  }
});

/**
 * Local time tool
 * Returns a fake local time string – good enough for demo.
 */
const getLocalTime = tool({
  description: "Get the local time for a specified location.",
  inputSchema: z.object({
    location: z.string().describe("The location to check the local time for.")
  }),
  execute: async ({ location }) => {
    console.log(`Getting local time for ${location}`);
    // Demo only – you can replace this with a real time API
    return `It is currently 10:00 AM in ${location}.`;
  }
});

/**
 * Export all available tools.
 */
export const tools = {
  getWeatherInformation,
  getLocalTime
} satisfies ToolSet;

// We no longer need an `executions` object;
// all tools execute directly via their `execute` functions.