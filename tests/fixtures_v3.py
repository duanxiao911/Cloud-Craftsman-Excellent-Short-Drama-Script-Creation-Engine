def valid_proposal():
    dimensions = ("core_hook", "audience_fit", "identification_entry", "core_desire", "core_dilemma", "long_term_expectation", "commercial_fit", "originality", "shootability", "signing_potential")
    return {"core_hook": "三天替仇人翻案", "target_audience": "20—35岁悬疑观众", "identification_entry": "职业受挫", "core_desire": "证明清白", "core_dilemma": "救仇人才能救自己", "long_term_expectation": "幕后集团身份", "scores": {key: 8 for key in dimensions}, "evidence": {key: f"创意中{key}的具体证据" for key in dimensions}, "decision": "pass"}


def valid_engine():
    return {
        "long_term_goal": "找出栽赃集团", "episode_capacity": 40,
        "phase_goals": [{"id": "PG1", "episode_start": 1, "episode_end": 10, "goal": "拿到卷宗", "outcome": "确认调包"}, {"id": "PG2", "episode_start": 11, "episode_end": 25, "goal": "找到证人", "outcome": "证人倒戈"}, {"id": "PG3", "episode_start": 26, "episode_end": 40, "goal": "公开证据", "outcome": "集团瓦解"}],
        "opponent_mechanism": {"id": "OM1", "pattern": "迫使主角牺牲关系", "escalation_levels": ["资源", "关系", "身份"]},
        "emotional_debts": [{"id": "ED1", "debtor": "主角", "creditor": "父亲", "payoff_episode": 35}],
        "secrets": [{"id": "SEC1", "holder": "证人", "audience_knowledge": "少知道", "reveal_episode": 20}],
        "foreshadowing": [{"id": "F01", "setup_episode": 5, "payoff_episode": 18}],
        "relationship_curve": [{"id": "RC1", "episode": 1, "state": "敌对"}, {"id": "RC2", "episode": 20, "state": "合作"}],
        "payoff_route": [{"id": "PO1", "episode": 10, "level": "小胜"}, {"id": "PO2", "episode": 40, "level": "大胜"}],
        "failure_costs": [{"id": "FC1", "cost": "失去执照"}],
        "irreversible_events": [{"id": "IE1", "episode": 12, "change": "公开伪证"}, {"id": "IE2", "episode": 28, "change": "母亲决裂"}],
    }
