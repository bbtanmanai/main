import sys
import json
from faster_whisper import WhisperModel

def transcribe(audio_path, model_size="turbo"):
    # GPU 사용 가능 시 cuda, 아니면 cpu
    # Whisper Turbo 모델은 'large-v3'의 최적화 버전입니다.
    # 여기서는 'turbo' 모델을 명시적으로 사용합니다.
    try:
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        
        segments, info = model.transcribe(audio_path, beam_size=5, language="ko")
        
        full_text = ""
        for segment in segments:
            full_text += segment.text + " "
            
        return full_text.strip()
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python stt_engine.py <audio_path>")
        sys.exit(1)
        
    audio_file = sys.argv[1]
    result = transcribe(audio_file)
    print(result)
