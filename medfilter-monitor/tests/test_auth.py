from medfilter_monitor.auth import _hash_password, create_access


def test_access_hashes_and_demo_expiry_present():
    bundle = create_access(demo_hours=72, site_url="https://example.test")
    assert bundle.demo_user == "demo"
    assert bundle.admin_user == "admin"
    assert bundle.demo_hash == _hash_password(bundle.demo_password, bundle.salt)
    assert bundle.admin_hash == _hash_password(bundle.admin_password, bundle.salt)
    assert bundle.demo_expires_at.endswith("Z")
    cfg = bundle.to_public_auth_config()
    assert "demo_password" not in cfg
    assert cfg["demo"]["hash"] == bundle.demo_hash
