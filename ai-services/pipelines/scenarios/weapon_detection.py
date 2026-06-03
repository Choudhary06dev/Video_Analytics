from pipelines.scenarios.base import BaseScenario

class WeaponDetectionScenario(BaseScenario):
    def __init__(self):
        super().__init__(
            key="WEAPON_DETECTION_GUN_KNIFE",
            labels=["gun", "pistol", "revolver", "rifle", "weapon", "knife", "scissors"]
        )
