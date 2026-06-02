import cv2
import numpy as np

def _point_in_polygon(point, polygon):
    """Ray-casting point-in-polygon test for normalized frame coordinates."""
    if not polygon or len(polygon) < 3:
        return False

    x, y = point
    inside = False
    j = len(polygon) - 1
    for i in range(len(polygon)):
        xi, yi = polygon[i]["x"], polygon[i]["y"]
        xj, yj = polygon[j]["x"], polygon[j]["y"]
        intersects = (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi
        if intersects:
            inside = not inside
        j = i
    return inside


def _normalize_restricted_zones(config):
    if "restricted_zone" in config:
        zone = config.get("restricted_zone")
        return [zone] if isinstance(zone, list) and len(zone) >= 3 else []

    zone = config.get("restricted_zone")
    zones = config.get("restricted_zones")
    if zones:
        return [z for z in zones if isinstance(z, list) and len(z) >= 3]
    if isinstance(zone, list) and len(zone) >= 3:
        return [zone]
    return []


def _bbox_inside_any_zone(xyxy, frame_w, frame_h, zones):
    x1, y1, x2, y2 = xyxy
    candidate_points = [
        (((x1 + x2) / 2) / frame_w, y2 / frame_h),                    # feet/lower center
        (((x1 + x2) / 2) / frame_w, ((y1 + y2) / 2) / frame_h),        # bbox center
        (((x1 + x2) / 2) / frame_w, (y1 + ((y2 - y1) * 0.75)) / frame_h),
        (x1 / frame_w, y2 / frame_h),
        (x2 / frame_w, y2 / frame_h),
    ]

    for zone_index, zone in enumerate(zones):
        for x, y in candidate_points:
            point = (max(0.0, min(1.0, x)), max(0.0, min(1.0, y)))
            if _point_in_polygon(point, zone):
                return zone_index, {"x": round(point[0], 4), "y": round(point[1], 4)}
    return None, None


def _draw_restricted_zones(frame, zones, frame_w, frame_h):
    if not zones:
        return

    for zone in zones:
        pts = np.array([[
            int(point["x"] * frame_w),
            int(point["y"] * frame_h)
        ] for point in zone], np.int32)
        # Draw the zone outline directly on the original frame
        cv2.polylines(frame, [pts], isClosed=True, color=(0, 0, 255), thickness=2)
        # Generate semi-transparent color fill
        overlay = frame.copy()
        cv2.fillPoly(overlay, [pts], color=(0, 0, 255))
        # Blend overlay in-place back into original frame
        cv2.addWeighted(overlay, 0.12, frame, 0.88, 0, dst=frame)
