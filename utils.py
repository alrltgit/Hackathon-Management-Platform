from datetime import datetime, timezone, timedelta

def calculate_submission_date():
    current_utc_time = datetime.now(timezone.utc)
    submission_utc_time = current_utc_time + timedelta(minutes=30)
    return submission_utc_time.strftime("%H:%M")