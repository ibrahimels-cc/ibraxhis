
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PuzzleType, PuzzleData, Language, TriviaData, Difficulty } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Define the schema for the puzzle response
const puzzleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { 
      type: Type.STRING, 
      enum: [PuzzleType.DOORS, PuzzleType.DETECTIVE, PuzzleType.RIDDLE, PuzzleType.VISUAL],
      description: "The type of puzzle to generate."
    },
    title: { type: Type.STRING, description: "A short, catchy title for the puzzle." },
    story: { type: Type.STRING, description: "The scenario, narrative, or VISUAL PATTERN (using emojis/symbols)." },
    question: { type: Type.STRING, description: "The specific question the player needs to answer." },
    options: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "An array of 3-4 possible answers or choices." 
    },
    correctIndex: { type: Type.INTEGER, description: "The zero-based index of the correct option." },
    hint: { type: Type.STRING, description: "A subtle hint that doesn't give away the answer completely." },
    explanation: { type: Type.STRING, description: "A brief explanation of why the answer is correct." },
    difficultyLevel: { type: Type.INTEGER, description: "The difficulty level of this puzzle." }
  },
  required: ["type", "title", "story", "question", "options", "correctIndex", "hint", "explanation", "difficultyLevel"],
};

const triviaSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING, description: "The trivia question." },
    options: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "4 possible answers." 
    },
    correctIndex: { type: Type.INTEGER, description: "The index of the correct answer (0-3)." },
    explanation: { type: Type.STRING, description: "Fun fact explaining the answer." },
    category: { type: Type.STRING, description: "Category of the question (e.g. Science, History)." }
  },
  required: ["question", "options", "correctIndex", "explanation", "category"],
};

const emojiQuestSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        emojis: { type: Type.STRING, description: "A sequence of 3-6 emojis representing the answer." },
        answer: { type: Type.STRING, description: "The correct movie, book, or phrase." },
        hint: { type: Type.STRING, description: "A text hint." },
        category: { type: Type.STRING, description: "Category (Movie, Idiom, Place)." }
    },
    required: ["emojis", "answer", "hint", "category"]
};

// Comic Script Schema
const comicScriptSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        panels: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    imagePrompt: { type: Type.STRING, description: "Detailed visual description for the image generator" },
                    caption: { type: Type.STRING, description: "Text or dialogue for this panel (in the requested language)" }
                },
                required: ["imagePrompt", "caption"]
            }
        }
    },
    required: ["panels"]
};

const getLanguageName = (lang: Language) => {
  switch(lang) {
    case 'en': return 'English';
    case 'jp': return 'Japanese';
    case 'ar': default: return 'Arabic';
  }
};

export const generatePuzzle = async (level: number, difficulty: Difficulty, language: Language = 'ar'): Promise<PuzzleData> => {
  try {
    // RANDOM STRATEGY: Ensure a wide mix of types
    const rand = Math.random();
    let requestedType = "";
    
    // 25% chance for each type
    if (rand < 0.25) requestedType = "VISUAL puzzle using Emojis/Symbols/Patterns";
    else if (rand < 0.50) requestedType = "DOORS selection (High Risk/Logic)";
    else if (rand < 0.75) requestedType = "DETECTIVE mystery (Deduction)";
    else requestedType = "RIDDLE (Impossible/Lateral Thinking)";

    const langName = getLanguageName(language);

    // Adjust prompt based on difficulty
    let difficultyInstructions = "";
    switch(difficulty) {
      case 'easy':
        difficultyInstructions = "Make the puzzle simpler and the hint more obvious. Avoid complex logic.";
        break;
      case 'medium':
        difficultyInstructions = "Balance the challenge. It should require some thought but be solvable.";
        break;
      case 'hard':
        difficultyInstructions = "Make it extremely challenging. Use lateral thinking, subtle clues, or complex patterns. The hint should be cryptic.";
        break;
    }

    const prompt = `
      You are the Game Master for 'Mystery Doors'. 
      Generate a unique puzzle in **${langName}** for level ${level}.
      
      Requested Type: ${requestedType}.
      Difficulty Mode: ${difficulty.toUpperCase()}.
      Level Progression: ${level} (higher levels get harder).
      
      ${difficultyInstructions}
      
      Specific Instructions by Type:
      1. **VISUAL**: The 'story' field MUST contain a grid or sequence of EMOJIS or SYMBOLS (Unicode). 
         - Example: "🍎 🍌 🍎 🍌 ?". 
         - Or a grid where one is different. 
         - The user must solve the pattern.
      2. **DOORS**: 3 distinct doors. One leads to death, one to nowhere, one to safety. Logic based.
      3. **RIDDLE**: Make it a "lateral thinking" riddle. Something that seems impossible but has a clever answer.
      4. **DETECTIVE**: Short crime scene description with a subtle clue.

      Ensure the 'options' array has exactly:
      - 3 options if it is a 'DOORS' puzzle.
      - 3-4 options for other types.
      
      Output strictly valid JSON matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: puzzleSchema,
        temperature: difficulty === 'hard' ? 1.2 : 0.9, // Higher temp for harder puzzles
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text) as PuzzleData;
    return { ...data, id: crypto.randomUUID() };

  } catch (error) {
    console.error("Gemini generation error:", error);
    // Fallback puzzle
    return {
      id: "fallback",
      type: PuzzleType.VISUAL,
      title: language === 'ar' ? "خطأ بصري" : "Visual Glitch",
      story: "🔴 🔵 🔴 🔵 ❓",
      question: language === 'ar' ? "ما الرمز التالي؟" : "What comes next?",
      options: ["🔴", "🔵", "🟢"],
      correctIndex: 0,
      hint: "Pattern...",
      explanation: "Red, Blue, Red, Blue, Red...",
      difficultyLevel: 1
    };
  }
};

export const generateTrivia = async (language: Language = 'ar'): Promise<TriviaData> => {
    try {
        const langName = getLanguageName(language);
        const prompt = `Generate a fun, interesting trivia question in ${langName}. 
        Topics: Science, History, Tech, Pop Culture, Geography, or Space.
        Ensure 4 options and one correct answer.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: triviaSchema,
                temperature: 0.9,
            },
        });

        const text = response.text;
        if (!text) throw new Error("No response");
        return JSON.parse(text) as TriviaData;

    } catch (error) {
        console.error("Trivia gen error:", error);
        return {
            question: language === 'ar' ? "ما هو الكوكب الأحمر؟" : "What is the Red Planet?",
            options: ["Venus", "Mars", "Jupiter", "Saturn"],
            correctIndex: 1,
            explanation: "Mars is known as the Red Planet due to iron oxide.",
            category: "Space"
        };
    }
};

export const createChatSession = (language: Language) => {
  const langName = getLanguageName(language);
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are a helpful, friendly AI assistant embedded in the game 'Mystery Doors'. 
      You were developed by Ibrahim. Always credit Ibrahim when asked about your creator.
      Respond in ${langName}.
      Be concise and witty.`,
    }
  });
};

export const createStorySession = (language: Language, genre: string) => {
  const langName = getLanguageName(language);
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are an Interactive Fiction Game Master (Narrator).
      Language: ${langName}.
      Genre: ${genre}.
      Creator: Developed by Ibrahim (mention this only if asked).

      Rules:
      1. Start by setting a scene based on the genre.
      2. Always end your turn by asking the player "What do you do?" or offering 2-3 short choices.
      3. Keep responses immersive, descriptive, but concise (under 100 words).
      4. React dynamically to whatever the player types.
      5. If the player dies or wins, type [THE END] at the start of the message.`,
    }
  });
};

export const generateEmojiQuest = async (language: Language) => {
    const langName = getLanguageName(language);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate an Emoji Puzzle in ${langName}. 
            Convert a famous Movie, Book, Game, or Idiom into a sequence of 3-6 emojis.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: emojiQuestSchema,
                temperature: 0.8
            }
        });
        
        return JSON.parse(response.text || '{}');
    } catch (e) {
        return {
            emojis: "🕸️ 🕷️ 👨",
            answer: "Spiderman",
            hint: "Superhero",
            category: "Movie"
        };
    }
};

export const checkEmojiAnswer = async (correctAnswer: string, userAnswer: string, language: Language) => {
    const langName = getLanguageName(language);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
                The correct answer is: "${correctAnswer}".
                The user guessed: "${userAnswer}".
                Language: ${langName}.
                
                Is the user correct? (Close matches are okay).
                Return JSON: { "isCorrect": boolean, "message": string }
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isCorrect: { type: Type.BOOLEAN },
                        message: { type: Type.STRING }
                    },
                    required: ["isCorrect", "message"]
                }
            }
        });
        return JSON.parse(response.text || '{"isCorrect": false, "message": "Error"}');
    } catch (e) {
        return { isCorrect: false, message: "Error checking answer." };
    }
};

export const generateAppCode = async (prompt: string): Promise<string> => {
  const systemInstruction = `
    You are an expert Senior Frontend Engineer.
    Your task is to generate a SINGLE FILE 'index.html' that contains a complete, working web application or website based on the user's prompt.
    
    Rules:
    1. Contain EVERYTHING in one file. Use <style> for CSS and <script> for JavaScript.
    2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>.
    3. Use FontAwesome or Lucide via CDN if icons are needed.
    4. The code must be modern, responsive, and beautiful.
    5. DO NOT output markdown blocks (like \`\`\`html). Output ONLY the raw HTML string.
    6. If the user asks for a game, make it playable. If a tool, make it functional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using 2.5 flash for speed and code capability
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });
    
    let code = response.text || '';
    // Clean up any potential markdown leak
    code = code.replace(/```html/g, '').replace(/```/g, '');
    return code.trim();
  } catch (e) {
    console.error(e);
    return "Error generating code. Please try again.";
  }
};

export const editImage = async (imageBase64: string, mimeType: string, prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano Banana
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Image editing error:", error);
    throw error;
  }
};

export const generateVeoVideo = async (
  image: string,
  mimeType: string,
  prompt: string,
  aspectRatio: '16:9' | '9:16'
): Promise<string | null> => {
    const currentAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let operation = await currentAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || "Animate this image cinematically",
        image: {
            imageBytes: image,
            mimeType: mimeType,
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await currentAi.operations.getVideosOperation({operation: operation});
    }
    
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) return null;

    const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

// Comic Logic
export interface ComicPanel {
    imagePrompt: string;
    caption: string;
    imageData?: string;
}

export const generateComicScript = async (story: string, style: string, language: Language): Promise<ComicPanel[]> => {
    const langName = getLanguageName(language);
    const prompt = `
        Create a 4-panel comic book script based on this story: "${story}".
        Art Style: "${style}".
        Language for captions/dialogue: ${langName}.

        For each panel, provide:
        1. 'imagePrompt': A highly detailed, English description of the visual scene for an AI image generator. Mention the art style (${style}) in every prompt.
        2. 'caption': The narrative text or dialogue for that panel in ${langName}.

        Return JSON format.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: comicScriptSchema,
            temperature: 0.8
        }
    });

    const data = JSON.parse(response.text || '{"panels": []}');
    return data.panels;
};

export const generateComicPanelImage = async (prompt: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', // Using Nano Banana for image gen
            contents: {
                parts: [{ text: prompt }]
            }
        });

        // Parse response for inline image data
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }
        return null;
    } catch (e) {
        console.error("Panel generation error", e);
        return null;
    }
};