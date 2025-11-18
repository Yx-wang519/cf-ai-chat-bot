import { tool, type ToolSet } from "ai";
import { z } from "zod/v3";

/**
 * Weather information tool
 */
const getWeatherInformation = tool({
  description: "Show the weather in a given city to the user.",
  inputSchema: z.object({
    city: z.string().describe("The city name to look up.")
  }),
  execute: async ({ city }) => {
    console.log(`Getting weather information for ${city}`);
    return `The weather in ${city} is sunny with a high of 22°C.`;
  }
});

/**
 * Local time tool
 */
const getLocalTime = tool({
  description: "Get the local time for a specified location.",
  inputSchema: z.object({
    location: z.string().describe("The location to check the local time for.")
  }),
  execute: async ({ location }) => {
    console.log(`Getting local time for ${location}`);
    return `It is currently 10:00 AM in ${location}.`;
  }
});

export const tools = {
  getWeatherInformation,
  getLocalTime
} satisfies ToolSet;

