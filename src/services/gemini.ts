import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const geminiService = {
  async generateWebSearchSummary(input: string, lang: 'en' | 'zh') {
    const prompt = `Search the web and create a comprehensive summary in markdown (2000-3000 words) related to FDA guidance and 510(k) summary based on the following information: ${input}. Output language: ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true }
      }
    });
    
    return response.text;
  },

  async generateComprehensiveSummary(input: string, webSearchSummary: string, lang: 'en' | 'zh') {
    const prompt = `Create a comprehensive 510(k) summary (3000-4000 words) in markdown based on the user input and the web search summary provided below.
    User Input: ${input}
    Web Search Summary: ${webSearchSummary}
    Output language: ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text;
  },

  async generateDataset(summary: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a 510(k) dataset (JSON) with exactly 50 entities from the following 510(k) summary. Each entity should have 'id', 'key', 'value', and 'description'.
      Summary: ${summary}`,
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
    
    return JSON.parse(response.text || '{"entities": []}');
  },

  async generateReviewReport(input: string, webSummary: string, compSummary: string, dataset: any, template: string, lang: 'en' | 'zh') {
    const prompt = `Create a comprehensive 510(k) review report (3000-4000 words) in markdown based on the provided information and template.
    Include:
    - 5 tables
    - 20 entities
    - A review checklist
    - 20 comprehensive follow-up questions at the end.
    
    Template: ${template}
    User Input: ${input}
    Web Summary: ${webSummary}
    Comprehensive Summary: ${compSummary}
    Dataset: ${JSON.stringify(dataset)}
    
    Output language: ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text;
  },

  async generateFollowUpQuestions(input: string, compSummary: string, lang: 'en' | 'zh') {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 20 comprehensive follow-up questions for an FDA 510(k) reviewer based on the following submission summary and comprehensive analysis. Output language: ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.
      Input: ${input}
      Summary: ${compSummary}`,
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
    
    const data = JSON.parse(response.text || '{"questions": []}');
    return data.questions as string[];
  },

  async generateSkillMd(results: any) {
    const prompt = `Create a skill.md based on the previous 510(k) review results for an agent to create comprehensive review reports of similar devices. 
    Use the "Skill Creator" skill format. 
    Add 3 additional WOW AI features to this skill.
    Results: ${JSON.stringify(results)}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text;
  }
};
