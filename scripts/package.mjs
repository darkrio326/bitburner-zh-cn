import{execFileSync}from'node:child_process';
// Explicit source allowlist: caches, raw test output and previous archives stay local.
execFileSync('python3',['-c',`
import hashlib,json,zipfile
from pathlib import Path
version=json.loads(Path('package.json').read_text())['version']
key=[Path('bitburner-zh-cn.user.js'),Path('translations/zh-CN.json'),Path('translations/candidates.json')]
Path('SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.as_posix()+'\\n' for p in key))
files=[Path(n) for n in ['bitburner-zh-cn.user.js','README.md','README.en.md','CHANGELOG.md','LICENSE','THIRD_PARTY_NOTICES.md','package.json','package-lock.json','playwright.config.mjs','.gitignore','SHA256SUMS']]
for folder in ['src','scripts','tests','translations','docs','licenses','.github']:
    files.extend(p for p in Path(folder).rglob('*') if p.is_file())
archive=Path('bitburner-zh-cn-v'+version+'.zip')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(files):z.write(p,Path('bitburner-zh-cn')/p)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for p in files:assert z.read(str(Path('bitburner-zh-cn')/p))==p.read_bytes(),p
print(json.dumps({'package':str(archive),'bytes':archive.stat().st_size,'files':len(files),'integrity':'OK'}))
`],{stdio:'inherit'});
