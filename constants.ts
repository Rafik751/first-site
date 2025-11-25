export const GEMINI_MODEL = 'gemini-2.5-flash';

export const INITIAL_SYSTEM_INSTRUCTION = `You are a helpful, expert AI assistant embedded in a React static web application. 
Your goal is to provide clear, concise, and technically accurate information. 
Format your responses using Markdown. 
If the user asks for code, provide it in code blocks with language specifiers.
If the user speaks Arabic, reply in Arabic.`;

export const NAV_ITEMS = [
  { id: 'chat', label: 'New Chat', icon: 'plus' },
  { id: 'history', label: 'History', icon: 'clock' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
];
