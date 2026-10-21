import asyncio
import os
import subprocess
import json
import edge_tts

ROOT_DIR = r"c:\Users\ricar\Documents\dev-workspace\DocaOS"
AUDIO_DIR = os.path.join(ROOT_DIR, "screen_recordings", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE = "pt-BR-AntonioNeural"

SCENES = [
    {
        "id": "scene_01_landing",
        "text": "Conheça o DocaOS, o sistema operacional de pátio logístico de nova geração desenvolvido pela RAOS Tecnologia. Projetado para centros de distribuição e operadores de alta performance, o DocaOS elimina filas externas e automatiza todo o fluxo de carga e descarga."
    },
    {
        "id": "scene_02_login",
        "text": "Com acesso corporativo seguro e arquitetura em nuvem, a equipe operacional ingressa em um ambiente intuitivo e de alta produtividade, perfeitamente integrado às operações diárias do armazém."
    },
    {
        "id": "scene_03_torre_kanban",
        "text": "Na Torre de Controle, o gestor acompanha em tempo real cada caminhão pelo quadro Kanban inteligente. Os alertas dinâmicos de tolerância da Lei 11.442 monitoram os prazos de permanência, prevenindo multas de estadia antes que elas aconteçam."
    },
    {
        "id": "scene_04_docas",
        "text": "No módulo de Gestão de Docas, cada baia física é monitorada por categoria de carga, como refrigerada, grãos ou secos. O armazém sabe exatamente quais docas estão em operação, aumentando o giro de carretas em mais de quarenta por cento."
    },
    {
        "id": "scene_05_mapa_gps",
        "text": "Com o Mapa do Pátio e a Cerca Eletrônica GPS, o sistema garante blindagem jurídica total. O motorista só consegue registrar sua presença quando seu smartphone comprova que ele realmente ingressou no perímetro do terminal."
    },
    {
        "id": "scene_06_portaria",
        "text": "Na Portaria Express, as pranchetas manuais dão lugar à conferência digital com leitor de placas e QR Code em menos de trinta segundos, agilizando o acesso e liberando as vias de entrada."
    },
    {
        "id": "scene_07_crachas",
        "text": "Uma inovação exclusiva do DocaOS é o Crachá Digital de Pedestres e Ajudantes. Visitantes e terceiros recebem sua credencial com foto e QR Code direto no WhatsApp, eliminando cartões plásticos e reforçando a segurança patrimonial."
    },
    {
        "id": "scene_08_motorista_pwa",
        "text": "Para o motorista, a experiência é ágil e sem atrito. Pelo próprio navegador do celular, sem precisar baixar aplicativos, ele acompanha a fila e recebe uma notificação quando sua doca é liberada para manobra."
    },
    {
        "id": "scene_09_transportador",
        "text": "Pelo Portal do Transportador, as frotas e embarcadores fazem o autoagendamento em janelas disponíveis e anexam antecipadamente notas fiscais e dados do veículo, reduzindo em noventa por cento os atendimentos manuais."
    },
    {
        "id": "scene_10_relatorios",
        "text": "No painel de Relatórios e Auditoria, a diretoria tem visibilidade do tempo médio de permanência, indicadores de pontualidade e a economia líquida gerada em diárias de estadia evitadas."
    },
    {
        "id": "scene_11_encerramento",
        "text": "Integrável ao SAP, TOTVS e aos principais WMS do mercado, o DocaOS transforma seu pátio em uma operação ágil e lucrativa. Fale agora com a RAOS Tecnologia em docaos.log.br e agende uma demonstração personalizada."
    }
]

def get_audio_duration(file_path):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return float(res.stdout.strip())

async def main():
    print("Iniciando sintese de voz neural profissional para o DocaOS...")
    manifest = []
    audio_files_for_concat = []

    for item in SCENES:
        sid = item["id"]
        out_mp3 = os.path.join(AUDIO_DIR, f"{sid}.mp3")
        tts = edge_tts.Communicate(item["text"], VOICE, rate="+3%")
        await tts.save(out_mp3)
        duration = get_audio_duration(out_mp3)
        print(f"[{sid}] Duracao: {duration:.2f}s")
        manifest.append({
            "id": sid,
            "duration": duration,
            "duration_ms": int(duration * 1000),
            "file": out_mp3
        })
        audio_files_for_concat.append(out_mp3)

    concat_list = os.path.join(AUDIO_DIR, "concat_audio.txt")
    with open(concat_list, "w", encoding="utf-8") as f:
        for a in audio_files_for_concat:
            norm = a.replace("\\", "/")
            f.write(f"file '{norm}'\n")

    full_narration_mp3 = os.path.join(AUDIO_DIR, "full_narration.mp3")
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list.replace("\\", "/"),
        "-c", "copy",
        full_narration_mp3
    ]
    subprocess.run(cmd, check=True)
    total_duration = get_audio_duration(full_narration_mp3)
    print(f"\nNarracao completa consolidada: {full_narration_mp3} (Duracao total: {total_duration:.2f}s)")

    manifest_path = os.path.join(AUDIO_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({
            "total_duration": total_duration,
            "scenes": manifest
        }, f, indent=2)
    print(f"Manifesto salvo em: {manifest_path}")

if __name__ == "__main__":
    asyncio.run(main())
