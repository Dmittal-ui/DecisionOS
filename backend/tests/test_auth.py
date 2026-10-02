"""
DecisionOS — Phase 2 Auth Tests

Uses mongomock-motor to provide a fully in-memory async MongoDB client.
No real MongoDB connection required — all tests run isolated.

Test coverage:
    TestSignup                  — success, duplicate email, field validation
    TestLogin                   — success, invalid password, unknown email
    TestGetMe                   — authenticated access, unauthenticated, expired/bad token
    TestOrganizationIsolation   — two separate orgs, verify cross-org access is denied
    TestPasswordSecurity        — passwords are hashed, hash is not in any response
    TestAuthContext             — require_org_access helper enforcement
"""

import pytest
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient

from app.main import app
from app.database.mongodb import get_database

# ─────────────────────────────────────────────────────────────────────────────
# Test database: in-memory MongoDB via mongomock-motor
# ─────────────────────────────────────────────────────────────────────────────

def get_test_db():
    """Returns a fresh in-memory MongoDB database for each test session."""
    client = AsyncMongoMockClient()
    return client["decisionos_test"]


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def test_db():
    """Fresh in-memory database per fixture usage."""
    return get_test_db()


@pytest.fixture
async def client(test_db):
    """
    Async test client with get_database dependency overridden to use in-memory MongoDB.
    Lifespan is bypassed intentionally — no real MongoDB needed.
    """
    async def override_get_database():
        yield test_db

    app.dependency_overrides[get_database] = override_get_database

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as c:
        yield c

    app.dependency_overrides.clear()


# ─── Signup payloads ───────────────────────────────────────────────────────────

ORG_A_SIGNUP = {
    "name": "Alexandra Chen",
    "email": "alex@acme-corp.com",
    "password": "SecurePass123",
    "organization_name": "Acme Corp",
}

ORG_B_SIGNUP = {
    "name": "Marcus Vance",
    "email": "marcus@beta-inc.com",
    "password": "AnotherPass456",
    "organization_name": "Beta Inc",
}


# ─────────────────────────────────────────────────────────────────────────────
# 1. SIGNUP TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestSignup:
    """POST /api/auth/signup"""

    async def test_signup_success_returns_201(self, client: AsyncClient):
        response = await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        assert response.status_code == 201, response.text

    async def test_signup_response_envelope(self, client: AsyncClient):
        response = await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        body = response.json()
        assert body["success"] is True
        assert "data" in body
        assert "message" in body

    async def test_signup_returns_access_token(self, client: AsyncClient):
        response = await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        data = response.json()["data"]
        assert "access_token" in data
        assert len(data["access_token"]) > 20
        assert data["token_type"] == "bearer"

    async def test_signup_returns_user_without_password(self, client: AsyncClient):
        response = await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        user = response.json()["data"]["user"]
        # Must have user fields
        assert user["email"] == ORG_A_SIGNUP["email"]
        assert user["full_name"] == ORG_A_SIGNUP["name"]
        assert "organization_id" in user
        assert "organization_name" in user
        assert user["organization_name"] == ORG_A_SIGNUP["organization_name"]
        # Must NOT expose password
        assert "password" not in user
        assert "password_hash" not in user

    async def test_signup_first_user_is_admin(self, client: AsyncClient):
        response = await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        user = response.json()["data"]["user"]
        assert user["role"] == "admin"

    async def test_signup_duplicate_email_returns_409(self, client: AsyncClient):
        # First signup — should succeed
        await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        # Second signup with same email — must fail
        response = await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        assert response.status_code == 409, response.text
        body = response.json()
        assert body["detail"]["code"] == "CONFLICT"

    async def test_signup_duplicate_email_case_insensitive(self, client: AsyncClient):
        await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        # Same email, different casing
        signup_upper = {**ORG_A_SIGNUP, "email": "ALEX@ACME-CORP.COM"}
        response = await client.post("/api/auth/signup", json=signup_upper)
        assert response.status_code == 409

    async def test_signup_short_password_returns_422(self, client: AsyncClient):
        bad_payload = {**ORG_A_SIGNUP, "password": "short"}
        response = await client.post("/api/auth/signup", json=bad_payload)
        assert response.status_code == 422

    async def test_signup_missing_email_returns_422(self, client: AsyncClient):
        bad_payload = {k: v for k, v in ORG_A_SIGNUP.items() if k != "email"}
        response = await client.post("/api/auth/signup", json=bad_payload)
        assert response.status_code == 422

    async def test_signup_empty_email_returns_422(self, client: AsyncClient):
        bad_payload = {**ORG_A_SIGNUP, "email": "   "}
        response = await client.post("/api/auth/signup", json=bad_payload)
        assert response.status_code == 422

    async def test_signup_whitespace_around_email_normalized(self, client: AsyncClient):
        payload = {**ORG_A_SIGNUP, "email": "  alex.padded@acme-corp.com  "}
        response = await client.post("/api/auth/signup", json=payload)
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["user"]["email"] == "alex.padded@acme-corp.com"

    async def test_signup_invalid_email_missing_at_returns_422(self, client: AsyncClient):
        bad_payload = {**ORG_A_SIGNUP, "email": "invalidemail.com"}
        response = await client.post("/api/auth/signup", json=bad_payload)
        assert response.status_code == 422

    async def test_signup_invalid_email_missing_domain_returns_422(self, client: AsyncClient):
        bad_payload = {**ORG_A_SIGNUP, "email": "user@"}
        response = await client.post("/api/auth/signup", json=bad_payload)
        assert response.status_code == 422

    async def test_signup_invalid_email_spaces_inside_returns_422(self, client: AsyncClient):
        bad_payload = {**ORG_A_SIGNUP, "email": "user name@domain.com"}
        response = await client.post("/api/auth/signup", json=bad_payload)
        assert response.status_code == 422

    async def test_signup_invalid_email_consecutive_dots_returns_422(self, client: AsyncClient):
        bad_payload = {**ORG_A_SIGNUP, "email": "user..name@domain.com"}
        response = await client.post("/api/auth/signup", json=bad_payload)
        assert response.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# 2. LOGIN TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestLogin:
    """POST /api/auth/login"""

    async def test_login_success_returns_200(self, client: AsyncClient):
        await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        response = await client.post("/api/auth/login", json={
            "email": ORG_A_SIGNUP["email"],
            "password": ORG_A_SIGNUP["password"],
        })
        assert response.status_code == 200, response.text

    async def test_login_using_normalized_email_with_spaces_and_casing_succeeds(self, client: AsyncClient):
        await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        # Login with uppercase and leading/trailing whitespace
        response = await client.post("/api/auth/login", json={
            "email": f"  {ORG_A_SIGNUP['email'].upper()}  ",
            "password": ORG_A_SIGNUP["password"],
        })
        assert response.status_code == 200, response.text
        data = response.json()["data"]
        assert data["user"]["email"] == ORG_A_SIGNUP["email"]

    async def test_login_invalid_email_format_returns_422(self, client: AsyncClient):
        response = await client.post("/api/auth/login", json={
            "email": "not-a-valid-email",
            "password": "Password123",
        })
        assert response.status_code == 422

    async def test_login_returns_access_token(self, client: AsyncClient):
        await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        response = await client.post("/api/auth/login", json={
            "email": ORG_A_SIGNUP["email"],
            "password": ORG_A_SIGNUP["password"],
        })
        data = response.json()["data"]
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_password_returns_401(self, client: AsyncClient):
        await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        response = await client.post("/api/auth/login", json={
            "email": ORG_A_SIGNUP["email"],
            "password": "WRONG_PASSWORD",
        })
        assert response.status_code == 401, response.text

    async def test_login_unknown_email_returns_401(self, client: AsyncClient):
        response = await client.post("/api/auth/login", json={
            "email": "nobody@nowhere.com",
            "password": "SomePassword123",
        })
        assert response.status_code == 401

    async def test_login_error_message_is_vague(self, client: AsyncClient):
        """Error must not reveal whether email or password was wrong (prevents enumeration)."""
        await client.post("/api/auth/signup", json=ORG_A_SIGNUP)

        bad_pass = await client.post("/api/auth/login", json={
            "email": ORG_A_SIGNUP["email"],
            "password": "WRONGPASS",
        })
        bad_email = await client.post("/api/auth/login", json={
            "email": "nonexistent@nowhere.com",
            "password": "WRONGPASS",
        })

        # Both must return the same vague message
        assert bad_pass.json()["detail"]["message"] == bad_email.json()["detail"]["message"]

    async def test_login_returns_no_password_hash(self, client: AsyncClient):
        await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        response = await client.post("/api/auth/login", json={
            "email": ORG_A_SIGNUP["email"],
            "password": ORG_A_SIGNUP["password"],
        })
        response_text = response.text
        assert "password_hash" not in response_text
        assert "pbkdf2" not in response_text



# ─────────────────────────────────────────────────────────────────────────────
# 3. GET /me TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestGetMe:
    """GET /api/auth/me"""

    async def _signup_and_get_token(self, client, payload=None) -> str:
        payload = payload or ORG_A_SIGNUP
        response = await client.post("/api/auth/signup", json=payload)
        return response.json()["data"]["access_token"]

    async def test_me_with_valid_token_returns_200(self, client: AsyncClient):
        token = await self._signup_and_get_token(client)
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200, response.text

    async def test_me_returns_correct_user(self, client: AsyncClient):
        token = await self._signup_and_get_token(client)
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        user = response.json()["data"]
        assert user["email"] == ORG_A_SIGNUP["email"]
        assert user["full_name"] == ORG_A_SIGNUP["name"]
        assert user["organization_name"] == ORG_A_SIGNUP["organization_name"]

    async def test_me_without_token_returns_401(self, client: AsyncClient):
        response = await client.get("/api/auth/me")
        assert response.status_code == 401

    async def test_me_with_garbage_token_returns_401(self, client: AsyncClient):
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer this.is.not.a.valid.jwt"},
        )
        assert response.status_code == 401

    async def test_me_with_malformed_header_returns_401(self, client: AsyncClient):
        """Token without 'Bearer' prefix must be rejected."""
        token = await self._signup_and_get_token(client)
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": token},  # missing "Bearer " prefix
        )
        assert response.status_code == 401

    async def test_me_does_not_expose_password(self, client: AsyncClient):
        token = await self._signup_and_get_token(client)
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert "password_hash" not in response.text
        assert "pbkdf2" not in response.text

    async def test_update_me_profile(self, client: AsyncClient):
        token = await self._signup_and_get_token(client)
        response = await client.patch(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "firstName": "Alex",
                "lastName": "Johnson",
                "title": "Head of Operations",
                "department": "Global Supply Chain",
            },
        )
        assert response.status_code == 200, response.text
        user = response.json()["data"]
        assert user["first_name"] == "Alex"
        assert user["last_name"] == "Johnson"
        assert user["full_name"] == "Alex Johnson"
        assert user["title"] == "Head of Operations"
        assert user["department"] == "Global Supply Chain"

        # Verify persistent in subsequent GET /me
        get_res = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        get_user = get_res.json()["data"]
        assert get_user["first_name"] == "Alex"
        assert get_user["title"] == "Head of Operations"
        assert get_user["department"] == "Global Supply Chain"

    async def test_update_me_unauthenticated_returns_401(self, client: AsyncClient):
        response = await client.patch(
            "/api/auth/me",
            json={"title": "Unauthorized Title"},
        )
        assert response.status_code == 401



# ─────────────────────────────────────────────────────────────────────────────
# 4. PASSWORD SECURITY TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestPasswordSecurity:
    """Verify passwords are hashed and never exposed."""

    async def test_password_not_in_signup_response(self, client: AsyncClient):
        response = await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        body = response.text
        assert ORG_A_SIGNUP["password"] not in body
        assert "password_hash" not in body

    async def test_password_not_in_login_response(self, client: AsyncClient):
        await client.post("/api/auth/signup", json=ORG_A_SIGNUP)
        response = await client.post("/api/auth/login", json={
            "email": ORG_A_SIGNUP["email"],
            "password": ORG_A_SIGNUP["password"],
        })
        body = response.text
        assert ORG_A_SIGNUP["password"] not in body
        assert "password_hash" not in body

    def test_same_password_produces_different_hashes(self):
        """PBKDF2 with random salt — same input must produce different output."""
        from app.core.security import hash_password
        h1 = hash_password("SamePassword123")
        h2 = hash_password("SamePassword123")
        assert h1 != h2, "Two hashes of same password must differ (random salt)"

    def test_password_verify_correct(self):
        from app.core.security import hash_password, verify_password
        pw = "MyTestPassword!"
        h = hash_password(pw)
        assert verify_password(pw, h) is True

    def test_password_verify_wrong(self):
        from app.core.security import hash_password, verify_password
        h = hash_password("CorrectPassword")
        assert verify_password("WrongPassword", h) is False

    def test_password_verify_invalid_hash_returns_false(self):
        from app.core.security import verify_password
        assert verify_password("anything", "not$a$valid$hash") is False


# ─────────────────────────────────────────────────────────────────────────────
# 5. ORGANIZATION ISOLATION TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestOrganizationIsolation:
    """
    Two organizations are created. Verify:
    - Each user can access their own data.
    - Cross-org access via require_org_access raises HTTP 403.
    - JWT of user from Org A contains Org A's id, not Org B's.
    """

    async def _signup_user(self, client: AsyncClient, payload: dict) -> dict:
        """Signs up a user and returns { token, user, org_id }."""
        response = await client.post("/api/auth/signup", json=payload)
        assert response.status_code == 201, f"Signup failed: {response.text}"
        data = response.json()["data"]
        return {
            "token": data["access_token"],
            "user": data["user"],
            "org_id": data["user"]["organization_id"],
        }

    async def test_two_orgs_have_different_org_ids(self, client: AsyncClient):
        org_a = await self._signup_user(client, ORG_A_SIGNUP)
        org_b = await self._signup_user(client, ORG_B_SIGNUP)
        assert org_a["org_id"] != org_b["org_id"], "Different orgs must have different org_ids"

    async def test_jwt_contains_correct_org_id(self, client: AsyncClient):
        """Decode the token and verify org_id in payload matches user's org."""
        import jwt as pyjwt
        from app.config import get_settings

        org_a = await self._signup_user(client, ORG_A_SIGNUP)
        settings = get_settings()

        payload = pyjwt.decode(
            org_a["token"],
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        assert payload["org_id"] == org_a["org_id"]

    async def test_me_returns_own_org_only(self, client: AsyncClient):
        """User A's /me must return Org A, not Org B."""
        org_a = await self._signup_user(client, ORG_A_SIGNUP)
        org_b = await self._signup_user(client, ORG_B_SIGNUP)

        response_a = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {org_a['token']}"},
        )
        response_b = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {org_b['token']}"},
        )

        org_a_user = response_a.json()["data"]
        org_b_user = response_b.json()["data"]

        assert org_a_user["organization_name"] == ORG_A_SIGNUP["organization_name"]
        assert org_b_user["organization_name"] == ORG_B_SIGNUP["organization_name"]
        assert org_a_user["organization_id"] != org_b_user["organization_id"]

    async def test_require_org_access_same_org_passes(self):
        """require_org_access must not raise when org_ids match."""
        from app.api.deps import require_org_access
        from app.schemas.auth import AuthContext

        auth = AuthContext(user_id="u1", org_id="org-abc", email="test@test.com")
        # Must not raise
        require_org_access(auth, "org-abc")

    async def test_require_org_access_different_org_raises_403(self):
        """require_org_access must raise HTTP 403 when org_ids differ."""
        from fastapi import HTTPException
        from app.api.deps import require_org_access
        from app.schemas.auth import AuthContext

        auth = AuthContext(user_id="u1", org_id="org-abc", email="test@test.com")

        with pytest.raises(HTTPException) as exc_info:
            require_org_access(auth, "org-xyz")

        assert exc_info.value.status_code == 403
        assert exc_info.value.detail["code"] == "FORBIDDEN"

    async def test_cannot_use_org_b_token_to_see_org_a_user(self, client: AsyncClient):
        """
        User B's JWT must only return User B's profile, never User A's.
        This verifies the /me endpoint uses JWT sub (user_id) not any request param.
        """
        org_a = await self._signup_user(client, ORG_A_SIGNUP)
        org_b = await self._signup_user(client, ORG_B_SIGNUP)

        # Use Org B's token — should return Org B's user, not Org A's
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {org_b['token']}"},
        )
        user = response.json()["data"]

        assert user["email"] == ORG_B_SIGNUP["email"]
        assert user["email"] != ORG_A_SIGNUP["email"]
        assert user["organization_id"] == org_b["org_id"]
        assert user["organization_id"] != org_a["org_id"]

    async def test_cross_org_data_access_prevented(self, client: AsyncClient):
        """
        Simulate an actual resource (e.g. opportunities/decisions collection) belonging to Org A.
        Verify that a request authenticated as Org B fails isolation checks.
        """
        from app.api.deps import require_org_access
        from app.schemas.auth import AuthContext
        from fastapi import HTTPException

        org_a = await self._signup_user(client, ORG_A_SIGNUP)
        org_b = await self._signup_user(client, ORG_B_SIGNUP)

        # Context for User B
        auth_b = AuthContext(
            user_id=org_b["user"]["id"],
            org_id=org_b["org_id"],
            email=org_b["user"]["email"],
        )

        # Resource owned by Org A
        resource_org_a = {
            "id": "opp-123",
            "title": "Pricing Opportunity",
            "organization_id": org_a["org_id"],
        }

        # Org B attempting to access Org A's resource
        with pytest.raises(HTTPException) as exc:
            require_org_access(auth_b, resource_org_a["organization_id"])

        assert exc.value.status_code == 403
        assert exc.value.detail["code"] == "FORBIDDEN"


# ─────────────────────────────────────────────────────────────────────────────
# 6. MODEL PROPERTIES & CONTRACT COMPATIBILITY TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestModelContracts:
    """Verifies that User and Organization models adhere to all required property names."""

    def test_user_document_properties(self):
        from app.models.user import UserDocument
        from app.core.security import hash_password

        hashed = hash_password("Secret12345")
        user = UserDocument(
            id="user-uuid-1",
            name="Alice Smith",
            email="alice@corp.com",
            password_hash=hashed,
            organization_id="org-uuid-1",
        )

        # Check required fields
        assert user.userId == "user-uuid-1"
        assert user.name == "Alice Smith"
        assert user.email == "alice@corp.com"
        assert user.passwordHash == hashed
        assert user.organizationId == "org-uuid-1"
        assert user.createdAt is not None

        # Check to_mongo mapping
        m = user.to_mongo()
        assert m["_id"] == "user-uuid-1"
        assert m["userId"] == "user-uuid-1"
        assert m["passwordHash"] == hashed
        assert m["organizationId"] == "org-uuid-1"

    def test_organization_document_properties(self):
        from app.models.organization import OrganizationDocument

        org = OrganizationDocument(
            id="org-uuid-99",
            name="Enterprise Ltd",
        )

        assert org.organizationId == "org-uuid-99"
        assert org.name == "Enterprise Ltd"
        assert org.createdAt is not None

        m = org.to_mongo()
        assert m["_id"] == "org-uuid-99"
        assert m["organizationId"] == "org-uuid-99"

    async def test_signup_with_camelcase_organization_name(self, client: AsyncClient):
        payload = {
            "name": "Camel User",
            "email": "camel@user.com",
            "password": "Password123",
            "organizationName": "CamelCase Inc",
        }
        response = await client.post("/api/auth/signup", json=payload)
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["user"]["organization_name"] == "CamelCase Inc"
        assert data["user"]["organizationName"] == "CamelCase Inc"
        assert data["user"]["userId"] is not None
        assert data["user"]["organizationId"] is not None


# ─────────────────────────────────────────────────────────────────────────────
# 7. DECISION REGISTRY & GOVERNANCE REGRESSION TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestDecisionRegistrySeeding:
    """Verify decision owner resolution, pending counts, and organization isolation."""

    async def _signup(self, client: AsyncClient, payload: dict) -> str:
        res = await client.post("/api/auth/signup", json=payload)
        return res.json()["data"]["access_token"]

    async def test_decision_owner_uses_authenticated_user_name(self, client: AsyncClient):
        token = await self._signup(client, {
            "name": "Elena Rostova",
            "email": "elena@apex.corp",
            "password": "ApexPassword123",
            "organization_name": "Apex Global",
        })

        # Fetch decisions — triggers seeding
        res = await client.get(
            "/api/decisions",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200, res.text
        decisions = res.json()["data"]
        assert len(decisions) >= 1
        # Verify the seeded decision owner is the authenticated user's name
        assert decisions[0]["owner"] == "Elena Rostova"
        assert decisions[0]["owner"] != "Chief Strategy & Operating Officer"

    async def test_decision_pending_status_and_count(self, client: AsyncClient):
        token = await self._signup(client, {
            "name": "David Miller",
            "email": "david@quantum.corp",
            "password": "QuantumPassword123",
            "organization_name": "Quantum Tech",
        })

        res = await client.get(
            "/api/decisions",
            headers={"Authorization": f"Bearer {token}"},
        )
        decisions = res.json()["data"]
        # Filter matching frontend logic ["under_review", "proposed"]
        pending = [d for d in decisions if d["status"] in ["under_review", "proposed"]]
        assert len(pending) >= 1

    async def test_decision_registry_tenant_isolation(self, client: AsyncClient):
        token_a = await self._signup(client, ORG_A_SIGNUP)
        token_b = await self._signup(client, ORG_B_SIGNUP)

        res_a = await client.get(
            "/api/decisions",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        res_b = await client.get(
            "/api/decisions",
            headers={"Authorization": f"Bearer {token_b}"},
        )

        dec_a = res_a.json()["data"]
        dec_b = res_b.json()["data"]

        assert dec_a[0]["owner"] == ORG_A_SIGNUP["name"]
        assert dec_b[0]["owner"] == ORG_B_SIGNUP["name"]
        assert dec_a[0]["id"] != dec_b[0]["id"]

