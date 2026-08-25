"""Observed DeepSeek acceptance for automatic project development."""
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.experts.base import LLMClient
from src.workflow.orchestrator import Orchestrator


class DeepSeekJSONClient(LLMClient):
    def __init__(self, api_key, base_url="https://api.deepseek.com", model="deepseek-chat"):
        self.api_key, self.base_url, self.model = api_key, base_url, model
        self.usages = []
    def complete(self, prompt, **kwargs):
        return json.dumps(self.complete_json(prompt, **kwargs), ensure_ascii=False)
    def complete_json(self, prompt, **kwargs):
        payload = json.dumps({"model": self.model, "messages": [{"role": "user", "content": prompt}], "max_tokens": kwargs.get("max_tokens", 5000), "temperature": kwargs.get("temperature", 0.2), "response_format": {"type": "json_object"}}).encode("utf-8")
        request = urllib.request.Request(self.base_url.rstrip("/") + "/chat/completions", data=payload, headers={"Authorization": "Bearer " + self.api_key, "Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                body = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            raise RuntimeError(f"DeepSeek HTTP {error.code}: {error.read().decode('utf-8', errors='replace')[:500]}") from None
        usage = body.get("usage") or {}
        self.usages.append({"prompt_tokens": usage.get("prompt_tokens", 0), "completion_tokens": usage.get("completion_tokens", 0), "total_tokens": usage.get("total_tokens", 0), "evidence": "observed"})
        content = body["choices"][0]["message"]["content"].strip()
        fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
        return json.loads(fenced.group(1) if fenced else content)


def read_key():
    value = os.getenv("OPENAI_API_KEY", "").strip()
    if value:
        return value
    path = Path(os.getenv("OPENAI_API_KEY_FILE", r"D:\云匠引擎\云匠引擎测试apikey.txt"))
    if not path.exists():
        raise RuntimeError("缺少DeepSeek临时密钥文件")
    return path.read_text(encoding="utf-8-sig").strip()


def run(output_path):
    client = DeepSeekJSONClient(read_key(), os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com"), os.getenv("OPENAI_MODEL", "deepseek-chat"))
    idea = "35岁失业刑辩律师林一被旧案受害者家属指认为伪证帮凶。他只有三天替最恨的前合伙人翻案，才能拿到证明自己清白的原始录音；每推进一步都必须牺牲一段亲密关系，而操盘者能合法转移证据。全剧40集，现代城市实景，主要角色6人，无视效。"
    orchestrator = Orchestrator(llm_client=client, enable_checkpoint=False, enable_culture_kb=False)
    result = orchestrator.auto_develop_project(idea, {"name": "三日证词", "genre": "现实悬疑", "episode_capacity": 40, "production": "现代实景，6个主要角色，无视效"}, max_attempts=3)
    gate = orchestrator.check_generation_gate()
    report = {"status": "passed" if result["passed"] and gate["passed"] else "failed", "evidence": "observed", "model": client.model, "developed_idea": result["developed_idea"], "assessment_attempts": result["assessment_attempts"], "engine_attempts": result["engine_attempts"], "assessment": result["assessment"], "assessment_gate": result["assessment_gate"], "engine": result["engine"], "engine_gate": result["engine_gate"], "generation_gate": gate, "api_calls": len(client.usages), "usage": {"prompt_tokens": sum(item["prompt_tokens"] for item in client.usages), "completion_tokens": sum(item["completion_tokens"] for item in client.usages), "total_tokens": sum(item["total_tokens"] for item in client.usages)}}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("phase3_real_acceptance.json")
    print(json.dumps(run(target), ensure_ascii=False, indent=2))
