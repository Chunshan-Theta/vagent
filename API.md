# Audio Analysis API Documentation

## Audio Emotion Analysis Endpoint

This endpoint processes audio files and returns a detailed analysis including transcription and emotion labeling for each sentence.

### Endpoint

```
POST /api/analysis/llm
```

### Request

#### Headers
- `Content-Type: multipart/form-data`

#### Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| audioFile | File | Yes | The audio file to analyze (MP3 format) |

### Response

Returns a JSON object with the following structure:

```json
{
  "result": "string",       // Raw result with emotion tags
  "analysis": {
    "transcription": "string",  // Clean transcription without emotion tags
    "emotions": [
      {
        "sentence": "string",   // Individual sentence
        "emotion": "string"     // Detected emotion for this sentence
      }
    ]
  }
}
```

### Example

```bash
curl -X POST http://your-domain/api/analysis/llm \
  -F "audioFile=@/path/to/audio.mp3" \
  -H "Content-Type: multipart/form-data"
```

### Response Example

```json
{
  "result": "[Emotion: 溫柔] 這是一句話。\n[Emotion: 喜悅] 這是另一句話。",
  "analysis": {
    "transcription": "這是一句話。\n這是另一句話。",
    "emotions": [
      {
        "sentence": "這是一句話",
        "emotion": "溫柔"
      },
      {
        "sentence": "這是另一句話",
        "emotion": "喜悅"
      }
    ]
  }
}
```

### Features

1. **Accurate Transcription**
   - Converts audio to text with high accuracy
   - Maintains original sentence structure

2. **Emotion Analysis**
   - Detects emotions for each sentence
   - Supports multiple emotion types (e.g., 溫柔, 喜悅, 哽咽, 悲傷)
   - Handles emotion transitions naturally

3. **Stable Output Format**
   - Consistent JSON structure
   - Clean separation of raw and processed data
   - Organized sentence-emotion pairs

### Technical Details

- Supports MP3 audio format
- Uses Gemini API for processing
- Temperature set to 0.3 for stable output
- Maximum output tokens: 2048

### Error Handling

The API returns appropriate HTTP status codes:

- 200: Successful analysis
- 400: Missing or invalid audio file
- 500: Server processing error

### Limitations

- Maximum audio file size: TBD
- Supported audio format: MP3
- Processing time varies with audio length

### Best Practices

1. **Audio Quality**
   - Use clear audio recordings
   - Minimize background noise
   - Ensure proper audio encoding

2. **Request Handling**
   - Handle large files appropriately
   - Implement proper error handling
   - Consider implementing retry logic

3. **Response Processing**
   - Parse both raw and analyzed results
   - Handle potential missing fields
   - Consider implementing caching for repeated requests

### Updates and Maintenance

This API is actively maintained and updated. Check back for:
- New emotion types
- Improved accuracy
- Additional analysis features
- Performance optimizations 