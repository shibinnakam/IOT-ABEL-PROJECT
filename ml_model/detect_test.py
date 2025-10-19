# detect_test.py
from ultralytics import YOLO
import sys
import os

# ====== Load YOLO model ======
# Use relative path inside your project for Render deployment
model_path = os.path.join("runs", "detect", "train2", "weights", "best.pt")
model = YOLO(model_path)

# ====== Get image path from command-line argument ======
if len(sys.argv) < 2:
    print("Error: No image path provided")
    sys.exit(1)

image_path = sys.argv[1]

# ====== Run detection ======
try:
    results = model(image_path, show=False)  # headless mode
    names = results[0].names
    detected = [names[int(box.cls)] for box in results[0].boxes]

    if detected:
        detected_set = list(set(detected))  # remove duplicates
        print(",".join(detected_set))       # Node.js reads this stdout
    else:
        print("none")                        # Node.js reads this stdout

    # Optional: save result image to temp folder
    output_dir = os.path.join("temp_results")
    os.makedirs(output_dir, exist_ok=True)
    results[0].save(os.path.join(output_dir, "result.jpg"))

except Exception as e:
    print(f"error:{e}")
    sys.exit(1)
