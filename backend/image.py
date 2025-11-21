import google.generativeai as genai
from PIL import Image
import requests
from io import BytesIO
import os

# 1. CONFIGURA TU API KEY
# ¡¡CAMBIA ESTO por tu clave API real de AI Studio!!
API_KEY = "AIzaSyB9mu55iCvCwRyc8LJX9_FvQ8Jac0afsNE"

try:
    genai.configure(api_key=API_KEY)
except Exception as e:
    print(f"Error configurando la API Key (asegúrate de ponerla): {e}")
    exit()

# 2. EL MODELO CORRECTO PARA "VER" IMÁGENES
try:
    # El modelo correcto que SÍ está en tu lista
    model = genai.GenerativeModel('gemini-2.5-flash')
except Exception as e:
    print(f"Error cargando el modelo: {e}")
    exit()


# 3. FUNCIÓN PARA OBTENER Y DESCRIBIR LA IMAGEN
def describir_imagen_desde_url(url, prompt):
    print(f"Descargando imagen de prueba...")
    try:
        # Descargar la imagen de la URL
        response_img = requests.get(url)
        # Asegurarse que la descarga fue exitosa (código 200)
        response_img.raise_for_status() 
        
        # Abrir la imagen usando PIL desde los bytes descargados
        img = Image.open(BytesIO(response_img.content))
        
        print("Imagen descargada. Analizando con Gemini...")
        
        # Lista de contenidos: el prompt de texto y la imagen
        contents = [prompt, img]
        
        # Llamar al modelo
        response = model.generate_content(contents)
        
        print("\n--- DESCRIPCIÓN GENERADA ---")
        print(response.text)
        print("------------------------------")
        
    except requests.exceptions.RequestException as e:
        print(f"Error al descargar la imagen de la URL: {e}")
    except Exception as e:
        # Aquí es donde verías un error 429 si tuvieras problemas de cuota
        print(f"Ocurrió un error al generar contenido: {e}")


# --- 4. EJECUTAR EL CÓDIGO ---

# Vamos a usar una imagen de ejemplo de Google
url_de_prueba = "https://img.freepik.com/foto-gratis/primer-plano-carne-asada-salsa-verduras-patatas-fritas-plato-sobre-mesa_181624-35847.jpg?" # Es una foto de un perro en un escritorio
mi_prompt = """Analiza esta imagen de comida y proporciona la información EXACTAMENTE en este formato estructurado:

ALIMENTOS IDENTIFICADOS:
- [Nombre del alimento 1] ([porción en gramos]g)
- [Nombre del alimento 2] ([porción en gramos]g)
- [Nombre del alimento 3] ([porción en gramos]g)

TOTALES:
Calorías: [número] kcal
Proteínas: [número]g ([porcentaje]%)
Carbohidratos: [número]g ([porcentaje]%)
Grasas: [número]g ([porcentaje]%)

DESGLOSE POR ALIMENTO:
1. [Nombre alimento 1]
   - Porción: [número]g
   - Calorías: [número] kcal
   - Proteínas: [número]g
   - Carbohidratos: [número]g
   - Grasas: [número]g

2. [Nombre alimento 2]
   - Porción: [número]g
   - Calorías: [número] kcal
   - Proteínas: [número]g
   - Carbohidratos: [número]g
   - Grasas: [número]g

Proporciona SOLO números y datos, sin explicaciones adicionales. Se preciso y conciso."""

describir_imagen_desde_url(url_de_prueba, mi_prompt)
