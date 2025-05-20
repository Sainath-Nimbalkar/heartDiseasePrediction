from pydantic import BaseModel

class HeartData(BaseModel):
    Age: float
    Sex: str
    RestingBP: float
    Cholesterol: float
    FastingBS: int
    MaxHR: float
    ExerciseAngina: str
    Oldpeak: float
    ChestPain: str
    RestingECG: str
    ST_Slope: str