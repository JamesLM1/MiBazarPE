from pathlib import Path
import json,subprocess
out=Path(__file__).resolve().parent;file=out/'Bazi_correo_a_contrasena.mp4'
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name,width,height,avg_frame_rate','-show_entries','format=duration','-of','json',str(file)],text=True))
data=subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-i',str(file),'-t','1.4','-vf','fps=15','-f','framemd5','-'],text=True)
frames=[row.split(',')[-1].strip() for row in data.splitlines() if row and not row.startswith('#')]
assert len(set(frames))>10
report={'video':file.name,'first_transition_seconds_sampled':1.4,'sampled_frames':len(frames),'distinct_frames':len(set(frames)),'animated':True,'metadata':meta}
(out/'verificacion_video.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
