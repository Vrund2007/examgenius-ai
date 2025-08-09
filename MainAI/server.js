const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/generate-questions", async (req, res) => {
  try {
    const { examType, subject, difficulty, numQuestions } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      
    Generate a COMPACT JEE Main paper with 15 previous year questions (15 each in Physics, Chemistry, Math) as pure JSON:
    {
      "instructions": "JEE Main 2024 Pattern: 75 Qs, +4/-1 marking",
      "questions": [
        {
          "section": "Physics",
          "q": "A particle moves...?",
          "options": ["A) 2 m/s", "B) 4 m/s", "C) 6 m/s", "D) 8 m/s"],
          "ans": "A"
        },
        // Continue similarly...
      ]
    }
      
    RULES:
    1. Only 4-line MCQs (1 question + 4 options)
    2. In solution just give the answer option (A, B, C, D)
    3. Math Distribution:
       - 3 Algebra
       - 3 Calculus
       - 3 Trigonometry
       - 3 Coordinate Geometry
       - 3 Vectors
    4. Physics Distribution:
       - 3 Mechanics
       - 3 Heat/Thermo
       - 3 E&M
       - 3 Optics
       - 3 Modern Physics
    5. Chemistry Distribution:
       - 5 Physical
       - 5 Organic
       - 5 Inorganic
    6. Difficulty mix:
       - 60% Easy
       - 30% Medium
       - 10% Difficult
    7. STRICT 45 questions total as per given distribution
    8. STRICT JSON format - no extra text
    9. Dont use any other format, just pure JSON
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    
    const sanitizedText = text.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(sanitizedText);

    res.json({ success: true, questions });
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      rawResponse: text,
    });
  }
});

app.post("/generate-questionneet", async (req, res) => {
  try {
    const { examType, subject, difficulty, numQuestions } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const neetprompt = `
    Generate a COMPACT NEET-UG paper with 45 previous year questions (15 Biology, 15 Physics, 15 Chemistry) as pure JSON:

    {
      "instructions": "NEET-UG 2024 Pattern: 45 Qs (15P+15C+15B), +4/-1 marking",
      "questions": [
        {
          "section": "Biology",
          "q": "Which of the following is...?",
          "options": ["A) Option1", "B) Option2", "C) Option3", "D) Option4"],
          "ans": "A"
        },
        // Continue similarly...
      ]
    }

    RULES:
    1. Only 4-line MCQs (1 question + 4 options)
    2. Just provide answer key (A/B/C/D) - no solutions
    3. Biology Distribution:
       - 7 Zoology
       - 8 Botany 
    4. Physics Distribution:
       - 3 Mechanics
       - 3 Heat/Thermo
       - 3 E&M
       - 3 Optics
       - 3 Modern Physics
    5. Chemistry Distribution:
       - 5 Physical
       - 5 Organic
       - 5 Inorganic
    6. Difficulty mix:
       - 60% Easy
       - 30% Medium
       - 10% Difficult
    7. STRICT 45 questions total as per given distribution   
    8. STRICT JSON format - no extra text/comments
    9. Dont use any other format, just pure JSON
    `;

    const result = await model.generateContent(neetprompt);
    const response = result.response;
    const text = response.text();
    
    const sanitizedText = text.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(sanitizedText);

    res.json({ success: true, questions });
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      rawResponse: text, 
      
    });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));


const axios = require('axios');


app.get("/user-pdfs/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { sort = 'desc' } = req.query; 
    
    
    
    const cloudName = 'dol7leoig';
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    
    const response = await axios.get(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
      {
        headers: {
          Authorization: `Basic ${auth}`
        },
        params: {
          expression: `resource_type:image AND context.user_id=${userId}`,
          sort_by: [{created_at: sort}],
          max_results: 100
        }
      }
    );
    
    if (!response.data || !response.data.resources) {
      return res.json({ success: true, pdfs: [] });
    }
    
    
    const pdfs = response.data.resources.map(resource => {
      const context = resource.context || {};
      return {
        id: resource.public_id,
        name: context.alt || resource.public_id,
        url: resource.secure_url,
        date: context.created_at || resource.created_at,
        examType: context.caption || 'Unknown'
      };
    });
    
    res.json({ success: true, pdfs });
  } catch (error) {
    console.error("Error fetching PDFs from Cloudinary:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
