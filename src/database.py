"""
SQLite数据库层

提供User和Project的持久化存储。
使用Python内置sqlite3，无需额外依赖。
"""

import os
import json
import sqlite3
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List


class Database:
    """SQLite数据库管理类"""

    def __init__(self, db_path: str = None):
        if db_path is None:
            # 支持环境变量 DATABASE_PATH，默认相对路径
            env_path = os.environ.get("DATABASE_PATH")
            if env_path:
                db_path = env_path
            else:
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                db_path = os.path.join(base_dir, "data", "yunjiang.db")
        # 确保目录存在
        db_dir = os.path.dirname(os.path.abspath(db_path))
        os.makedirs(db_dir, exist_ok=True)
        self.db_path = db_path

    def init_db(self):
        """初始化数据库表"""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user (
                    user_id TEXT PRIMARY KEY,
                    nickname TEXT,
                    created_at TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS project (
                    project_id TEXT PRIMARY KEY,
                    user_id TEXT,
                    title TEXT,
                    project_type TEXT NOT NULL DEFAULT 'original',
                    genre TEXT DEFAULT '',
                    original_idea TEXT DEFAULT '',
                    workflow_id TEXT,
                    status TEXT DEFAULT 'draft',
                    current_stage TEXT DEFAULT 'idea',
                    created_at TEXT,
                    updated_at TEXT,
                    artifacts TEXT DEFAULT '{}',
                    FOREIGN KEY (user_id) REFERENCES user(user_id)
                )
            """)
            # 兼容已部署的旧数据库：历史项目统一视为原创项目。
            project_columns = {row[1] for row in cursor.execute("PRAGMA table_info(project)").fetchall()}
            if "project_type" not in project_columns:
                cursor.execute("ALTER TABLE project ADD COLUMN project_type TEXT NOT NULL DEFAULT 'original'")
            # 文学改编工作台：原著事实层 + 改编决策层。数组和复杂对象统一存 JSON，
            # 同时保留 source_chunk_ids，保证每一项结论都能回溯原文。
            cursor.executescript("""
                CREATE TABLE IF NOT EXISTS adaptation_settings (
                    id TEXT PRIMARY KEY, user_id TEXT, source_type TEXT NOT NULL,
                    source_name TEXT NOT NULL, source_author TEXT,
                    target_output_type TEXT NOT NULL DEFAULT 'short_drama',
                    target_episode_count INTEGER, total_chapters INTEGER,
                    total_chunks INTEGER NOT NULL DEFAULT 0,
                    extraction_status TEXT NOT NULL DEFAULT 'pending',
                    rights_confirmed INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS adaptation_chunks (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, chapter INTEGER,
                    chunk_index INTEGER NOT NULL, text TEXT NOT NULL,
                    type_label TEXT NOT NULL, word_count INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_characters (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, name TEXT NOT NULL,
                    aliases TEXT DEFAULT '[]', identity TEXT, personality TEXT DEFAULT '[]',
                    appearance TEXT, motivation TEXT, first_appearance_chunk_id TEXT,
                    source_chunk_ids TEXT NOT NULL DEFAULT '[]', extraction_confidence TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_world (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, category TEXT NOT NULL,
                    name TEXT NOT NULL, description TEXT NOT NULL,
                    related_character_ids TEXT DEFAULT '[]', source_chunk_ids TEXT NOT NULL DEFAULT '[]',
                    extraction_confidence TEXT NOT NULL, created_at TEXT NOT NULL,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_events (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, chapter INTEGER,
                    chunk_index_start INTEGER NOT NULL, chunk_index_end INTEGER,
                    summary TEXT NOT NULL, detail TEXT, participant_character_ids TEXT NOT NULL DEFAULT '[]',
                    event_type TEXT NOT NULL, importance TEXT NOT NULL,
                    source_chunk_ids TEXT NOT NULL DEFAULT '[]', extraction_confidence TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_event_edges (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL,
                    cause_event_id TEXT NOT NULL, effect_event_id TEXT NOT NULL,
                    relation_type TEXT NOT NULL DEFAULT 'causes', confidence TEXT NOT NULL,
                    rationale TEXT, source_chunk_ids TEXT NOT NULL DEFAULT '[]',
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_relationships (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL,
                    character_id TEXT NOT NULL, related_character_id TEXT NOT NULL,
                    relation_type TEXT NOT NULL, relation_label TEXT,
                    chapter_start INTEGER, chapter_end INTEGER,
                    chunk_index_start INTEGER NOT NULL, chunk_index_end INTEGER,
                    transformation_note TEXT, source_chunk_ids TEXT NOT NULL DEFAULT '[]',
                    extraction_confidence TEXT NOT NULL, created_at TEXT NOT NULL,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_character_arcs (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, character_id TEXT NOT NULL,
                    stage_name TEXT NOT NULL, chapter_start INTEGER, chapter_end INTEGER,
                    chunk_index_start INTEGER NOT NULL, chunk_index_end INTEGER,
                    description TEXT NOT NULL, key_event_ids TEXT DEFAULT '[]',
                    source_chunk_ids TEXT NOT NULL DEFAULT '[]', extraction_confidence TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_dialogues (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL,
                    speaker_character_id TEXT NOT NULL, target_character_id TEXT,
                    content TEXT NOT NULL, scene_event_id TEXT, emotion TEXT,
                    is_original INTEGER NOT NULL, validation_status TEXT NOT NULL,
                    validation_note TEXT, source_chunk_ids TEXT DEFAULT '[]', created_at TEXT NOT NULL,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_story_invariants (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, invariant_type TEXT NOT NULL,
                    title TEXT NOT NULL, description TEXT NOT NULL, lock_level TEXT NOT NULL,
                    source_chunk_ids TEXT NOT NULL DEFAULT '[]', approved_by_human INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL, FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_plot_beats (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, sequence_no INTEGER NOT NULL,
                    event_id TEXT, title TEXT NOT NULL, function TEXT NOT NULL,
                    preservation_policy TEXT NOT NULL, adaptation_note TEXT,
                    source_chunk_ids TEXT NOT NULL DEFAULT '[]', FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_filmability_issues (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, beat_id TEXT,
                    issue_type TEXT NOT NULL, severity TEXT NOT NULL, original_excerpt TEXT,
                    diagnosis TEXT NOT NULL, modern_value_dimension TEXT,
                    source_chunk_ids TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'open',
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_proposals (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, issue_id TEXT NOT NULL,
                    strategy TEXT NOT NULL, adapted_content TEXT NOT NULL, rationale TEXT NOT NULL,
                    skeleton_impact TEXT NOT NULL, downstream_event_ids TEXT DEFAULT '[]',
                    validation_status TEXT NOT NULL DEFAULT 'pending', selected INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_change_ledger (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, proposal_id TEXT NOT NULL,
                    original_content TEXT NOT NULL, adapted_content TEXT NOT NULL,
                    reason TEXT NOT NULL, affected_entities TEXT DEFAULT '[]', approved_by TEXT,
                    approved_at TEXT, created_at TEXT NOT NULL,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_value_reviews (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, proposal_id TEXT,
                    dimension TEXT NOT NULL, risk_level TEXT NOT NULL, evidence TEXT NOT NULL,
                    recommendation TEXT NOT NULL, validation_status TEXT NOT NULL DEFAULT 'pending',
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_scene_outlines (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, episode_no INTEGER NOT NULL,
                    scene_no INTEGER NOT NULL, location TEXT NOT NULL, time_of_day TEXT,
                    character_ids TEXT NOT NULL DEFAULT '[]', dramatic_goal TEXT NOT NULL,
                    conflict TEXT NOT NULL, visual_action TEXT NOT NULL, source_event_ids TEXT DEFAULT '[]',
                    validation_status TEXT NOT NULL DEFAULT 'pending',
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_runs (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, status TEXT NOT NULL,
                    current_stage TEXT NOT NULL, checkpoint TEXT, evidence_log TEXT NOT NULL DEFAULT '[]',
                    snapshot TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_manga_pages (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, page_no INTEGER NOT NULL,
                    image_ref TEXT NOT NULL, reading_direction TEXT NOT NULL DEFAULT 'ltr',
                    width INTEGER NOT NULL DEFAULT 0, height INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL, FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_manga_panels (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, page_id TEXT NOT NULL,
                    panel_no INTEGER NOT NULL, reading_order INTEGER NOT NULL, bbox TEXT NOT NULL,
                    scene_description TEXT NOT NULL, character_ids TEXT NOT NULL DEFAULT '[]',
                    extraction_confidence TEXT NOT NULL, human_corrected INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_manga_speech_bubbles (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, panel_id TEXT NOT NULL,
                    bubble_no INTEGER NOT NULL, content TEXT NOT NULL, speaker_character_id TEXT,
                    bubble_type TEXT NOT NULL DEFAULT 'speech', emotion TEXT,
                    ocr_confidence REAL NOT NULL, attribution_confidence TEXT NOT NULL,
                    human_corrected INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_manga_visual_characters (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, character_id TEXT NOT NULL,
                    panel_ids TEXT NOT NULL DEFAULT '[]', visual_signature TEXT NOT NULL,
                    continuity_note TEXT, extraction_confidence TEXT NOT NULL,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
                CREATE TABLE IF NOT EXISTS adaptation_manga_shot_mappings (
                    id TEXT PRIMARY KEY, settings_id TEXT NOT NULL, panel_ids TEXT NOT NULL DEFAULT '[]',
                    scene_outline_id TEXT NOT NULL, shot_no INTEGER NOT NULL, shot_size TEXT NOT NULL,
                    camera_movement TEXT, adaptation_note TEXT,
                    FOREIGN KEY(settings_id) REFERENCES adaptation_settings(id)
                );
            """)
            conn.commit()
        finally:
            conn.close()

    def get_connection(self) -> sqlite3.Connection:
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn


# 全局数据库实例
_db_instance: Optional[Database] = None


def get_db() -> Database:
    """获取全局数据库实例"""
    global _db_instance
    if _db_instance is None:
        _db_instance = Database()
    return _db_instance


def set_db(db: Database):
    """设置全局数据库实例（用于测试或自定义路径）"""
    global _db_instance
    _db_instance = db


class UserDAO:
    """用户数据访问对象"""

    def __init__(self, db: Database = None):
        self.db = db or get_db()

    def create_user(self, user_id: str = None, nickname: str = "") -> Dict[str, Any]:
        """创建用户"""
        if user_id is None:
            user_id = f"user_{uuid.uuid4().hex[:8]}"
        now = datetime.now().isoformat()
        conn = self.db.get_connection()
        try:
            conn.execute(
                "INSERT OR REPLACE INTO user (user_id, nickname, created_at) VALUES (?, ?, ?)",
                (user_id, nickname, now)
            )
            conn.commit()
            return {"user_id": user_id, "nickname": nickname, "created_at": now}
        finally:
            conn.close()

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """获取用户"""
        conn = self.db.get_connection()
        try:
            row = conn.execute("SELECT * FROM user WHERE user_id = ?", (user_id,)).fetchone()
            if row:
                return dict(row)
            return None
        finally:
            conn.close()


class ProjectDAO:
    """项目数据访问对象"""

    def __init__(self, db: Database = None):
        self.db = db or get_db()

    def create_project(
        self,
        user_id: str,
        title: str,
        genre: str = "",
        original_idea: str = "",
        project_type: str = "original",
    ) -> Dict[str, Any]:
        """创建项目"""
        project_id = f"proj_{uuid.uuid4().hex[:12]}"
        now = datetime.now().isoformat()
        conn = self.db.get_connection()
        try:
            conn.execute(
                """INSERT INTO project
                   (project_id, user_id, title, project_type, genre, original_idea, status, current_stage, created_at, updated_at, artifacts)
                   VALUES (?, ?, ?, ?, ?, ?, 'draft', 'idea', ?, ?, '{}')""",
                (project_id, user_id, title, project_type, genre, original_idea, now, now)
            )
            conn.commit()
            return self._get_project_raw(conn, project_id)
        finally:
            conn.close()

    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """获取项目详情"""
        conn = self.db.get_connection()
        try:
            result = self._get_project_raw(conn, project_id)
            return result
        finally:
            conn.close()

    def list_projects(self, user_id: str) -> List[Dict[str, Any]]:
        """获取用户的项目列表"""
        conn = self.db.get_connection()
        try:
            rows = conn.execute(
                "SELECT * FROM project WHERE user_id = ? ORDER BY updated_at DESC",
                (user_id,)
            ).fetchall()
            return [self._row_to_dict(row) for row in rows]
        finally:
            conn.close()

    def update_project(self, project_id: str, **kwargs) -> Optional[Dict[str, Any]]:
        """更新项目字段"""
        allowed = {"title", "project_type", "genre", "original_idea", "workflow_id", "status", "current_stage", "artifacts"}
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return self.get_project(project_id)

        # Serialize artifacts if present
        if "artifacts" in updates and isinstance(updates["artifacts"], dict):
            updates["artifacts"] = json.dumps(updates["artifacts"], ensure_ascii=False)

        updates["updated_at"] = datetime.now().isoformat()

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [project_id]

        conn = self.db.get_connection()
        try:
            conn.execute(f"UPDATE project SET {set_clause} WHERE project_id = ?", values)
            conn.commit()
            return self._get_project_raw(conn, project_id)
        finally:
            conn.close()

    def delete_project(self, project_id: str) -> bool:
        """删除项目"""
        conn = self.db.get_connection()
        try:
            cursor = conn.execute("DELETE FROM project WHERE project_id = ?", (project_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    def _get_project_raw(self, conn: sqlite3.Connection, project_id: str) -> Optional[Dict[str, Any]]:
        """内部方法：从连接获取项目"""
        row = conn.execute("SELECT * FROM project WHERE project_id = ?", (project_id,)).fetchone()
        if row:
            return self._row_to_dict(row)
        return None

    @staticmethod
    def _row_to_dict(row) -> Dict[str, Any]:
        """将数据库行转换为字典，自动反序列化artifacts"""
        d = dict(row)
        if "artifacts" in d:
            try:
                d["artifacts"] = json.loads(d["artifacts"]) if d["artifacts"] else {}
            except (json.JSONDecodeError, TypeError):
                d["artifacts"] = {}
        return d
