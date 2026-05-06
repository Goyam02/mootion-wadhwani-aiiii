import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PlanData, Attachment, QuizData, FlashcardData, GraphData, DragDropGameData, MistakeGameData } from '../types';
import { API_BASE_URL } from '../config';

// Ensure API Key is present
const apiKey = process.env.VITE_API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Helper to process attachments
const processAttachments = (attachments: Attachment[]) => {
  return attachments.map(att => {
    if (att.base64 && att.mimeType) {
      return {
        inlineData: {
          data: att.base64,
          mimeType: att.mimeType
        }
      };
    }
    return null;
  }).filter(Boolean);
};

// 1. ASK Service (Streaming)
export const chatWithGeminiStream = async function* (
  message: string, 
  attachments: Attachment[] = [],
  history: {role: string, parts: {text: string}[]}[] = [],
  isVideoMode: boolean = false
) {
  try {
    const systemInstruction = isVideoMode 
      ? "You are a video AI. The user wants a video generated. Acknowledge the request and briefly describe the visual style and content of the video being generated. Do not write a script."
      : "You are a helpful, concise, and intelligent AI assistant. Keep answers brief but informative. You can analyze images and read documents if provided.";

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: history,
      config: { systemInstruction }
    });

    const parts: any[] = [...processAttachments(attachments)];
    if (message) parts.push({ text: message });

    const result = await chat.sendMessageStream({ 
      message: parts.length > 0 ? parts : message 
    });
    
    for await (const chunk of result) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Chat Stream Error:", error);
    yield "Sorry, I encountered an error.";
  }
};

// Legacy non-streaming (optional, but keeping for compatibility if needed elsewhere)
export const chatWithGemini = async (
  message: string, 
  attachments: Attachment[] = [],
  history: {role: string, parts: {text: string}[]}[] = []
): Promise<string> => {
  const stream = chatWithGeminiStream(message, attachments, history);
  let fullText = "";
  for await (const text of stream) {
    fullText += text;
  }
  return fullText;
};

// 2. PLAN Service
export const generatePlan = async (topic: string): Promise<PlanData | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a detailed plan for: ${topic}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy title for the plan" },
            description: { type: Type.STRING, description: "A brief summary of the plan objectives" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeframe: { type: Type.STRING, description: "Time or duration (e.g., 'Day 1', '9:00 AM', 'Phase 1')" },
                  activity: { type: Type.STRING, description: "The core task or activity" },
                  notes: { type: Type.STRING, description: "Additional tips or context" }
                },
                required: ["timeframe", "activity"]
              }
            }
          },
          required: ["title", "description", "items"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as PlanData;
  } catch (error) {
    console.error("Plan Error:", error);
    return null;
  }
};

// 2.b GRAPH/MINDMAP Service
export const generateMindMap = async (prompt: string, attachments: Attachment[]): Promise<GraphData | null> => {
  const parts: any[] = [...processAttachments(attachments)];
  
  // 1. Try Local API Integration
  try {
    // Construct payload matching Gemini "speech input format" (parts structure)
    // If prompt exists, add it as text part.
    const localParts = [...parts];
    if (prompt) localParts.push({ text: prompt });

    const localResponse = await fetch(`${API_BASE_URL}/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Sending payload in Gemini-like structure as requested
      body: JSON.stringify({ contents: localParts }) 
    });

    if (localResponse.ok) {
      const result = await localResponse.json();
      // result might be the raw string JSON (Schema "string") or the object itself
      // Try to parse if it's a string, otherwise return as is
      if (typeof result === 'string') {
         try {
           return JSON.parse(result) as GraphData;
         } catch {
           console.error("Local API returned string but failed to parse JSON");
         }
      } else if (typeof result === 'object') {
         return result as GraphData;
      }
    }
  } catch (localError) {
    console.warn("Local API connection failed, falling back to Cloud Gemini...", localError);
  }

  // 2. Fallback to Gemini Cloud
  try {
    const geminiParts: any[] = [...parts];
    geminiParts.push({ 
      text: `Create a learning roadmap or project flow based on: "${prompt}". 
             If a file is provided (Course Handout/CHO), extract key topics and structure them logically.
             Return a JSON object with 'nodes' and 'edges'. 
             Nodes should have short labels. 'stepType' should be 'root' for the main topic, 'milestone' for major sections, and 'task' for sub-items.`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: geminiParts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  description: { type: Type.STRING },
                  stepType: { type: Type.STRING, enum: ['root', 'milestone', 'task'] }
                },
                required: ['id', 'label']
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING, description: "id of source node" },
                  target: { type: Type.STRING, description: "id of target node" },
                  label: { type: Type.STRING, description: "optional label for the line" }
                },
                required: ['source', 'target']
              }
            }
          },
          required: ['nodes', 'edges']
        }
      }
    });

    return JSON.parse(response.text || "{}") as GraphData;
  } catch (error) {
    console.error("Graph Error:", error);
    return null;
  }
};

// 3. PLAY Service (Image Generation)
export const generateCreativeImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

// 4. QUIZ Generator
export const generateQuiz = async (prompt: string, attachments: Attachment[]): Promise<QuizData | null> => {
  try {
    const parts: any[] = [...processAttachments(attachments)];
    parts.push({ text: `Generate a quiz based on this content. ${prompt}. Create exactly 5 questions.` });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: parts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Array of 4 possible answers"
                  },
                  correctAnswer: { type: Type.STRING, description: "The exact string of the correct answer from the options" }
                },
                required: ["question", "options", "correctAnswer"]
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}") as QuizData;
  } catch (error) {
    console.error("Quiz Error", error);
    return null;
  }
};

// 5. FLASHCARD Generator
export const generateFlashcards = async (prompt: string, attachments: Attachment[]): Promise<FlashcardData | null> => {
  try {
    const parts: any[] = [...processAttachments(attachments)];
    parts.push({ text: `Generate flashcards based on this content. ${prompt}. Create exactly 10 flashcards.` });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: parts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: "Concept or question" },
                  back: { type: Type.STRING, description: "Definition or answer" }
                },
                required: ["front", "back"]
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}") as FlashcardData;
  } catch (error) {
    console.error("Flashcard Error", error);
    return null;
  }
};

// 6. PLAY Module Services

// Teach AI - Voice-based teaching session with cross-questioning
// --- TEACH AI (LIVE VOICE MODE) ---

import { LiveServerMessage, Modality } from "@google/genai";

/* ---------- AUDIO HELPERS ---------- */

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  channels: number
): Promise<AudioBuffer> {
  const pcm = new Int16Array(data.buffer);
  const frameCount = pcm.length / channels;
  const buffer = ctx.createBuffer(channels, frameCount, sampleRate);

  for (let c = 0; c < channels; c++) {
    const channelData = buffer.getChannelData(c);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = pcm[i * channels + c] / 32768;
    }
  }
  return buffer;
}

/* ---------- MAIN TEACH AI FUNCTION ---------- */

export const connectToStudentAI = async (
  onAudio: (buffer: AudioBuffer) => void,
  onTranscript: (text: string, role: 'user' | 'model', isTurnComplete: boolean) => void,
  onClose: () => void
) => {
  /* Audio contexts */
  const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

  if (outputCtx.state === 'suspended') {
    await outputCtx.resume();
  }

  /* Mic stream */
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = inputCtx.createMediaStreamSource(stream);

  /* Visualizer analyser */
  const analyser = inputCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  /* Audio capture */
  const processor = inputCtx.createScriptProcessor(4096, 1, 1);

  /* Gemini Live Session */
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction:
        "You are a curious student. The user is teaching you. Ask clarifying questions, show confusion when appropriate, and respond briefly and naturally.",
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' }
        }
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {}
    },
    callbacks: {
      onopen: () => {
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            pcm16[i] = input[i] * 32768;
          }

          sessionPromise.then(session => {
            session.sendRealtimeInput({
              media: {
                mimeType: 'audio/pcm;rate=16000',
                data: encode(new Uint8Array(pcm16.buffer))
              }
            });
          });
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      },

      onmessage: async (msg: LiveServerMessage) => {
        /* Audio output */
        const audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audio) {
          const buffer = await decodeAudioData(
            decode(audio),
            outputCtx,
            24000,
            1
          );
          onAudio(buffer);
        }

        /* Transcripts */
        if (msg.serverContent?.inputTranscription) {
          onTranscript(msg.serverContent.inputTranscription.text, 'user', false);
        }
        if (msg.serverContent?.outputTranscription) {
          onTranscript(msg.serverContent.outputTranscription.text, 'model', false);
        }
        if (msg.serverContent?.turnComplete) {
          onTranscript('', 'model', true);
        }
      },

      onclose: () => onClose(),
      onerror: (e) => {
        console.error("Teach AI Live Error:", e);
        onClose();
      }
    }
  });

  return {
    disconnect: () => {
      sessionPromise.then(s => s.close());
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach(t => t.stop());
      inputCtx.close();
      outputCtx.close();
    },
    getAnalyser: () => analyser,
    getOutputContext: () => outputCtx
  };
};

// Drag Drop Game Generator
export const generateDragDrop = async (topic: string): Promise<DragDropGameData | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a drag-and-drop quiz game about: ${topic}. Create exactly 10 questions. Each question should have a sentence with a blank (represented as "_____") and 4 options, one of which is correct.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sentence: { 
                    type: Type.STRING, 
                    description: "A sentence with '_____' where the blank should be filled" 
                  },
                  options: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Array of exactly 4 possible answers"
                  },
                  correctAnswer: { 
                    type: Type.STRING, 
                    description: "The exact string of the correct answer from the options" 
                  }
                },
                required: ["sentence", "options", "correctAnswer"]
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}") as DragDropGameData;
  } catch (error) {
    console.error("Drag Drop Error:", error);
    return null;
  }
};

// Mistake Game Generator
export const generateMistakeGame = async (topic: string): Promise<MistakeGameData | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a "Spot The Mistake" game about: ${topic}. Create exactly 10 rounds. Each round should have a title, a list of steps/items (one of which contains an error), the ID of the item with the error, and an explanation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rounds: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Title of the round/challenge" },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING, description: "Unique ID for this item" },
                        text: { type: Type.STRING, description: "The text content of this step/item" }
                      },
                      required: ["id", "text"]
                    }
                  },
                  errorId: { 
                    type: Type.STRING, 
                    description: "The ID of the item that contains the mistake" 
                  },
                  explanation: { 
                    type: Type.STRING, 
                    description: "Explanation of what the mistake is and why it's wrong" 
                  }
                },
                required: ["title", "items", "errorId", "explanation"]
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}") as MistakeGameData;
  } catch (error) {
    console.error("Mistake Game Error:", error);
    return null;
  }
};