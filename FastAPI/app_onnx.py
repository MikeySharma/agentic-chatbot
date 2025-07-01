from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer
import onnxruntime as ort
import numpy as np
import torch
import re
from huggingface_hub import hf_hub_download

app = FastAPI()

class SentimentAnalyzer:
    def __init__(self, model_repo="mikeysharma/finance-sentiment-analysis"):
        # Download model and tokenizer from Hugging Face Hub
        model_path = hf_hub_download(repo_id=model_repo, filename="model.onnx")
        self.session = ort.InferenceSession(model_path)
        self.tokenizer = AutoTokenizer.from_pretrained(model_repo)
        self.labels = ["negative", "neutral", "positive"]  # Hard-coded labels
        
    def predict(self, text):
        # Preprocess
        text = preprocess_text(text)
        
        # Tokenize
        inputs = self.tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=128,
            return_tensors="np",
            return_token_type_ids=True
        )
        
        # Run inference
        outputs = self.session.run(
            None,
            {
                "input_ids": inputs["input_ids"].astype(np.int64),
                "attention_mask": inputs["attention_mask"].astype(np.int64),
                "token_type_ids": inputs["token_type_ids"].astype(np.int64)
            }
        )
        
        # Get predictions
        logits = outputs[0]
        probabilities = torch.nn.functional.softmax(torch.from_numpy(logits), dim=-1)
        predicted_class = np.argmax(logits, axis=-1)[0] # type: ignore
        
        return {
            "sentiment": self.labels[predicted_class],
            "confidence": float(probabilities[0][predicted_class]),
            "probabilities": {
                label: float(prob)
                for label, prob in zip(self.labels, probabilities[0])
            }
        }

# Preprocessing function
def preprocess_text(text):
    text = str(text).lower()  # Convert to lowercase
    text = text.replace('$', '')  # Remove dollar signs (tickers)
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    # Remove special characters except basic punctuation
    text = re.sub(r'[^\w\s.,!?]', '', text)
    return text.strip()

# Initialize analyzer
analyzer = SentimentAnalyzer()

class TextRequest(BaseModel):
    text: str

@app.post("/predict")
async def predict(request: TextRequest):
    return analyzer.predict(request.text)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)