from pipelines.scenarios.base import BaseScenario

class FireSmokeDetectionScenario(BaseScenario):
    def __init__(self):
        super().__init__(
            key="FIRE_SMOKE_DETECTION",
            labels=["fire", "smoke", "fire hydrant", "oven", "toaster"]
        )
