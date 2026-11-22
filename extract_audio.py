import json
import base64
import os
from grader import MOCK_SAMPLES

os.makedirs('static/audio', exist_ok=True)
sample = MOCK_SAMPLES['user_math_photo.jpg']
with open('tts_cache.json', 'r', encoding='utf-8') as f:
    cache = json.load(f)

for ann in sample['annotations']:
    q = ann['question_number']
    for v in ['en-male', 'en-female']:
        k = f"{ann['spoken_explanation'].strip()}___{v}"
        if k in cache:
            fn = f'static/audio/q{q}_{v}.mp3'
            with open(fn, 'wb') as out:
                out.write(base64.b64decode(cache[k]))
            print(f'Wrote {fn}')
    k_hi = f"{ann['spoken_explanation_hi'].strip()}___hi-male"
    if k_hi in cache:
        fn = f'static/audio/q{q}_hi-male.mp3'
        with open(fn, 'wb') as out:
            out.write(base64.b64decode(cache[k_hi]))
        print(f'Wrote {fn}')
    k_mr = f"{ann['spoken_explanation_mr'].strip()}___mr-female"
    if k_mr in cache:
        fn = f'static/audio/q{q}_mr-female.mp3'
        with open(fn, 'wb') as out:
            out.write(base64.b64decode(cache[k_mr]))
        print(f'Wrote {fn}')

print("All audio files written successfully!")
