from pipelines.scenarios.base import BaseScenario

class UnauthorizedParkingScenario(BaseScenario):
    def __init__(self):
        super().__init__(
            key="UNAUTHORIZED_PARKING_AMBULANCE_BLOCKAGE",
            labels=["parking meter"]
        )
