import asyncio
import json
import re
import base64
import os
import edge_tts
from grader import MOCK_SAMPLES

VOICE_MAP = {
    'en-female': 'en-US-JennyNeural',
    'en-male': 'en-US-ChristopherNeural',
    'hi-male': 'hi-IN-MadhurNeural',
    'mr-female': 'mr-IN-AarohiNeural',
}

async def generate():
    cache = {}
    sample = MOCK_SAMPLES['user_math_photo.jpg']
    tasks = [
        (sample['voice_script'], 'en-male'),
        (sample['voice_script'], 'en-female'),
        (sample['voice_script_hi'], 'hi-male'),
        (sample['voice_script_mr'], 'mr-female'),
    ]
    for ann in sample.get('annotations', []):
        tasks.append((ann['spoken_explanation'], 'en-male'))
        tasks.append((ann['spoken_explanation'], 'en-female'))
        tasks.append((ann['spoken_explanation_hi'], 'hi-male'))
        tasks.append((ann['spoken_explanation_mr'], 'mr-female'))
    
    print(f"Generating {len(tasks)} TTS clips for instant cloud playback...")
    for text, voice_name in tasks:
        key = f"{text.strip()}___{voice_name}"
        target_voice = VOICE_MAP[voice_name]
        clean = re.sub(r'[\*\#_`]', '', text).strip()
        try:
            comm = edge_tts.Communicate(clean, target_voice)
            audio_bytes = bytearray()
            async for chunk in comm.stream():
                if chunk['type'] == 'audio':
                    audio_bytes.extend(chunk['data'])
            if audio_bytes:
                b64 = base64.b64encode(bytes(audio_bytes)).decode('utf-8')
                cache[key] = b64
                print(f"Cached: {voice_name} ({len(b64)} chars)")
        except Exception as e:
            print(f"Failed {voice_name}: {e}")
    
    with open('tts_cache.json', 'w', encoding='utf-8') as f:
        json.dump(cache, f)
    print("Done! Saved tts_cache.json")

if __name__ == "__main__":
    asyncio.run(generate())
