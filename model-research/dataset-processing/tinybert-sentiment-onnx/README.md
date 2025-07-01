---
tags:
- text-classification
- sentiment-analysis
- finance
- tinybert
datasets:
- financial_phrasebank
- custom-financial-news
metrics:
- accuracy
- f1
widget:
- text: "$AAPL - Apple hits record high after earnings beat"
- text: "$TSLA - Tesla misses Q2 delivery estimates"
- text: "$MSFT - Microsoft announces new Azure features"
---

# TinyBERT Financial News Sentiment Analysis

[![Hugging Face](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Model%20Hub-yellow)](https://huggingface.co/your-username/your-model-name)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A lightweight TinyBERT model fine-tuned for financial news sentiment analysis, achieving 89% accuracy with < 60MB model size and <50ms CPU inference latency.

## Model Details

- **Model Type:** Text Classification (Sentiment Analysis)
- **Architecture:** TinyBERT (4-layer, 312-hidden)
- **Pretrained Base:** `huawei-noah/TinyBERT_General_4L_312D`
- **Fine-tuned Dataset:** Financial news headlines with sentiment labels
- **Input:** Financial news text (max 128 tokens)
- **Output:** Sentiment classification (Negative/Neutral/Positive)

## Performance

| Metric       | Value  |
|--------------|--------|
| Accuracy     | 89.2%  |
| F1-Score     | 0.87   |
| Model Size   | 54.84MB|
| CPU Latency  | 28ms   |
| Quantized Size | 5.3MB |

## Usage

### Direct Inference with Pipeline

```python
from transformers import pipeline

classifier = pipeline(
    "text-classification", 
    model="mikeysharma/finance-sentiment-analysis"
)

result = classifier("$TSLA - Morgan Stanley upgrades Tesla to Overweight")
print(result)
```

### Using Model & Tokenizer Directly

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

tokenizer = AutoTokenizer.from_pretrained("mikeysharma/finance-sentiment-analysis)
model = AutoModelForSequenceClassification.from_pretrained("mikeysharma/finance-sentiment-analysis")

inputs = tokenizer(
    "$BYND - JPMorgan cuts Beyond Meat price target",
    return_tensors="pt",
    truncation=True,
    max_length=128
)

with torch.no_grad():
    outputs = model(**inputs)
    predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
    print(predictions)
```

### ONNX Runtime (Optimal for Production)

```python
from optimum.onnxruntime import ORTModelForSequenceClassification
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("mikeysharma/finance-sentiment-analysis")
model = ORTModelForSequenceClassification.from_pretrained("mikeysharma/finance-sentiment-analysis")

inputs = tokenizer(
    "Cemex shares fall after Credit Suisse downgrade",
    return_tensors="pt",
    truncation=True,
    max_length=128
)

outputs = model(**inputs)
```

## Training Data

The model was fine-tuned on a dataset of financial news headlines with three sentiment classes:

1. **Negative**: Bearish sentiment, downgrades, losses
2. **Neutral**: Factual reporting, no strong sentiment
3. **Positive**: Bullish sentiment, upgrades, gains

Example samples:
```
$AAPL - Apple hits record high after earnings beat (Positive)
$TSLA - Tesla misses Q2 delivery estimates (Negative)
$MSFT - Microsoft announces new Azure features (Neutral)
```

## Preprocessing

Text is preprocessed with:
- Lowercasing
- Ticker symbol normalization ($AAPL → AAPL)
- URL removal
- Special character cleaning
- Truncation to 128 tokens

## Deployment

For production deployment, we recommend:

1. **ONNX Runtime** for CPU-optimized inference
2. **FastAPI** for REST API serving
3. **Docker** containerization

Example Dockerfile:
```dockerfile
FROM python:3.8-slim

WORKDIR /app
COPY . .

RUN pip install transformers optimum[onnxruntime] fastapi uvicorn

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Limitations

- Primarily trained on English financial news
- Performance may degrade on non-financial text
- Short-form text (headlines) works best
- May not capture nuanced sarcasm/irony

## Ethical Considerations

While useful for market analysis, this model should not be used as sole input for investment decisions. Always combine with human judgment and other data sources.

## Citation

If you use this model in your research, please cite:

```bibtex
@misc{tinybert-fin-sentiment,
  author = {Mikey Sharma},
  title = {Lightweight Financial News Sentiment Analysis with TinyBERT},
  year = {2023},
  publisher = {Hugging Face},
  howpublished = {\url{https://huggingface.co/mikeysharma/finance-sentiment-analysis}}
}
```

---
license: mit
---
