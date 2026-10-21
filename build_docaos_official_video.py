import os
import sys
import json
import subprocess
import shutil

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

ROOT_DIR = r"c:\Users\ricar\Documents\dev-workspace\DocaOS"
SCREEN_REC_DIR = os.path.join(ROOT_DIR, "screen_recordings")
AUDIO_DIR = os.path.join(SCREEN_REC_DIR, "audio")
FRAMES_DIR = os.path.join(SCREEN_REC_DIR, "verified_frames")
CLIPS_DIR = os.path.join(SCREEN_REC_DIR, "clips")
os.makedirs(CLIPS_DIR, exist_ok=True)

ARTIFACT_DIR = r"C:\Users\ricar\.gemini\antigravity-ide\brain\30c76c36-0c91-49fc-8552-2dc37d20b8ed"
FINAL_LOCAL_MP4 = os.path.join(ROOT_DIR, "DocaOS_Apresentacao_Oficial_Clientes.mp4")
FINAL_ARTIFACT_MP4 = os.path.join(ARTIFACT_DIR, "DocaOS_Apresentacao_Oficial_Clientes.mp4")

MANIFEST_PATH = os.path.join(AUDIO_DIR, "manifest.json")

def get_audio_duration(file_path):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return float(res.stdout.strip())

def main():
    print("=== DocaOS: Construção do Vídeo Oficial MP4 para Clientes ===")
    
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    scenes = manifest["scenes"]
    print(f"Total de Cenas Identificadas: {len(scenes)}")

    clip_paths = []

    for i, scene in enumerate(scenes, 1):
        sid = scene["id"]
        img_path = os.path.join(FRAMES_DIR, f"{sid}.png")
        audio_path = os.path.join(AUDIO_DIR, f"{sid}.mp3")
        out_clip = os.path.join(CLIPS_DIR, f"{sid}.mp4")

        # Obter duração exata do arquivo de áudio real
        duration = get_audio_duration(audio_path)
        total_frames = int(duration * 30) + 15
        print(f"\n[{i}/{len(scenes)}] Renderizando {sid} ({duration:.2f}s, {total_frames} frames)...")

        # Configura movimento suave Ken Burns
        # Alterna entre zoom sutil e pan sutil para dinamismo visual
        if i % 2 == 1:
            vf = f"scale=3840x2160,zoompan=z='min(zoom+0.00022,1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={total_frames}:s=1920x1080:fps=30"
        else:
            vf = f"scale=3840x2160,zoompan=z='min(zoom+0.00018,1.035)':x='iw/2-(iw/zoom/2)+sin(in/45)*8':y='ih/2-(ih/zoom/2)':d={total_frames}:s=1920x1080:fps=30"

        cmd = [
            "ffmpeg", "-y",
            "-loop", "1",
            "-i", img_path,
            "-i", audio_path,
            "-vf", vf,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "48000",
            "-t", str(duration),
            out_clip
        ]

        subprocess.run(cmd, check=True)
        clip_paths.append(out_clip)
        print(f"[OK] Clip gerado: {out_clip}")

    # Lista para concatenação
    concat_txt = os.path.join(CLIPS_DIR, "concat_clips.txt")
    with open(concat_txt, "w", encoding="utf-8") as f:
        for c in clip_paths:
            norm = c.replace("\\", "/")
            f.write(f"file '{norm}'\n")

    print("\nConcatenando todos os clipes individuais...")
    temp_concat_mp4 = os.path.join(CLIPS_DIR, "temp_concat.mp4")
    cmd_concat = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_txt.replace("\\", "/"),
        "-c", "copy",
        temp_concat_mp4
    ]
    subprocess.run(cmd_concat, check=True)

    total_duration = get_audio_duration(temp_concat_mp4)
    print(f"Vídeo bruto consolidado: {total_duration:.2f}s")

    print("\nSintetizando trilha sonora ambiente corporativa com ducking sob a narração...")
    # Trilha ambiente suave harmônica (D minor / F major / C major)
    ambient_audio = os.path.join(CLIPS_DIR, "ambient_track.wav")
    cmd_ambient = [
        "ffmpeg", "-y",
        "-f", "lavfi",
        "-i", f"aevalsrc=exprs='0.016*sin(2*PI*146.83*t)+0.013*sin(2*PI*220.00*t)+0.011*sin(2*PI*293.66*t)+0.009*sin(2*PI*329.63*t)':s=48000:d={total_duration}",
        "-af", f"lowpass=f=600,volume=0.30,afade=t=in:ss=0:d=3,afade=t=out:st={total_duration-4}:d=4",
        ambient_audio
    ]
    subprocess.run(cmd_ambient, check=True)

    print("\nRealizando mixagem final de áudio e masterização do vídeo MP4...")
    # Mixagem de áudio: voz principal (100%) + ambiente ducked (14%)
    cmd_master = [
        "ffmpeg", "-y",
        "-i", temp_concat_mp4,
        "-i", ambient_audio,
        "-filter_complex", "[0:a]volume=1.0[v];[1:a]volume=0.12[a];[v][a]amix=inputs=2:duration=first:dropout_transition=2[aout]",
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "256k",
        "-movflags", "+faststart",
        FINAL_LOCAL_MP4
    ]
    subprocess.run(cmd_master, check=True)

    final_size_mb = os.path.getsize(FINAL_LOCAL_MP4) / (1024 * 1024)
    print(f"\n★ SUCESSO! Vídeo Oficial Masterizado: {FINAL_LOCAL_MP4}")
    print(f"Duração: {total_duration:.2f}s (~2m34s) | Tamanho: {final_size_mb:.2f} MB")

    # Copia para os artefatos para visualização imediata
    try:
        shutil.copyfile(FINAL_LOCAL_MP4, FINAL_ARTIFACT_MP4)
        print(f"Cópia de entrega no Artifacts: {FINAL_ARTIFACT_MP4}")
    except Exception as e:
        print(f"Aviso ao copiar para artefatos: {e}")

if __name__ == "__main__":
    main()
