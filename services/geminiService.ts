import { GoogleGenAI, Type } from "@google/genai";
import { GRID_HEIGHT, GRID_WIDTH } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLevelFromPrompt = async (prompt: string): Promise<number[][] | null> => {
  try {
    const modelId = 'gemini-2.5-flash'; 
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Create a 2D grid map for a tank battle game. 
      The grid size is ${GRID_WIDTH} columns by ${GRID_HEIGHT} rows.
      
      Use these integer codes for tiles:
      0 = Empty (Driveable)
      1 = Brick Wall (Destructible)
      2 = Steel Wall (Indestructible)
      3 = Water (Impassable but bullets fly over)
      4 = Grass (Hides tanks, visual only)
      9 = Base (The Eagle - MUST be at bottom center)

      User request description: "${prompt}"

      Ensure the Base (9) is protected by some walls. Ensure there is open space for tanks to move.
      Return ONLY the JSON object with the grid property.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grid: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.INTEGER
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const json = JSON.parse(response.text);
      const grid = json.grid;

      // Basic validation
      if (Array.isArray(grid) && grid.length === GRID_HEIGHT && grid[0].length === GRID_WIDTH) {
         return grid;
      }
    }
    
    return null;

  } catch (error) {
    console.error("Failed to generate level:", error);
    return null;
  }
};
