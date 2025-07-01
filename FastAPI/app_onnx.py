from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer
import onnxruntime as ort
import numpy as np
import torch
import re
from huggingface_hub import hf_hub_download
from typing import List

app = FastAPI()

class SentimentAnalyzer:
    def __init__(self, model_repo="mikeysharma/finance-sentiment-analysis"):
        # Download model and tokenizer from Hugging Face Hub
        model_path = hf_hub_download(repo_id=model_repo, filename="model.onnx")
        self.session = ort.InferenceSession(model_path)
        self.tokenizer = AutoTokenizer.from_pretrained(model_repo)
        self.labels = ["negative", "neutral", "positive"]

    def predict_batch(self, texts: List[str]):
        # Preprocess all texts
        cleaned_texts = [preprocess_text(t) for t in texts]

        # Tokenize batch
        inputs = self.tokenizer(
            cleaned_texts,
            padding=True,
            truncation=True,
            max_length=128,
            return_tensors="np",
            return_token_type_ids=True
        )

        # Run ONNX inference
        outputs = self.session.run(
            None,
            {
                "input_ids": inputs["input_ids"].astype(np.int64),
                "attention_mask": inputs["attention_mask"].astype(np.int64),
                "token_type_ids": inputs["token_type_ids"].astype(np.int64),
            }
        )

        logits = outputs[0]
        probabilities = torch.nn.functional.softmax(torch.from_numpy(logits), dim=-1)

        predictions = []
        for i in range(len(texts)):
            pred_class = int(np.argmax(logits[i])) # type: ignore
            pred = {
                "text": texts[i],
                "sentiment": self.labels[pred_class],
                "confidence": float(probabilities[i][pred_class]),
                "probabilities": {
                    label: float(prob) for label, prob in zip(self.labels, probabilities[i])
                }
            }
            predictions.append(pred)

        return predictions

# Preprocessing helper
def preprocess_text(text: str) -> str:
    text = str(text).lower()
    text = text.replace('$', '')
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'[^\w\s.,!?]', '', text)
    return text.strip()

# Request schema
class TextRequest(BaseModel):
    text: List[str]

# Initialize sentiment analyzer
analyzer = SentimentAnalyzer()

@app.post("/predict-sentiment")
async def predict(request: TextRequest):
    return analyzer.predict_batch(request.text)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
