from pipelines.scenarios.base import BaseScenario

class VehicleTrackingScenario(BaseScenario):
    def __init__(self):
        super().__init__(
            key="VEHICLE_DETECTION_TRACKING",
            labels=["car", "truck", "bus", "motorcycle"]
        )
