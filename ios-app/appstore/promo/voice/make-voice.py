"""PR 動画のナレーション（女性の声）を作る。出力: narration-ja.wav / narration-en.wav（48kHz モノラル、動画と同じ長さ）
使い方: python3 make-voice.py <声のモデルのフォルダ> [ffmpeg のパス]
  日本語: Open JTalk（pip install pyopenjtalk）＋ 東北大学の女性の声 tohoku-f01（git clone https://github.com/icn-lab/htsvoice-tohoku-f01  CC BY 4.0）
  英語:   Piper の女性の声 amy（pip install sherpa-onnx、モデルは https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-amy-medium.tar.bz2）
"""
import json, os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
VOICES = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'models')
FFMPEG = sys.argv[2] if len(sys.argv) > 2 else 'ffmpeg'
SR = 48000
L = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
scenes = L['scenes']; total_ms = scenes[-1]['start'] + scenes[-1]['slot'] + 600

def to48k(x, sr):
    if sr == SR: return x.astype(np.float32)
    with tempfile.TemporaryDirectory() as d:
        a = os.path.join(d, 'a.wav'); b = os.path.join(d, 'b.wav'); sf.write(a, x, sr)
        subprocess.run([FFMPEG, '-loglevel', 'error', '-y', '-i', a, '-ar', str(SR), '-ac', '1', b], check=True)
        y, _ = sf.read(b, dtype='float32'); return y

def ja_tts():
    import pyopenjtalk
    from pyopenjtalk.htsengine import HTSEngine
    voice = os.path.join(VOICES, 'htsvoice-tohoku-f01', 'tohoku-f01-neutral.htsvoice')
    def synth(text, speed):
        e = HTSEngine(voice.encode()); e.set_speed(speed); e.add_half_tone(1.0)   # 少しだけ高めに
        x = e.synthesize(pyopenjtalk.extract_fullcontext(text)); sr = e.get_sampling_frequency()
        return to48k(np.asarray(x, dtype=np.float32) / 32768.0, sr)
    return synth

def en_tts():
    import sherpa_onnx
    d = os.path.join(VOICES, 'vits-piper-en_US-amy-medium')
    cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f'{d}/en_US-amy-medium.onnx', tokens=f'{d}/tokens.txt', data_dir=f'{d}/espeak-ng-data'), num_threads=2))
    tts = sherpa_onnx.OfflineTts(cfg)
    def synth(text, speed):
        a = tts.generate(text, sid=0, speed=speed); return to48k(np.array(a.samples, dtype=np.float32), a.sample_rate)
    return synth

def trim(x, thr=0.01):
    idx = np.where(np.abs(x) > thr)[0]
    return x[max(0, idx[0] - 1200):idx[-1] + 4800] if len(idx) else x

for lang, mk in (('ja', ja_tts), ('en', en_tts)):
    try: synth = mk()
    except Exception as e: print(lang, 'skip:', repr(e)[:200]); continue
    out = np.zeros(int(total_ms / 1000 * SR), dtype=np.float32)
    cap = 1.35 if lang == 'ja' else 1.2                           # 速読みの上限（これ以上は聞き取りにくい）
    prev_end = 0
    for sc, text in zip(scenes, L[lang]):
        lead = 300 if sc['start'] else 250                        # 場面が出てから少し間を置く
        room = (sc['slot'] - lead - 100) / 1000
        x = trim(synth(text, 1.0)); dur = len(x) / SR; speed = 1.0
        if dur > room:                                            # 収まらないときは少し速く読む
            speed = min(cap, dur / room); x = trim(synth(text, speed)); dur = len(x) / SR
        pos = max(int((sc['start'] + lead) / 1000 * SR), prev_end + int(0.25 * SR))   # 前の行と重ねない
        x = x[:max(0, len(out) - pos)]; out[pos:pos + len(x)] += x; prev_end = pos + len(x)
        late = (pos + len(x)) / SR - (sc['start'] + sc['slot']) / 1000
        print(f'{lang} {pos/SR:5.1f}s  {dur:4.1f}s  x{speed:.2f}  {text[:26]}' + (f'  (次の場面に {late:.1f}s かかる)' if late > 0 else ''))
    print(f'{lang} 終わり {prev_end/SR:.1f}s / 動画 {total_ms/1000:.1f}s' + ('  !! はみ出し' if prev_end/SR > total_ms/1000 else ''))
    peak = np.max(np.abs(out)) or 1.0; out = out / peak * 0.7                   # 音量をそろえる
    sf.write(os.path.join(HERE, f'narration-{lang}.wav'), out, SR, subtype='PCM_16')
    print('wrote', f'narration-{lang}.wav')
