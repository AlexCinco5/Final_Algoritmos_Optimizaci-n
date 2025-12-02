from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()

class EntradaReinas(BaseModel):
    n: int  

class PasoSnapshot(BaseModel):
    tablero: List[int]
    estado: str  

class RespuestaReinas(BaseModel):
    solucion: List[int]
    historial: List[PasoSnapshot]
    mensaje: str

def es_seguro(tablero: List[int], fila: int, columna: int) -> bool:
    for col_anterior in range(columna):
        fila_anterior = tablero[col_anterior]
        
        if fila_anterior == -1:
            continue
            
        if fila_anterior == fila:
            return False
            
        if abs(fila_anterior - fila) == abs(col_anterior - columna):
            return False
            
    return True

def resolver_backtracking(n: int, columna: int, tablero: List[int], historial: List[dict]) -> bool:
    if columna >= n:
        return True

    for fila in range(n):
        if es_seguro(tablero, fila, columna):
            tablero[columna] = fila
            
            if n <= 10:
                historial.append({"tablero": list(tablero), "estado": "colocando"})
            
            if resolver_backtracking(n, columna + 1, tablero, historial):
                return True
            
            tablero[columna] = -1
            if n <= 10:
                historial.append({"tablero": list(tablero), "estado": "retrocediendo"})
                
    return False

@router.post("/resolver")
def resolver_n_reinas(datos: EntradaReinas):
    n = datos.n
    if n < 4 or n > 12:
        raise HTTPException(status_code=400, detail="N debe estar entre 4 y 12")

    tablero_inicial = [-1] * n
    historial_pasos = []
    
    exito = resolver_backtracking(n, 0, tablero_inicial, historial_pasos)
    
    if not exito:
        return {"solucion": [], "historial": historial_pasos, "mensaje": "No hay solución"}

    return {
        "solucion": tablero_inicial,
        "historial": historial_pasos,
        "mensaje": "Solución encontrada"
    }