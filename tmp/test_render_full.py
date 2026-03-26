import httpx, json, time

# 실제 씬 데이터 로드
r = httpx.get('http://localhost:8000/api/v1/browser/session')
data = r.json()
scenes = data.get('scenes', [])
print(f"씬 수: {len(scenes)}")

# 이미지 확인
r = httpx.post('http://localhost:8000/api/v1/browser/submit-images')
print(f"이미지: {r.json()}")

# 렌더 시작
r = httpx.post('http://localhost:8000/api/v1/video/render', data={
    'scenes_json': json.dumps(scenes),
    'ratio': '16:9',
}, timeout=10)
print(f"render: {r.status_code} {r.text[:300]}")

if r.status_code != 200:
    exit()

job_id = r.json()['job_id']

for _ in range(40):
    time.sleep(5)
    s = httpx.get(f'http://localhost:8000/api/v1/video/status/{job_id}')
    prog = s.json()
    print(f"[{prog.get('percent',0):3d}%] {prog.get('step','?')} - 씬 {prog.get('scene','?')}/{prog.get('total','?')}")
    if prog.get('step') in ('done', 'error'):
        if prog.get('step') == 'error':
            print(f"ERROR: {prog.get('message','')}")
        break
