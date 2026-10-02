import subprocess, sys, os, pathlib
BASE = pathlib.Path(r"C:\Users\HP\Downloads\DECISION OS FINAL\DecisionOS\backend")
OUT  = pathlib.Path(r"C:\Users\HP\Downloads\DECISION OS FINAL\test_full.txt")
r = subprocess.run(
    [sys.executable, "-m", "pytest", str(BASE / "tests"), "-v", "--tb=short"],
    cwd=str(BASE), capture_output=True, text=True, encoding="utf-8", errors="replace",
    env={**os.environ, "PYTHONUTF8": "1", "PYTHONPATH": str(BASE)},
)
OUT.write_text(r.stdout + "\n" + r.stderr, encoding="utf-8")
print(f"RC={r.returncode}")
