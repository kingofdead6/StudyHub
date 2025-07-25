import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

function boldTitlesAndMath(text) {
  text = text.replace(/^(#{1,6}\s+)(.*?)$/gm, (match, prefix, title) => {
    return `${prefix}**${title.trim()}**`;
  });

  text = text.replace(
    /\b(\d+\/\d+|\d+\.\d+|[-\d]+|[xXyYzZ]\b|\$[^\$]+\$)/g,
    (match) => {
      if (match.startsWith('$') && match.endsWith('$')) {
        return match.replace(
          /(\d+\/\d+|\d+\.\d+|[-\d]+|[xXyYzZ])/g,
          '**$1**'
        );
      }
      return `**${match}**`;
    }
  );

  text = text.replace(/\b([xXyYzZ])([\^][0-9]+)/g, '**$1**$2');

  return text;
}

export const askGeminiStream = async (text, res) => {
  try {
    const prompt = text.length < 10
      ? `The user said: "${text}". Respond conversationally, as if starting a friendly chat. For example, if the user says "hi", reply with something like "Hello! How can I assist you today?"`
      : `Please explain this content clearly and concisely:\n\n${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    responseText = boldTitlesAndMath(responseText);

    const words = responseText.split(' ');
    for (const word of words) {
      res.write(`data: ${word}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    res.write('event: done\ndata: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Gemini Error:', error.message);
    res.write('event: error\ndata: Failed to process request\n\n');
    res.end();
  }
};

export const askGemini = async (text) => {
  try {
    const prompt = text.length < 10
      ? `The user said: "${text}". Respond conversationally, as if starting a friendly chat. For example, if the user says "hi", reply with something like "Hello! How can I assist you today?"`
      : `Please explain this content clearly and concisely:\n\n${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();
    responseText = boldTitlesAndMath(responseText);
    return responseText;
  } catch (error) {
    console.error('Gemini Error:', error.message);
    throw error;
  }
};