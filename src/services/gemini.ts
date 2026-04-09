import { GoogleGenAI, Type } from "@google/genai";
import { AIConfig } from "../types";

const getAI = (apiKey?: string) => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY || '' });
};

const safeJsonParse = (text: string, fallback: any) => {
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON:", e, "Original text:", text);
    return fallback;
  }
};

export const geminiService = {
  async generateWebSearchSummary(input: string, lang: 'en' | 'zh', config?: AIConfig) {
    const ai = getAI(config?.apiKey);
    const prompt = config?.prompts.webSearch 
      ? config.prompts.webSearch.replace("{{input}}", input).replace("{{lang}}", lang === 'zh' ? 'Traditional Chinese' : 'English')
      : `You are a regulatory expert. Search the web and create a highly comprehensive summary in markdown (aim for 2000-3000 words) related to FDA guidance and 510(k) summary based on the following information: 
    
    ${input}
    
    Output language: ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.
    Ensure the summary covers relevant consensus standards, predicate device history, and specific FDA requirements for this device class.`;
    
    const response = await ai.models.generateContent({
      model: config?.models.webSearch || "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true }
      }
    });
    
    return response.text || "";
  },

  async generateComprehensiveSummary(input: string, webSearchSummary: string, lang: 'en' | 'zh', config?: AIConfig) {
    const ai = getAI(config?.apiKey);
    const prompt = config?.prompts.comprehensiveSummary
      ? config.prompts.comprehensiveSummary
          .replace("{{input}}", input)
          .replace("{{webSearchSummary}}", webSearchSummary)
          .replace("{{lang}}", lang === 'zh' ? 'Traditional Chinese' : 'English')
      : `You are a senior regulatory consultant. Create a comprehensive 510(k) summary (aim for 3000-4000 words) in markdown based on the user input and the web search summary provided below.
    
    User Input: ${input}
    Web Search Summary: ${webSearchSummary}
    
    Output language: ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.
    The summary must be professional, detailed, and structured for a formal FDA submission.`;
    
    const response = await ai.models.generateContent({
      model: config?.models.comprehensiveSummary || "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || "";
  },

  async generateDataset(summary: string, config?: AIConfig) {
    const ai = getAI(config?.apiKey);
    const prompt = config?.prompts.dataset
      ? config.prompts.dataset.replace("{{summary}}", summary)
      : `Extract exactly 50 key entities from the following 510(k) summary and return them as a JSON array of objects.
    Each object MUST have:
    - 'id': a unique string identifier
    - 'key': the name of the regulatory field (e.g., "Sterilization Method")
    - 'value': the specific value found in the summary
    - 'description': a brief explanation of why this entity is important for compliance.
    
    Summary: ${summary}
    
    Return ONLY the JSON object with an 'entities' key.`;

    const response = await ai.models.generateContent({
      model: config?.models.dataset || "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  key: { type: Type.STRING },
                  value: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["id", "key", "value", "description"]
              }
            }
          },
          required: ["entities"]
        }
      }
    });
    
    return safeJsonParse(response.text || '{"entities": []}', { entities: [] });
  },

  async generateReviewReport(input: string, webSummary: string, compSummary: string, dataset: any, template: string, lang: 'en' | 'zh', config?: AIConfig) {
    const ai = getAI(config?.apiKey);
    const prompt = config?.prompts.reviewReport
      ? config.prompts.reviewReport
          .replace("{{input}}", input)
          .replace("{{webSummary}}", webSummary)
          .replace("{{compSummary}}", compSummary)
          .replace("{{dataset}}", JSON.stringify(dataset))
          .replace("{{template}}", template)
          .replace("{{lang}}", lang === 'zh' ? 'Traditional Chinese' : 'English')
      : `You are an FDA lead reviewer. Create a comprehensive 510(k) review report (aim for 3000-4000 words) in markdown based on the provided information and template.
    
    CRITICAL REQUIREMENTS:
    1. Follow the template structure strictly.
    2. Include at least 5 detailed tables (e.g., Comparison Table, V&V Results, Standards Compliance).
    3. Explicitly reference at least 20 entities from the provided dataset.
    4. Include a detailed review checklist.
    5. End with exactly 20 comprehensive follow-up questions for the submitter.
    
    Template: ${template}
    User Input: ${input}
    Web Summary: ${webSummary}
    Comprehensive Summary: ${compSummary}
    Dataset: ${JSON.stringify(dataset)}
    
    Output language: ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.`;
    
    const response = await ai.models.generateContent({
      model: config?.models.reviewReport || "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || "";
  },

  async generateFollowUpQuestions(input: string, compSummary: string, lang: 'en' | 'zh', config?: AIConfig) {
    const ai = getAI(config?.apiKey);
    const prompt = config?.prompts.followUpQuestions
      ? config.prompts.followUpQuestions
          .replace("{{input}}", input)
          .replace("{{compSummary}}", compSummary)
          .replace("{{lang}}", lang === 'zh' ? 'Traditional Chinese' : 'English')
      : `Generate exactly 20 comprehensive, high-level follow-up questions for an FDA 510(k) reviewer to ask the submitter. 
    These questions should target potential gaps in biocompatibility, software validation, clinical data, and substantial equivalence.
    
    Output language: ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.
    
    Input: ${input}
    Summary: ${compSummary}
    
    Return ONLY a JSON object with a 'questions' key containing an array of strings.`;

    const response = await ai.models.generateContent({
      model: config?.models.followUpQuestions || "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["questions"]
        }
      }
    });
    
    const data = safeJsonParse(response.text || '{"questions": []}', { questions: [] });
    return data.questions || [];
  },

  async generateSkillMd(results: any, config?: AIConfig) {
    const ai = getAI(config?.apiKey);
    const prompt = config?.prompts.skillMd
      ? config.prompts.skillMd.replace("{{results}}", JSON.stringify(results))
      : `Create a high-quality skill.md file based on the provided 510(k) review results. 
    This skill will be used by other AI agents to perform similar reviews.
    
    Include:
    1. A clear name and description.
    2. Detailed instructions for reviewing this specific device class.
    3. 3 additional "WOW" AI features (e.g., Adversarial Red Team Simulation, Future-Proof Analysis, Comparison Ghosting).
    
    Results: ${JSON.stringify(results)}
    
    Output in Markdown format.`;
    
    const response = await ai.models.generateContent({
      model: config?.models.skillMd || "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || "";
  }
};
