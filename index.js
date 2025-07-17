const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
const upload = multer({ dest: "uploads/" });
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server sudah berjalan di http://localhost:${PORT}`);
});

const imageToGenerativePart = (filePath) => ({
    inlineData: {
        data: fs.readFileSync(filePath).toString('base64'),
        mimeType: 'image/png',
    },
})

app.get("/", (req, res) => {
    res.send("Welcome To Gemini Wave 2 Session 3");
})
app.post("/generate-text", async (req, res) => {
    const { prompt } = req.body;
    try {
        const result = await model.generateContent(prompt);
        res.json({ result: result.response.text() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


app.post('/generate-image', upload.single('image'), async (req, res) => {
    const prompt = req.body.prompt || 'Describe this image'
    const image = imageToGenerativePart(req.file.path)

    try {
        const result = await model.generateContent([prompt, image])
        res.json({ output: result.response.text() })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
})

app.post("/generate-document", upload.single('document'), async (req, res) => {
    const filePath = req.file.path
    const buffer = fs.readFileSync(filePath);
    const base64data = buffer.toString('base64');
    const mimeType = req.file.mimetype;

    try {
        const documentPart = { inlineData: { data: base64data, mimeType } };
        const result = await model.generateContent('Analyze this document', [documentPart]);
        res.json({ result: result.response.text() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/generate-audio", upload.single('audio'), async (req, res) => {
    const audiotBuffer = fs.readFileSync(req.file.path);
    const base64audio = audiotBuffer.toString('base64');

    const audioPart = { inlineData: { data: base64audio, mimeType: req.file.mimeType } };
    try {
        const result = await model.generateContent('Transcribe or analyze this following audio', [audioPart]);
        res.json({ result: result.response.text() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});