import asyncio
import os
import edge_tts

VOICE_MAP = {
    'en-female': 'en-US-JennyNeural',
    'en-male': 'en-US-ChristopherNeural',
    'hi-male': 'hi-IN-MadhurNeural',
    'mr-female': 'mr-IN-AarohiNeural',
}

GREETINGS = {
    'en-male': "Hey there! Coach Guy here. Let's look over your answers and sharpen your skills.",
    'en-female': "Hello! I am Mrs. Davis, your English teacher. Let's review your worksheet together.",
    'hi-male': "नमस्ते! मैं आपका शिक्षक वर्मा हूँ। आइए गलतियों को सुधारें और सही नियम सीखें।",
    'mr-female': "नमस्कार! मी तुमची शिक्षिका सौ. कुलकर्णी. चला तुमची वर्कशीट काळजीपूर्वक पाहूया.",
}

async def make_greetings():
    os.makedirs('static/audio', exist_ok=True)
    for voice_key, text in GREETINGS.items():
        neural_voice = VOICE_MAP[voice_key]
        fn = f'static/audio/greeting_{voice_key}.mp3'
        print(f"Generating {fn} with {neural_voice}...")
        comm = edge_tts.Communicate(text, neural_voice)
        audio_data = bytearray()
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                audio_data.extend(chunk["data"])
        with open(fn, 'wb') as f:
            f.write(audio_data)
        print(f"Saved {fn}: {len(audio_data)} bytes")

asyncio.run(make_greetings())
