// Sistema de notificaciones mejorado
import toast from 'react-hot-toast';

// Traducción de errores comunes de validación
const errorTranslations = {
  'string_too_short': 'Texto demasiado corto',
  'string_too_long': 'Texto demasiado largo',
  'value_error': 'Valor inválido',
  'type_error.integer': 'Debe ser un número entero',
  'type_error.float': 'Debe ser un número',
  'missing': 'Campo requerido',
  'string_type': 'Debe ser texto',
  'greater_than': 'Debe ser mayor que',
  'less_than': 'Debe ser menor que',
};

// Mapeo de campos a nombres legibles en español
const fieldNames = {
  'email': 'Email',
  'password': 'Contraseña',
  'name': 'Nombre',
  'age': 'Edad',
  'weight_kg': 'Peso',
  'height_cm': 'Altura',
  'bmi': 'IMC',
  'sex': 'Sexo',
  'activity': 'Nivel de actividad',
};

/**
 * Parsea errores de validación de FastAPI/Pydantic
 */
export function parseValidationError(error) {
  try {
    // Intentar extraer el detalle del error
    const match = error.message.match(/\{.*\}/);
    if (!match) return error.message;
    
    const errorData = JSON.parse(match[0]);
    
    if (errorData.detail && Array.isArray(errorData.detail)) {
      // Son errores de validación de Pydantic
      const messages = errorData.detail.map(err => {
        const field = err.loc[err.loc.length - 1];
        const fieldName = fieldNames[field] || field;
        const errorType = err.type.split('.')[0];
        const errorTypeName = errorTranslations[errorType] || err.type;
        
        // Mensajes personalizados según el tipo de error
        if (err.type === 'string_too_short') {
          return `${fieldName}: Mínimo ${err.ctx.min_length} caracteres (ingresaste ${err.input?.length || 0})`;
        }
        if (err.type === 'string_too_long') {
          return `${fieldName}: Máximo ${err.ctx.max_length} caracteres`;
        }
        if (err.type === 'greater_than') {
          return `${fieldName}: Debe ser mayor que ${err.ctx.gt}`;
        }
        if (err.type === 'less_than') {
          return `${fieldName}: Debe ser menor que ${err.ctx.lt}`;
        }
        if (err.type === 'value_error.email') {
          return `${fieldName}: Email inválido`;
        }
        if (err.type === 'missing') {
          return `${fieldName}: Campo requerido`;
        }
        
        return `${fieldName}: ${err.msg}`;
      });
      
      return messages.join('\n');
    }
    
    if (errorData.detail && typeof errorData.detail === 'string') {
      return errorData.detail;
    }
    
    return error.message;
  } catch (e) {
    return error.message;
  }
}

/**
 * Muestra notificación de error
 */
export function showError(error) {
  const message = parseValidationError(error);
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
    style: {
      background: '#EF4444',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    icon: '❌',
  });
}

/**
 * Muestra notificación de éxito
 */
export function showSuccess(message) {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#10B981',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    icon: '✅',
  });
}

/**
 * Muestra notificación de información
 */
export function showInfo(message) {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#3B82F6',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    icon: 'ℹ️',
  });
}

/**
 * Muestra notificación de advertencia
 */
export function showWarning(message) {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#F59E0B',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    icon: '⚠️',
  });
}

/**
 * Muestra loading mientras se ejecuta una promesa
 */
export async function showLoading(promise, messages = {}) {
  const { loading = 'Cargando...', success = '✅ Éxito', error = 'Error' } = messages;
  
  return toast.promise(
    promise,
    {
      loading,
      success,
      error: (err) => parseValidationError(err),
    },
    {
      style: {
        padding: '16px',
        borderRadius: '8px',
      },
    }
  );
}
