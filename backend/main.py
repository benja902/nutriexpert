from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv
import json, sqlite3, operator, os
import google.generativeai as genai
from PIL import Image
from io import BytesIO
import base64

# Cargar variables de entorno
load_dotenv()

app = FastAPI(
    title="NutriExpert API",
    description="Sistema Experto de Nutrición con motor de inferencia basado en reglas",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ---- CORS SIMPLE - Permitir todo para desarrollo con túneles ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Middleware para logging de peticiones
@app.middleware("http")
async def log_requests(request, call_next):
    origin = request.headers.get('origin', 'N/A')
    print(f"📨 {request.method} {request.url.path} - Origin: {origin}")
    try:
        response = await call_next(request)
        print(f"✅ Response: {response.status_code}")
        return response
    except Exception as e:
        print(f"❌ Error procesando request: {e}")
        raise

# Endpoint de salud para verificar que el backend funciona
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Backend funcionando correctamente"}

# ---- CONFIGURACIÓN DE SEGURIDAD ----
DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./rules.db").replace("sqlite:///", "")
JWT_SECRET = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET:
    raise RuntimeError("❌ JWT_SECRET_KEY no está configurado en .env")
print(f"🔑 JWT_SECRET cargado correctamente (primeros 10 chars): {JWT_SECRET[:10]}...")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))

# ---- CONFIGURACIÓN DE GEMINI API ----
GEMINI_API_KEY = os.getenv("API_GEMINI_KEY")
try:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
    print("✅ Gemini API configurada correctamente")
except Exception as e:
    print(f"⚠️ Error configurando Gemini API: {e}")
    gemini_model = None

# Contexto de hashing de contraseñas con pbkdf2_sha256 (incluido en Python, muy seguro)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ---------- MODELOS ----------
class Facts(BaseModel):
    """Memoria de trabajo - Estado actual del paciente"""
    age: int = Field(gt=0, lt=120, description="Edad del paciente en años")
    sex: str = Field(pattern="^[MF]$", description="Sexo: M o F")
    height_cm: float = Field(gt=50, lt=250, description="Altura en centímetros")
    weight_kg: float = Field(gt=20, lt=300, description="Peso en kilogramos")
    activity: str = Field(description="Nivel de actividad física")
    conditions: List[str] = Field(default=[], description="Condiciones médicas preexistentes")
    bmi: float = Field(gt=10, lt=100, description="Índice de masa corporal calculado")

class Rule(BaseModel):
    id: str
    name: str
    priority: int = 0
    when: List[Dict[str, Any]]
    then: Dict[str, Any]

class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=6, max_length=100)
    role: str = Field("patient", pattern="^(patient|nutritionist)$")

class UserPublic(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ImageAnalysisRequest(BaseModel):
    image_base64: str
    prompt: Optional[str] = "Analiza el plato en esta imagen y proporciona un desglose nutricional detallado. Incluye: 1) Identificación de los alimentos presentes, 2) Calorías totales estimadas, 3) Macronutrientes (proteínas, carbohidratos, grasas) en gramos y porcentajes, 4) Micronutrientes destacables (vitaminas, minerales), 5) Consideraciones de salud y recomendaciones nutricionales."

# ---------- DB HELPERS ----------

def get_conn():
    return sqlite3.connect(DB_PATH)


def init_db():
    with get_conn() as con:
        cur = con.cursor()
        # users
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT UNIQUE NOT NULL,
              name TEXT NOT NULL,
              password_hash TEXT NOT NULL,
              role TEXT NOT NULL CHECK(role in ('patient','nutritionist')),
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        # rules
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS rules (
              id TEXT PRIMARY KEY,
              name TEXT,
              priority INTEGER,
              json TEXT NOT NULL
            )
            """
        )
        con.commit()


# ---- FUNCIONES DE SEGURIDAD (BCRYPT + JWT) ----

def hash_password(password: str) -> str:
    """Hashea una contraseña usando bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica que una contraseña coincida con su hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea un JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """Decodifica y valida un JWT token"""
    try:
        print(f"🔓 Intentando decodificar token...")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        print(f"✅ Token decodificado exitosamente. Payload: {payload}")
        return payload
    except JWTError as e:
        print(f"❌ Error JWT al decodificar: {e}")
        raise HTTPException(
            status_code=401,
            detail=f"Token inválido o expirado: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ---------- AUTH ----------

def get_user_by_email(email: str) -> Optional[dict]:
    with get_conn() as con:
        cur = con.cursor()
        cur.execute("SELECT id,email,name,password_hash,role FROM users WHERE email=?", (email,))
        row = cur.fetchone()
        if row:
            return {"id": row[0], "email": row[1], "name": row[2], "password_hash": row[3], "role": row[4]}
        return None


def create_user(u: UserCreate) -> UserPublic:
    with get_conn() as con:
        cur = con.cursor()
        try:
            cur.execute(
                "INSERT INTO users (email,name,password_hash,role) VALUES (?,?,?,?)",
                (u.email, u.name, hash_password(u.password), u.role)
            )
            con.commit()
            uid = cur.lastrowid
            return UserPublic(id=uid, email=u.email, name=u.name, role=u.role)
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="Email ya registrado")


def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Autentica un usuario verificando email y contraseña"""
    user = get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Obtiene el usuario actual desde el token JWT"""
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")  # ✅ Ahora es string
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido: no contiene 'sub'")
        return payload
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error decodificando token: {e}")
        raise HTTPException(status_code=401, detail=f"Error validando token: {str(e)}")


def require_nutritionist(user: dict = Depends(get_current_user)):
    """Verifica que el usuario sea nutricionista"""
    if user.get("role") != "nutritionist":
        raise HTTPException(status_code=403, detail="Se requiere rol de nutricionista")
    return user

# ---------- ENERGY UTILS ----------
# Factores de actividad para TDEE
ACTIVITY_FACTORS = {"sedentary":1.2,"light":1.375,"moderate":1.55,"active":1.725,"very_active":1.9}

def mifflin_st_jeor(sex: str, age: int, height_cm: float, weight_kg: float, activity: str) -> float:
    
    # Calcular TMB (Tasa Metabólica Basal)
    bmr = 10*weight_kg + 6.25*height_cm - 5*age + (5 if sex.upper()=="M" else -161)
    
    # Multiplicar por factor de actividad = TDEE
    return bmr * ACTIVITY_FACTORS.get(activity,1.2)

# ---------- RULES DB ----------

def load_rules() -> List[Dict[str,Any]]:
    with get_conn() as con:
        cur = con.cursor()
        cur.execute("SELECT json FROM rules ORDER BY priority DESC, id")
        return [json.loads(r[0]) for r in cur.fetchall()]


def save_rule(rule: Dict[str,Any]):
    with get_conn() as con:
        cur = con.cursor()
        cur.execute("INSERT INTO rules (id,name,priority,json) VALUES (?,?,?,?)",(rule["id"], rule.get("name"), int(rule.get("priority",0)), json.dumps(rule)))
        con.commit()


def update_rule(rule: Dict[str,Any]):
    with get_conn() as con:
        cur = con.cursor()
        cur.execute("UPDATE rules SET name=?, priority=?, json=? WHERE id=?", (rule.get("name"), int(rule.get("priority",0)), json.dumps(rule), rule["id"]))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Rule not found")
        con.commit()


def delete_rule(rule_id: str):
    with get_conn() as con:
        cur = con.cursor()
        cur.execute("DELETE FROM rules WHERE id=?", (rule_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Rule not found")
        con.commit()

# ---------- INFERENCE ENGINE ----------
OPS = {"==": operator.eq, "!=": operator.ne, ">": operator.gt, ">=": operator.ge, "<": operator.lt, "<=": operator.le}

def match_condition(facts: Dict[str,Any], cond: Dict[str,Any]) -> bool:
    fact, op, value = cond.get("fact"), cond.get("op"), cond.get("value")
    if op in OPS: return OPS[op](facts.get(fact), value)
    if op == "in": return facts.get(fact) in value
    if op == "not_in": return facts.get(fact) not in value
    if op == "contains": return value in facts.get(fact, [])
    return False


def infer(facts: Dict[str,Any], rules: List[Dict[str,Any]]):
    """Motor de inferencia - Forward Chaining"""
    
    # PASO 1: Ordenar reglas por prioridad (mayor a menor) 
    agenda = sorted(rules, key=lambda r: r.get("priority",0), reverse=True)

    # PASO 2: Inicializar resultados
    diagnoses, plan, fired = [], {"kcal_target":None, "macro_split":None, "restrictions":[], "advice":[]}, []
    
    # PASO 3: CICLO DE INFERENCIA - Evaluar cada regla
    for r in agenda:
        if all(match_condition(facts, c) for c in r.get("when", [])):
            fired.append({"id": r["id"], "name": r.get("name"), "explain": r.get("then",{}).get("explain")})
            then = r.get("then", {})
            for d in then.get("diagnosis", []):
                if d not in diagnoses: diagnoses.append(d)
            diet = then.get("diet", {})
            if diet:
                kcal_cfg = diet.get("kcal_target")
                if isinstance(kcal_cfg, dict) and kcal_cfg.get("method") == "mifflin_st_jeor":
                    tdee = mifflin_st_jeor(facts.get("sex"), facts.get("age"), facts.get("height_cm"), facts.get("weight_kg"), facts.get("activity"))
                    plan["kcal_target"] = round(tdee * (1 - float(kcal_cfg.get("deficit_pct",0.0)) + float(kcal_cfg.get("surplus_pct",0.0))))
                elif isinstance(kcal_cfg, (int,float)):
                    plan["kcal_target"] = int(kcal_cfg)
                if diet.get("macro_split"): plan["macro_split"] = diet["macro_split"]
                plan["restrictions"] += diet.get("restrictions", [])
                plan["advice"] += diet.get("advice", [])

    # PASO 4: Limpieza de resultados (eliminar duplicados)
    plan["restrictions"] = sorted(list(set(plan["restrictions"])))
    plan["advice"] = sorted(list(set(plan["advice"])))
    # return {"diagnosis": diagnoses or (["Eutrófico (sin hallazgos)"] if 18.5 <= facts.get("bmi",0) < 25 else []), "plan": plan, "fired_rules": fired}
    # Sin diagnóstico por defecto para IMC normal

    # PASO 5: Retornar resultado
    return {"diagnosis": diagnoses, "plan": plan, "fired_rules": fired}
# ---------- STARTUP & SEED ----------
@app.on_event("startup")
async def on_startup():
    init_db()
    # si no hay nutricionista, crear uno demo
    with get_conn() as con:
        cur = con.cursor()
        cur.execute("SELECT COUNT(1) FROM users WHERE role='nutritionist'")
        (c,) = cur.fetchone()
        if c == 0:
            cur.execute("INSERT INTO users (email,name,password_hash,role) VALUES (?,?,?,?)", ("pro@nutri.com","Nutricionista Pro", hash_password("nutri123"), "nutritionist"))
            con.commit()
            # print("✅ Usuario nutricionista demo creado: pro@nutri.com / nutri123")
        # seed de reglas si vacío
        cur.execute("SELECT COUNT(1) FROM rules")
        (rc,) = cur.fetchone()
        if rc == 0:
            base_rules = [
                {   
                    "id":"R1","name":"Bajo peso",
                    "priority":20,
                    "when":[{"fact":"bmi","op":"<","value":18.5}],
                    "then":{
                        "diagnosis":["Bajo peso"],
                        "diet":{
                            "kcal_target":{"method":"mifflin_st_jeor","surplus_pct":0.15},
                            "macro_split":{"carb_pct":0.50,"prot_pct":0.20,"fat_pct":0.30},
                            "advice":["Aumentar densidad calórica"],
                            "restrictions":[]
                        },
                        "explain":"IMC < 18.5"
                    }
                },
                {
                    "id":"R2","name":"Sobrepeso",
                    "priority":10,
                    "when":[
                        {"fact":"bmi","op":">=","value":25},
                        {"fact":"bmi","op":"<","value":30}
                    ],
                    "then":{
                        "diagnosis":["Sobrepeso"],
                        "diet":{
                            "kcal_target":{"method":"mifflin_st_jeor","deficit_pct":0.15},
                            "macro_split":{"carb_pct":0.45,"prot_pct":0.25,"fat_pct":0.30},
                            "advice":["Déficit moderado"],
                            "restrictions":["bebidas_azucaradas"]
                        },
                        "explain":"IMC 25–29.9"
                    }
                },
                {
                    "id":"R3","name":"Obesidad",
                    "priority":11,
                    "when":[
                        {"fact":"bmi","op":">=","value":30}
                    ],
                    "then":{
                        "diagnosis":["Obesidad"],
                        "diet":{
                            "kcal_target":{"method":"mifflin_st_jeor","deficit_pct":0.20},
                            "macro_split":{"carb_pct":0.40,"prot_pct":0.30,"fat_pct":0.30},
                            "advice":["Más proteína y fibra"],
                            "restrictions":["ultraprocesados"]
                        },
                        "explain":"IMC ≥ 30"
                    }
                },
            ]
            for r in base_rules:
                save_rule(r)
            print("✅ Reglas iniciales cargadas")

# ---------- AUTH ENDPOINTS ----------
@app.post("/auth/register", response_model=UserPublic)
async def register(u: UserCreate):
    """Registra un nuevo usuario en el sistema"""
    return create_user(u)

@app.post("/auth/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    """Inicia sesión y retorna un JWT token"""
    print(f"🔐 Intento de login: {form.username}")
    user = authenticate_user(form.username, form.password)
    if not user:
        print(f"❌ Login fallido para: {form.username}")
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={
            "sub": str(user["id"]),  # ✅ Convertir a string
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    )
    print(f"✅ Login exitoso para: {user['email']} (ID: {user['id']}, Rol: {user['role']})")
    print(f"   Token generado (primeros 50 chars): {access_token[:50]}...")
    return Token(access_token=access_token)

@app.get("/auth/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    """Obtiene la información del usuario autenticado"""
    print(f"✅ Usuario autenticado: {user.get('email')} (ID: {user.get('sub')})")
    return UserPublic(
        id=int(user["sub"]),  # ✅ Convertir de string a int
        email=user["email"], 
        name=user["name"], 
        role=user["role"]
    )

@app.get("/auth/test-token")
async def test_token(token: str = Depends(oauth2_scheme)):
    """Endpoint de prueba para verificar que el token se recibe correctamente"""
    print(f"🔍 Token recibido (primeros 20 chars): {token[:20]}...")
    return {"token_received": True, "token_preview": token[:50] + "..."}

# ---------- RULES CRUD (nutricionista) ----------
@app.get("/rules")
async def get_rules():
    return {"rules": load_rules()}

@app.post("/rules")
async def add_rule(rule: Rule, _ = Depends(require_nutritionist)):
    try:
        save_rule(rule.model_dump())
        return {"ok": True}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Rule ID already exists")

@app.put("/rules/{rule_id}")
async def edit_rule(rule_id: str, rule: Rule, _ = Depends(require_nutritionist)):
    if rule_id != rule.id:
        raise HTTPException(status_code=400, detail="ID mismatch")
    update_rule(rule.model_dump())
    return {"ok": True}

@app.delete("/rules/{rule_id}")
async def remove_rule(rule_id: str, _ = Depends(require_nutritionist)):
    delete_rule(rule_id)
    return {"ok": True}

# ---------- INFERENCE ----------
@app.post("/infer")
async def do_infer(f: Facts):
    """Ejecuta el motor de inferencia con los hechos proporcionados"""
    return infer(f.model_dump(), load_rules())
    #       ⬆️              ⬆️          ⬆️
    #    Motor          Hechos    Base de conocimiento

# ---------- IMAGE ANALYSIS ----------
@app.post("/analyze-image")
async def analyze_image(request: ImageAnalysisRequest, user: dict = Depends(get_current_user)):
    """Analiza una imagen de comida y retorna información nutricional detallada"""
    if not gemini_model:
        raise HTTPException(status_code=503, detail="Servicio de análisis de imágenes no disponible")
    
    try:
        # Decodificar la imagen base64
        image_data = base64.b64decode(request.image_base64.split(',')[1] if ',' in request.image_base64 else request.image_base64)
        image = Image.open(BytesIO(image_data))
        
        # Generar análisis con Gemini
        contents = [request.prompt, image]
        response = gemini_model.generate_content(contents)
        
        return {
            "success": True,
            "analysis": response.text,
            "user": user.get("email")
        }
    except Exception as e:
        print(f"❌ Error analizando imagen: {e}")
        raise HTTPException(status_code=500, detail=f"Error al analizar la imagen: {str(e)}")