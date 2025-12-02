from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .n_reinas import router as router_reinas
from .montecarlo import router as router_montecarlo
from .genetico import router as router_genetico

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def verificar_salud():
    return {"estado": "ok", "mensaje": "API funcionando correctamente"}

app.include_router(router_reinas, prefix="/api/reinas", tags=["N-Reinas"])
app.include_router(router_montecarlo, prefix="/api/montecarlo", tags=["Montecarlo"])
app.include_router(router_genetico, prefix="/api/genetico", tags=["Genetico TSP"])