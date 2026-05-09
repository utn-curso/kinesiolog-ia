from datetime import date, time
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TimeSlotBase(BaseModel):
    start_time: date
    end_time: date
    start_hour: time
    end_hour: time
    is_available: bool = True


class TimeSlotCreate(TimeSlotBase):
    pass


class TimeSlotUpdate(BaseModel):
    start_time: Optional[date] = None
    end_time: Optional[date] = None
    start_hour: Optional[time] = None
    end_hour: Optional[time] = None
    is_available: Optional[bool] = None


class TimeSlotOut(TimeSlotBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kinesiologo_id: int
