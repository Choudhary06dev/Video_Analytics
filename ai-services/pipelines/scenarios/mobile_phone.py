from pipelines.scenarios.base import BaseScenario

class MobilePhoneUsageScenario(BaseScenario):
    def __init__(self):
        super().__init__(
            key="MOBILE_PHONE_USAGE_IN_RESTRICTED_AREAS",
            labels=["cell phone"]
        )
