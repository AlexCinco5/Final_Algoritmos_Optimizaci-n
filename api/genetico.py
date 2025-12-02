from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import random
import math

router = APIRouter()

class Punto(BaseModel):
    x: float
    y: float
    id: int

class EntradaEvolucion(BaseModel):
    ciudades: List[Punto]
    poblacion_indices: Optional[List[List[int]]] = None
    tamano_poblacion: int = 100  
    tasa_mutacion: float = 0.1   

def calc_distancia_total(indices: List[int], ciudades: List[Punto]) -> float:
    dist = 0.0
    size = len(indices)
    for i in range(size):
        c1 = ciudades[indices[i]]
        c2 = ciudades[indices[(i + 1) % size]]
        dist += math.sqrt((c1.x - c2.x)**2 + (c1.y - c2.y)**2)
    return dist

def cruce_ordenado(padre1: List[int], padre2: List[int]) -> List[int]:
    size = len(padre1)
    a, b = sorted(random.sample(range(size), 2))
    
    hijo = [-1] * size
    hijo[a:b] = padre1[a:b]
    
    pos_actual = b
    for item in padre2[b:] + padre2[:b]:
        if item not in hijo:
            if pos_actual >= size:
                pos_actual = 0
            hijo[pos_actual] = item
            pos_actual += 1
            
    return hijo

def mutacion_inversion(individuo: List[int]) -> List[int]:

    size = len(individuo)
    if size < 2: return individuo
    
    mutado = individuo[:]
    
    i, j = sorted(random.sample(range(size), 2))
    
    mutado[i:j+1] = mutado[i:j+1][::-1]
    
    return mutado


@router.post("/evolucionar")
def evolucionar(datos: EntradaEvolucion):
    num_ciudades = len(datos.ciudades)
    if num_ciudades < 3:
        return {"error": "Mínimo 3 ciudades"}

    poblacion = datos.poblacion_indices
    if not poblacion:
        poblacion = []
        base = list(range(num_ciudades))
        for _ in range(datos.tamano_poblacion):
            nuevo = base[:]
            random.shuffle(nuevo)
            poblacion.append(nuevo)

    scored_pop = []
    for ind in poblacion:
        dist = calc_distancia_total(ind, datos.ciudades)
        scored_pop.append((ind, dist))
    
    scored_pop.sort(key=lambda x: x[1])

    elite_size = max(1, int(datos.tamano_poblacion * 0.10)) 
    nueva_poblacion = [ind for ind, score in scored_pop[:elite_size]]
    
    while len(nueva_poblacion) < datos.tamano_poblacion:
        torneo = random.sample(scored_pop, 4)
        padre1 = min(torneo, key=lambda x: x[1])[0]
        
        torneo = random.sample(scored_pop, 4)
        padre2 = min(torneo, key=lambda x: x[1])[0]
        
        hijo = cruce_ordenado(padre1, padre2)
        
        if random.random() < datos.tasa_mutacion:
            hijo = mutacion_inversion(hijo)
            
        nueva_poblacion.append(hijo)

    mejor_individuo, mejor_distancia = scored_pop[0]
    
    mejor_ruta_puntos = [datos.ciudades[i] for i in mejor_individuo]

    return {
        "nueva_poblacion": nueva_poblacion,
        "mejor_ruta": mejor_ruta_puntos,
        "mejor_distancia": mejor_distancia
    }