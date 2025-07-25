import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = 'llama3-8b-8192'; // Using LLaMA 3 8B model for Groq

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

export const askGroqStream = async (text, res) => {
  try {
    const prompt = text.length < 10
      ? `The user said: "${text}". Respond conversationally, as if starting a friendly chat. For example, if the user says "hi", reply with something like "Hello! How can I assist you today?"`
      : `Please explain this content clearly and concisely:\n\n${text}`;
    
    const stream = await groq.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    let streamedReply = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        streamedReply += content;
        const words = content.split(' ');
        for (const word of words) {
          if (word) {
            res.write(`data: ${word}\n\n`);
            await new Promise((resolve) => setTimeout(resolve, 80));
          }
        }
      }
    }

    streamedReply = boldTitlesAndMath(streamedReply);
    res.write('event: done\ndata: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Groq Error:', error.message);
    res.write('event: error\ndata: Failed to process request\n\n');
    res.end();
  }
};

export const askGroq = async (text) => {
  try {
    const prompt = text.length < 10
      ? `The user said: "${text}". Respond conversationally, as if starting a friendly chat. For example, if the user says "hi", reply with something like "Hello! How can I assist you today?"`
      : `Please explain this content clearly and concisely:\n\n${text}`;
    
    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    let responseText = completion.choices[0]?.message?.content || '';
    responseText = boldTitlesAndMath(responseText);
    return responseText;
  } catch (error) {
    console.error('Groq Error:', error.message);
    throw error;
  }
};