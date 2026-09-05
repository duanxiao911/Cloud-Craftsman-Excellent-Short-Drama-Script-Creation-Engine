from src.database import Database, ProjectDAO, UserDAO


def test_project_type_roundtrip_and_legacy_default(tmp_path):
    database = Database(str(tmp_path / "projects.db"))
    database.init_db()
    UserDAO(database).create_user("portal_user", "门户用户")
    dao = ProjectDAO(database)

    literary = dao.create_project(
        user_id="portal_user",
        title="文学改编项目",
        original_idea="已取得作品改编授权",
        project_type="literary_adaptation",
    )
    original = dao.create_project(user_id="portal_user", title="原创项目")
    global_project = dao.create_project(user_id="portal_user", title="文化出海项目", project_type="globalization")
    tourism_project = dao.create_project(user_id="portal_user", title="滴水湖文旅宣传", project_type="tourism_promo")

    assert literary["project_type"] == "literary_adaptation"
    assert original["project_type"] == "original"
    assert global_project["project_type"] == "globalization"
    assert tourism_project["project_type"] == "tourism_promo"
    assert {item["project_type"] for item in dao.list_projects("portal_user")} == {"original", "literary_adaptation", "globalization", "tourism_promo"}
