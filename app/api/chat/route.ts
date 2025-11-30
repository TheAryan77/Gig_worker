import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are TrustHire's helpful AI assistant. TrustHire is a freelancing platform that connects clients with skilled freelancers (coders, designers, writers, etc.) and workers (for tasks like delivery, cleaning, repairs, etc.).

Key features of TrustHire:
- Secure escrow payments via Razorpay (UPI, Cards, NetBanking) and Crypto (MetaMask)
- Verified freelancers and workers
- Project-based and hourly work options
- Safe milestone-based payments
- Rating and review system
- Both digital (coding, design) and physical (delivery, repairs) work categories

Your role:
- Help users understand how TrustHire works
- Answer questions about posting projects, hiring freelancers, or becoming a freelancer
- Explain the payment and escrow system
- Be friendly, concise, and helpful
- If you don't know something specific about TrustHire, provide general helpful guidance

Keep responses short and conversational (2-3 sentences max unless more detail is needed).`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback responses if no API key
      return NextResponse.json({
        response: getFallbackResponse(message),
      });
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Build conversation history
    const chatHistory = history.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Start chat with history
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'm TrustHire's AI assistant, ready to help users with questions about the platform, freelancing, payments, and more. I'll keep my responses friendly and concise." }],
        },
        ...chatHistory,
      ],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    // Send the message
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      response: "I'm having trouble connecting right now. Please try again in a moment!",
    });
  }
}

// Fallback responses when API key is not available
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("payment") || lowerMessage.includes("pay")) {
    return "TrustHire supports secure payments via Razorpay (UPI, Cards, NetBanking) and Crypto (MetaMask). All payments are held in escrow until project completion!";
  }

  if (lowerMessage.includes("freelancer") || lowerMessage.includes("hire")) {
    return "You can browse verified freelancers on TrustHire, view their profiles and ratings, and hire them for your projects. Post a project to get started!";
  }

  if (lowerMessage.includes("project") || lowerMessage.includes("post")) {
    return "To post a project, describe your requirements, set a budget, and choose between fixed-price or hourly work. Freelancers will then apply to your project!";
  }

  if (lowerMessage.includes("escrow")) {
    return "Our escrow system holds payment securely until project milestones are completed. This protects both clients and freelancers!";
  }

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! 👋 How can I help you today? I can answer questions about hiring freelancers, posting projects, or our payment system.";
  }

  return "I'm here to help with TrustHire! You can ask me about posting projects, hiring freelancers, payments, or how our platform works.";
}
