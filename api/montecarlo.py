from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict
import numpy as np

router = APIRouter()

class EntradaSimulacion(BaseModel):
    precio_actual: float
    volatilidad: float
    dias_proyectar: int
    num_simulaciones: int

class RespuestaSimulacion(BaseModel):
    simulaciones_visuales: List[Dict] 
    estadisticas: Dict
    var_95: float

def ejecutar_montecarlo(precio: float, vol: float, dias: int, sims: int):
    dt = 1 / 252 
    mu = 0.0
    sigma = vol

    cambios_diarios = np.random.normal(
        loc=(mu - 0.5 * sigma**2) * dt, 
        scale=sigma * np.sqrt(dt), 
        size=(dias, sims)
    )
    
    factores = np.exp(cambios_diarios)
    caminos_precio = np.zeros((dias + 1, sims))
    caminos_precio[0] = precio
    caminos_precio[1:] = precio * np.cumprod(factores, axis=0)
    
    media_diaria = np.mean(caminos_precio, axis=1)
    percentil_5 = np.percentile(caminos_precio, 5, axis=1)
    percentil_95 = np.percentile(caminos_precio, 95, axis=1)
    
    precios_finales = caminos_precio[-1]
    corte_95 = np.percentile(precios_finales, 5)
    valor_en_riesgo = precio - corte_95

    datos_grafica = []
    simulaciones_reducidas = caminos_precio[:, :50] 

    for i in range(dias + 1):
        punto = {
            "dia": i,
            "media": float(media_diaria[i]),
            "p5": float(percentil_5[i]),
            "p95": float(percentil_95[i]),
        }
        for j in range(50):
            punto[f"sim_{j}"] = float(simulaciones_reducidas[i, j])
        
        datos_grafica.append(punto)

    return datos_grafica, valor_en_riesgo

@router.post("/simular")
def simular_riesgo(datos: EntradaSimulacion):
    if datos.num_simulaciones > 5000:
        return {"error": "Máximo 5000 simulaciones"}
        
    datos_graficos, var = ejecutar_montecarlo(
        datos.precio_actual, datos.volatilidad, datos.dias_proyectar, datos.num_simulaciones
    )
    
    return {
        "simulaciones_visuales": datos_graficos,
        "estadisticas": {"mensaje": "Simulación exitosa"},
        "var_95": var
    }